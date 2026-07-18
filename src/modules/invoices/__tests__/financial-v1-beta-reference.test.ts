import { describe, expect, it } from 'vitest';
import { calculateInvoiceLine, calculateInvoiceTotals } from '../domain/invoice';
import { calculatePaymentFinancialState } from '@/modules/payments/domain/payment';

describe('Référence financière déterministe V1 bêta', () => {
  it('calcule explicitement quantités, remise, taxe, sous-total et total en entiers', () => {
    const discounted = calculateInvoiceLine({ position: 0, designation: 'Service fictif', quantityScaled: 250, quantityScale: 2, unitPriceMinor: 10_000, discountType: 'PERCENT', discountValue: 1_000, taxRateBasisPoints: 1_800 }, true);
    const fixed = calculateInvoiceLine({ position: 1, designation: 'Produit fictif', quantityScaled: 2, quantityScale: 0, unitPriceMinor: 5_000, discountType: 'AMOUNT', discountValue: 1_000, taxRateBasisPoints: 0 }, true);
    expect(discounted).toMatchObject({ grossMinor: 25_000, discountMinor: 2_500, taxMinor: 4_050, lineTotalMinor: 26_550 });
    expect(fixed).toMatchObject({ grossMinor: 10_000, discountMinor: 1_000, taxMinor: 0, lineTotalMinor: 9_000 });
    expect(calculateInvoiceTotals([discounted, fixed])).toEqual({ subtotalMinor: 31_500, discountTotalMinor: 3_500, taxTotalMinor: 4_050, grandTotalMinor: 35_550 });
  });

  it('enchaîne deux paiements partiels, le solde exact, le paiement final et le refus du trop-perçu', () => {
    const first = calculatePaymentFinancialState(35_550, [{ amountMinor: 10_000, status: 'ACTIVE' }]);
    expect(first).toEqual({ paidTotalMinor: 10_000, balanceMinor: 25_550, status: 'PARTIELLEMENT_PAYEE' });
    const second = calculatePaymentFinancialState(35_550, [{ amountMinor: 10_000, status: 'ACTIVE' }, { amountMinor: 5_550, status: 'ACTIVE' }, { amountMinor: 2_000, status: 'REVERSED' }]);
    expect(second).toEqual({ paidTotalMinor: 15_550, balanceMinor: 20_000, status: 'PARTIELLEMENT_PAYEE' });
    expect(calculatePaymentFinancialState(35_550, [{ amountMinor: 15_550, status: 'ACTIVE' }, { amountMinor: 20_000, status: 'ACTIVE' }])).toEqual({ paidTotalMinor: 35_550, balanceMinor: 0, status: 'PAYEE' });
    expect(() => calculatePaymentFinancialState(35_550, [{ amountMinor: 35_551, status: 'ACTIVE' }])).toThrow('dépassent');
  });
});
