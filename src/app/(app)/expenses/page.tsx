'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/infrastructure/database/db';
import { formatMinor } from '@/modules/invoices/domain/invoice';
import { EXPENSE_CATEGORY_LABELS, EXPENSE_PAYMENT_METHOD_LABELS, ExpenseRecord } from '@/modules/expenses/domain/expense';

export default function ExpensesPage() {
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

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
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dépenses</h1>
          <p className="text-muted-foreground">Suivez les sorties d'argent de votre entreprise.</p>
        </div>
        <Link href="/expenses/new" className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50">
          Nouvelle dépense
        </Link>
      </header>

      <section className="bg-card text-card-foreground rounded-xl border p-4 shadow-sm flex flex-wrap gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span>Du</span>
          <input type="date" className="h-9 rounded-md border px-3" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>Au</span>
          <input type="date" className="h-9 rounded-md border px-3" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>Catégorie</span>
          <select className="h-9 rounded-md border px-3" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
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

      {Object.keys(totalsByCurrency).length > 0 && (
        <section className="bg-blue-50/50 dark:bg-blue-950/20 text-card-foreground rounded-xl border border-blue-100 dark:border-blue-900 p-4 shadow-sm">
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

      <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
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
                  <tr key={expense.id} className="border-b transition-colors hover:bg-muted/50">
                    <td className="p-4 align-middle">{expense.expenseDate}</td>
                    <td className="p-4 align-middle">
                      <div className="font-medium">{expense.description}</div>
                      {expense.supplier && <div className="text-xs text-muted-foreground">Bénéficiaire: {expense.supplier}</div>}
                    </td>
                    <td className="p-4 align-middle">
                      {EXPENSE_CATEGORY_LABELS[expense.category]}
                      {expense.category === 'OTHER' && expense.customCategory && ` (${expense.customCategory})`}
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
                        ? <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-green-500/10 text-green-700 border-green-500/20">Active</span>
                        : <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-amber-500/10 text-amber-700 border-amber-500/20" title={expense.cancellationReason}>Annulée</span>
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
    </main>
  );
}
