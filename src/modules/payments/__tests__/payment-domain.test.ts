import { describe, expect, it } from 'vitest';
import { calculatePaymentFinancialState, daysOverdue, minorToPaymentInput, parsePaymentAmount, sumActivePayments } from '../domain/payment';

describe('Agrégation financière des paiements', () => {
  it('calcule les transitions EMISE, PARTIELLEMENT_PAYEE et PAYEE depuis les paiements actifs', () => {
    expect(calculatePaymentFinancialState(100_000, [])).toEqual({ paidTotalMinor: 0, balanceMinor: 100_000, status: 'EMISE' });
    expect(calculatePaymentFinancialState(100_000, [{ amountMinor: 30_000, status: 'ACTIVE' }])).toEqual({ paidTotalMinor: 30_000, balanceMinor: 70_000, status: 'PARTIELLEMENT_PAYEE' });
    expect(calculatePaymentFinancialState(100_000, [{ amountMinor: 30_000, status: 'ACTIVE' }, { amountMinor: 70_000, status: 'ACTIVE' }])).toEqual({ paidTotalMinor: 100_000, balanceMinor: 0, status: 'PAYEE' });
  });

  it('exclut les paiements contrepassés sans les supprimer', () => {
    const payments = [{ amountMinor: 30_000, status: 'ACTIVE' as const }, { amountMinor: 70_000, status: 'REVERSED' as const }];
    expect(sumActivePayments(payments)).toBe(30_000);
    expect(calculatePaymentFinancialState(100_000, payments).status).toBe('PARTIELLEMENT_PAYEE');
  });

  it('refuse surpaiement, montants non sûrs et dépassement de somme', () => {
    expect(() => calculatePaymentFinancialState(100, [{ amountMinor: 101, status: 'ACTIVE' }])).toThrow(/dépassent/);
    expect(() => sumActivePayments([{ amountMinor: Number.NaN, status: 'ACTIVE' }])).toThrow(/invalide/);
    expect(() => sumActivePayments([{ amountMinor: Number.MAX_SAFE_INTEGER, status: 'ACTIVE' }, { amountMinor: 1, status: 'ACTIVE' }])).toThrow(/plage/);
  });

  it('calcule les jours de retard sur des dates civiles sans dépendre du fuseau', () => {
    expect(daysOverdue('2026-07-10', '2026-07-18')).toBe(8);
    expect(daysOverdue('2026-07-18', '2026-07-18')).toBe(0);
    expect(daysOverdue(undefined, '2026-07-18')).toBe(0);
  });

  it('convertit exactement une saisie monétaire selon l’échelle de devise', () => {
    expect(parsePaymentAmount('30 000'.replace(' ', ''), 0)).toBe(30_000);
    expect(parsePaymentAmount('30,50', 2)).toBe(3050);
    expect(parsePaymentAmount('30.5', 2)).toBe(3050);
    expect(minorToPaymentInput(3050, 2)).toBe('30.50');
    expect(() => parsePaymentAmount('1,001', 2)).toThrow(/2 décimale/);
  });
});
