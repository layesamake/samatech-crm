'use client';

import { useState, useEffect } from 'react';
import { ManageExpenseBudgetsUseCase, ExpenseBudgetWithConsumption } from '@/modules/treasury/application/manage-expense-budgets';
import { treasuryRepository } from '@/modules/treasury/infrastructure/dexie-treasury-repository';
import { formatMinorExact } from '@/modules/statistics/domain/statistics';
import { Plus, TrendingDown } from 'lucide-react';
import Link from 'next/link';

const budgetUseCase = new ManageExpenseBudgetsUseCase(treasuryRepository);

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<ExpenseBudgetWithConsumption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    budgetUseCase.listBudgetsWithConsumption('ACTIVE').then(setBudgets).finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-6 p-4 pb-20 bg-muted/50 min-h-full">
      <header className="flex justify-between items-center mb-1">
         <h1 className="text-xl font-bold flex items-center gap-2">
           <TrendingDown className="w-5 h-5 text-amber-500" />
           Budgets de dépenses
         </h1>
         <Link href="/budgets/new" className="p-2 bg-primary text-primary-foreground rounded-full hover:scale-105 transition-transform shadow-sm">
           <Plus className="w-4 h-4" />
         </Link>
      </header>

      <section className="bg-card text-card-foreground rounded-2xl p-5 shadow-sm border border-border">
        {loading ? (
          <p className="text-muted-foreground text-sm animate-pulse">Chargement...</p>
        ) : budgets.length === 0 ? (
          <p className="text-muted-foreground text-sm">Aucun budget défini.</p>
        ) : (
          <div className="space-y-6">
            {budgets.map(budget => {
              const limit = BigInt(budget.amountMinor);
              const consumed = BigInt(budget.consumedMinor);
              const pct = limit > BigInt(0) ? Number((consumed * BigInt(100)) / limit) : 0;
              const isDanger = pct >= 90;

              return (
                <div key={budget.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
                  <div className="flex justify-between items-end mb-2">
                    <div>
                      <p className="font-semibold text-base">{budget.name}</p>
                      <p className="text-xs text-muted-foreground">Du {budget.startDate} au {budget.endDate}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">
                        {formatMinorExact(budget.consumedMinor.toString(), budget.currency, budget.currencyScale)}
                        <span className="text-muted-foreground font-normal"> / {formatMinorExact(budget.amountMinor.toString(), budget.currency, budget.currencyScale)}</span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${isDanger ? 'bg-red-500' : 'bg-amber-400'}`} 
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex justify-between mt-1 text-xs">
                    <span className={isDanger ? 'text-red-500 font-medium' : 'text-muted-foreground'}>
                      {pct.toFixed(1)}% consommé
                    </span>
                    <span className={budget.isExceeded ? 'text-red-500 font-medium' : 'text-muted-foreground'}>
                      {budget.isExceeded ? 'Dépassé de ' : 'Reste '}
                      {formatMinorExact(Math.abs(budget.remainingMinor).toString(), budget.currency, budget.currencyScale)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
