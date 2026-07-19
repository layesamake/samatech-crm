'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GetCashForecastUseCase } from '@/modules/treasury/application/get-cash-forecast';
import { ManageTreasuryAccountsUseCase } from '@/modules/treasury/application/manage-treasury-accounts';
import { treasuryRepository } from '@/modules/treasury/infrastructure/dexie-treasury-repository';
import { TreasuryForecastType } from '@/modules/treasury/domain/forecast';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const accountUseCase = new ManageTreasuryAccountsUseCase(treasuryRepository);
const forecastUseCase = new GetCashForecastUseCase(treasuryRepository, accountUseCase);

export default function NewForecastItemPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const type = formData.get('type') as TreasuryForecastType;
    const label = formData.get('label') as string;
    const currency = formData.get('currency') as string;
    const amountMinorStr = formData.get('amount') as string;
    const expectedDate = formData.get('expectedDate') as string;
    const note = formData.get('note') as string;

    try {
      const amountMinor = Math.round(Number(amountMinorStr) * 1); // Simplification: assuming XOF (scale 0)
      
      await forecastUseCase.createForecastItem({
        type,
        label,
        currency,
        currencyScale: 0,
        amountMinor,
        expectedDate,
        note
      });

      router.push('/treasury/forecast');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 pb-20 bg-muted/50 min-h-full">
      <header className="flex items-center gap-4">
        <Link href="/treasury/forecast" className="p-2 -ml-2 rounded-full hover:bg-muted text-muted-foreground">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold">Nouvelle prévision</h1>
      </header>

      {error && <div className="p-4 bg-red-100 text-red-800 rounded-xl text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-card p-5 rounded-2xl shadow-sm border border-border flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Type de flux</label>
          <select name="type" required className="w-full p-3 bg-muted rounded-xl border-transparent focus:ring-2 focus:ring-primary outline-none">
            <option value="INFLOW">Entrée d&apos;argent (+)</option>
            <option value="OUTFLOW">Sortie d&apos;argent (-)</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Libellé</label>
          <input type="text" name="label" required placeholder="Ex: Paiement client prévu" className="w-full p-3 bg-muted rounded-xl border-transparent focus:ring-2 focus:ring-primary outline-none" />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Devise</label>
          <select name="currency" required className="w-full p-3 bg-muted rounded-xl border-transparent focus:ring-2 focus:ring-primary outline-none">
            <option value="XOF">XOF (FCFA)</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Montant prévu</label>
          <input type="number" name="amount" required min="1" step="1" className="w-full p-3 bg-muted rounded-xl border-transparent focus:ring-2 focus:ring-primary outline-none" />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Date prévue</label>
          <input type="date" name="expectedDate" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full p-3 bg-muted rounded-xl border-transparent focus:ring-2 focus:ring-primary outline-none" />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Notes (Optionnel)</label>
          <textarea name="note" rows={2} placeholder="Informations complémentaires" className="w-full p-3 bg-muted rounded-xl border-transparent focus:ring-2 focus:ring-primary outline-none"></textarea>
        </div>

        <button type="submit" disabled={loading} className="w-full py-3.5 mt-2 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90 disabled:opacity-50">
          {loading ? 'Création...' : 'Ajouter la prévision'}
        </button>
      </form>
    </div>
  );
}
