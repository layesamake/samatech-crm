import { db } from '@/infrastructure/database/db';
import type { TimelineEventRecord } from '@/modules/follow-ups/domain/follow-up';
import {
  calculatePaymentFinancialState,
  daysOverdue,
  PaymentAggregate,
  PaymentIndicators,
  PaymentMethod,
  PaymentRecord,
  PaymentStatus,
  ReceivableRecord,
  RecordPaymentInput,
  sumActivePayments,
} from '../domain/payment';

export interface PaymentSearchCriteria {
  query?: string;
  from?: string;
  to?: string;
  method?: PaymentMethod;
  status?: PaymentStatus;
  clientProfileId?: string;
  invoiceId?: string;
}

export interface ReceivableSearchCriteria {
  query?: string;
  due?: 'OVERDUE' | 'UPCOMING';
  from?: string;
  to?: string;
  clientProfileId?: string;
  sort?: 'DUE_DATE' | 'BALANCE_DESC';
  today: string;
}

function normalizeSearch(value: string): string {
  return value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr');
}

export class DexiePaymentRepository {
  private async clientName(clientProfileId: string): Promise<string> {
    const profile = await db.clientProfiles.get(clientProfileId);
    const contact = profile ? await db.contacts.get(profile.contactId) : undefined;
    return contact?.displayName ?? '';
  }

  private async hydrate(payment: PaymentRecord): Promise<PaymentAggregate> {
    const [invoice, clientName] = await Promise.all([db.invoices.get(payment.invoiceId), this.clientName(payment.clientProfileId)]);
    return { payment, invoiceNumber: invoice?.number ?? 'Facture introuvable', clientName };
  }

  async get(id: string): Promise<PaymentAggregate | null> {
    const payment = await db.payments.get(id);
    return payment ? this.hydrate(payment) : null;
  }

