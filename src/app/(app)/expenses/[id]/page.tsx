import { use } from 'react';
import ExpenseForm from '@/modules/expenses/presentation/ExpenseForm';

export default function EditExpensePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  return <ExpenseForm expenseId={resolvedParams.id} />;
}
