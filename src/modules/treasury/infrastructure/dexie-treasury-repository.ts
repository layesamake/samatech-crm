import { db } from '../../../infrastructure/database/db';
import { TreasuryAccountRecord, TreasuryAllocationRecord, TreasuryOperationRecord } from '../domain/treasury';
import { ExpenseBudgetRecord } from '../domain/budget';
import { TreasuryForecastItemRecord } from '../domain/forecast';

export class DexieTreasuryRepository {
  // --- Accounts ---
  async saveAccount(account: TreasuryAccountRecord): Promise<void> {
    await db.treasuryAccounts.put(account);
  }

  async getAccount(id: string): Promise<TreasuryAccountRecord | undefined> {
    return await db.treasuryAccounts.get(id);
  }

  async listAccounts(includeArchived = false): Promise<TreasuryAccountRecord[]> {
    if (includeArchived) {
      return await db.treasuryAccounts.toArray();
    }
    return await db.treasuryAccounts.filter(a => !a.archivedAt).toArray();
  }

  // --- Allocations ---
  async saveAllocation(allocation: TreasuryAllocationRecord): Promise<void> {
    await db.treasuryAllocations.put(allocation);
  }

  async getAllocation(id: string): Promise<TreasuryAllocationRecord | undefined> {
    return await db.treasuryAllocations.get(id);
  }

  async listAllocationsForAccount(accountId: string): Promise<TreasuryAllocationRecord[]> {
    return await db.treasuryAllocations.where('[accountId+status]').between([accountId, ''], [accountId, '\uffff']).toArray();
  }

  async getAllocationForSource(sourceType: string, sourceId: string): Promise<TreasuryAllocationRecord | undefined> {
    return await db.treasuryAllocations.where('[sourceType+sourceId]').equals([sourceType, sourceId]).first();
  }

  // --- Operations ---
  async saveOperation(operation: TreasuryOperationRecord): Promise<void> {
    await db.treasuryOperations.put(operation);
  }

  async getOperation(id: string): Promise<TreasuryOperationRecord | undefined> {
    return await db.treasuryOperations.get(id);
  }

  async listOperations(accountId: string): Promise<TreasuryOperationRecord[]> {
    const directOps = await db.treasuryOperations.where('accountId').equals(accountId).toArray();
    const sourceOps = await db.treasuryOperations.where('sourceAccountId').equals(accountId).toArray();
    const destOps = await db.treasuryOperations.where('destinationAccountId').equals(accountId).toArray();

    // Remove duplicates manually (if any) and sort by date descending
    const all = [...directOps, ...sourceOps, ...destOps];
    const unique = Array.from(new Map(all.map(item => [item.id, item])).values());
    
    return unique.sort((a, b) => b.operationDate.localeCompare(a.operationDate));
  }

  // --- Budgets ---
  async saveBudget(budget: ExpenseBudgetRecord): Promise<void> {
    await db.expenseBudgets.put(budget);
  }

  async getBudget(id: string): Promise<ExpenseBudgetRecord | undefined> {
    return await db.expenseBudgets.get(id);
  }

  async listBudgets(status?: 'ACTIVE' | 'ARCHIVED'): Promise<ExpenseBudgetRecord[]> {
    if (status) {
      return await db.expenseBudgets.where('[status+startDate]').between([status, ''], [status, '\uffff']).toArray();
    }
    return await db.expenseBudgets.toArray();
  }

  // --- Forecasts ---
  async saveForecastItem(item: TreasuryForecastItemRecord): Promise<void> {
    await db.treasuryForecastItems.put(item);
  }

  async getForecastItem(id: string): Promise<TreasuryForecastItemRecord | undefined> {
    return await db.treasuryForecastItems.get(id);
  }

  async listForecastItems(status: 'ACTIVE' | 'ARCHIVED'): Promise<TreasuryForecastItemRecord[]> {
    return await db.treasuryForecastItems.where('[status+expectedDate]').between([status, ''], [status, '\uffff']).toArray();
  }
}

export const treasuryRepository = new DexieTreasuryRepository();
