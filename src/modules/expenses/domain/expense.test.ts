import { describe, expect, it } from 'vitest';
import { ExpenseInputSchema, formatExpenseCategory } from './expense';

describe('Expense categories', () => {
  it('accepte et affiche une catégorie personnalisée', () => {
    const result = ExpenseInputSchema.safeParse({
      expenseDate: '2026-07-24',
      description: 'Maintenance du climatiseur',
      amountMinor: 25000,
      currency: 'XOF',
      currencyScale: 0,
      category: 'OTHER',
      customCategory: 'Maintenance',
      paymentMethod: 'CASH',
    });

    expect(result.success).toBe(true);
    expect(formatExpenseCategory('OTHER', ' Maintenance ')).toBe('Maintenance');
  });

  it('conserve le libellé Autre sans catégorie personnalisée', () => {
    expect(formatExpenseCategory('OTHER')).toBe('Autre');
  });
});
