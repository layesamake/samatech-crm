import { z } from 'zod';
import type { ProductRecord } from '@/modules/catalog/domain/catalog';
import type { ClientAggregate } from '@/modules/clients/domain/client';
import type { CompanyProfile, InvoiceSettings } from '@/modules/settings/domain/settings';
import type { TimelineEventRecord } from '@/modules/follow-ups/domain/follow-up';

export const INVOICE_STATUSES = ['BROUILLON', 'EMISE', 'PARTIELLEMENT_PAYEE', 'PAYEE', 'ANNULEE'] as const;
export const DISCOUNT_TYPES = ['NONE', 'PERCENT', 'AMOUNT'] as const;
export type InvoiceStatus = typeof INVOICE_STATUSES[number];
export type DiscountType = typeof DISCOUNT_TYPES[number];

export interface PartySnapshot { displayName: string; address?: string; phone?: string; email?: string; taxId?: string; logoDataRef?: string; logoDataUri?: string; managerName?: string; managerSignatureDataUri?: string; }
export interface InvoiceRecord {
  id: string; type?: 'INVOICE'; clientProfileId: string; number?: string; status: InvoiceStatus; issueDate?: string; dueDate?: string;
  currency: string; currencyScale: number; companySnapshot: PartySnapshot; clientSnapshot: PartySnapshot;
  subtotalMinor: number; discountTotalMinor: number; taxTotalMinor: number; grandTotalMinor: number;
  paidTotalMinor: number; balanceMinor: number; notes?: string; terms?: string; issuedAt?: string;
  cancelledAt?: string; cancellationReason?: string; createdAt: string; updatedAt: string; archivedAt?: string;
}
export interface InvoiceLineRecord {
  id: string; invoiceId: string; productId?: string; position: number; designationSnapshot: string;
  descriptionSnapshot?: string; unitLabelSnapshot?: string; quantityScaled: number; quantityScale: number;
  unitPriceMinor: number; grossMinor: number; discountType: DiscountType; discountValue: number;
  discountMinor: number; taxRateBasisPoints: number; taxMinor: number; lineTotalMinor: number;
  createdAt: string; updatedAt: string; archivedAt?: string;
}
export interface InvoiceAggregate { invoice: InvoiceRecord; lines: InvoiceLineRecord[]; clientName: string; timelineEvents?: TimelineEventRecord[]; }
export interface InvoiceTotals { subtotalMinor: number; discountTotalMinor: number; taxTotalMinor: number; grandTotalMinor: number; }
export interface InvoiceFormOptions { clients: ClientAggregate[]; products: ProductRecord[]; company: CompanyProfile | null; settings: InvoiceSettings | null; }

export const MAX_QUANTITY_SCALED = 1_000_000_000;
export const MAX_QUANTITY_SCALE = 6;
export const MAX_MONEY_MINOR = Number.MAX_SAFE_INTEGER;

export const DraftLineInputSchema = z.object({
  id: z.string().uuid().optional(), productId: z.string().uuid().optional().or(z.literal('')), position: z.number().int().nonnegative(),
  designation: z.string().trim().min(1, 'La désignation est obligatoire').max(500), description: z.string().trim().max(2000).optional(),
  unitLabel: z.string().trim().max(50).optional(), quantityScaled: z.number().int().positive().max(MAX_QUANTITY_SCALED),
  quantityScale: z.number().int().min(0).max(MAX_QUANTITY_SCALE), unitPriceMinor: z.number().int().nonnegative().max(MAX_MONEY_MINOR),
  discountType: z.enum(DISCOUNT_TYPES).default('NONE'), discountValue: z.number().int().nonnegative().max(MAX_MONEY_MINOR).default(0),
  taxRateBasisPoints: z.number().int().min(0).max(10_000).default(0),
});
export type DraftLineInput = z.infer<typeof DraftLineInputSchema>;

export const DraftInvoiceInputSchema = z.object({
  type: z.literal('INVOICE').optional().default('INVOICE'),
  clientProfileId: z.string().uuid('Client invalide'), currency: z.string().regex(/^[A-Z]{3}$/, 'Devise invalide'),
  currencyScale: z.number().int().min(0).max(3), issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')), notes: z.string().trim().max(5000).optional(),
  terms: z.string().trim().max(5000).optional(), lines: z.array(DraftLineInputSchema), taxesEnabled: z.boolean(),
});
export type DraftInvoiceInput = z.infer<typeof DraftInvoiceInputSchema>;

function assertSafeInteger(value: number, label: string) { if (!Number.isSafeInteger(value)) throw new Error(`${label} dépasse la plage entière sûre`); }
function safeNumber(value: bigint, label: string): number { if (value < BigInt(0) || value > BigInt(MAX_MONEY_MINOR)) throw new Error(`${label} dépasse la plage monétaire sûre`); return Number(value); }
function roundHalfUp(value: bigint, divisor: bigint): bigint { return (value + divisor / BigInt(2)) / divisor; }

