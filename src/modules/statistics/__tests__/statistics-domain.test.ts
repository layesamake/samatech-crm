import { describe, expect, it } from 'vitest';
import type { CampaignRecord, CampaignRecipientRecord } from '@/modules/campaigns/domain/campaign';
import type { ProductRecord } from '@/modules/catalog/domain/catalog';
import type { ClientProfileRecord } from '@/modules/clients/domain/client';
import type { FollowUpRecord } from '@/modules/follow-ups/domain/follow-up';
import type { InvoiceLineRecord, InvoiceRecord } from '@/modules/invoices/domain/invoice';
import type { LocationRecord } from '@/modules/locations/domain/location';
import type { PaymentRecord } from '@/modules/payments/domain/payment';
import type { ContactRecord, ProspectInterestRecord, ProspectProfileRecord } from '@/modules/prospects/domain/prospect';
import { calculateStatistics, formatMinorExact, formatQuantityExact, resolveStatisticsPeriod, StatisticsData } from '../domain/statistics';

const now = '2026-07-18T10:00:00.000Z';
const audit = { createdAt: now, updatedAt: now };
const empty = (): StatisticsData => ({ contacts: [], prospectProfiles: [], clientProfiles: [], locations: [], products: [], prospectInterests: [], followUps: [], invoices: [], invoiceLines: [], payments: [], campaigns: [], campaignRecipients: [], expenses: [] });
const contact = (id: string, createdAt: string, extra: Partial<ContactRecord> = {}): ContactRecord => ({ id, displayName: id, whatsappPhone: '+221770000000', normalizedWhatsappPhone: '+221770000000', createdAt, updatedAt: now, ...extra });
const profile = (id: string, contactId: string, createdAt: string, extra: Partial<ProspectProfileRecord> = {}): ProspectProfileRecord => ({ id, contactId, status: 'NOUVEAU', interestLevel: 'FROID', firstContactDate: createdAt.slice(0, 10), lastStatusChangedAt: now, createdAt, updatedAt: now, ...extra });
const client = (id: string, contactId: string, convertedAt: string): ClientProfileRecord => ({ id, contactId, convertedAt, ...audit });
const invoice = (id: string, clientProfileId: string, extra: Partial<InvoiceRecord> = {}): InvoiceRecord => ({ id, clientProfileId, status: 'EMISE', issueDate: '2026-07-10', dueDate: '2026-07-17', currency: 'XOF', currencyScale: 0, companySnapshot: { displayName: 'SAMTECH' }, clientSnapshot: { displayName: clientProfileId }, subtotalMinor: 1000, discountTotalMinor: 0, taxTotalMinor: 0, grandTotalMinor: 1000, paidTotalMinor: 0, balanceMinor: 1000, ...audit, ...extra });
const payment = (id: string, invoiceId: string, clientProfileId: string, amountMinor: number, extra: Partial<PaymentRecord> = {}): PaymentRecord => ({ id, invoiceId, clientProfileId, paymentDate: '2026-07-12', amountMinor, currency: 'XOF', currencyScale: 0, method: 'CASH', status: 'ACTIVE', ...audit, ...extra });
const line = (id: string, invoiceId: string, productId: string | undefined, quantityScaled: number, quantityScale: number, lineTotalMinor: number): InvoiceLineRecord => ({ id, invoiceId, productId, position: 0, designationSnapshot: 'Formation CRM', quantityScaled, quantityScale, unitPriceMinor: 1000, grossMinor: lineTotalMinor, discountType: 'NONE', discountValue: 0, discountMinor: 0, taxRateBasisPoints: 0, taxMinor: 0, lineTotalMinor, ...audit });

