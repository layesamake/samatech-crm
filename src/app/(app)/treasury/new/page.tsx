'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ManageTreasuryAccountsUseCase } from '@/modules/treasury/application/manage-treasury-accounts';
import { treasuryRepository } from '@/modules/treasury/infrastructure/dexie-treasury-repository';
import { TreasuryAccountType } from '@/modules/treasury/domain/treasury';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const accountUseCase = new ManageTreasuryAccountsUseCase(treasuryRepository);

export default function NewTreasuryAccountPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const type = formData.get('type') as TreasuryAccountType;
    const name = formData.get('name') as string;
    const currency = formData.get('currency') as string;
    const openingBalanceStr = formData.get('openingBalance') as string;
    const note = formData.get('note') as string;

    try {
      const openingBalanceMinor = Math.round(Number(openingBalanceStr) * 1); // Simplification: assuming XOF (scale 0)
      
      await accountUseCase.createAccount({
        name,
        type,
        currency,
        currencyScale: 0,
        openingBalanceMinor,
        openingDate: new Date().toISOString().split('T')[0],
        note
      });

      router.push('/treasury');
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 pb-20 bg-muted/50 min-h-full">
      <header className="flex items-center gap-4">
        <Link href="/treasury" className="p-2 -ml-2 rounded-full hover:bg-muted text-muted-foreground">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold">Nouveau Compte</h1>
      </header>

      {error && <div className="p-4 bg-red-100 text-red-800 rounded-xl text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-card p-5 rounded-2xl shadow-sm border border-border flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Type de compte</label>
          <select name="type" required className="w-full p-3 bg-muted rounded-xl border-transparent focus:ring-2 focus:ring-primary outline-none">
            <option value="CASH">Caisse (Espèces)</option>
            <option value="BANK">Banque</option>
            <option value="MOBILE_MONEY">Mobile Money (Wave, Orange, etc.)</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Nom du compte</label>
          <input type="text" name="name" required placeholder="Ex: Caisse Principale" className="w-full p-3 bg-muted rounded-xl border-transparent focus:ring-2 focus:ring-primary outline-none" />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Devise</label>
          <select name="currency" required className="w-full p-3 bg-muted rounded-xl border-transparent focus:ring-2 focus:ring-primary outline-none">
            <option value="XOF">XOF (FCFA)</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Solde initial</label>
          <input type="number" name="openingBalance" required min="0" step="1" defaultValue="0" className="w-full p-3 bg-muted rounded-xl border-transparent focus:ring-2 focus:ring-primary outline-none" />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Notes (Optionnel)</label>
          <textarea name="note" rows={3} placeholder="Informations complémentaires" className="w-full p-3 bg-muted rounded-xl border-transparent focus:ring-2 focus:ring-primary outline-none"></textarea>
        </div>

        <button type="submit" disabled={loading} className="w-full py-3.5 mt-2 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90 disabled:opacity-50">
          {loading ? 'Création...' : 'Créer le compte'}
        </button>
      </form>
    </div>
  );
}
