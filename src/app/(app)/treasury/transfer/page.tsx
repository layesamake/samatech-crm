'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ManageTreasuryAccountsUseCase, TreasuryAccountWithBalance } from '@/modules/treasury/application/manage-treasury-accounts';
import { ManageTreasuryOperationsUseCase } from '@/modules/treasury/application/manage-treasury-operations';
import { treasuryRepository } from '@/modules/treasury/infrastructure/dexie-treasury-repository';
import { ArrowLeft, ArrowRightLeft } from 'lucide-react';
import Link from 'next/link';
import { formatMinorExact } from '@/modules/statistics/domain/statistics';

const accountUseCase = new ManageTreasuryAccountsUseCase(treasuryRepository);
const operationsUseCase = new ManageTreasuryOperationsUseCase(treasuryRepository);

export default function TreasuryTransferPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<TreasuryAccountWithBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    accountUseCase.listAccountsWithBalance().then(setAccounts).catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const sourceAccountId = formData.get('sourceAccountId') as string;
    const destinationAccountId = formData.get('destinationAccountId') as string;
    const amountMinor = Math.round(Number(formData.get('amount')) * 1);
    const operationDate = formData.get('operationDate') as string;
    const label = formData.get('label') as string;

    try {
      if (sourceAccountId === destinationAccountId) {
        throw new Error('Le compte source et destination doivent être différents.');
      }
      
      await operationsUseCase.transfer({
        sourceAccountId,
        destinationAccountId,
        amountMinor,
        operationDate,
        label
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
        <h1 className="text-xl font-bold flex items-center gap-2">
          <ArrowRightLeft className="w-5 h-5 text-blue-500" /> Transfert
        </h1>
      </header>

      {error && <div className="p-4 bg-red-100 text-red-800 rounded-xl text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-card p-5 rounded-2xl shadow-sm border border-border flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Depuis le compte</label>
          <select name="sourceAccountId" required className="w-full p-3 bg-muted rounded-xl border-transparent focus:ring-2 focus:ring-primary outline-none">
            <option value="">Sélectionner un compte source...</option>
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>
                {acc.name} ({formatMinorExact(acc.balanceMinor.toString(), acc.currency, acc.currencyScale)})
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Vers le compte</label>
          <select name="destinationAccountId" required className="w-full p-3 bg-muted rounded-xl border-transparent focus:ring-2 focus:ring-primary outline-none">
            <option value="">Sélectionner un compte destination...</option>
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>
                {acc.name} ({formatMinorExact(acc.balanceMinor.toString(), acc.currency, acc.currencyScale)})
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Montant à transférer</label>
          <input type="number" name="amount" required min="1" step="1" className="w-full p-3 bg-muted rounded-xl border-transparent focus:ring-2 focus:ring-primary outline-none" />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Date d&apos;opération</label>
          <input type="date" name="operationDate" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full p-3 bg-muted rounded-xl border-transparent focus:ring-2 focus:ring-primary outline-none" />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Motif / Libellé</label>
          <input type="text" name="label" required placeholder="Ex: Alimentation caisse" className="w-full p-3 bg-muted rounded-xl border-transparent focus:ring-2 focus:ring-primary outline-none" />
        </div>

        <button type="submit" disabled={loading} className="w-full py-3.5 mt-2 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90 disabled:opacity-50">
          {loading ? 'Transfert...' : 'Valider le transfert'}
        </button>
      </form>
    </div>
  );
}