describe('périodes statistiques', () => {
  it('résout les bornes inclusives avec une date de référence explicite', () => {
    expect(resolveStatisticsPeriod('TODAY', '2026-07-18')).toMatchObject({ from: '2026-07-18', to: '2026-07-18' });
    expect(resolveStatisticsPeriod('LAST_7_DAYS', '2026-07-18')).toMatchObject({ from: '2026-07-12', to: '2026-07-18' });
    expect(resolveStatisticsPeriod('CURRENT_MONTH', '2026-07-18')).toMatchObject({ from: '2026-07-01', to: '2026-07-31' });
    expect(resolveStatisticsPeriod('PREVIOUS_MONTH', '2026-01-10')).toMatchObject({ from: '2025-12-01', to: '2025-12-31' });
    expect(resolveStatisticsPeriod('CURRENT_YEAR', '2026-07-18')).toMatchObject({ from: '2026-01-01', to: '2026-12-31' });
    expect(resolveStatisticsPeriod('CUSTOM', '2026-07-18', 'Africa/Dakar', '2026-02-03', '2026-02-05')).toMatchObject({ from: '2026-02-03', to: '2026-02-05' });
  });

  it('refuse une période personnalisée inversée', () => expect(() => resolveStatisticsPeriod('CUSTOM', '2026-07-18', 'Africa/Dakar', '2026-02-05', '2026-02-03')).toThrow(/invalide/));
});

