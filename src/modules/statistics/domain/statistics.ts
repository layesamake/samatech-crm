import type { CampaignRecord, CampaignRecipientRecord } from '@/modules/campaigns/domain/campaign';
import type { ProductRecord } from '@/modules/catalog/domain/catalog';
import type { ClientProfileRecord } from '@/modules/clients/domain/client';
import type { FollowUpRecord } from '@/modules/follow-ups/domain/follow-up';
import type { InvoiceLineRecord, InvoiceRecord } from '@/modules/invoices/domain/invoice';
import type { LocationRecord } from '@/modules/locations/domain/location';
import type { PaymentRecord } from '@/modules/payments/domain/payment';
import type { ContactRecord, ProspectInterestRecord, ProspectProfileRecord } from '@/modules/prospects/domain/prospect';
import type { ExpenseRecord } from '@/modules/expenses/domain/expense';

export const STATISTICS_TIMEZONE = 'Africa/Dakar';
export const PERIOD_PRESETS = ['TODAY', 'LAST_7_DAYS', 'CURRENT_MONTH', 'PREVIOUS_MONTH', 'CURRENT_YEAR', 'CUSTOM'] as const;
export type PeriodPreset = typeof PERIOD_PRESETS[number];

export interface StatisticsPeriod { preset: PeriodPreset; from: string; to: string; label: string; timezone: string; }
export interface StatisticsData {
  contacts: ContactRecord[]; prospectProfiles: ProspectProfileRecord[]; clientProfiles: ClientProfileRecord[];
  locations: LocationRecord[]; products: ProductRecord[]; prospectInterests: ProspectInterestRecord[];
  followUps: FollowUpRecord[]; invoices: InvoiceRecord[]; invoiceLines: InvoiceLineRecord[]; payments: PaymentRecord[];
  campaigns: CampaignRecord[]; campaignRecipients: CampaignRecipientRecord[]; expenses: ExpenseRecord[];
}
export interface StatisticsOptions {
  period: StatisticsPeriod; today: string; primaryCurrency: string; primaryCurrencyScale: number; includeArchivedProducts?: boolean;
}
export interface MoneyGroup { currency: string; currencyScale: number; billedMinor: string; collectedMinor: string; receivableMinor: string; overdueMinor: string; upcomingMinor: string; expensesMinor: string; }
export interface RankedCount { id: string; label: string; count: number; archived: boolean; }
export interface SoldProduct extends RankedCount { quantityScaled: string; quantityScale: number; invoiceCount: number; clientCount: number; freeLineCount: number; amounts: Array<{ currency: string; currencyScale: number; minor: string }>; }
export interface SegmentStatistics { id: string; label: string; prospects: number; clients: number; conversions: number; eligibleCohort: number; convertedCohort: number; invoiceCount: number; billed: Array<{ currency: string; currencyScale: number; minor: string }>; collected: Array<{ currency: string; currencyScale: number; minor: string }>; receivable: Array<{ currency: string; currencyScale: number; minor: string }>; archived?: boolean; }
export interface TimeSeriesPoint { key: string; label: string; newProspects: number; conversions: number; billedMinor: string; collectedMinor: string; expensesMinor: string; }
export type IntegrityCode = 'UNSAFE_AMOUNT' | 'INVOICE_AGGREGATE_MISMATCH' | 'NEGATIVE_BALANCE' | 'PAYMENT_ON_CANCELLED_INVOICE' | 'MISSING_REFERENCE' | 'INCOHERENT_STATUS';
export interface StatisticsReport {
  period: StatisticsPeriod;
  primaryCurrency: string; primaryCurrencyScale: number; includeArchivedProducts: boolean;
  prospects: { total: number; active: number; newInPeriod: number; };
  clients: { total: number; };
  conversions: { inPeriod: number; eligibleCohort: number; convertedCohort: number; ratePercent: number | null; averageDelayDays: number | null; invalidDelayCount: number; };
  followUps: { today: number; overdue: number; upcoming: number; completedInPeriod: number; };
  demandedProducts: RankedCount[]; soldProducts: SoldProduct[]; freeInvoiceLineCount: number;
  financial: MoneyGroup[]; primaryFinancial: MoneyGroup; hasOtherCurrencies: boolean;
  receivables: { invoices: number; debtorClients: number; overdueInvoices: number; upcomingInvoices: number; partiallyPaidInvoices: number; aging: { days0to30: number; days31to60: number; days61to90: number; daysOver90: number; }; topDebtors: Array<{ clientProfileId: string; label: string; amounts: Array<{ currency: string; currencyScale: number; minor: string }> }>; };
  localities: SegmentStatistics[]; sources: SegmentStatistics[]; statuses: RankedCount[]; interestLevels: RankedCount[];
  campaigns: { total: number; draft: number; ready: number; inProgress: number; completed: number; cancelled: number; recipients: number; remaining: number; confirmed: number; resumableCampaignId: string | null; };
  seriesGranularity: 'DAY' | 'MONTH'; series: TimeSeriesPoint[];
  comparison: { period: StatisticsPeriod; newProspects: number; conversions: number; billedMinor: string; collectedMinor: string; expensesMinor: string; };
  integrity: { hasIssues: boolean; count: number; byCode: Partial<Record<IntegrityCode, number>>; };
  isEmpty: boolean;
}