export function calculateInvoiceLine(input: DraftLineInput, taxesEnabled: boolean): Omit<InvoiceLineRecord, 'id' | 'invoiceId' | 'createdAt' | 'updatedAt'> {
  const line = DraftLineInputSchema.parse(input); assertSafeInteger(line.quantityScaled, 'Quantité'); assertSafeInteger(line.unitPriceMinor, 'Prix');
  const divisor = BigInt(10) ** BigInt(line.quantityScale); const gross = safeNumber(roundHalfUp(BigInt(line.quantityScaled) * BigInt(line.unitPriceMinor), divisor), 'Montant brut');
  let discount = 0;
  if (line.discountType === 'PERCENT') { if (line.discountValue > 10_000) throw new Error('La remise en pourcentage doit être comprise entre 0 et 100 %'); discount = safeNumber(roundHalfUp(BigInt(gross) * BigInt(line.discountValue), BigInt(10_000)), 'Remise'); }
  if (line.discountType === 'AMOUNT') discount = line.discountValue;
  if (discount > gross) throw new Error('La remise ne peut pas dépasser le montant brut');
  const base = gross - discount; const rate = taxesEnabled ? line.taxRateBasisPoints : 0;
  const tax = safeNumber(roundHalfUp(BigInt(base) * BigInt(rate), BigInt(10_000)), 'Taxe'); const total = safeNumber(BigInt(base) + BigInt(tax), 'Total de ligne');
  return { productId: line.productId || undefined, position: line.position, designationSnapshot: line.designation, descriptionSnapshot: line.description || undefined, unitLabelSnapshot: line.unitLabel || undefined, quantityScaled: line.quantityScaled, quantityScale: line.quantityScale, unitPriceMinor: line.unitPriceMinor, grossMinor: gross, discountType: line.discountType, discountValue: line.discountType === 'NONE' ? 0 : line.discountValue, discountMinor: discount, taxRateBasisPoints: rate, taxMinor: tax, lineTotalMinor: total };
}

export function calculateInvoiceTotals(lines: Array<Pick<InvoiceLineRecord, 'grossMinor' | 'discountMinor' | 'taxMinor' | 'lineTotalMinor'>>): InvoiceTotals {
  let subtotal = BigInt(0); let discounts = BigInt(0); let taxes = BigInt(0); let total = BigInt(0);
  for (const line of lines) { subtotal += BigInt(line.grossMinor - line.discountMinor); discounts += BigInt(line.discountMinor); taxes += BigInt(line.taxMinor); total += BigInt(line.lineTotalMinor); }
  return { subtotalMinor: safeNumber(subtotal, 'Sous-total'), discountTotalMinor: safeNumber(discounts, 'Total remises'), taxTotalMinor: safeNumber(taxes, 'Total taxes'), grandTotalMinor: safeNumber(total, 'Total facture') };
}
export function sumSafeMinor(values: number[]): number { return safeNumber(values.reduce((sum, value) => { assertSafeInteger(value, 'Montant'); return sum + BigInt(value); }, BigInt(0)), 'Somme monétaire'); }

export function currencyScaleFor(code: string): number { return code === 'XOF' ? 0 : 2; }
export function percentageToBasisPoints(value: number | string): number { const normalized = String(value).trim().replace(',', '.'); if (!/^\d+(?:\.\d+)?$/.test(normalized)) throw new Error('Pourcentage invalide'); const [integer, fraction = ''] = normalized.split('.'); if (fraction.length > MAX_QUANTITY_SCALE) throw new Error(`Maximum ${MAX_QUANTITY_SCALE} décimales`); const scaled = Number(`${integer}${fraction}`); if (!Number.isSafeInteger(scaled)) throw new Error('Pourcentage hors limites'); const result = safeNumber(roundHalfUp(BigInt(scaled) * BigInt(100), BigInt(10) ** BigInt(fraction.length)), 'Pourcentage'); if (result > 10_000) throw new Error('Le pourcentage doit être compris entre 0 et 100 %'); return result; }
export function parseScaledDecimal(value: string, maxScale = MAX_QUANTITY_SCALE): { scaled: number; scale: number } { const normalized = value.trim().replace(',', '.'); if (!/^\d+(?:\.\d+)?$/.test(normalized)) throw new Error('Nombre décimal invalide'); const [integer, fraction = ''] = normalized.split('.'); if (fraction.length > maxScale) throw new Error(`Maximum ${maxScale} décimales`); const scaled = Number(`${integer}${fraction}`); if (!Number.isSafeInteger(scaled) || scaled <= 0 || scaled > MAX_QUANTITY_SCALED) throw new Error('Quantité hors limites'); return { scaled, scale: fraction.length }; }
export function formatMinor(value: number, currency: string, scale: number, options?: { noCurrency?: boolean; prefixCurrency?: boolean }): string { assertSafeInteger(value, 'Montant'); const digits = String(value).padStart(scale + 1, '0'); const integer = scale ? digits.slice(0, -scale) : digits; const fraction = scale ? `,${digits.slice(-scale)}` : ''; const formatted = `${integer.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}${fraction}`; if (options?.noCurrency) return formatted; if (options?.prefixCurrency) return `${currency}${formatted}`; return `${formatted} ${currency}`; }
export function formatQuantity(value: number, scale: number): string { assertSafeInteger(value, 'Quantité'); const digits = String(value).padStart(scale + 1, '0'); return scale ? `${digits.slice(0, -scale)},${digits.slice(-scale)}` : digits; }