  async forInvoice(invoiceId: string): Promise<PaymentRecord[]> {
    const values = await db.payments.where('invoiceId').equals(invoiceId).toArray();
    return values.sort((a, b) => b.paymentDate.localeCompare(a.paymentDate) || b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id));
  }

  async list(criteria: PaymentSearchCriteria = {}): Promise<PaymentAggregate[]> {
    const records = await db.payments.toArray();
    const hydrated = await Promise.all(records.map((payment) => this.hydrate(payment)));
    const query = criteria.query ? normalizeSearch(criteria.query) : '';
    return hydrated.filter((value) => {
      const payment = value.payment;
      const searchable = normalizeSearch(`${value.invoiceNumber} ${value.clientName} ${payment.reference ?? ''}`);
      return (!query || searchable.includes(query))
        && (!criteria.from || payment.paymentDate >= criteria.from)
        && (!criteria.to || payment.paymentDate <= criteria.to)
        && (!criteria.method || payment.method === criteria.method)
        && (!criteria.status || payment.status === criteria.status)
        && (!criteria.clientProfileId || payment.clientProfileId === criteria.clientProfileId)
        && (!criteria.invoiceId || payment.invoiceId === criteria.invoiceId);
    }).sort((a, b) => b.payment.paymentDate.localeCompare(a.payment.paymentDate) || b.payment.createdAt.localeCompare(a.payment.createdAt) || b.payment.id.localeCompare(a.payment.id));
  }

  async record(input: RecordPaymentInput, now: string): Promise<PaymentAggregate> {
    const paymentId = crypto.randomUUID();
    await db.transaction('rw', [db.payments, db.invoices, db.timelineEvents, db.clientProfiles, db.contacts], async () => {
      const invoice = await db.invoices.get(input.invoiceId);
      if (!invoice || invoice.archivedAt) throw new Error('Facture introuvable ou archivée');
      if (invoice.status !== 'EMISE' && invoice.status !== 'PARTIELLEMENT_PAYEE') throw new Error('Cette facture ne peut pas recevoir de paiement');
      if (invoice.clientProfileId !== input.clientProfileId) throw new Error('Le client du paiement ne correspond pas à la facture');
      if (invoice.currency !== input.currency || invoice.currencyScale !== input.currencyScale) throw new Error('La devise du paiement ne correspond pas à la facture');
      const profile = await db.clientProfiles.get(input.clientProfileId);
      if (!profile || profile.archivedAt) throw new Error('Client introuvable ou archivé');
      const contact = await db.contacts.get(profile.contactId);
      if (!contact || contact.archivedAt) throw new Error('Contact client introuvable ou archivé');
      if (!invoice.issueDate) throw new Error('La facture ne possède pas de date d’émission');
      if (input.paymentDate < invoice.issueDate && !input.confirmHistoricalDate) throw new Error('Confirmez explicitement la date de paiement antérieure à l’émission');

      const existing = await db.payments.where('[invoiceId+status]').equals([invoice.id, 'ACTIVE']).toArray();
      const currentState = calculatePaymentFinancialState(invoice.grandTotalMinor, existing);
      if (input.amountMinor > currentState.balanceMinor) throw new Error('Le paiement dépasse le solde restant');
      const payment: PaymentRecord = {
        id: paymentId,
        invoiceId: invoice.id,
        clientProfileId: invoice.clientProfileId,
        paymentDate: input.paymentDate,
        amountMinor: input.amountMinor,
        currency: invoice.currency,
        currencyScale: invoice.currencyScale,
        method: input.method,
        reference: input.reference?.trim() || undefined,
        note: input.note?.trim() || undefined,
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now,
      };
      const nextState = calculatePaymentFinancialState(invoice.grandTotalMinor, [...existing, payment]);
      const event: TimelineEventRecord = {
        id: crypto.randomUUID(),
        contactId: contact.id,
        type: 'PAYMENT_RECORDED',
        occurredAt: now,
        createdAt: now,
        sourceEntityType: 'PAYMENT',
        sourceEntityId: payment.id,
        title: `Paiement enregistré pour ${invoice.number ?? 'la facture'}`,
        summary: `Encaissement manuel · ${input.method}`,
        payloadVersion: 1,
      };
      await db.payments.add(payment);
      await db.invoices.put({ ...invoice, ...nextState, updatedAt: now });
      await db.timelineEvents.add(event);
    });
    const result = await this.get(paymentId);
    if (!result) throw new Error('Paiement introuvable après enregistrement');
    return result;
  }

  async reverse(paymentId: string, reason: string, now: string): Promise<PaymentAggregate> {
    const trimmedReason = reason.trim();
    if (!trimmedReason) throw new Error('Le motif de contrepassation est obligatoire');
    await db.transaction('rw', [db.payments, db.invoices, db.timelineEvents, db.clientProfiles], async () => {
      const payment = await db.payments.get(paymentId);
      if (!payment) throw new Error('Paiement introuvable');
      if (payment.status !== 'ACTIVE') throw new Error('Ce paiement est déjà contrepassé');
      const invoice = await db.invoices.get(payment.invoiceId);
      if (!invoice) throw new Error('Facture introuvable');
      if (invoice.status === 'ANNULEE') throw new Error('Une facture annulée ne peut pas contenir de paiement actif');
      const profile = await db.clientProfiles.get(payment.clientProfileId);
      if (!profile) throw new Error('Client introuvable');
      const active = await db.payments.where('[invoiceId+status]').equals([invoice.id, 'ACTIVE']).toArray();
      const reversed: PaymentRecord = { ...payment, status: 'REVERSED', reversedAt: now, reversalReason: trimmedReason, updatedAt: now };
      const remaining = active.map((item) => item.id === payment.id ? reversed : item);
      const nextState = calculatePaymentFinancialState(invoice.grandTotalMinor, remaining);
      const event: TimelineEventRecord = {
        id: crypto.randomUUID(),
        contactId: profile.contactId,
        type: 'PAYMENT_REVERSED',
        occurredAt: now,
        createdAt: now,
        sourceEntityType: 'PAYMENT',
        sourceEntityId: payment.id,
        title: `Paiement contrepassé pour ${invoice.number ?? 'la facture'}`,
        summary: 'Correction financière enregistrée',
        payloadVersion: 1,
      };
      await db.payments.put(reversed);
      await db.invoices.put({ ...invoice, ...nextState, updatedAt: now });
      await db.timelineEvents.add(event);
    });
    const result = await this.get(paymentId);
    if (!result) throw new Error('Paiement introuvable après contrepassation');
    return result;
  }

  async receivables(criteria: ReceivableSearchCriteria): Promise<ReceivableRecord[]> {
    const invoices = await db.invoices.filter((invoice) => !invoice.archivedAt && invoice.balanceMinor > 0 && (invoice.status === 'EMISE' || invoice.status === 'PARTIELLEMENT_PAYEE')).toArray();
    const values = await Promise.all(invoices.map(async (invoice) => ({ invoice, clientName: await this.clientName(invoice.clientProfileId), daysOverdue: daysOverdue(invoice.dueDate, criteria.today) })));
    const query = criteria.query ? normalizeSearch(criteria.query) : '';
    const filtered = values.filter((value) => {
      const date = value.invoice.dueDate ?? value.invoice.issueDate ?? value.invoice.createdAt.slice(0, 10);
      return (!query || normalizeSearch(`${value.invoice.number ?? ''} ${value.clientName}`).includes(query))
        && (!criteria.due || (criteria.due === 'OVERDUE' ? value.daysOverdue > 0 : value.daysOverdue === 0))
        && (!criteria.from || date >= criteria.from)
        && (!criteria.to || date <= criteria.to)
        && (!criteria.clientProfileId || value.invoice.clientProfileId === criteria.clientProfileId);
    });
    return filtered.sort(criteria.sort === 'BALANCE_DESC'
      ? (a, b) => b.invoice.balanceMinor - a.invoice.balanceMinor || (a.invoice.dueDate ?? '').localeCompare(b.invoice.dueDate ?? '') || a.invoice.id.localeCompare(b.invoice.id)
      : (a, b) => (a.invoice.dueDate ?? '9999-12-31').localeCompare(b.invoice.dueDate ?? '9999-12-31') || b.invoice.balanceMinor - a.invoice.balanceMinor || a.invoice.id.localeCompare(b.invoice.id));
  }

  async indicators(today: string): Promise<PaymentIndicators> {
    const [payments, invoices, receivables] = await Promise.all([db.payments.toArray(), db.invoices.filter((invoice) => !invoice.archivedAt && invoice.status !== 'ANNULEE').toArray(), this.receivables({ today })]);
    return {
      activeCollectedMinor: sumActivePayments(payments),
      remainingMinor: invoices.reduce((sum, invoice) => {
        const next = BigInt(sum) + BigInt(invoice.balanceMinor);
        if (next > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('Le total restant dépasse la plage entière sûre');
        return Number(next);
      }, 0),
      partiallyPaidCount: invoices.filter((invoice) => invoice.status === 'PARTIELLEMENT_PAYEE').length,
      paidCount: invoices.filter((invoice) => invoice.status === 'PAYEE').length,
      overdueReceivablesCount: receivables.filter((item) => item.daysOverdue > 0).length,
    };
  }

  async activeTotalForInvoice(invoiceId: string): Promise<number> {
    return sumActivePayments(await db.payments.where('[invoiceId+status]').equals([invoiceId, 'ACTIVE']).toArray());
  }
}