const DAY_MS = 86_400_000;
const ELIGIBLE_INVOICE_STATUSES = new Set(['EMISE', 'PARTIELLEMENT_PAYEE', 'PAYEE']);
const FINAL_RECIPIENT_STATUSES = new Set(['CONFIRME_CONTACTE', 'IGNORE', 'ERREUR']);
const DATE_FORMATTERS = new Map<string, Intl.DateTimeFormat>();

function dateFromKey(key: string): Date { return new Date(`${key}T00:00:00.000Z`); }
function keyFromDate(date: Date): string { return date.toISOString().slice(0, 10); }
function addDays(key: string, count: number): string { return keyFromDate(new Date(dateFromKey(key).getTime() + count * DAY_MS)); }
function monthStart(key: string): string { return `${key.slice(0, 7)}-01`; }
function monthEnd(key: string): string { const [year, month] = key.split('-').map(Number); return keyFromDate(new Date(Date.UTC(year, month, 0))); }
function previousMonthStart(key: string): string { const [year, month] = key.split('-').map(Number); return keyFromDate(new Date(Date.UTC(year, month - 2, 1))); }
function validDateKey(value: string): boolean { return /^\d{4}-\d{2}-\d{2}$/.test(value) && keyFromDate(dateFromKey(value)) === value; }

