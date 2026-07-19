import { describe, expect, it } from 'vitest';
import {
  calculateTreasuryBalance,
  TreasuryAccountRecord,
  TreasuryAllocationRecord,
  TreasuryOperationRecord,
  validateTransfer
} from '../domain/treasury';
import { calculateBudgetConsumption, ExpenseBudgetRecord } from '../domain/budget';
import { calculateCashForecast, TreasuryForecastItemRecord } from '../domain/forecast';

describe('Treasury Domain', () => {
  const account: TreasuryAccountRecord = {
    id: 'acc1',
    name: 'Caisse',
    normalizedName: 'caisse',
    type: 'CASH',
    currency: 'XOF',
    currencyScale: 0,
    openingBalanceMinor: 10000,
    openingDate: '2023-01-01',
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01'
  };

  it('calculates balance with operations and allocations', () => {
    const allocations = [
      {
        allocation: { id: 'a1', status: 'ACTIVE', sourceType: 'PAYMENT', sourceId: 'p1', accountId: 'acc1', createdAt: '', updatedAt: '' } as TreasuryAllocationRecord,
        sourceAmountMinor: 5000,
        sourceDate: '2023-01-02'
      },
      {
        allocation: { id: 'a2', status: 'ACTIVE', sourceType: 'EXPENSE', sourceId: 'e1', accountId: 'acc1', createdAt: '', updatedAt: '' } as TreasuryAllocationRecord,
        sourceAmountMinor: 2000,
        sourceDate: '2023-01-03'
      }
    ];

    const operations: TreasuryOperationRecord[] = [
      { id: 'op1', status: 'ACTIVE', kind: 'TRANSFER', sourceAccountId: 'acc1', destinationAccountId: 'acc2', amountMinor: 1000, operationDate: '2023-01-04', currency: 'XOF', currencyScale: 0, label: 'T', createdAt: '', updatedAt: '' },
      { id: 'op2', status: 'ACTIVE', kind: 'ADJUSTMENT', accountId: 'acc1', adjustmentDirection: 'IN', amountMinor: 3000, operationDate: '2023-01-05', currency: 'XOF', currencyScale: 0, label: 'A', createdAt: '', updatedAt: '' }
    ];

    const balance = calculateTreasuryBalance(account, allocations, operations, '2023-01-06');
    // 10000 + 5000 - 2000 - 1000 + 3000 = 15000
    expect(balance).toBe(15000);
  });

  it('ignores cancelled or out-of-date records', () => {
    const allocations = [
      {
        allocation: { id: 'a1', status: 'CANCELLED', sourceType: 'PAYMENT', sourceId: 'p1', accountId: 'acc1', createdAt: '', updatedAt: '' } as TreasuryAllocationRecord,
        sourceAmountMinor: 5000,
        sourceDate: '2023-01-02'
      },
      {
        allocation: { id: 'a2', status: 'ACTIVE', sourceType: 'PAYMENT', sourceId: 'p2', accountId: 'acc1', createdAt: '', updatedAt: '' } as TreasuryAllocationRecord,
        sourceAmountMinor: 4000,
        sourceDate: '2022-12-31' // Avant ouverture
      },
      {
        allocation: { id: 'a3', status: 'ACTIVE', sourceType: 'PAYMENT', sourceId: 'p3', accountId: 'acc1', createdAt: '', updatedAt: '' } as TreasuryAllocationRecord,
        sourceAmountMinor: 2000,
        sourceDate: '2023-01-10' // Après asOfDate
      }
    ];

    const balance = calculateTreasuryBalance(account, allocations, [], '2023-01-06');
    expect(balance).toBe(10000);
  });

  it('validates a transfer correctly', () => {
    const acc2 = { ...account, id: 'acc2' };
    expect(() => validateTransfer(account, acc2, 1000, '2023-01-02')).not.toThrow();
    expect(() => validateTransfer(account, account, 1000, '2023-01-02')).toThrow('La source et la destination doivent être différentes');
    expect(() => validateTransfer(account, acc2, -100, '2023-01-02')).toThrow('positif');
  });
});

describe('Budget Domain', () => {
  it('calculates consumption correctly', () => {
    const budget: ExpenseBudgetRecord = {
      id: 'b1', name: 'Loyer', amountMinor: 10000, currency: 'XOF', currencyScale: 0, startDate: '2023-01-01', endDate: '2023-01-31', status: 'ACTIVE', createdAt: '', updatedAt: ''
    };
    const expenses = [
      { date: '2023-01-15', amountMinor: 4000, currency: 'XOF', currencyScale: 0 },
      { date: '2023-01-20', amountMinor: 8000, currency: 'XOF', currencyScale: 0 },
      { date: '2023-02-01', amountMinor: 1000, currency: 'XOF', currencyScale: 0 }
    ];

    const result = calculateBudgetConsumption(budget, expenses);
    expect(result.consumedMinor).toBe(12000);
    expect(result.remainingMinor).toBe(-2000);
    expect(result.isExceeded).toBe(true);
  });
});

describe('Forecast Domain', () => {
  it('calculates cash forecast', () => {
    const items: TreasuryForecastItemRecord[] = [
      { id: 'f1', type: 'INFLOW', expectedDate: '2023-01-10', amountMinor: 5000, currency: 'XOF', currencyScale: 0, label: 'Vente', status: 'ACTIVE', createdAt: '', updatedAt: '' },
      { id: 'f2', type: 'OUTFLOW', expectedDate: '2023-01-15', amountMinor: 2000, currency: 'XOF', currencyScale: 0, label: 'Loyer', status: 'ACTIVE', createdAt: '', updatedAt: '' },
      { id: 'f3', type: 'INFLOW', expectedDate: '2023-01-20', amountMinor: 10000, currency: 'XOF', currencyScale: 0, label: 'Gros client', status: 'CANCELLED', createdAt: '', updatedAt: '' }
    ];

    const forecast = calculateCashForecast(10000, items, 'XOF', 0, '2023-01-01', '2023-01-31');
    // 10000 + 5000 - 2000 = 13000
    expect(forecast).toBe(13000);
  });
});
