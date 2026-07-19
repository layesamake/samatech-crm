import { DexieTreasuryRepository } from '../infrastructure/dexie-treasury-repository';
import { calculateBudgetConsumption, ExpenseBudgetRecord, validateBudget } from '../domain/budget';
import { db } from '../../../infrastructure/database/db';

export interface CreateBudgetDTO {
  name: string;
  amountMinor: number;
  currency: string;
  currencyScale: number;
  startDate: string;
  endDate: string;
  note?: string;
}

export interface ExpenseBudgetWithConsumption extends ExpenseBudgetRecord {
  consumedMinor: number;
  remainingMinor: number;
  isExceeded: boolean;
}

export class ManageExpenseBudgetsUseCase {
  constructor(private readonly repository: DexieTreasuryRepository) {}

  async createBudget(dto: CreateBudgetDTO): Promise<string> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const budget: ExpenseBudgetRecord = {
      id,
      name: dto.name.trim(),
      amountMinor: dto.amountMinor,
      currency: dto.currency,
      currencyScale: dto.currencyScale,
      startDate: dto.startDate,
      endDate: dto.endDate,
      note: dto.note,
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now
    };

    validateBudget(budget);
    await this.repository.saveBudget(budget);
    return id;
  }

  async getBudgetWithConsumption(id: string): Promise<ExpenseBudgetWithConsumption | undefined> {
    const budget = await this.repository.getBudget(id);
    if (!budget) return undefined;

    // Récupérer toutes les dépenses (dans une base réelle, il faudrait filtrer par période/devise depuis Dexie)
    const allExpenses = await db.expenses.where('status').equals('ACTIVE').toArray();
    const mappedExpenses = allExpenses.map(e => ({ date: e.expenseDate, amountMinor: e.amountMinor, currency: e.currency, currencyScale: e.currencyScale }));
    
    const consumption = calculateBudgetConsumption(budget, mappedExpenses);
    return { ...budget, ...consumption };
  }

  async listBudgetsWithConsumption(status?: 'ACTIVE' | 'ARCHIVED'): Promise<ExpenseBudgetWithConsumption[]> {
    const budgets = await this.repository.listBudgets(status);
    const allExpenses = await db.expenses.where('status').equals('ACTIVE').toArray();
    const mappedExpenses = allExpenses.map(e => ({ date: e.expenseDate, amountMinor: e.amountMinor, currency: e.currency, currencyScale: e.currencyScale }));
    
    return budgets.map(budget => {
      const consumption = calculateBudgetConsumption(budget, mappedExpenses);
      return { ...budget, ...consumption };
    });
  }
}
