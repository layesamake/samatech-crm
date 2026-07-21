'use client';

import { useState, useEffect } from 'react';
import { TreasuryAccountWithBalance, ManageTreasuryAccountsUseCase } from '@/modules/treasury/application/manage-treasury-accounts';
import { treasuryRepository } from '@/modules/treasury/infrastructure/dexie-treasury-repository';
import { formatMinorExact } from '@/modules/statistics/domain/statistics';
import { Plus, ArrowRightLeft, TrendingUp, TrendingDown, DollarSign, Edit2, Archive } from 'lucide-react';
import Link from 'next/link';

const accountUseCase = new ManageTreasuryAccountsUseCase(treasuryRepository);

export default function TreasuryPage() {
  const [accounts, setAccounts] = useState<TreasuryAccountWithBalance[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAccounts = () => {
    setLoading(true);
    accountUseCase.listAccountsWithBalance().then(setAccounts).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const handleArchive = async (id: string, name: string) => {
    if (confirm(`Voulez-vous vraiment archiver le compte "${name}" ?`)) {
      try {
        await accountUseCase.archiveAccount(id);
        loadAccounts();
      } catch (err: any) {
        alert(`Erreur d'archivage : ${err.message}`);
      }
    }
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + BigInt(acc.balanceMinor), BigInt(0));
  const primaryCurrency = accounts.length > 0 ? accounts[0].currency : 'XOF';
  const primaryScale = accounts.length > 0 ? accounts[0].currencyScale : 0;

  return (
    <div className="flex flex-col gap-6 p-4 pb-20 bg-muted/50 min-h-full">
      <section>
        <div className="flex justify-between items-center mb-1">
           <h1 className="text-xl font-bold flex items-center gap-2">
             <DollarSign className="w-5 h-5 text-emerald-500" />
             Trésorerie
           </h1>
           <Link href="/treasury/new" className="p-2 bg-primary text-primary-foreground rounded-full hover:scale-105 transition-transform shadow-sm">
             <Plus className="w-4 h-4" />
           </Link>
        </div>
        <p className="text-sm text-muted-foreground">Solde global : <strong className="text-foreground">{formatMinorExact(totalBalance.toString(), primaryCurrency, primaryScale)}</strong></p>
      </section>

      <section className="flex gap-2 mb-2">
        <Link href="/treasury/transfer" className="flex-1 bg-card border border-border p-3 rounded-xl flex items-center justify-center gap-2 shadow-sm font-medium text-sm text-foreground hover:bg-muted/50">
          <ArrowRightLeft className="w-4 h-4 text-blue-500" /> Transfert
        </Link>
        <Link href="/treasury/forecast" className="flex-1 bg-card border border-border p-3 rounded-xl flex items-center justify-center gap-2 shadow-sm font-medium text-sm text-foreground hover:bg-muted/50">
          <TrendingUp className="w-4 h-4 text-emerald-500" /> Prévisions
        </Link>
        <Link href="/budgets" className="flex-1 bg-card border border-border p-3 rounded-xl flex items-center justify-center gap-2 shadow-sm font-medium text-sm text-foreground hover:bg-muted/50">
          <TrendingDown className="w-4 h-4 text-amber-500" /> Budgets
        </Link>
      </section>

      <section className="bg-card text-card-foreground rounded-2xl p-5 shadow-sm border border-border">
        <h2 className="font-semibold text-foreground mb-4">Mes Comptes</h2>
        
        {loading ? (
          <p className="text-muted-foreground text-sm animate-pulse">Chargement...</p>
        ) : accounts.length === 0 ? (
          <p className="text-muted-foreground text-sm">Aucun compte créé.</p>
        ) : (
          <div className="space-y-4">
            {accounts.map(acc => (
              <div key={acc.id} className="flex justify-between items-center pb-4 border-b border-border last:border-0 last:pb-0 gap-4">
                <div className="flex-1">
                  <p className="font-semibold">{acc.name}</p>
                  <p className="text-xs text-muted-foreground">{acc.type === 'BANK' ? 'Banque' : acc.type === 'CASH' ? 'Caisse' : 'Mobile Money'}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-semibold">{formatMinorExact(acc.balanceMinor.toString(), acc.currency, acc.currencyScale)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Link href={`/treasury/${acc.id}/edit`} className="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors" title="Modifier">
                      <Edit2 className="w-4 h-4" />
                    </Link>
                    <button onClick={() => handleArchive(acc.id, acc.name)} className="p-2 text-muted-foreground hover:text-destructive hover:bg-muted rounded-lg transition-colors" title="Archiver">
                      <Archive className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
