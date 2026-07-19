'use client';

import { useState, useEffect } from 'react';
import { GetCashForecastUseCase } from '@/modules/treasury/application/get-cash-forecast';
import { ManageTreasuryAccountsUseCase } from '@/modules/treasury/application/manage-treasury-accounts';
import { treasuryRepository } from '@/modules/treasury/infrastructure/dexie-treasury-repository';
import { formatMinorExact } from '@/modules/statistics/domain/statistics';
import { ArrowLeft, TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import Link from 'next/link';

const accountUseCase = new ManageTreasuryAccountsUseCase(treasuryRepository);
const forecastUseCase = new GetCashForecastUseCase(treasuryRepository, accountUseCase);

export default function ForecastPage() {
  const [forecast, setForecast] = useState<{currentBalanceMinor: number, forecastBalanceMinor: number, items: any[]}>({
    currentBalanceMinor: 0, forecastBalanceMinor: 0, items: []
  });
  const [loading, setLoading] = useState(true);
  const [targetDate, setTargetDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split('T')[0];
  });

  useEffect(() => {
    setLoading(true);
    forecastUseCase.getForecast('XOF', 0, targetDate).then(setForecast).finally(() => setLoading(false));
  }, [targetDate]);

  return (
    <div className="flex flex-col gap-6 p-4 pb-20 bg-muted/50 min-h-full">
      <header className="flex justify-between items-center mb-1">
         <h1 className="text-xl font-bold flex items-center gap-2">
           <Link href="/treasury" className="p-2 -ml-2 rounded-full hover:bg-muted text-muted-foreground">
             <ArrowLeft className="w-5 h-5" />
           </Link>
           <TrendingUp className="w-5 h-5 text-emerald-500" />
           Prévisions
         </h1>
      </header>

      <section className="bg-card text-card-foreground rounded-2xl p-5 shadow-sm border border-border">
        <div className="flex flex-col gap-1.5 mb-6">
          <label className="text-sm font-medium flex items-center gap-2"><Calendar className="w-4 h-4"/> Date cible</label>
          <input 
            type="date" 
            value={targetDate} 
            onChange={e => setTargetDate(e.target.value)} 
            className="w-full p-3 bg-muted rounded-xl border-transparent focus:ring-2 focus:ring-primary outline-none" 
          />
        </div>

        <div className="flex justify-between items-center mb-2">
          <p className="text-muted-foreground">Solde Actuel</p>
          <p className="font-semibold">{formatMinorExact(forecast.currentBalanceMinor.toString(), 'XOF', 0)}</p>
        </div>

        <div className="flex justify-between items-center mb-6 pt-2 border-t border-border">
          <p className="text-muted-foreground">Solde Prévisionnel</p>
          <p className={`font-bold text-lg ${forecast.forecastBalanceMinor >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            {formatMinorExact(forecast.forecastBalanceMinor.toString(), 'XOF', 0)}
          </p>
        </div>

        {forecast.forecastBalanceMinor < 0 && (
          <div className="p-4 bg-red-50 text-red-700 rounded-xl flex items-start gap-3 mb-6">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm">Attention, le solde prévisionnel est négatif. Un découvert est à prévoir si aucune rentrée n&apos;est ajoutée.</p>
          </div>
        )}

        <h2 className="font-semibold mb-4 border-b border-border pb-2">Mouvements Prévus</h2>
        {loading ? (
          <p className="text-muted-foreground text-sm animate-pulse">Chargement...</p>
        ) : forecast.items.length === 0 ? (
          <p className="text-muted-foreground text-sm">Aucun mouvement prévu d&apos;ici cette date.</p>
        ) : (
          <div className="space-y-4">
            {forecast.items.map(item => (
              <div key={item.id} className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-sm">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.expectedDate}</p>
                </div>
                <div className={`font-semibold ${item.type === 'INFLOW' ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {item.type === 'INFLOW' ? '+' : '-'}{formatMinorExact(item.amountMinor.toString(), item.currency, item.currencyScale)}
                </div>
              </div>
            ))}
          </div>
        )}

        <Link href="/treasury/forecast/new" className="mt-6 flex items-center justify-center gap-2 w-full py-3 bg-muted text-foreground font-semibold rounded-xl hover:bg-muted/80">
          Ajouter une prévision
        </Link>
      </section>
    </div>
  );
}