describe('moteur statistique pur', () => {
  it('calcule cohortes, flux, stocks, classements et campagnes sans mélanger les devises', () => {
    const data = empty();
    data.locations = [{ id: 'dakar', name: 'Dakar', normalizedName: 'dakar', level: 'REGION', ...audit } as LocationRecord];
    data.products = [{ id: 'product', name: 'Formation CRM', normalizedName: 'formation crm', type: 'SERVICE', unitPriceMinor: 1000, currency: 'XOF', currencyScale: 0, isActive: true, ...audit } as ProductRecord];
    data.contacts = [contact('c1', '2026-07-02T08:00:00Z', { locationId: 'dakar', source: 'WHATSAPP' }), contact('c2', '2026-06-01T08:00:00Z', { source: 'REFERRAL' }), contact('c3', '2026-07-15T08:00:00Z', { locationId: 'dakar', source: 'WHATSAPP' })];
    data.prospectProfiles = [profile('p1', 'c1', '2026-07-02T08:00:00Z', { status: 'CONVERTI', convertedAt: '2026-07-10T08:00:00Z' }), profile('p2', 'c2', '2026-06-01T08:00:00Z'), profile('p3', 'c3', '2026-07-15T08:00:00Z', { status: 'CONVERTI', convertedAt: '2026-08-01T08:00:00Z' })];
    data.clientProfiles = [client('cl1', 'c1', '2026-07-10T08:00:00Z'), client('cl3', 'c3', '2026-08-01T08:00:00Z')];
    data.prospectInterests = [
      { id: 'interest1', prospectProfileId: 'p1', productId: 'product', requestedAt: '2026-07-03T00:00:00Z', ...audit } as ProspectInterestRecord,
      { id: 'interest2', prospectProfileId: 'p1', productId: 'product', requestedAt: '2026-07-04T00:00:00Z', ...audit } as ProspectInterestRecord,
      { id: 'interest3', prospectProfileId: 'p3', productId: 'product', requestedAt: '2026-07-16T00:00:00Z', ...audit } as ProspectInterestRecord,
    ];
    data.followUps = [
      { id: 'f1', contactId: 'c2', channel: 'PHONE', dueAt: '2026-07-18T23:00:00Z', timezone: 'Africa/Dakar', priority: 'NORMAL', status: 'PLANIFIEE', ...audit } as FollowUpRecord,
      { id: 'f2', contactId: 'c2', channel: 'PHONE', dueAt: '2026-07-17T23:00:00Z', timezone: 'Africa/Dakar', priority: 'NORMAL', status: 'PLANIFIEE', ...audit } as FollowUpRecord,
      { id: 'f3', contactId: 'c2', channel: 'PHONE', dueAt: '2026-07-20T00:00:00Z', timezone: 'Africa/Dakar', priority: 'NORMAL', status: 'PLANIFIEE', ...audit } as FollowUpRecord,
      { id: 'f4', contactId: 'c2', channel: 'PHONE', dueAt: '2026-07-01T00:00:00Z', timezone: 'Africa/Dakar', priority: 'NORMAL', status: 'REALISEE', completedAt: '2026-07-05T00:00:00Z', ...audit } as FollowUpRecord,
    ];
    data.invoices = [
      invoice('i1', 'cl1', { status: 'PARTIELLEMENT_PAYEE', paidTotalMinor: 400, balanceMinor: 600 }),
      invoice('i2', 'cl1', { status: 'ANNULEE', grandTotalMinor: 500, subtotalMinor: 500, paidTotalMinor: 100, balanceMinor: 400 }),
      invoice('i3', 'cl3', { status: 'PAYEE', currency: 'USD', currencyScale: 2, grandTotalMinor: 10000, subtotalMinor: 10000, paidTotalMinor: 10000, balanceMinor: 0 }),
      invoice('i4', 'cl1', { status: 'BROUILLON', grandTotalMinor: 9000, subtotalMinor: 9000, balanceMinor: 9000 }),
    ];
    data.payments = [payment('pay1', 'i1', 'cl1', 400), payment('reversed', 'i1', 'cl1', 200, { status: 'REVERSED' }), payment('cancelled', 'i2', 'cl1', 100), payment('usd', 'i3', 'cl3', 10000, { currency: 'USD', currencyScale: 2 })];
    data.invoiceLines = [line('l1', 'i1', 'product', 15, 1, 600), line('l2', 'i1', 'product', 2, 0, 400), line('free', 'i1', 'product', 1, 0, 0), line('cancelled-line', 'i2', 'product', 10, 0, 500)];
    data.campaigns = [{ id: 'campaign', name: 'Relance', status: 'EN_COURS', audienceType: 'PROSPECTS', criteria: {}, messageSnapshot: 'Bonjour', ...audit } as CampaignRecord];
    data.campaignRecipients = [{ id: 'recipient1', campaignId: 'campaign', contactId: 'c2', normalizedPhoneSnapshot: '+221770000000', displayNameSnapshot: 'c2', resolvedMessageSnapshot: 'Bonjour', position: 0, status: 'A_TRAITER', ...audit } as CampaignRecipientRecord, { id: 'recipient2', campaignId: 'campaign', contactId: 'c1', normalizedPhoneSnapshot: '+221770000001', displayNameSnapshot: 'c1', resolvedMessageSnapshot: 'Bonjour', position: 1, status: 'CONFIRME_CONTACTE', ...audit } as CampaignRecipientRecord];

    const report = calculateStatistics(data, { period: resolveStatisticsPeriod('CURRENT_MONTH', '2026-07-18'), today: '2026-07-18', primaryCurrency: 'XOF', primaryCurrencyScale: 0 });
    expect(report.prospects).toEqual({ total: 3, active: 1, newInPeriod: 2 });
    expect(report.clients.total).toBe(2);
    expect(report.conversions).toMatchObject({ inPeriod: 1, eligibleCohort: 2, convertedCohort: 2, ratePercent: 100, averageDelayDays: 8 });
    expect(report.followUps).toEqual({ today: 1, overdue: 1, upcoming: 1, completedInPeriod: 1 });
    expect(report.demandedProducts[0].count).toBe(2);
    expect(report.soldProducts[0]).toMatchObject({ quantityScaled: '35', quantityScale: 1, freeLineCount: 1 });
    expect(report.primaryFinancial).toMatchObject({ billedMinor: '1000', collectedMinor: '400', receivableMinor: '600', overdueMinor: '600' });
    expect(report.financial.find((row) => row.currency === 'USD')).toMatchObject({ billedMinor: '10000', collectedMinor: '10000', receivableMinor: '0' });
    expect(report.hasOtherCurrencies).toBe(true);
    expect(report.receivables).toMatchObject({ invoices: 1, debtorClients: 1, overdueInvoices: 1 });
    expect(report.localities.find((row) => row.label === 'Dakar')).toMatchObject({ prospects: 2, clients: 2, conversions: 1 });
    expect(report.campaigns).toMatchObject({ inProgress: 1, remaining: 1, confirmed: 1, resumableCampaignId: 'campaign' });
    expect(report.integrity.byCode.PAYMENT_ON_CANCELLED_INVOICE).toBe(1);
    expect(report.series).toHaveLength(31);
  });

  it('rend le taux non calculable sur une cohorte vide et conserve les zéros de série', () => {
    const report = calculateStatistics(empty(), { period: resolveStatisticsPeriod('LAST_7_DAYS', '2026-07-18'), today: '2026-07-18', primaryCurrency: 'XOF', primaryCurrencyScale: 0 });
    expect(report.conversions.ratePercent).toBeNull();
    expect(report.series).toHaveLength(7);
    expect(report.series.every((point) => point.billedMinor === '0')).toBe(true);
  });

  it('détecte montants non sûrs, références absentes, agrégats et statuts incohérents', () => {
    const data = empty(); data.contacts = [contact('c1', now)]; data.clientProfiles = [client('cl1', 'c1', now)];
    data.invoices = [invoice('bad', 'cl1', { grandTotalMinor: Number.MAX_SAFE_INTEGER + 1 }), invoice('mismatch', 'cl1', { status: 'PAYEE', paidTotalMinor: 1000, balanceMinor: -1 })];
    data.payments = [payment('orphan', 'missing', 'cl1', 100)];
    const report = calculateStatistics(data, { period: resolveStatisticsPeriod('CURRENT_MONTH', '2026-07-18'), today: '2026-07-18', primaryCurrency: 'XOF', primaryCurrencyScale: 0 });
    expect(report.integrity.byCode.UNSAFE_AMOUNT).toBeGreaterThan(0);
    expect(report.integrity.byCode.MISSING_REFERENCE).toBeGreaterThan(0);
    expect(report.integrity.byCode.NEGATIVE_BALANCE).toBeGreaterThan(0);
    expect(report.integrity.byCode.INVOICE_AGGREGATE_MISMATCH).toBeGreaterThan(0);
    expect(report.integrity.byCode.INCOHERENT_STATUS).toBeGreaterThan(0);
  });

  it('préserve le libellé de vente instantané et gère explicitement un produit archivé', () => {
    const data = empty(); data.contacts = [contact('c1', now)]; data.clientProfiles = [client('cl1', 'c1', now)];
    data.products = [{ id: 'product', name: 'Nom actuel modifié', normalizedName: 'nom actuel modifie', type: 'SERVICE', unitPriceMinor: 1000, currency: 'XOF', currencyScale: 0, isActive: false, archivedAt: now, ...audit } as ProductRecord];
    data.invoices = [invoice('i1', 'cl1')]; data.invoiceLines = [{ ...line('l1', 'i1', 'product', 1, 0, 1000), designationSnapshot: 'Nom historique facturé' }];
    const options = { period: resolveStatisticsPeriod('CURRENT_MONTH', '2026-07-18'), today: '2026-07-18', primaryCurrency: 'XOF', primaryCurrencyScale: 0 } as const;
    expect(calculateStatistics(data, options).soldProducts).toHaveLength(0);
    expect(calculateStatistics(data, { ...options, includeArchivedProducts: true }).soldProducts[0].label).toBe('Nom historique facturé');
  });

  it('formate les montants et quantités sans flottants', () => {
    expect(formatMinorExact('123456', 'USD', 2)).toBe('1 234,56 USD');
    expect(formatMinorExact('-10', 'XOF', 0)).toBe('−10 XOF');
    expect(formatQuantityExact('35', 1)).toBe('3,5');
  });
});
