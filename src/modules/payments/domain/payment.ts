import { z } from 'zod';
import type { InvoiceRecord, InvoiceStatus } from '@/modules/invoices/domain/invoice';

export const PAYMENT_METHODS = ['CASH', 'WAVE', 'ORANGE_MONEY', 'BANK_TRANSFER', 'CARD', 'OTHER'] as const;
export const PAYMENT_STATUSES = ['ACTIVE', 'REVERSED'] as const;
export type PaymentMethod = typeof PAYMENT_METHODS[number];
export type PaymentStatus = typeof PAYMENT_STATUSES[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Espèces',
  WAVE: 'Wave',
  ORANGE_MONEY: 'Orange Money',
  BANK_TRANSFER: 'Virement',
  CARD: 'Carte',
  OTHER: 'Autre',
};

export interface PaymentRecord {
  id: string;
  invoiceId: string;
  clientProfileId: string;
  paymentDate: string;
  amountMinor: number;
  currency: string;
  currencyScale: number;
  method: PaymentMethod;
  reference?: string;
  note?: string;
  status: PaymentStatus;
  reversedAt?: string;
  reversalReason?: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
}

export interface PaymentAggregate {
  payment: PaymentRecord;
  invoiceNumber: string;
  clientName: string;
}

export interface ReceivableRecord {
  invoice: InvoiceRecord;
  clientName: string;
  daysOverdue: number;
}

export interface PaymentIndicators {
  activeCollectedMinor: number;
  remainingMinor: number;
  partiallyPaidCount: number;
  paidCount: number;
  overdueReceivablesCount: number;
}

export const RecordPaymentInputSchema = z.object({
  invoiceId: z.string().uuid('Facture invalide'),
  clientProfileId: z.string().uuid('Client invalide'),
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'La date du paiement est obligatoire'),
  amountMinor: z.number().int('Le montant doit être un entier en unité mineure').positive('Le montant doit être strictement positif').max(Number.MAX_SAFE_INTEGER),
  currency: z.string().regex(/^[A-Z]{3}$/, 'Devise invalide'),
  currencyScale: z.number().int().min(0).max(3),
  method: z.enum(PAYMENT_METHODS),
  reference: z.string().trim().max(200).optional(),
  note: z.string().trim().max(2000).optional(),
  confirmHistoricalDate: z.boolean().default(false),
}).superRefine((value, context) => {
  if (value.method === 'OTHER' && !value.note?.trim()) {
    context.addIssue({ code: 'custom', path: ['note'], message: 'Décrivez le mode de paiement Autre dans la note' });
  }
});
export type RecordPaymentInput = z.infer<typeof RecordPaymentInputSchema>;

export interface PaymentFinancialState {
  paidTotalMinor: number;
  balanceMinor: number;
  status: Extract<InvoiceStatus, 'EMISE' | 'PARTIELLEMENT_PAYEE' | 'PAYEE'>;
}

export function sumActivePayments(payments: readonly Pick<PaymentRecord, 'amountMinor' | 'status'>[]): number {
  let total = BigInt(0);
  for (const payment of payments) {
    if (payment.status !== 'ACTIVE') continue;
    if (!Number.isSafeInteger(payment.amountMinor) || payment.amountMinor <= 0) throw new Error('Montant de paiement actif invalide');
    total += BigInt(payment.amountMinor);
    if (total > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('Le total payé dépasse la plage entière sûre');
  }
  return Number(total);
}

export function calculatePaymentFinancialState(grandTotalMinor: number, payments: readonly Pick<PaymentRecord, 'amountMinor' | 'status'>[]): PaymentFinancialState {
  if (!Number.isSafeInteger(grandTotalMinor) || grandTotalMinor < 0) throw new Error('Total de facture invalide');
  const paidTotalMinor = sumActivePayments(payments);
  if (paidTotalMinor > grandTotalMinor) throw new Error('Les paiements actifs dépassent le total de la facture');
  const balanceMinor = grandTotalMinor - paidTotalMinor;
  const status = paidTotalMinor === 0 ? 'EMISE' : balanceMinor === 0 ? 'PAYEE' : 'PARTIELLEMENT_PAYEE';
  return { paidTotalMinor, balanceMinor, status };
}

export function daysOverdue(dueDate: string | undefined, today: string): number {
  if (!dueDate || dueDate >= today) return 0;
  const due = Date.parse(`${dueDate}T00:00:00Z`);
  const current = Date.parse(`${today}T00:00:00Z`);
  return Number.isFinite(due) && Number.isFinite(current) ? Math.floor((current - due) / 86_400_000) : 0;
}

export function parsePaymentAmount(value: string, currencyScale: number): number {
  if (!Number.isInteger(currencyScale) || currencyScale < 0 || currencyScale > 3) throw new Error('Échelle monétaire invalide');
  const normalized = value.trim().replace(',', '.');
  if (!/^\d+(?:\.\d+)?$/.test(normalized)) throw new Error('Montant invalide');
  const [integer, fraction = ''] = normalized.split('.');
  if (fraction.length > currencyScale) throw new Error(`Maximum ${currencyScale} décimale(s) pour cette devise`);
  const minor = Number(`${integer}${fraction.padEnd(currencyScale, '0')}`);
  if (!Number.isSafeInteger(minor) || minor <= 0) throw new Error('Le montant doit être strictement positif et rester dans la plage sûre');
  return minor;
}

export function minorToPaymentInput(value: number, currencyScale: number): string {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error('Montant invalide');
  if (currencyScale === 0) return String(value);
  const digits = String(value).padStart(currencyScale + 1, '0');
  return `${digits.slice(0, -currencyScale)}.${digits.slice(-currencyScale)}`;
}
