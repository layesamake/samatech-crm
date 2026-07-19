export type ExpenseBudgetStatus = 'ACTIVE' | 'ARCHIVED';

export interface ExpenseBudgetRecord {
  id: string;
  name: string;
  amountMinor: number;
  currency: string;
  currencyScale: number;
  startDate: string;
  endDate: string;
  note?: string;
  status: ExpenseBudgetStatus;
  createdAt: string;
  updatedAt: string;
}

export function validateBudget(budget: ExpenseBudgetRecord) {
  if (budget.startDate > budget.endDate) {
    throw new Error('La date de début doit être antérieure ou égale à la date de fin.');
  }
  if (budget.amountMinor < 0) {
    throw new Error('Le montant du budget ne peut pas être négatif.');
  }
}

export function calculateBudgetConsumption(
  budget: ExpenseBudgetRecord,
  expenses: { date: string; amountMinor: number; currency: string; currencyScale: number }[]
): { consumedMinor: number; remainingMinor: number; isExceeded: boolean } {
  let consumed = BigInt(0);

  for (const exp of expenses) {
    if (exp.currency !== budget.currency || exp.currencyScale !== budget.currencyScale) continue;
    if (exp.date >= budget.startDate && exp.date <= budget.endDate) {
      consumed += BigInt(exp.amountMinor);
    }
  }

  const budgetLimit = BigInt(budget.amountMinor);
  const remaining = budgetLimit - consumed;
  
  return {
    consumedMinor: Number(consumed),
    remainingMinor: Number(remaining),
    isExceeded: remaining < BigInt(0),
  };
}
