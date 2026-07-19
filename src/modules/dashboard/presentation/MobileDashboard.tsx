'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { FileText, User, ReceiptText, Timer, Clock, ChevronRight, DollarSign } from 'lucide-react';
import { GetStatisticsUseCase } from '@/modules/statistics/application/get-statistics';
import { StatisticsReport, formatMinorExact, PeriodPreset } from '@/modules/statistics/domain/statistics';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/infrastructure/database/db';

const getStatistics = new GetStatisticsUseCase();

export function MobileDashboard() {
  const [report, setReport] = useState<StatisticsReport | null>(null);
  
  // Load data for the current month by default
  useEffect(() => { 
    void getStatistics.execute({ preset: 'CURRENT_MONTH' as PeriodPreset })
      .then(setReport)
      .catch(console.error); 
  }, []);

  // Fetch recent transactions (invoices)
  const recentInvoices = useLiveQuery(
    async () => {
      const all = await db.invoices.toArray();
      return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3);
    }
  );

  if (!report) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Chargement du tableau de bord...</div>;
  }

  const money = report.primaryFinancial;
  const primary = { currency: report.primaryCurrency, scale: report.primaryCurrencyScale };

  // Calculate percentages for Accounts Receivable
  const totalReceivable = Number(money.receivableMinor);
  const overdueReceivable = Number(money.overdueMinor);
  const currentReceivable = totalReceivable - overdueReceivable;
  
  const currentPct = totalReceivable > 0 ? (currentReceivable / totalReceivable) * 100 : 0;
  const overduePct = totalReceivable > 0 ? (overdueReceivable / totalReceivable) * 100 : 0;

  return (
    <div className="flex flex-col gap-6 p-4 pb-20 bg-muted/50 min-h-full">
      {/* Welcome Section */}
      <section>
        <div className="flex items-center gap-2 mb-1">
           <span className="text-orange-500">✨</span>
           <h1 className="text-xl font-bold">Bienvenue sur SAMTECH CRM</h1>
        </div>
        <p className="text-sm text-muted-foreground">Voici une vue d&apos;ensemble de votre organisation</p>
      </section>

      {/* Quick Actions Card */}
      <section className="bg-card text-card-foreground rounded-2xl p-5 shadow-sm border border-border flex justify-between items-start gap-2 overflow-x-auto scrollbar-hide">
        <Link href="/invoices/new" className="shrink-0 flex flex-col items-center gap-2 flex-1 min-w-[70px]">
          <div className="w-14 h-14 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 shadow-sm relative">
             <FileText className="w-6 h-6" />
             <div className="absolute bottom-0 right-0 bg-card text-card-foreground rounded-full p-0.5 shadow-sm">
                <div className="bg-slate-900 rounded-full w-4 h-4 flex items-center justify-center">
                  <span className="text-[10px] text-white font-bold">+</span>
                </div>
             </div>
          </div>
          <span className="text-xs text-center font-medium leading-tight text-muted-foreground">Nouvelle<br/>facture</span>
        </Link>
        <Link href="/prospects/nouveau" className="shrink-0 flex flex-col items-center gap-2 flex-1 min-w-[70px]">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-sm relative">
             <User className="w-6 h-6" />
             <div className="absolute bottom-0 right-0 bg-card text-card-foreground rounded-full p-0.5 shadow-sm">
                <div className="bg-slate-900 rounded-full w-4 h-4 flex items-center justify-center">
                  <span className="text-[10px] text-white font-bold">+</span>
                </div>
             </div>
          </div>
          <span className="text-xs text-center font-medium leading-tight text-muted-foreground">Nouveau<br/>client</span>
        </Link>
        <Link href="/payments" className="shrink-0 flex flex-col items-center gap-2 flex-1 min-w-[70px]">
          <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 shadow-sm relative">
             <ReceiptText className="w-6 h-6" />
             <div className="absolute bottom-0 right-0 bg-card text-card-foreground rounded-full p-0.5 shadow-sm">
                <div className="bg-slate-900 rounded-full w-4 h-4 flex items-center justify-center">
                  <span className="text-[10px] text-white font-bold">+</span>
                </div>
             </div>
          </div>
          <span className="text-xs text-center font-medium leading-tight text-muted-foreground">Nouvelle<br/>dépense</span>
        </Link>
        <Link href="/follow-ups" className="shrink-0 flex flex-col items-center gap-2 flex-1 min-w-[70px]">
          <div className="w-14 h-14 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 shadow-sm relative">
             <Timer className="w-6 h-6" />
          </div>
          <span className="text-xs text-center font-medium leading-tight text-muted-foreground">Ajouter<br/>l&apos;heure du<br/>journal</span>
        </Link>
      </section>

      {/* Accounts Receivable Card */}
      <section className="bg-card text-card-foreground rounded-2xl p-5 shadow-sm border border-border">
        <div className="flex justify-between items-start mb-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Récapitulatif des créances
          </h2>
        </div>
        <p className="text-sm text-muted-foreground mb-1">Total des créances clients</p>
        <p className="text-2xl font-bold mb-6">
          {formatMinorExact(money.receivableMinor, primary.currency, primary.scale)}
        </p>
        
        {/* Simple Bar Chart */}
        <div className="h-40 flex items-end gap-8 border-b border-border pb-2 mb-4 relative">
          {/* Y-axis labels mockup */}
          <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[10px] text-slate-400">
             <span>{totalReceivable > 0 ? formatMinorExact(money.receivableMinor, primary.currency, primary.scale) : '1000'}</span>
             <span>0</span>
          </div>
          <div className="ml-12 flex-1 flex items-end justify-around h-full">
            <div className="w-8 bg-blue-500 rounded-t-sm" style={{ height: `${Math.max(currentPct, 5)}%` }}></div>
            <div className="w-8 bg-amber-500 rounded-t-sm" style={{ height: `${Math.max(overduePct, 5)}%` }}></div>
          </div>
        </div>

        <div className="flex justify-between text-sm">
          <div>
            <p className="text-blue-500 font-medium">Actuel</p>
            <p className="font-semibold">{formatMinorExact((currentReceivable).toString(), primary.currency, primary.scale)}</p>
          </div>
          <div className="text-right">
            <p className="text-amber-500 font-medium">En retard</p>
            <p className="font-semibold">{formatMinorExact((overdueReceivable).toString(), primary.currency, primary.scale)}</p>
          </div>
        </div>
      </section>

      {/* Recent Transactions Card */}
      <section className="bg-card text-card-foreground rounded-2xl p-5 shadow-sm border border-border">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Transactions récentes
          </h2>
        </div>
        
        <div className="flex gap-2 mb-4">
          <span className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm font-medium">Factures</span>
        </div>

        <div className="space-y-4">
          {recentInvoices && recentInvoices.length > 0 ? (
            recentInvoices.map((invoice) => (
              <div key={invoice.id} className="flex justify-between items-center pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                <div>
                  <p className="font-semibold text-sm">{invoice.clientSnapshot?.displayName || 'Client Inconnu'}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {invoice.issueDate || invoice.createdAt.substring(0, 10)} • {invoice.number || 'Brouillon'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm">{formatMinorExact(invoice.grandTotalMinor.toString(), invoice.currency, invoice.currencyScale)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 capitalize">{invoice.status.toLowerCase()}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Aucune transaction récente</p>
          )}
        </div>

        <Link href="/invoices" className="mt-4 flex items-center justify-center text-sm font-medium text-blue-600 gap-1 w-full p-2">
          Afficher Tout <ChevronRight className="w-4 h-4" />
        </Link>
      </section>

      {/* Sales / Expenses Card (Ventes / Facturé / Dépenses) */}
      <section className="bg-card text-card-foreground rounded-2xl p-5 shadow-sm border border-border">
         <div className="flex justify-between items-center mb-6">
          <h2 className="font-semibold text-foreground">Trésorerie & Activité</h2>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">Ce mois</span>
        </div>

        {/* Mock Chart for Sales */}
        <div className="h-48 flex items-end justify-between gap-1 border-b border-border pb-2 mb-4">
           {report.series.slice(-6).map((item, i) => {
              const maxVal = Math.max(...report.series.map(s => Number(s.billedMinor) + Number(s.collectedMinor)), 1);
              const billedPct = (Number(item.billedMinor) / maxVal) * 100;
              const collectedPct = (Number(item.collectedMinor) / maxVal) * 100;
              
              return (
                <div key={i} className="flex flex-col items-center gap-1 flex-1">
                  <div className="flex items-end justify-center gap-0.5 h-32 w-full">
                    <div className="w-full max-w-[6px] bg-blue-500 rounded-t-sm" style={{ height: `${Math.max(billedPct, 2)}%` }}></div>
                    <div className="w-full max-w-[6px] bg-emerald-400 rounded-t-sm" style={{ height: `${Math.max(collectedPct, 2)}%` }}></div>
                  </div>
                  <span className="text-[9px] text-muted-foreground mt-1">{item.label.substring(0, 3)}</span>
                </div>
              )
           })}
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div>
            <p className="font-semibold">{formatMinorExact(money.billedMinor, primary.currency, primary.scale)}</p>
            <p className="text-blue-500 text-xs font-medium">Facturé</p>
          </div>
          <div>
             <p className="font-semibold">{formatMinorExact(money.receivableMinor, primary.currency, primary.scale)}</p>
             <p className="text-amber-500 text-xs font-medium">Créances</p>
          </div>
          <div>
            <p className="font-semibold">{formatMinorExact(money.collectedMinor, primary.currency, primary.scale)}</p>
            <p className="text-emerald-500 text-xs font-medium">Encaissé</p>
          </div>
          <div>
            <p className="font-semibold">{formatMinorExact(money.expensesMinor || '0', primary.currency, primary.scale)}</p>
            <p className="text-red-500 text-xs font-medium">Dépensé</p>
          </div>
        </div>
        <div className="pt-3 border-t border-border flex justify-between items-center text-sm">
          <p className="font-medium text-muted-foreground">Mouvement Net</p>
          <p className={`font-bold ${Number(money.collectedMinor) - Number(money.expensesMinor || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
             {formatMinorExact((Number(money.collectedMinor) - Number(money.expensesMinor || 0)).toString(), primary.currency, primary.scale)}
          </p>
        </div>
      </section>

      {/* Top Debtors */}
      <section className="bg-card text-card-foreground rounded-2xl p-5 shadow-sm border border-border">
         <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-foreground">Clients débiteurs</h2>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">Actuel</span>
        </div>
        
        {report.receivables.topDebtors.length > 0 ? (
           <div className="space-y-4">
             {report.receivables.topDebtors.slice(0,3).map(debtor => {
                const amount = debtor.amounts.find(a => a.currency === primary.currency)?.minor || '0';
                const pct = totalReceivable > 0 ? (Number(amount) / totalReceivable) * 100 : 0;
                return (
                  <div key={debtor.clientProfileId}>
                     <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{debtor.label}</span>
                        <span className="font-semibold">{formatMinorExact(amount, primary.currency, primary.scale)}</span>
                     </div>
                     <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.max(pct, 2)}%` }}></div>
                     </div>
                  </div>
                )
             })}
           </div>
        ) : (
          <div className="text-center py-4 text-sm text-muted-foreground">
             Aucun client débiteur.
          </div>
        )}
      </section>

      {/* Top Products */}
      <section className="bg-card text-card-foreground rounded-2xl p-5 shadow-sm border border-border">
         <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-foreground">Produits populaires</h2>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">Ce mois</span>
        </div>
        
        {report.soldProducts.length > 0 ? (
           <div className="space-y-4">
             {report.soldProducts.slice(0, 4).map(product => {
                const maxQty = Math.max(...report.soldProducts.map(p => Number(p.quantityScaled)), 1);
                const pct = (Number(product.quantityScaled) / maxQty) * 100;
                return (
                  <div key={product.id}>
                     <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium truncate pr-4">{product.label}</span>
                        <span className="font-semibold">{Number(product.quantityScaled) / (10 ** product.quantityScale)}</span>
                     </div>
                     <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.max(pct, 2)}%` }}></div>
                     </div>
                  </div>
                )
             })}
           </div>
        ) : (
          <div className="text-center py-4 text-sm text-muted-foreground">
             Aucun produit vendu.
          </div>
        )}
      </section>
    </div>
  );
}
