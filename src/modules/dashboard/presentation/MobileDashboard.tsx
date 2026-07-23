'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { FileText, User, ReceiptText, Timer, Clock, ChevronRight, DollarSign } from 'lucide-react';
import { GetStatisticsUseCase } from '@/modules/statistics/application/get-statistics';
import { StatisticsReport, formatMinorExact, PeriodPreset } from '@/modules/statistics/domain/statistics';
import { useLiveQuery } from 'dexie-react-hooks';
import { ManageInvoicesUseCase } from '@/modules/invoices/application/manage-invoices';
import { ManageTreasuryAccountsUseCase } from '@/modules/treasury/application/manage-treasury-accounts';
import { treasuryRepository } from '@/modules/treasury/infrastructure/dexie-treasury-repository';
import { opportunityUseCases } from '@/modules/opportunities/application/opportunity.usecases';
import { Briefcase } from 'lucide-react';

const getStatistics = new GetStatisticsUseCase();
const manageInvoices = new ManageInvoicesUseCase();
const accountUseCase = new ManageTreasuryAccountsUseCase(treasuryRepository);

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
      const all = await manageInvoices.getRecent(3);
      return all;
    }
  );

  const treasuryAccounts = useLiveQuery(() => accountUseCase.listAccountsWithBalance());
  const activeOpportunities = useLiveQuery(() => opportunityUseCases.getPipeline());

  if (!report) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Chargement du tableau de bord...</div>;
  }

  const money = report.primaryFinancial;
  const primary = { currency: report.primaryCurrency, scale: report.primaryCurrencyScale };

  // Calculate percentages for Accounts Receivable
  const totalReceivable = BigInt(money.receivableMinor);
  const overdueReceivable = BigInt(money.overdueMinor);
  const currentReceivable = totalReceivable - overdueReceivable;
  
  const currentPct = totalReceivable > BigInt(0) ? Number((currentReceivable * BigInt(100)) / totalReceivable) : 0;
  const overduePct = totalReceivable > BigInt(0) ? Number((overdueReceivable * BigInt(100)) / totalReceivable) : 0;

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
          <div className="w-14 h-14 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 shadow-sm">
             <FileText className="w-6 h-6" />
          </div>
          <span className="text-xs text-center font-medium leading-tight text-muted-foreground">Nouvelle<br/>facture</span>
        </Link>
        <Link href="/prospects/nouveau" className="shrink-0 flex flex-col items-center gap-2 flex-1 min-w-[70px]">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-sm">
             <User className="w-6 h-6" />
          </div>
          <span className="text-xs text-center font-medium leading-tight text-muted-foreground">Nouveau<br/>client</span>
        </Link>
        <Link href="/expenses/new" className="shrink-0 flex flex-col items-center gap-2 flex-1 min-w-[70px]">
          <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 shadow-sm">
             <ReceiptText className="w-6 h-6" />
          </div>
          <span className="text-xs text-center font-medium leading-tight text-muted-foreground">Nouvelle<br/>dépense</span>
        </Link>
        <Link href="/follow-ups" className="shrink-0 flex flex-col items-center gap-2 flex-1 min-w-[70px]">
          <div className="w-14 h-14 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 shadow-sm">
             <Timer className="w-6 h-6" />
          </div>
          <span className="text-xs text-center font-medium leading-tight text-muted-foreground">Nouvelle<br/>relance</span>
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
        
        {/* Horizontal Stacked Bar */}
        <div className="h-6 w-full bg-muted rounded-full overflow-hidden flex mb-6 relative">
          <div className="bg-blue-500 transition-all duration-500" style={{ width: `${currentPct}%` }}></div>
          <div className="bg-amber-500 transition-all duration-500" style={{ width: `${overduePct}%` }}></div>
          
          {/* Overlay to show 0 if nothing */}
          {totalReceivable === BigInt(0) && (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground font-medium">
              Aucune créance
            </div>
          )}
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

      {/* Pipeline Overview Card */}
      <section className="bg-card text-card-foreground rounded-2xl p-5 shadow-sm border border-border">
        <div className="flex justify-between items-start mb-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-purple-500" />
            Pipeline Commercial
          </h2>
          <Link href="/pipeline" className="text-xs font-semibold text-primary">Voir tout</Link>
        </div>
        <div className="space-y-2">
          {activeOpportunities === undefined ? (
            <p className="text-sm text-muted-foreground animate-pulse">Chargement...</p>
          ) : activeOpportunities.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune opportunité en cours.</p>
          ) : (
            <>
              <p className="text-2xl font-bold mb-2">
                {formatMinorExact(activeOpportunities.reduce((sum, opp) => sum + BigInt(opp.valueMinor || 0), BigInt(0)).toString(), 'XOF', 0)}
              </p>
              <p className="text-sm text-muted-foreground mb-4">Valeur potentielle sur {activeOpportunities.length} opportunité(s)</p>
              <div className="flex flex-col gap-2">
                {activeOpportunities.slice(0, 3).map(opp => (
                  <div key={opp.id} className="flex justify-between items-center text-sm border-b border-border pb-2 last:border-0 last:pb-0">
                    <span className="font-medium truncate pr-2 flex-1">{opp.title}</span>
                    <span className="font-semibold shrink-0">{formatMinorExact((opp.valueMinor || 0).toString(), opp.currency || 'XOF', 0)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Treasury Overview Card */}
      <section className="bg-card text-card-foreground rounded-2xl p-5 shadow-sm border border-border">
        <div className="flex justify-between items-start mb-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-500" />
            Trésorerie globale
          </h2>
          <Link href="/treasury" className="text-xs font-semibold text-primary">Gérer</Link>
        </div>
        <div className="space-y-4">
          {treasuryAccounts === undefined ? (
            <p className="text-sm text-muted-foreground animate-pulse">Chargement...</p>
          ) : treasuryAccounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun compte de trésorerie.</p>
          ) : (
            <>
              <p className="text-2xl font-bold mb-4">
                {formatMinorExact(treasuryAccounts.reduce((sum, acc) => sum + BigInt(acc.balanceMinor), BigInt(0)).toString(), treasuryAccounts[0]?.currency || 'XOF', treasuryAccounts[0]?.currencyScale || 0)}
              </p>
              <div className="flex flex-col gap-2">
                {treasuryAccounts.slice(0, 3).map(acc => (
                  <div key={acc.id} className="flex justify-between items-center text-sm border-b border-border pb-2 last:border-0 last:pb-0">
                    <span className="font-medium">{acc.name}</span>
                    <span className="font-semibold">{formatMinorExact(acc.balanceMinor.toString(), acc.currency, acc.currencyScale)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
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
          <p className={`font-bold ${BigInt(money.collectedMinor) - BigInt(money.expensesMinor || 0) >= BigInt(0) ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
             {formatMinorExact((BigInt(money.collectedMinor) - BigInt(money.expensesMinor || 0)).toString(), primary.currency, primary.scale)}
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
                const pct = totalReceivable > BigInt(0) ? Number((BigInt(amount) * BigInt(100)) / totalReceivable) : 0;
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