export function localDateKey(value: string | Date, timezone = STATISTICS_TIMEZONE): string | null {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  let formatter = DATE_FORMATTERS.get(timezone);
  if (!formatter) { formatter = new Intl.DateTimeFormat('fr-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }); DATE_FORMATTERS.set(timezone, formatter); }
  const parts = formatter.formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function resolveStatisticsPeriod(preset: PeriodPreset, referenceDate: string, timezone = STATISTICS_TIMEZONE, customFrom?: string, customTo?: string): StatisticsPeriod {
  if (!validDateKey(referenceDate)) throw new Error('Date de référence invalide');
  let from = referenceDate; let to = referenceDate; let label = `Aujourd’hui · ${referenceDate}`;
  if (preset === 'LAST_7_DAYS') { from = addDays(referenceDate, -6); label = '7 derniers jours'; }
  if (preset === 'CURRENT_MONTH') { from = monthStart(referenceDate); to = monthEnd(referenceDate); label = 'Mois en cours'; }
  if (preset === 'PREVIOUS_MONTH') { from = previousMonthStart(referenceDate); to = monthEnd(from); label = 'Mois précédent'; }
  if (preset === 'CURRENT_YEAR') { from = `${referenceDate.slice(0, 4)}-01-01`; to = `${referenceDate.slice(0, 4)}-12-31`; label = 'Année en cours'; }
  if (preset === 'CUSTOM') {
    if (!customFrom || !customTo || !validDateKey(customFrom) || !validDateKey(customTo) || customFrom > customTo) throw new Error('Période personnalisée invalide');
    from = customFrom; to = customTo; label = 'Période personnalisée';
  }
  return { preset, from, to, label, timezone };
}

export function previousEquivalentPeriod(period: StatisticsPeriod): StatisticsPeriod {
  const length = Math.round((dateFromKey(period.to).getTime() - dateFromKey(period.from).getTime()) / DAY_MS) + 1;
  const to = addDays(period.from, -1); const from = addDays(to, -(length - 1));
  return { preset: 'CUSTOM', from, to, label: 'Période précédente comparable', timezone: period.timezone };
}

function inPeriod(key: string | null | undefined, period: StatisticsPeriod): boolean { return Boolean(key && key >= period.from && key <= period.to); }
function recordDate(value: string | undefined, timezone: string): string | null { return value ? (value.length === 10 ? (validDateKey(value) ? value : null) : localDateKey(value, timezone)) : null; }
function safeInteger(value: number): boolean { return Number.isSafeInteger(value); }
function moneyKey(currency: string, scale: number): string { return `${currency}|${scale}`; }
function addMoney(map: Map<string, bigint>, currency: string, scale: number, value: number | bigint): void {
  const key = moneyKey(currency, scale); map.set(key, (map.get(key) ?? BigInt(0)) + BigInt(value));
}
function moneyRows(map: Map<string, bigint>): Array<{ currency: string; currencyScale: number; minor: string }> {
  return [...map.entries()].map(([key, value]) => { const [currency, scale] = key.split('|'); return { currency, currencyScale: Number(scale), minor: value.toString() }; }).sort((a, b) => a.currency.localeCompare(b.currency) || a.currencyScale - b.currencyScale);
}
function nameOrFallback(value: string | undefined, fallback: string): string { return value?.trim() || fallback; }
function increment(map: Map<string, number>, key: string, count = 1): void { map.set(key, (map.get(key) ?? 0) + count); }
function issue(byCode: Partial<Record<IntegrityCode, number>>, code: IntegrityCode): void { byCode[code] = (byCode[code] ?? 0) + 1; }
function bigintOrNull(value: number): bigint | null { return safeInteger(value) ? BigInt(value) : null; }

interface FinancialAccumulator { billed: Map<string, bigint>; collected: Map<string, bigint>; receivable: Map<string, bigint>; overdue: Map<string, bigint>; upcoming: Map<string, bigint>; expenses: Map<string, bigint>; }
function newFinancialAccumulator(): FinancialAccumulator { return { billed: new Map(), collected: new Map(), receivable: new Map(), overdue: new Map(), upcoming: new Map(), expenses: new Map() }; }
function financialGroups(acc: FinancialAccumulator): MoneyGroup[] {
  const keys = new Set([...acc.billed.keys(), ...acc.collected.keys(), ...acc.receivable.keys(), ...acc.overdue.keys(), ...acc.upcoming.keys(), ...acc.expenses.keys()]);
  return [...keys].map((key) => { const [currency, scale] = key.split('|'); return { currency, currencyScale: Number(scale), billedMinor: (acc.billed.get(key) ?? BigInt(0)).toString(), collectedMinor: (acc.collected.get(key) ?? BigInt(0)).toString(), receivableMinor: (acc.receivable.get(key) ?? BigInt(0)).toString(), overdueMinor: (acc.overdue.get(key) ?? BigInt(0)).toString(), upcomingMinor: (acc.upcoming.get(key) ?? BigInt(0)).toString(), expensesMinor: (acc.expenses.get(key) ?? BigInt(0)).toString() }; }).sort((a, b) => a.currency.localeCompare(b.currency) || a.currencyScale - b.currencyScale);
}
function primaryGroup(groups: MoneyGroup[], currency: string, scale: number): MoneyGroup { return groups.find((item) => item.currency === currency && item.currencyScale === scale) ?? { currency, currencyScale: scale, billedMinor: '0', collectedMinor: '0', receivableMinor: '0', overdueMinor: '0', upcomingMinor: '0', expensesMinor: '0' }; }

function segmentRow(id: string, label: string, data: { prospects: number; clients: number; conversions: number; eligibleCohort: number; convertedCohort: number; invoiceCount: number; billed: Map<string, bigint>; collected: Map<string, bigint>; receivable: Map<string, bigint>; archived?: boolean }): SegmentStatistics {
  return { id, label, prospects: data.prospects, clients: data.clients, conversions: data.conversions, eligibleCohort: data.eligibleCohort, convertedCohort: data.convertedCohort, invoiceCount: data.invoiceCount, billed: moneyRows(data.billed), collected: moneyRows(data.collected), receivable: moneyRows(data.receivable), archived: data.archived };
}

export function calculateStatistics(data: StatisticsData, options: StatisticsOptions): StatisticsReport {
  const { period, today, primaryCurrency, primaryCurrencyScale } = options;
  if (!validDateKey(today)) throw new Error('Date du jour invalide');
  const contactById = new Map(data.contacts.map((item) => [item.id, item]));
  const prospectById = new Map(data.prospectProfiles.map((item) => [item.id, item]));
  const clientById = new Map(data.clientProfiles.map((item) => [item.id, item]));
  const productById = new Map(data.products.map((item) => [item.id, item]));
  const locationById = new Map(data.locations.map((item) => [item.id, item]));
  const invoiceById = new Map(data.invoices.map((item) => [item.id, item]));
  const byCode: Partial<Record<IntegrityCode, number>> = {};

  for (const profile of data.prospectProfiles) if (!contactById.has(profile.contactId)) issue(byCode, 'MISSING_REFERENCE');
  for (const profile of data.clientProfiles) if (!contactById.has(profile.contactId)) issue(byCode, 'MISSING_REFERENCE');
  for (const interest of data.prospectInterests) if (!prospectById.has(interest.prospectProfileId) || !productById.has(interest.productId)) issue(byCode, 'MISSING_REFERENCE');

  const prospectsTotal = new Set(data.prospectProfiles.filter((item) => contactById.has(item.contactId)).map((item) => item.contactId)).size;
  const activeProspects = data.prospectProfiles.filter((profile) => { const contact = contactById.get(profile.contactId); return Boolean(contact && !profile.archivedAt && !contact.archivedAt && profile.status !== 'CONVERTI'); }).length;
  const newInPeriod = data.prospectProfiles.filter((item) => contactById.has(item.contactId) && inPeriod(recordDate(item.createdAt, period.timezone), period)).length;
  const activeClients = data.clientProfiles.filter((profile) => { const contact = contactById.get(profile.contactId); return Boolean(contact && !profile.archivedAt && !contact.archivedAt); });
  const clientsTotal = new Set(activeClients.map((item) => item.contactId)).size;
  const conversionsInPeriodRows = data.prospectProfiles.filter((item) => inPeriod(recordDate(item.convertedAt, period.timezone), period));
  const cohort = data.prospectProfiles.filter((item) => inPeriod(recordDate(item.createdAt, period.timezone), period));
  const convertedCohort = cohort.filter((item) => Boolean(recordDate(item.convertedAt, period.timezone))).length;
  const validDelays: number[] = []; let invalidDelayCount = 0;
  for (const profile of conversionsInPeriodRows) {
    const created = recordDate(profile.createdAt, period.timezone); const converted = recordDate(profile.convertedAt, period.timezone);
    if (!created || !converted || converted < created) { invalidDelayCount += 1; continue; }
    validDelays.push(Math.floor((dateFromKey(converted).getTime() - dateFromKey(created).getTime()) / DAY_MS));
  }

  const followUps = { today: 0, overdue: 0, upcoming: 0, completedInPeriod: 0 };
  for (const followUp of data.followUps) {
    if (followUp.archivedAt) continue;
    if (followUp.status === 'PLANIFIEE') {
      const due = recordDate(followUp.dueAt, followUp.timezone || period.timezone);
      if (due === today) followUps.today += 1; else if (due && due < today) followUps.overdue += 1; else if (due && due > today) followUps.upcoming += 1;
    }
    if (followUp.status === 'REALISEE' && inPeriod(recordDate(followUp.completedAt, period.timezone), period)) followUps.completedInPeriod += 1;
  }

  const demandCount = new Map<string, number>(); const seenDemand = new Set<string>();
  for (const interest of data.prospectInterests) {
    if (interest.archivedAt || !inPeriod(recordDate(interest.requestedAt, period.timezone), period)) continue;
    const product = productById.get(interest.productId); if (!product || (!options.includeArchivedProducts && product.archivedAt)) continue;
    const key = `${interest.prospectProfileId}|${interest.productId}`; if (seenDemand.has(key)) continue; seenDemand.add(key); increment(demandCount, interest.productId);
  }
  const demandedProducts = [...demandCount.entries()].map(([id, count]) => ({ id, label: nameOrFallback(productById.get(id)?.name, 'Produit supprimé'), count, archived: Boolean(productById.get(id)?.archivedAt) })).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label) || a.id.localeCompare(b.id));

  const activePaymentsByInvoice = new Map<string, PaymentRecord[]>();
  for (const payment of data.payments) {
    if (payment.archivedAt || payment.status !== 'ACTIVE') continue;
    if (!invoiceById.has(payment.invoiceId) || !clientById.has(payment.clientProfileId)) issue(byCode, 'MISSING_REFERENCE');
    const rows = activePaymentsByInvoice.get(payment.invoiceId) ?? []; rows.push(payment); activePaymentsByInvoice.set(payment.invoiceId, rows);
  }
  const financial = newFinancialAccumulator();
  const invoiceActivePaid = new Map<string, bigint>();
  const invoiceCalculatedBalance = new Map<string, bigint>();
  const receivableInvoiceIds = new Set<string>(); const overdueInvoiceIds = new Set<string>(); const debtorClients = new Set<string>();
  const aging = { days0to30: 0, days31to60: 0, days61to90: 0, daysOver90: 0 }; const debtorAmounts = new Map<string, Map<string, bigint>>();

  for (const invoice of data.invoices) {
    const total = bigintOrNull(invoice.grandTotalMinor); const cachedPaid = bigintOrNull(invoice.paidTotalMinor); const cachedBalance = bigintOrNull(invoice.balanceMinor);
    if (total === null || cachedPaid === null || cachedBalance === null || !Number.isInteger(invoice.currencyScale) || invoice.currencyScale < 0) { issue(byCode, 'UNSAFE_AMOUNT'); continue; }
    if (invoice.balanceMinor < 0) issue(byCode, 'NEGATIVE_BALANCE');
    if (!clientById.has(invoice.clientProfileId)) issue(byCode, 'MISSING_REFERENCE');
    let activePaid = BigInt(0);
    for (const payment of activePaymentsByInvoice.get(invoice.id) ?? []) {
      if (!safeInteger(payment.amountMinor) || payment.amountMinor <= 0 || payment.currency !== invoice.currency || payment.currencyScale !== invoice.currencyScale) { issue(byCode, 'UNSAFE_AMOUNT'); continue; }
      activePaid += BigInt(payment.amountMinor);
      if (invoice.status === 'ANNULEE') issue(byCode, 'PAYMENT_ON_CANCELLED_INVOICE');
    }
    invoiceActivePaid.set(invoice.id, activePaid);
    const balance = total - activePaid; invoiceCalculatedBalance.set(invoice.id, balance);
    if (cachedPaid !== activePaid || cachedBalance !== balance) issue(byCode, 'INVOICE_AGGREGATE_MISMATCH');
    const expected = activePaid === BigInt(0) ? 'EMISE' : balance === BigInt(0) ? 'PAYEE' : balance > BigInt(0) ? 'PARTIELLEMENT_PAYEE' : null;
    if (ELIGIBLE_INVOICE_STATUSES.has(invoice.status) && expected !== invoice.status) issue(byCode, 'INCOHERENT_STATUS');
    if (!invoice.archivedAt && ELIGIBLE_INVOICE_STATUSES.has(invoice.status) && inPeriod(recordDate(invoice.issueDate, period.timezone), period)) addMoney(financial.billed, invoice.currency, invoice.currencyScale, total);
    if (!invoice.archivedAt && invoice.status !== 'ANNULEE' && invoice.status !== 'BROUILLON' && balance > BigInt(0)) {
      addMoney(financial.receivable, invoice.currency, invoice.currencyScale, balance); receivableInvoiceIds.add(invoice.id); debtorClients.add(invoice.clientProfileId); const debtor = debtorAmounts.get(invoice.clientProfileId) ?? new Map<string, bigint>(); addMoney(debtor, invoice.currency, invoice.currencyScale, balance); debtorAmounts.set(invoice.clientProfileId, debtor);
      const overdue = Boolean(invoice.dueDate && invoice.dueDate < today);
      addMoney(overdue ? financial.overdue : financial.upcoming, invoice.currency, invoice.currencyScale, balance);
      if (overdue) {
        overdueInvoiceIds.add(invoice.id); const days = Math.floor((dateFromKey(today).getTime() - dateFromKey(invoice.dueDate!).getTime()) / DAY_MS);
        if (days <= 30) aging.days0to30 += 1; else if (days <= 60) aging.days31to60 += 1; else if (days <= 90) aging.days61to90 += 1; else aging.daysOver90 += 1;
      }
    }
  }
  for (const payment of data.payments) {
    if (payment.archivedAt || payment.status !== 'ACTIVE') continue;
    const invoice = invoiceById.get(payment.invoiceId);
    if (!invoice || invoice.status === 'ANNULEE' || invoice.archivedAt) continue;
    if (!safeInteger(payment.amountMinor) || payment.amountMinor <= 0 || payment.currency !== invoice.currency || payment.currencyScale !== invoice.currencyScale) continue;
    if (inPeriod(recordDate(payment.paymentDate, period.timezone), period)) addMoney(financial.collected, payment.currency, payment.currencyScale, payment.amountMinor);
  }
  for (const expense of data.expenses) {
    if (expense.archivedAt || expense.status !== 'ACTIVE') continue;
    if (!safeInteger(expense.amountMinor) || expense.amountMinor <= 0) continue;
    if (inPeriod(recordDate(expense.expenseDate, period.timezone), period)) addMoney(financial.expenses, expense.currency, expense.currencyScale, expense.amountMinor);
  }

  interface SoldAcc { id: string; label: string; count: number; archived: boolean; quantities: Array<{ value: number; scale: number }>; invoiceIds: Set<string>; clientIds: Set<string>; freeLineCount: number; amounts: Map<string, bigint>; }
  const sold = new Map<string, SoldAcc>(); let freeInvoiceLineCount = 0;
  for (const line of data.invoiceLines) {
    if (line.archivedAt) continue; const invoice = invoiceById.get(line.invoiceId);
    if (!invoice) { issue(byCode, 'MISSING_REFERENCE'); continue; }
    if (invoice.archivedAt || !ELIGIBLE_INVOICE_STATUSES.has(invoice.status) || !inPeriod(recordDate(invoice.issueDate, period.timezone), period)) continue;
    if (!safeInteger(line.quantityScaled) || line.quantityScaled < 0 || !Number.isInteger(line.quantityScale) || line.quantityScale < 0 || !safeInteger(line.lineTotalMinor)) { issue(byCode, 'UNSAFE_AMOUNT'); continue; }
    const id = line.productId ?? `snapshot:${line.designationSnapshot}`; const product = line.productId ? productById.get(line.productId) : undefined;
    if (line.productId && !product) issue(byCode, 'MISSING_REFERENCE');
    if (product?.archivedAt && !options.includeArchivedProducts) continue;
    const snapshotLabel = nameOrFallback(line.designationSnapshot, 'Ligne sans désignation'); const entry: SoldAcc = sold.get(id) ?? { id, label: snapshotLabel, count: 0, archived: Boolean(product?.archivedAt), quantities: [], invoiceIds: new Set<string>(), clientIds: new Set<string>(), freeLineCount: 0, amounts: new Map<string, bigint>() }; if (snapshotLabel.localeCompare(entry.label) < 0) entry.label = snapshotLabel;
    if (line.lineTotalMinor === 0) { entry.freeLineCount += 1; freeInvoiceLineCount += 1; sold.set(id, entry); continue; }
    entry.count += 1; entry.quantities.push({ value: line.quantityScaled, scale: line.quantityScale }); entry.invoiceIds.add(invoice.id); entry.clientIds.add(invoice.clientProfileId); addMoney(entry.amounts, invoice.currency, invoice.currencyScale, line.lineTotalMinor); sold.set(id, entry);
  }
  const soldProducts: SoldProduct[] = [...sold.values()].map((item) => {
    const quantityScale = item.quantities.reduce((max, row) => Math.max(max, row.scale), 0);
    const quantity = item.quantities.reduce((sum, row) => sum + BigInt(row.value) * (BigInt(10) ** BigInt(quantityScale - row.scale)), BigInt(0));
    return { id: item.id, label: item.label, count: item.count, archived: item.archived, quantityScaled: quantity.toString(), quantityScale, invoiceCount: item.invoiceIds.size, clientCount: item.clientIds.size, freeLineCount: item.freeLineCount, amounts: moneyRows(item.amounts) };
  }).sort((a, b) => { const quantityA = BigInt(a.quantityScaled) * (BigInt(10) ** BigInt(Math.max(a.quantityScale, b.quantityScale) - a.quantityScale)); const quantityB = BigInt(b.quantityScaled) * (BigInt(10) ** BigInt(Math.max(a.quantityScale, b.quantityScale) - b.quantityScale)); return quantityA === quantityB ? a.label.localeCompare(b.label) || a.id.localeCompare(b.id) : quantityA > quantityB ? -1 : 1; });

  type SegmentAcc = { prospects: number; clients: number; conversions: number; eligibleCohort: number; convertedCohort: number; invoiceCount: number; billed: Map<string, bigint>; collected: Map<string, bigint>; receivable: Map<string, bigint>; archived?: boolean };
  const segment = (map: Map<string, SegmentAcc>, key: string, archived?: boolean): SegmentAcc => { const value = map.get(key) ?? { prospects: 0, clients: 0, conversions: 0, eligibleCohort: 0, convertedCohort: 0, invoiceCount: 0, billed: new Map(), collected: new Map(), receivable: new Map(), archived }; map.set(key, value); return value; };
  const localityAcc = new Map<string, SegmentAcc>(); const sourceAcc = new Map<string, SegmentAcc>();
  const localityKey = (contact: ContactRecord | undefined): string => contact?.locationId && locationById.has(contact.locationId) ? contact.locationId : '__NONE__';
  const sourceKey = (contact: ContactRecord | undefined): string => contact?.source ?? '__NONE__';
  for (const profile of data.prospectProfiles) { const contact = contactById.get(profile.contactId); if (!contact) continue; const locality = segment(localityAcc, localityKey(contact), Boolean(contact.locationId && locationById.get(contact.locationId)?.archivedAt)); const source = segment(sourceAcc, sourceKey(contact)); locality.prospects += 1; source.prospects += 1; if (inPeriod(recordDate(profile.convertedAt, period.timezone), period)) { locality.conversions += 1; source.conversions += 1; } if (inPeriod(recordDate(profile.createdAt, period.timezone), period)) { locality.eligibleCohort += 1; source.eligibleCohort += 1; if (profile.convertedAt) { locality.convertedCohort += 1; source.convertedCohort += 1; } } }
  for (const profile of activeClients) { const contact = contactById.get(profile.contactId); segment(localityAcc, localityKey(contact)).clients += 1; segment(sourceAcc, sourceKey(contact)).clients += 1; }
  for (const invoice of data.invoices) {
    if (invoice.archivedAt || !safeInteger(invoice.grandTotalMinor)) continue; const contact = contactById.get(clientById.get(invoice.clientProfileId)?.contactId ?? ''); const locality = segment(localityAcc, localityKey(contact)); const source = segment(sourceAcc, sourceKey(contact));
    if (ELIGIBLE_INVOICE_STATUSES.has(invoice.status) && inPeriod(recordDate(invoice.issueDate, period.timezone), period)) { addMoney(locality.billed, invoice.currency, invoice.currencyScale, invoice.grandTotalMinor); addMoney(source.billed, invoice.currency, invoice.currencyScale, invoice.grandTotalMinor); locality.invoiceCount += 1; source.invoiceCount += 1; }
    const balance = invoiceCalculatedBalance.get(invoice.id); if (invoice.status !== 'ANNULEE' && invoice.status !== 'BROUILLON' && balance !== undefined && balance > BigInt(0)) { addMoney(locality.receivable, invoice.currency, invoice.currencyScale, balance); addMoney(source.receivable, invoice.currency, invoice.currencyScale, balance); }
  }
  for (const payment of data.payments) {
    const invoice = invoiceById.get(payment.invoiceId); if (payment.archivedAt || payment.status !== 'ACTIVE' || !invoice || invoice.status === 'ANNULEE' || !safeInteger(payment.amountMinor) || !inPeriod(recordDate(payment.paymentDate, period.timezone), period)) continue;
    const contact = contactById.get(clientById.get(payment.clientProfileId)?.contactId ?? ''); addMoney(segment(localityAcc, localityKey(contact)).collected, payment.currency, payment.currencyScale, payment.amountMinor); addMoney(segment(sourceAcc, sourceKey(contact)).collected, payment.currency, payment.currencyScale, payment.amountMinor);
  }
  const locationPath = (id: string): string => { if (id === '__NONE__') return 'Sans localité'; const names: string[] = []; const seen = new Set<string>(); let current = locationById.get(id); while (current && !seen.has(current.id)) { seen.add(current.id); names.unshift(current.name); current = current.parentId ? locationById.get(current.parentId) : undefined; } return names.join(' › ') || 'Localité supprimée'; };
  const localities = [...localityAcc.entries()].map(([id, value]) => segmentRow(id, locationPath(id), value)).sort((a, b) => b.prospects - a.prospects || a.label.localeCompare(b.label));
  const sourceLabels: Record<string, string> = { WHATSAPP: 'WhatsApp', FACEBOOK: 'Facebook', INSTAGRAM: 'Instagram', LINKEDIN: 'LinkedIn', WEBSITE: 'Site web', REFERRAL: 'Recommandation', EVENT: 'Événement', MANUAL: 'Saisie manuelle', OTHER: 'Autre', __NONE__: 'Source non renseignée' };
  const sources = [...sourceAcc.entries()].map(([id, value]) => segmentRow(id, sourceLabels[id] ?? id, value)).sort((a, b) => b.prospects - a.prospects || a.label.localeCompare(b.label));
  const statusCount = new Map<string, number>(); const interestCount = new Map<string, number>();
  for (const profile of data.prospectProfiles) { const contact = contactById.get(profile.contactId); if (profile.archivedAt || contact?.archivedAt || profile.status === 'CONVERTI') continue; increment(statusCount, profile.status); increment(interestCount, profile.interestLevel); }
  const labelToken = (value: string): string => value.toLowerCase().replaceAll('_', ' ').replace(/^./, (letter) => letter.toUpperCase());
  const rankedTokens = (map: Map<string, number>): RankedCount[] => [...map.entries()].map(([id, count]) => ({ id, label: labelToken(id), count, archived: false })).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

  const campaignRows = data.campaigns.filter((item) => !item.archivedAt); const campaignIds = new Set(campaignRows.map((item) => item.id)); const recipientRows = data.campaignRecipients.filter((item) => !item.archivedAt && campaignIds.has(item.campaignId));
  const resumable = campaignRows.filter((item) => item.status === 'EN_COURS').sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).find((campaign) => recipientRows.some((item) => item.campaignId === campaign.id && !FINAL_RECIPIENT_STATUSES.has(item.status)));
  const campaigns = { total: campaignRows.length, draft: campaignRows.filter((item) => item.status === 'BROUILLON').length, ready: campaignRows.filter((item) => item.status === 'PRETE').length, inProgress: campaignRows.filter((item) => item.status === 'EN_COURS').length, completed: campaignRows.filter((item) => item.status === 'TERMINEE').length, cancelled: campaignRows.filter((item) => item.status === 'ANNULEE').length, recipients: recipientRows.length, remaining: recipientRows.filter((item) => !FINAL_RECIPIENT_STATUSES.has(item.status)).length, confirmed: recipientRows.filter((item) => item.status === 'CONFIRME_CONTACTE').length, resumableCampaignId: resumable?.id ?? null };

  const days = Math.round((dateFromKey(period.to).getTime() - dateFromKey(period.from).getTime()) / DAY_MS) + 1; const seriesGranularity = days <= 93 ? 'DAY' as const : 'MONTH' as const;
  const seriesKeys: string[] = [];
  if (seriesGranularity === 'DAY') for (let key = period.from; key <= period.to; key = addDays(key, 1)) seriesKeys.push(key);
  else { for (let key = monthStart(period.from); key <= monthStart(period.to); ) { seriesKeys.push(key.slice(0, 7)); const [year, month] = key.split('-').map(Number); key = keyFromDate(new Date(Date.UTC(year, month, 1))); } }
  const pointByKey = new Map(seriesKeys.map((key) => [key, { key, label: seriesGranularity === 'DAY' ? key.slice(5) : key, newProspects: 0, conversions: 0, billedMinor: BigInt(0), collectedMinor: BigInt(0), expensesMinor: BigInt(0) }]));
  const bucket = (key: string): string => seriesGranularity === 'DAY' ? key : key.slice(0, 7);
  for (const profile of data.prospectProfiles) { const created = recordDate(profile.createdAt, period.timezone); const converted = recordDate(profile.convertedAt, period.timezone); if (inPeriod(created, period)) pointByKey.get(bucket(created!))!.newProspects += 1; if (inPeriod(converted, period)) pointByKey.get(bucket(converted!))!.conversions += 1; }
  for (const invoice of data.invoices) { const date = recordDate(invoice.issueDate, period.timezone); if (!invoice.archivedAt && ELIGIBLE_INVOICE_STATUSES.has(invoice.status) && invoice.currency === primaryCurrency && invoice.currencyScale === primaryCurrencyScale && safeInteger(invoice.grandTotalMinor) && inPeriod(date, period)) pointByKey.get(bucket(date!))!.billedMinor += BigInt(invoice.grandTotalMinor); }
  for (const payment of data.payments) { const date = recordDate(payment.paymentDate, period.timezone); const invoice = invoiceById.get(payment.invoiceId); if (!payment.archivedAt && payment.status === 'ACTIVE' && invoice && invoice.status !== 'ANNULEE' && payment.currency === primaryCurrency && payment.currencyScale === primaryCurrencyScale && safeInteger(payment.amountMinor) && inPeriod(date, period)) pointByKey.get(bucket(date!))!.collectedMinor += BigInt(payment.amountMinor); }
  for (const expense of data.expenses) { const date = recordDate(expense.expenseDate, period.timezone); if (!expense.archivedAt && expense.status === 'ACTIVE' && expense.currency === primaryCurrency && expense.currencyScale === primaryCurrencyScale && safeInteger(expense.amountMinor) && inPeriod(date, period)) pointByKey.get(bucket(date!))!.expensesMinor += BigInt(expense.amountMinor); }
  const series: TimeSeriesPoint[] = [...pointByKey.values()].map((item) => ({ ...item, billedMinor: item.billedMinor.toString(), collectedMinor: item.collectedMinor.toString(), expensesMinor: item.expensesMinor.toString() }));

  const comparisonPeriod = previousEquivalentPeriod(period);
  const previousNew = data.prospectProfiles.filter((item) => inPeriod(recordDate(item.createdAt, period.timezone), comparisonPeriod)).length;
  const previousConversions = data.prospectProfiles.filter((item) => inPeriod(recordDate(item.convertedAt, period.timezone), comparisonPeriod)).length;
  let previousBilled = BigInt(0); let previousCollected = BigInt(0); let previousExpenses = BigInt(0);
  for (const invoice of data.invoices) if (!invoice.archivedAt && ELIGIBLE_INVOICE_STATUSES.has(invoice.status) && invoice.currency === primaryCurrency && invoice.currencyScale === primaryCurrencyScale && safeInteger(invoice.grandTotalMinor) && inPeriod(recordDate(invoice.issueDate, period.timezone), comparisonPeriod)) previousBilled += BigInt(invoice.grandTotalMinor);
  for (const payment of data.payments) { const invoice = invoiceById.get(payment.invoiceId); if (!payment.archivedAt && payment.status === 'ACTIVE' && invoice && invoice.status !== 'ANNULEE' && payment.currency === primaryCurrency && payment.currencyScale === primaryCurrencyScale && safeInteger(payment.amountMinor) && inPeriod(recordDate(payment.paymentDate, period.timezone), comparisonPeriod)) previousCollected += BigInt(payment.amountMinor); }
  for (const expense of data.expenses) if (!expense.archivedAt && expense.status === 'ACTIVE' && expense.currency === primaryCurrency && expense.currencyScale === primaryCurrencyScale && safeInteger(expense.amountMinor) && inPeriod(recordDate(expense.expenseDate, period.timezone), comparisonPeriod)) previousExpenses += BigInt(expense.amountMinor);

  const groups = financialGroups(financial); const integrityCount = Object.values(byCode).reduce((sum, value) => sum + (value ?? 0), 0);
  return {
    period, primaryCurrency, primaryCurrencyScale, includeArchivedProducts: Boolean(options.includeArchivedProducts),
    prospects: { total: prospectsTotal, active: activeProspects, newInPeriod }, clients: { total: clientsTotal },
    conversions: { inPeriod: conversionsInPeriodRows.length, eligibleCohort: cohort.length, convertedCohort, ratePercent: cohort.length ? Math.round(convertedCohort * 10_000 / cohort.length) / 100 : null, averageDelayDays: validDelays.length ? Math.round(validDelays.reduce((sum, value) => sum + value, 0) * 10 / validDelays.length) / 10 : null, invalidDelayCount },
    followUps, demandedProducts, soldProducts, freeInvoiceLineCount, financial: groups, primaryFinancial: primaryGroup(groups, primaryCurrency, primaryCurrencyScale), hasOtherCurrencies: groups.some((item) => item.currency !== primaryCurrency || item.currencyScale !== primaryCurrencyScale),
    receivables: { invoices: receivableInvoiceIds.size, debtorClients: debtorClients.size, overdueInvoices: overdueInvoiceIds.size, upcomingInvoices: receivableInvoiceIds.size - overdueInvoiceIds.size, partiallyPaidInvoices: data.invoices.filter((item) => !item.archivedAt && item.status === 'PARTIELLEMENT_PAYEE').length, aging, topDebtors: [...debtorAmounts.entries()].map(([clientProfileId, amounts]) => { const profile = clientById.get(clientProfileId); const contact = profile ? contactById.get(profile.contactId) : undefined; return { clientProfileId, label: contact?.displayName ?? 'Client indisponible', amounts: moneyRows(amounts) }; }).sort((a, b) => { const amountA = a.amounts.find((item) => item.currency === primaryCurrency && item.currencyScale === primaryCurrencyScale)?.minor ?? '0'; const amountB = b.amounts.find((item) => item.currency === primaryCurrency && item.currencyScale === primaryCurrencyScale)?.minor ?? '0'; return BigInt(amountA) === BigInt(amountB) ? a.label.localeCompare(b.label) : BigInt(amountA) > BigInt(amountB) ? -1 : 1; }).slice(0, 5) },
    localities, sources, statuses: rankedTokens(statusCount), interestLevels: rankedTokens(interestCount), campaigns,
    seriesGranularity, series, comparison: { period: comparisonPeriod, newProspects: previousNew, conversions: previousConversions, billedMinor: previousBilled.toString(), collectedMinor: previousCollected.toString(), expensesMinor: previousExpenses.toString() },
    integrity: { hasIssues: integrityCount > 0, count: integrityCount, byCode },
    isEmpty: data.contacts.length === 0 && data.invoices.length === 0 && data.payments.length === 0 && data.followUps.length === 0 && data.campaigns.length === 0 && data.expenses.length === 0,
  };
}

export function formatMinorExact(minor: string, currency: string, scale: number): string {
  const negative = minor.startsWith('-'); const digits = (negative ? minor.slice(1) : minor).padStart(scale + 1, '0');
  const integer = scale ? digits.slice(0, -scale) : digits; const fraction = scale ? `,${digits.slice(-scale)}` : '';
  return `${negative ? '−' : ''}${integer.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}${fraction} ${currency}`;
}

export function formatQuantityExact(value: string, scale: number): string {
  const digits = value.padStart(scale + 1, '0'); return scale ? `${digits.slice(0, -scale)},${digits.slice(-scale)}` : digits;
}
