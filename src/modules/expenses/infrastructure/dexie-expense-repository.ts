import { db } from '@/infrastructure/database/db';
import { ExpenseRecord, ExpenseStatus } from '../domain/expense';

export interface ExpenseSearchCriteria {
  from?: string;
  to?: string;
  category?: string;
  status?: ExpenseStatus;
}

export class DexieExpenseRepository {
  async get(id: string): Promise<ExpenseRecord | null> {
    const expense = await db.expenses.get(id);
    return expense ?? null;
  }

  async list(criteria: ExpenseSearchCriteria = {}): Promise<ExpenseRecord[]> {
    const expenses = await db.expenses.filter((expense) => !expense.archivedAt).toArray();
    
    return expenses.filter((expense) => {
      if (criteria.status && expense.status !== criteria.status) return false;
      if (criteria.category && expense.category !== criteria.category) return false;
      if (criteria.from && expense.expenseDate < criteria.from) return false;
      if (criteria.to && expense.expenseDate > criteria.to) return false;
      return true;
    }).sort((a, b) => b.expenseDate.localeCompare(a.expenseDate) || b.createdAt.localeCompare(a.createdAt));
  }

  async save(expense: ExpenseRecord): Promise<void> {
    await db.expenses.put(expense);
  }

  async cancel(id: string, reason: string, now: string): Promise<ExpenseRecord> {
    const trimmed = reason.trim();
    if (!trimmed) throw new Error('Le motif d’annulation est obligatoire');
    
    let result: ExpenseRecord | null = null;
    await db.transaction('rw', db.expenses, async () => {
      const expense = await db.expenses.get(id);
      if (!expense) throw new Error('Dépense introuvable');
      if (expense.status !== 'ACTIVE') throw new Error('Seule une dépense active peut être annulée');
      
      const cancelled: ExpenseRecord = {
        ...expense,
        status: 'CANCELLED',
        cancelledAt: now,
        cancellationReason: trimmed,
        updatedAt: now,
      };
      
      await db.expenses.put(cancelled);
      result = cancelled;
    });
    
    if (!result) throw new Error('Échec de l’annulation de la dépense');
    return result;
  }
}
