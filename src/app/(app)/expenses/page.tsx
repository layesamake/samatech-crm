'use client';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/infrastructure/database/db';
import { formatMinor } from '@/modules/invoices/domain/invoice';
import { EXPENSE_CATEGORY_LABELS, EXPENSE_PAYMENT_METHOD_LABELS, ExpenseRecord, formatExpenseCategory } from '@/modules/expenses/domain/expense';
import { Filter, Plus, X } from 'lucide-react';

export default function ExpensesPage() {
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const hasActiveFilters = Boolean(filterDateFrom || filterDateTo || filterCategory);

  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setPortalContainer(document.getElementById('topbar-actions'));
  }, []);

  const actionButtons = (
    <button 
      type="button"
      className="relative flex h-10 w-10 items-center justify-center rounded-full text-nav-muted hover:text-nav-fg hover:bg-white/10 transition-colors"
      onClick={() => setShowFilters(!showFilters)}
      aria-label={showFilters ? "Fermer les filtres" : "Afficher les filtres"}
      title="Filtrer les dépenses"
    >
      {showFilters ? <X className="w-5 h-5" /> : <Filter className="w-5 h-5" />}
      {hasActiveFilters && !showFilters && (
        <span className="absolute right-0 top-0 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">•</span>
      )}
    </button>
  );

  const expenses = useLiveQuery(async () => {
    let collection = db.expenses.filter((e) => !e.archivedAt);
    const results = await collection.toArray();
    
    return results.filter((e) => {
      if (filterDateFrom && e.expenseDate < filterDateFrom) return false;
      if (filterDateTo && e.expenseDate > filterDateTo) return false;
      if (filterCategory && e.category !== filterCategory) return false;
      return true;
    }).sort((a, b) => b.expenseDate.localeCompare(a.expenseDate) || b.createdAt.localeCompare(a.createdAt));
  }, [filterDateFrom, filterDateTo, filterCategory]);

  // Calcul des totaux par devise pour les dépenses actives
  const totalsByCurrency: Record<string, { minor: number; scale: number }> = {};
  
  if (expenses) {
    for (const exp of expenses) {
      if (exp.status === 'ACTIVE') {
        if (!totalsByCurrency[exp.currency]) {
          totalsByCurrency[exp.currency] = { minor: 0, scale: exp.currencyScale };
        }
        totalsByCurrency[exp.currency].minor += exp.amountMinor;
      }
    }
  }

  return (
    <main className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      {portalContainer ? createPortal(actionButtons, portalContainer) : <div className="hidden md:flex justify-end">{actionButtons}</div>}

      <header className="hidden md:flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dépenses</h1>
          <p className="text-muted-foreground">Suivez les sorties d'argent de votre entreprise.</p>
        </div>
      </header>

      {showFilters && (
        <section className="bg-card text-card-foreground rounded-xl border p-4 shadow-sm flex flex-wrap gap-4 bg-background text-foreground animate-in slide-in-from-top-2">
          <label className="flex flex-col gap-1 text-sm">
            <span>Du</span>
            <input type="date" className="h-9 rounded-md border px-3 bg-background text-foreground" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>Au</span>
            <input type="date" className="h-9 rounded-md border px-3 bg-background text-foreground" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>Catégorie</span>
            <select className="h-9 rounded-md border px-3 bg-background text-foreground" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
              <option value="">Toutes les catégories</option>
              {Object.entries(EXPENSE_CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </label>
          <div className="flex items-end">
            <button type="button" onClick={() => { setFilterDateFrom(''); setFilterDateTo(''); setFilterCategory(''); }} className="h-9 px-3 text-sm rounded-md hover:bg-muted text-muted-foreground">Effacer</button>
          </div>
        </section>
      )}

      {Object.keys(totalsByCurrency).length > 0 && (
        <section className="bg-blue-50/50 dark:bg-blue-950/20 text-card-foreground rounded-xl border border-blue-100 dark:border-blue-900 p-4 shadow-sm bg-background text-foreground">
          <h2 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">Total des dépenses actives (période sélectionnée)</h2>
          <div className="flex gap-4">
            {Object.entries(totalsByCurrency).map(([currency, data]) => (
              <div key={currency} className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                {formatMinor(data.minor, currency, data.scale)}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Vue mobile : cartes */}
      <div className="grid gap-3 md:hidden">
        {!expenses ? (
          <p className="p-4 text-center">Chargement...</p>
        ) : expenses.length === 0 ? (
          <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground bg-background">Aucune dépense trouvée.</p>
        ) : (
          expenses.map((expense) => (
            <article key={expense.id} className={`rounded-xl border p-4 shadow-sm transition-colors ${expense.status === 'CANCELLED' ? 'bg-muted/50 text-muted-foreground' : 'bg-card text-card-foreground'}`}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="font-semibold text-base">{expense.description}</div>
                  {expense.supplier && <div className="text-xs text-muted-foreground">Bénéficiaire : {expense.supplier}</div>}
                </div>
                <div className="text-right shrink-0">
                  <div className={`font-bold text-base ${expense.status === 'CANCELLED' ? 'line-through text-muted-foreground' : ''}`}>
                    {formatMinor(expense.amountMinor, expense.currency, expense.currencyScale)}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground border-t pt-2.5 mt-2.5 gap-2">
                <div className="flex items-center gap-1.5">
                  <span>{expense.expenseDate}</span>
                  <span>•</span>
                  <span className="font-medium">{formatExpenseCategory(expense.category, expense.customCategory)}</span>
                </div>
                <div>
                  <span>{EXPENSE_PAYMENT_METHOD_LABELS[expense.paymentMethod]}</span>
                </div>
              </div>
              <div className="flex items-center justify-between border-t pt-2.5 mt-2.5">
                <div>
                  {expense.status === 'ACTIVE' 
                    ? <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-green-500/10 text-green-700 border-green-500/20">Active</span>
                    : <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-amber-500/10 text-amber-700 border-amber-500/20" title={expense.cancellationReason}>Annulée</span>
                  }
                </div>
                <Link href={`/expenses/${expense.id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:underline">
                  Ouvrir →
                </Link>
              </div>
            </article>
          ))
        )}
      </div>

      {/* Vue bureau : tableau */}
      <div className="hidden md:block rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden bg-background text-foreground">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b bg-background text-foreground">
              <tr>
                <th className="h-10 px-4 text-left font-medium text-muted-foreground">Date</th>
                <th className="h-10 px-4 text-left font-medium text-muted-foreground">Description</th>
                <th className="h-10 px-4 text-left font-medium text-muted-foreground">Catégorie</th>
                <th className="h-10 px-4 text-left font-medium text-muted-foreground">Règlement</th>
                <th className="h-10 px-4 text-right font-medium text-muted-foreground">Montant</th>
                <th className="h-10 px-4 text-center font-medium text-muted-foreground">Statut</th>
                <th className="h-10 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {!expenses ? (
                <tr><td colSpan={7} className="p-4 text-center">Chargement...</td></tr>
              ) : expenses.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Aucune dépense trouvée.</td></tr>
              ) : (
                expenses.map((expense) => (
                  <tr key={expense.id} className="border-b transition-colors hover:bg-muted/50 bg-background text-foreground">
                    <td className="p-4 align-middle">{expense.expenseDate}</td>
                    <td className="p-4 align-middle">
                      <div className="font-medium">{expense.description}</div>
                      {expense.supplier && <div className="text-xs text-muted-foreground">Bénéficiaire: {expense.supplier}</div>}
                    </td>
                    <td className="p-4 align-middle">
                      {formatExpenseCategory(expense.category, expense.customCategory)}
                    </td>
                    <td className="p-4 align-middle">{EXPENSE_PAYMENT_METHOD_LABELS[expense.paymentMethod]}</td>
                    <td className="p-4 align-middle text-right font-semibold">
                      {expense.status === 'CANCELLED' ? (
                        <span className="line-through text-muted-foreground">{formatMinor(expense.amountMinor, expense.currency, expense.currencyScale)}</span>
                      ) : (
                        formatMinor(expense.amountMinor, expense.currency, expense.currencyScale)
                      )}
                    </td>
                    <td className="p-4 align-middle text-center">
                      {expense.status === 'ACTIVE' 
                        ? <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-green-500/10 text-green-700 border-green-500/20 bg-background text-foreground">Active</span>
                        : <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-amber-500/10 text-amber-700 border-amber-500/20 bg-background text-foreground" title={expense.cancellationReason}>Annulée</span>
                      }
                    </td>
                    <td className="p-4 align-middle text-right">
                      <Link href={`/expenses/${expense.id}`} className="text-blue-600 hover:underline">Ouvrir</Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAB : Nouvelle dépense */}
      <Link
        href="/expenses/new"
        aria-label="Nouvelle dépense"
        className="fixed bottom-24 lg:bottom-12 right-6 lg:right-10 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:scale-105 active:scale-95"
      >
        <Plus className="w-8 h-8" />
      </Link>
    </main>
  );
}
