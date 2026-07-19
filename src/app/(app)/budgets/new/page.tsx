'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ManageExpenseBudgetsUseCase } from '@/modules/treasury/application/manage-expense-budgets';
import { treasuryRepository } from '@/modules/treasury/infrastructure/dexie-treasury-repository';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const budgetUseCase = new ManageExpenseBudgetsUseCase(treasuryRepository);

export default function NewBudgetPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const amountMinorStr = formData.get('amount') as string;
    const currency = formData.get('currency') as string;
    const startDate = formData.get('startDate') as string;
    const endDate = formData.get('endDate') as string;

    try {
      const amountMinor = Math.round(Number(amountMinorStr) * 1); // Simplification: assuming XOF (scale 0)
      
      await budgetUseCase.createBudget({
        name,
        amountMinor,
        currency,
        currencyScale: 0,
        startDate,
        endDate
      });

      router.push('/budgets');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 pb-20 bg-muted/50 min-h-full">
      <header className="flex items-center gap-4">
        <Link href="/budgets" className="p-2 -ml-2 rounded-full hover:bg-muted text-muted-foreground">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold">Nouveau Budget</h1>
      </header>

      {error && <div className="p-4 bg-red-100 text-red-800 rounded-xl text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-card p-5 rounded-2xl shadow-sm border border-border flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Nom du budget</label>
          <input type="text" name="name" required placeholder="Ex: Marketing Mensuel" className="w-full p-3 bg-muted rounded-xl border-transparent focus:ring-2 focus:ring-primary outline-none" />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Devise</label>
          <select name="currency" required className="w-full p-3 bg-muted rounded-xl border-transparent focus:ring-2 focus:ring-primary outline-none">
            <option value="XOF">XOF (FCFA)</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Montant alloué</label>
          <input type="number" name="amount" required min="1" step="1" className="w-full p-3 bg-muted rounded-xl border-transparent focus:ring-2 focus:ring-primary outline-none" />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Date de début</label>
          <input type="date" name="startDate" required className="w-full p-3 bg-muted rounded-xl border-transparent focus:ring-2 focus:ring-primary outline-none" />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Date de fin</label>
          <input type="date" name="endDate" required className="w-full p-3 bg-muted rounded-xl border-transparent focus:ring-2 focus:ring-primary outline-none" />
        </div>

        <button type="submit" disabled={loading} className="w-full py-3.5 mt-2 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90 disabled:opacity-50">
          {loading ? 'Création...' : 'Créer le budget'}
        </button>
      </form>
    </div>
  );
}
