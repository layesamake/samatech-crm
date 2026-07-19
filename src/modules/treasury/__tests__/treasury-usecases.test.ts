import { afterEach, describe, expect, it } from 'vitest';
import { db } from '../../../infrastructure/database/db';
import { ManageTreasuryAccountsUseCase } from '../application/manage-treasury-accounts';
import { AllocateTreasurySourcesUseCase } from '../application/allocate-treasury-sources';
import { ManageTreasuryOperationsUseCase } from '../application/manage-treasury-operations';
import { ManageExpenseBudgetsUseCase } from '../application/manage-expense-budgets';
import { GetCashForecastUseCase } from '../application/get-cash-forecast';
import { treasuryRepository } from '../infrastructure/dexie-treasury-repository';

describe('Treasury UseCases', () => {
  const accountUseCase = new ManageTreasuryAccountsUseCase(treasuryRepository);
  const allocateUseCase = new AllocateTreasurySourcesUseCase(treasuryRepository);
  const operationsUseCase = new ManageTreasuryOperationsUseCase(treasuryRepository);
  const budgetUseCase = new ManageExpenseBudgetsUseCase(treasuryRepository);
  const forecastUseCase = new GetCashForecastUseCase(treasuryRepository, accountUseCase);

  afterEach(async () => {
    await db.treasuryAccounts.clear();
    await db.treasuryAllocations.clear();
    await db.treasuryOperations.clear();
    await db.expenseBudgets.clear();
    await db.treasuryForecastItems.clear();
    await db.payments.clear();
    await db.expenses.clear();
  });

  it('gère le cycle de vie d’un compte et son solde avec paiements et dépenses', async () => {
    const accId = await accountUseCase.createAccount({
      name: 'Banque', type: 'BANK', currency: 'XOF', currencyScale: 0, openingBalanceMinor: 100000, openingDate: '2023-01-01'
    });

    await db.payments.put({ id: 'p1', invoiceId: 'inv1', clientProfileId: 'c1', paymentDate: '2023-01-05', amountMinor: 50000, currency: 'XOF', currencyScale: 0, method: 'CASH', status: 'ACTIVE', createdAt: '', updatedAt: '' });
    await db.expenses.put({ id: 'e1', description: 'Test', amountMinor: 20000, currency: 'XOF', currencyScale: 0, expenseDate: '2023-01-10', status: 'ACTIVE', category: 'OTHER', createdAt: '', updatedAt: '' });

    await allocateUseCase.allocate('PAYMENT', 'p1', accId);
    await allocateUseCase.allocate('EXPENSE', 'e1', accId);

    const accounts = await accountUseCase.listAccountsWithBalance('2023-01-15');
    expect(accounts).toHaveLength(1);
    // 100000 + 50000 - 20000 = 130000
    expect(accounts[0].balanceMinor).toBe(130000);
  });

  it('gère les transferts entre comptes et les ajustements', async () => {
    const acc1 = await accountUseCase.createAccount({ name: 'A1', type: 'CASH', currency: 'XOF', currencyScale: 0, openingBalanceMinor: 50000, openingDate: '2023-01-01' });
    const acc2 = await accountUseCase.createAccount({ name: 'A2', type: 'BANK', currency: 'XOF', currencyScale: 0, openingBalanceMinor: 10000, openingDate: '2023-01-01' });

    await operationsUseCase.transfer({
      sourceAccountId: acc1, destinationAccountId: acc2, amountMinor: 20000, operationDate: '2023-01-02', label: 'Virement'
    });

    await operationsUseCase.adjust({
      accountId: acc1, adjustmentDirection: 'OUT', amountMinor: 5000, operationDate: '2023-01-03', label: 'Frais'
    });

    const accounts = await accountUseCase.listAccountsWithBalance('2023-01-05');
    const a1 = accounts.find(a => a.id === acc1);
    const a2 = accounts.find(a => a.id === acc2);

    // a1: 50000 - 20000 - 5000 = 25000
    // a2: 10000 + 20000 = 30000
    expect(a1?.balanceMinor).toBe(25000);
    expect(a2?.balanceMinor).toBe(30000);
  });

  it('gère les budgets et le calcul des dépassements', async () => {
    const bId = await budgetUseCase.createBudget({
      name: 'Marketing', amountMinor: 100000, currency: 'XOF', currencyScale: 0, startDate: '2023-01-01', endDate: '2023-01-31'
    });

    await db.expenses.put({ id: 'e1', description: 'Pub', amountMinor: 80000, currency: 'XOF', currencyScale: 0, expenseDate: '2023-01-15', status: 'ACTIVE', category: 'OTHER', createdAt: '', updatedAt: '' });
    await db.expenses.put({ id: 'e2', description: 'Flyers', amountMinor: 30000, currency: 'XOF', currencyScale: 0, expenseDate: '2023-01-20', status: 'ACTIVE', category: 'OTHER', createdAt: '', updatedAt: '' });

    const budget = await budgetUseCase.getBudgetWithConsumption(bId);
    expect(budget?.consumedMinor).toBe(110000);
    expect(budget?.remainingMinor).toBe(-10000);
    expect(budget?.isExceeded).toBe(true);
  });

  it('calcule correctement les prévisions de trésorerie', async () => {
    await accountUseCase.createAccount({ name: 'A1', type: 'CASH', currency: 'XOF', currencyScale: 0, openingBalanceMinor: 50000, openingDate: '2023-01-01' });
    
    // Le test utilise targetDate > now() pour le forecast.
    // Mettons des dates futures pour s'assurer du calcul
    // Mettons des dates futures pour s'assurer du calcul
    const targetDate = new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0];
    const expectedDate = new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0];

    await forecastUseCase.createForecastItem({
      type: 'INFLOW', expectedDate, amountMinor: 20000, currency: 'XOF', currencyScale: 0, label: 'Grosse vente'
    });

    const forecast = await forecastUseCase.getForecast('XOF', 0, targetDate);
    
    expect(forecast.currentBalanceMinor).toBe(50000); // balance de acc1
    expect(forecast.forecastBalanceMinor).toBe(70000); // 50000 + 20000
    expect(forecast.items).toHaveLength(1);
  });
});
