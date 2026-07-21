'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ManageTreasuryAccountsUseCase } from '@/modules/treasury/application/manage-treasury-accounts';
import { treasuryRepository } from '@/modules/treasury/infrastructure/dexie-treasury-repository';
import { TreasuryAccountType } from '@/modules/treasury/domain/treasury';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const accountUseCase = new ManageTreasuryAccountsUseCase(treasuryRepository);

export default function EditTreasuryAccountPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [account, setAccount] = useState<{
    name: string;
    type: TreasuryAccountType;
    currency: string;
    openingBalanceMinor: number;
    note?: string;
  } | null>(null);

  useEffect(() => {
    accountUseCase.getAccount(id).then((acc) => {
      if (!acc) {
        setError('Compte de trésorerie introuvable.');
      } else {
        setAccount({
          name: acc.name,
          type: acc.type,
          currency: acc.currency,
          openingBalanceMinor: acc.openingBalanceMinor,
          note: acc.note,
        });
      }
    }).catch((err: any) => {
      setError(err.message || 'Erreur lors du chargement du compte.');
    }).finally(() => {
      setFetching(false);
    });
  }, [id]);

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
      const openingBalanceMinor = Math.round(Number(openingBalanceStr)); // Echelle 0 pour XOF
      
      await accountUseCase.updateAccount(id, {
        name,
        type,
        currency,
        openingBalanceMinor,
        note
      });

      router.push('/treasury');
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="p-4 text-center text-muted-foreground">Chargement...</div>;
  }

  if (error && !account) {
    return (
      <div className="flex flex-col gap-6 p-4 bg-muted/50 min-h-full">
        <header className="flex items-center gap-4">
          <Link href="/treasury" className="p-2 -ml-2 rounded-full hover:bg-muted text-muted-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold">Modifier le Compte</h1>
        </header>
        <div className="p-4 bg-red-100 text-red-800 rounded-xl text-sm">{error}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 pb-20 bg-muted/50 min-h-full">
      <header className="flex items-center gap-4">
        <Link href="/treasury" className="p-2 -ml-2 rounded-full hover:bg-muted text-muted-foreground">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold">Modifier le Compte</h1>
      </header>

      {error && <div className="p-4 bg-red-100 text-red-800 rounded-xl text-sm">{error}</div>}

      {account && (
        <form onSubmit={handleSubmit} className="bg-card p-5 rounded-2xl shadow-sm border border-border flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Type de compte</label>
            <select 
              name="type" 
              required 
              defaultValue={account.type}
              className="w-full p-3 bg-muted rounded-xl border-transparent focus:ring-2 focus:ring-primary outline-none"
            >
              <option value="CASH">Caisse (Espèces)</option>
              <option value="BANK">Banque</option>
              <option value="MOBILE_MONEY">Mobile Money (Wave, Orange, etc.)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Nom du compte</label>
            <input 
              type="text" 
              name="name" 
              required 
              defaultValue={account.name}
              placeholder="Ex: Caisse Principale" 
              className="w-full p-3 bg-muted rounded-xl border-transparent focus:ring-2 focus:ring-primary outline-none" 
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Devise</label>
            <select 
              name="currency" 
              required 
              defaultValue={account.currency}
              className="w-full p-3 bg-muted rounded-xl border-transparent focus:ring-2 focus:ring-primary outline-none"
            >
              <option value="XOF">XOF (FCFA)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Solde initial</label>
            <input 
              type="number" 
              name="openingBalance" 
              required 
              min="0" 
              step="1" 
              defaultValue={account.openingBalanceMinor}
              className="w-full p-3 bg-muted rounded-xl border-transparent focus:ring-2 focus:ring-primary outline-none" 
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Notes (Optionnel)</label>
            <textarea 
              name="note" 
              rows={3} 
              defaultValue={account.note}
              placeholder="Informations complémentaires" 
              className="w-full p-3 bg-muted rounded-xl border-transparent focus:ring-2 focus:ring-primary outline-none"
            ></textarea>
          </div>

          <div className="flex gap-3">
            <button 
              type="submit" 
              disabled={loading} 
              className="flex-1 py-3.5 mt-2 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
            <Link 
              href="/treasury"
              className="flex-1 py-3.5 mt-2 bg-muted text-muted-foreground font-semibold rounded-xl text-center hover:bg-slate-200 transition-colors"
            >
              Annuler
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
