import { z } from 'zod';

export const EXPENSE_CATEGORIES = [
  'RENT',
  'SUPPLIES',
  'TRANSPORT',
  'MARKETING',
  'PAYROLL',
  'TAXES',
  'UTILITIES',
  'PROFESSIONAL_SERVICES',
  'OTHER'
] as const;

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  RENT: 'Loyer',
  SUPPLIES: 'Fournitures',
  TRANSPORT: 'Transport',
  MARKETING: 'Marketing et communication',
  PAYROLL: 'Salaires et prestations',
  TAXES: 'Impôts et taxes',
  UTILITIES: 'Eau, électricité et télécommunications',
  PROFESSIONAL_SERVICES: 'Services professionnels',
  OTHER: 'Autre',
};

export const EXPENSE_PAYMENT_METHODS = ['CASH', 'WAVE', 'ORANGE_MONEY', 'BANK_TRANSFER', 'CARD', 'OTHER'] as const;
export type ExpensePaymentMethod = typeof EXPENSE_PAYMENT_METHODS[number];

export const EXPENSE_PAYMENT_METHOD_LABELS: Record<ExpensePaymentMethod, string> = {
  CASH: 'Espèces',
  WAVE: 'Wave',
  ORANGE_MONEY: 'Orange Money',
  BANK_TRANSFER: 'Virement bancaire',
  CARD: 'Carte',
  OTHER: 'Autre',
};

export const EXPENSE_STATUSES = ['ACTIVE', 'CANCELLED'] as const;
export type ExpenseStatus = typeof EXPENSE_STATUSES[number];

export interface ExpenseRecord {
  id: string;
  expenseDate: string;
  description: string;
  amountMinor: number;
  currency: string;
  currencyScale: number;
  category: ExpenseCategory;
  customCategory?: string; // only if category is 'OTHER'
  paymentMethod: ExpensePaymentMethod;
  supplier?: string;
  reference?: string;
  note?: string;
  status: ExpenseStatus;
  cancelledAt?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
}

export const ExpenseInputSchema = z.object({
  expenseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'La date est obligatoire'),
  description: z.string().trim().min(1, 'La description est obligatoire').max(200),
  amountMinor: z.number().int('Le montant doit être un entier en unité mineure').positive('Le montant doit être strictement positif').max(Number.MAX_SAFE_INTEGER),
  currency: z.string().regex(/^[A-Z]{3}$/, 'Devise invalide'),
  currencyScale: z.number().int().min(0).max(3),
  category: z.enum(EXPENSE_CATEGORIES),
  customCategory: z.string().trim().max(100).optional(),
  paymentMethod: z.enum(EXPENSE_PAYMENT_METHODS),
  supplier: z.string().trim().max(100).optional(),
  reference: z.string().trim().max(200).optional(),
  note: z.string().trim().max(2000).optional(),
}).superRefine((value, context) => {
  if (value.category === 'OTHER' && !value.customCategory?.trim()) {
    context.addIssue({ code: 'custom', path: ['customCategory'], message: 'Précisez la catégorie' });
  }
  if (value.paymentMethod === 'OTHER' && !value.note?.trim()) {
    context.addIssue({ code: 'custom', path: ['note'], message: 'Décrivez le mode de paiement Autre dans la note' });
  }
});

export type ExpenseInput = z.infer<typeof ExpenseInputSchema>;

export function parseExpenseAmount(value: string, currencyScale: number): number {
  if (!Number.isInteger(currencyScale) || currencyScale < 0 || currencyScale > 3) throw new Error('Échelle monétaire invalide');
  const normalized = value.trim().replace(',', '.');
  if (!/^\d+(?:\.\d+)?$/.test(normalized)) throw new Error('Montant invalide');
  const [integer, fraction = ''] = normalized.split('.');
  if (fraction.length > currencyScale) throw new Error(`Maximum ${currencyScale} décimale(s) pour cette devise`);
  const minor = Number(`${integer}${fraction.padEnd(currencyScale, '0')}`);
  if (!Number.isSafeInteger(minor) || minor <= 0) throw new Error('Le montant doit être strictement positif et rester dans la plage sûre');
  return minor;
}

export function minorToExpenseInput(value: number, currencyScale: number): string {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error('Montant invalide');
  if (currencyScale === 0) return String(value);
  const digits = String(value).padStart(currencyScale + 1, '0');
  return `${digits.slice(0, -currencyScale)}.${digits.slice(-currencyScale)}`;
}
