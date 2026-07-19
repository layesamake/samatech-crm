import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/infrastructure/database/db';
import { FixedClock } from '@/modules/follow-ups/domain/follow-up';
import { ManageInvoicesUseCase } from '@/modules/invoices/application/manage-invoices';
import { ManagePaymentsUseCase } from '../application/manage-payments';
import { PAYMENT_METHODS, PaymentMethod } from '../domain/payment';

const now = '2026-07-18T12:00:00.000Z';
const contactId = '11111111-1111-4111-8111-111111111111';
const clientId = '22222222-2222-4222-8222-222222222222';
const otherClientId = '33333333-3333-4333-8333-333333333333';

describe('Paiements partiels, surpaiement et contrepassation', () => {
  const clock = new FixedClock(new Date(now));
  let payments: ManagePaymentsUseCase;
  let invoices: ManageInvoicesUseCase;
  let invoiceId: string;

  const input = (changes: Record<string, unknown> = {}) => ({
    invoiceId,
    clientProfileId: clientId,
    paymentDate: '2026-07-18',
    amountMinor: 30_000,
    currency: 'XOF',
    currencyScale: 0,
    method: 'WAVE' as const,
    reference: 'REF-TEST',
    note: 'Versement manuel',
    confirmHistoricalDate: false,
    ...changes,
  });

  beforeEach(async () => {
    await db.transaction('rw', db.tables, async () => Promise.all(db.tables.map((table) => table.clear())));
    await db.contacts.add({ id: contactId, displayName: 'Client Paiement', whatsappPhone: '+221770000000', normalizedWhatsappPhone: '+221770000000', createdAt: now, updatedAt: now });
    await db.clientProfiles.add({ id: clientId, contactId, convertedAt: now, createdAt: now, updatedAt: now });
    await db.settings.bulkAdd([
      { key: 'company.profile', value: { name: 'SAMTECH', phone: '+221330000000', currencyCode: 'XOF', currencySymbol: 'FCFA' }, schemaVersion: 1, updatedAt: now },
      { key: 'invoice.defaults', value: { currencyCode: 'XOF', prefix: 'FAC-', nextValue: 1, enableTaxes: false }, schemaVersion: 1, updatedAt: now },
    ]);
    invoices = new ManageInvoicesUseCase(undefined, clock);
    payments = new ManagePaymentsUseCase(undefined, clock);
    const draft = await invoices.createDraft({ type: 'INVOICE', clientProfileId: clientId, currency: 'XOF', currencyScale: 0, issueDate: '2026-07-17', dueDate: '2026-07-17', taxesEnabled: false, lines: [{ position: 0, designation: 'Prestation', quantityScaled: 1, quantityScale: 0, unitPriceMinor: 100_000, discountType: 'NONE', discountValue: 0, taxRateBasisPoints: 0 }] });
    invoiceId = draft!.invoice.id;
    await invoices.issue(invoiceId);
  });

  it('enregistre plusieurs paiements partiels de modes différents puis solde exactement', async () => {
    await payments.record(input());
    expect(await db.invoices.get(invoiceId)).toMatchObject({ paidTotalMinor: 30_000, balanceMinor: 70_000, status: 'PARTIELLEMENT_PAYEE' });
    await payments.record(input({ amountMinor: 20_000, method: 'CASH', reference: undefined }));
    expect(await db.invoices.get(invoiceId)).toMatchObject({ paidTotalMinor: 50_000, balanceMinor: 50_000, status: 'PARTIELLEMENT_PAYEE' });
    await payments.record(input({ amountMinor: 50_000, method: 'BANK_TRANSFER' }));
    expect(await db.invoices.get(invoiceId)).toMatchObject({ paidTotalMinor: 100_000, balanceMinor: 0, status: 'PAYEE' });
    expect(await db.payments.count()).toBe(3);
  });

  it.each(PAYMENT_METHODS)('accepte le mode %s avec référence et note', async (method: PaymentMethod) => {
    const result = await payments.record(input({ method, note: method === 'OTHER' ? 'Chèque remis manuellement' : 'Note', amountMinor: 1 }));
    expect(result.payment).toMatchObject({ method, reference: 'REF-TEST', note: method === 'OTHER' ? 'Chèque remis manuellement' : 'Note', status: 'ACTIVE' });
  });

  it('exige une description pour Autre', async () => {
    await expect(payments.record(input({ method: 'OTHER', note: '' }))).rejects.toThrow(/Décrivez/);
  });

  it.each([{ amountMinor: 0 }, { amountMinor: -1 }, { amountMinor: Number.NaN }, { amountMinor: Number.POSITIVE_INFINITY }, { amountMinor: Number.MAX_SAFE_INTEGER + 1 }])('refuse un montant invalide %#', async (change) => {
    await expect(payments.record(input(change))).rejects.toThrow();
  });

  it('refuse facture absente, client absent, mauvais client, brouillon, payée et annulée', async () => {
    await expect(payments.record(input({ invoiceId: crypto.randomUUID() }))).rejects.toThrow(/Facture/);
    await db.clientProfiles.delete(clientId);
    await expect(payments.record(input())).rejects.toThrow(/Client/);
    await db.clientProfiles.add({ id: clientId, contactId, convertedAt: now, createdAt: now, updatedAt: now });
    await expect(payments.record(input({ clientProfileId: otherClientId }))).rejects.toThrow(/client/);
    await db.invoices.update(invoiceId, { status: 'BROUILLON' });
    await expect(payments.record(input())).rejects.toThrow(/ne peut pas/);
    await db.invoices.update(invoiceId, { status: 'PAYEE', paidTotalMinor: 100_000, balanceMinor: 0 });
    await expect(payments.record(input())).rejects.toThrow(/ne peut pas/);
    await db.invoices.update(invoiceId, { status: 'ANNULEE' });
    await expect(payments.record(input())).rejects.toThrow(/ne peut pas/);
  });

  it('refuse devise et échelle différentes ainsi qu’une date absente', async () => {
    await expect(payments.record(input({ currency: 'EUR' }))).rejects.toThrow(/devise/);
    await expect(payments.record(input({ currencyScale: 2 }))).rejects.toThrow(/devise/);
    await expect(payments.record(input({ paymentDate: '' }))).rejects.toThrow(/date/);
  });

  it('avertit et exige une confirmation explicite pour une date antérieure', async () => {
    await expect(payments.record(input({ paymentDate: '2026-07-16' }))).rejects.toThrow(/Confirmez/);
    await expect(payments.record(input({ paymentDate: '2026-07-16', confirmHistoricalDate: true }))).resolves.toMatchObject({ payment: { paymentDate: '2026-07-16' } });
  });

  it('refuse le surpaiement d’une unité et un paiement sur facture soldée', async () => {
    await expect(payments.record(input({ amountMinor: 100_001 }))).rejects.toThrow(/dépasse/);
    await payments.record(input({ amountMinor: 100_000 }));
    await expect(payments.record(input({ amountMinor: 1 }))).rejects.toThrow(/ne peut pas/);
    expect((await db.invoices.get(invoiceId))?.balanceMinor).toBe(0);
    expect(await payments.receivables()).toEqual([]);
  });

  it('protège deux paiements concurrents qui dépasseraient ensemble le solde', async () => {
    const results = await Promise.allSettled([payments.record(input({ amountMinor: 70_000 })), payments.record(input({ amountMinor: 70_000, method: 'CASH' }))]);
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);
    expect((await db.invoices.get(invoiceId))?.balanceMinor).toBe(30_000);
    expect(await db.payments.where('[invoiceId+status]').equals([invoiceId, 'ACTIVE']).count()).toBe(1);
  });

  it('rollback intégral si la création de l’événement échoue', async () => {
    const fail = () => { throw new Error('Événement impossible'); };
    db.timelineEvents.hook('creating').subscribe(fail);
    try { await expect(payments.record(input())).rejects.toThrow(/impossible/); } finally { db.timelineEvents.hook('creating').unsubscribe(fail); }
    expect(await db.payments.count()).toBe(0);
    expect(await db.invoices.get(invoiceId)).toMatchObject({ paidTotalMinor: 0, balanceMinor: 100_000, status: 'EMISE' });
  });

  it('contrepasse sans supprimer et recalcule PAYEE vers partielle puis EMISE', async () => {
    const first = await payments.record(input({ amountMinor: 30_000 }));
    const second = await payments.record(input({ amountMinor: 70_000, method: 'CASH' }));
    await expect(payments.reverse(second.payment.id, '   ')).rejects.toThrow(/motif/);
    await payments.reverse(second.payment.id, 'Erreur de saisie');
    expect(await db.invoices.get(invoiceId)).toMatchObject({ status: 'PARTIELLEMENT_PAYEE', paidTotalMinor: 30_000, balanceMinor: 70_000 });
    await payments.reverse(first.payment.id, 'Doublon');
    expect(await db.invoices.get(invoiceId)).toMatchObject({ status: 'EMISE', paidTotalMinor: 0, balanceMinor: 100_000 });
    expect(await db.payments.count()).toBe(2);
    expect(await db.payments.where('status').equals('REVERSED').count()).toBe(2);
    await expect(payments.reverse(first.payment.id, 'Encore')).rejects.toThrow(/déjà/);
    expect(await db.timelineEvents.where('type').equals('PAYMENT_REVERSED').count()).toBe(2);
  });

  it('corrige par contrepassation puis nouveau paiement distinct', async () => {
    const old = await payments.record(input({ amountMinor: 30_000 }));
    await payments.reverse(old.payment.id, 'Montant incorrect');
    const replacement = await payments.record(input({ amountMinor: 25_000 }));
    expect(replacement.payment.id).not.toBe(old.payment.id);
    expect(await db.payments.count()).toBe(2);
    expect(await db.invoices.get(invoiceId)).toMatchObject({ paidTotalMinor: 25_000, balanceMinor: 75_000 });
  });

  it('bloque l’annulation avec paiement actif puis l’autorise après contrepassation', async () => {
    const payment = await payments.record(input());
    await expect(invoices.cancel(invoiceId, 'Annulation')).rejects.toThrow(/paiement|émise/i);
    await payments.reverse(payment.payment.id, 'Annuler avant facture');
    await expect(invoices.cancel(invoiceId, 'Annulation autorisée')).resolves.toMatchObject({ invoice: { status: 'ANNULEE' } });
    await expect(payments.record(input({ amountMinor: 1 }))).rejects.toThrow(/ne peut pas/);
    expect(await payments.receivables()).toEqual([]);
  });

  it('ne fait pas confiance aux agrégats mémorisés pour autoriser une annulation', async () => {
    await payments.record(input());
    await db.invoices.update(invoiceId, { status: 'EMISE', paidTotalMinor: 0, balanceMinor: 100_000 });
    await expect(invoices.cancel(invoiceId, 'Agrégats volontairement corrompus')).rejects.toThrow(/paiements actifs/);
    expect(await db.payments.where('[invoiceId+status]').equals([invoiceId, 'ACTIVE']).count()).toBe(1);
  });

  it('recherche, filtre, totalise les actifs et calcule les créances/retards', async () => {
    const active = await payments.record(input({ amountMinor: 30_000, method: 'WAVE', reference: 'ABC-123' }));
    const reversed = await payments.record(input({ amountMinor: 10_000, method: 'CASH', reference: 'REV-1' }));
    await payments.reverse(reversed.payment.id, 'Test filtre');
    expect(await payments.list({ query: 'abc', method: 'WAVE', status: 'ACTIVE' })).toHaveLength(1);
    expect(await payments.list({ status: 'REVERSED' })).toHaveLength(1);
    expect(await payments.list({ clientProfileId: clientId, invoiceId, from: '2026-07-18', to: '2026-07-18' })).toHaveLength(2);
    expect(await payments.list({ from: '2026-07-19' })).toHaveLength(0);
    const secondDraft = await invoices.createDraft({ type: 'INVOICE', clientProfileId: clientId, currency: 'XOF', currencyScale: 0, issueDate: '2026-07-16', dueDate: '2026-07-16', taxesEnabled: false, lines: [{ position: 0, designation: 'Petite prestation', quantityScaled: 1, quantityScale: 0, unitPriceMinor: 40_000, discountType: 'NONE', discountValue: 0, taxRateBasisPoints: 0 }] });
    const secondInvoiceId = secondDraft!.invoice.id;
    await invoices.issue(secondInvoiceId);
    const indicators = await payments.indicators();
    expect(indicators.activeCollectedMinor).toBe(30_000);
    expect(indicators.remainingMinor).toBe(110_000);
    expect(indicators.partiallyPaidCount).toBe(1);
    expect(indicators.overdueReceivablesCount).toBe(2);
    const receivables = await payments.receivables({ due: 'OVERDUE', clientProfileId: clientId, sort: 'DUE_DATE' });
    expect(receivables).toHaveLength(2);
    expect(receivables[0]).toMatchObject({ daysOverdue: 2, invoice: { id: secondInvoiceId, balanceMinor: 40_000 } });
    expect((await payments.receivables({ sort: 'BALANCE_DESC' }))[0]).toMatchObject({ invoice: { id: invoiceId, balanceMinor: 70_000 } });
    expect(await payments.receivables({ query: 'introuvable' })).toHaveLength(0);
    expect(await payments.receivables({ due: 'UPCOMING' })).toHaveLength(0);
    expect(active.payment.status).toBe('ACTIVE');
  });
});
