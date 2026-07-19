import { Clock, SystemClock } from '@/modules/follow-ups/domain/follow-up';
import { ExpenseInput, ExpenseInputSchema, ExpenseRecord } from '../domain/expense';
import { DexieExpenseRepository, ExpenseSearchCriteria } from '../infrastructure/dexie-expense-repository';

export class ManageExpensesUseCase {
  constructor(
    private readonly repository = new DexieExpenseRepository(),
    private readonly clock: Clock = new SystemClock()
  ) {}

  async list(criteria?: ExpenseSearchCriteria): Promise<ExpenseRecord[]> {
    return this.repository.list(criteria);
  }

  async get(id: string): Promise<ExpenseRecord | null> {
    return this.repository.get(id);
  }

  async create(input: ExpenseInput): Promise<ExpenseRecord> {
    const value = ExpenseInputSchema.parse(input);
    const now = this.clock.now().toISOString();
    const id = crypto.randomUUID();

    const expense: ExpenseRecord = {
      ...value,
      id,
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    };

    await this.repository.save(expense);
    return expense;
  }

  async update(id: string, input: ExpenseInput): Promise<ExpenseRecord> {
    const current = await this.repository.get(id);
    if (!current) throw new Error('Dépense introuvable');
    if (current.status !== 'ACTIVE') throw new Error('Seule une dépense active peut être modifiée');

    const value = ExpenseInputSchema.parse(input);
    const now = this.clock.now().toISOString();

    const updated: ExpenseRecord = {
      ...current,
      ...value,
      updatedAt: now,
    };

    await this.repository.save(updated);
    return updated;
  }

  async cancel(id: string, reason: string): Promise<ExpenseRecord> {
    return this.repository.cancel(id, reason, this.clock.now().toISOString());
  }
}
