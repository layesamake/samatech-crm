'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ManageExpensesUseCase } from '../application/manage-expenses';
import { ExpenseRecord, ExpenseInput, EXPENSE_CATEGORIES, EXPENSE_CATEGORY_LABELS, EXPENSE_PAYMENT_METHODS, EXPENSE_PAYMENT_METHOD_LABELS, minorToExpenseInput, parseExpenseAmount } from '../domain/expense';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/infrastructure/database/db';
import { CompanyProfile, InvoiceSettings } from '@/modules/settings/domain/settings';

const manage = new ManageExpensesUseCase();

export default function ExpenseForm({ expenseId }: { expenseId?: string }) {
  const router = useRouter();
  
  // Load settings
  const settings = useLiveQuery(async () => {
    const comp = await db.settings.get('company.profile');
    const inv = await db.settings.get('invoice.defaults');
    return {
      company: comp?.value as CompanyProfile | undefined,
      invoice: inv?.value as InvoiceSettings | undefined
    };
  });

  const currency = settings?.invoice?.currencyCode ?? settings?.company?.currencyCode ?? 'XOF';
  // Simplified scale logic for XOF vs others. Ideally we should use currencyScaleFor(currency).
  const scale = currency === 'XOF' ? 0 : 2;

  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  const [amountText, setAmountText] = useState('');
  const [category, setCategory] = useState<ExpenseInput['category']>('RENT');
  const [customCategory, setCustomCategory] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<ExpenseInput['paymentMethod']>('CASH');
  const [supplier, setSupplier] = useState('');
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<ExpenseRecord['status']>('ACTIVE');
  const [cancellationReason, setCancellationReason] = useState('');

  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!expenseId) return;
    void manage.get(expenseId).then((current) => {
      if (current) {
        setExpenseDate(current.expenseDate);
        setDescription(current.description);
        setAmountText(minorToExpenseInput(current.amountMinor, current.currencyScale));
        setCategory(current.category);
        setCustomCategory(current.customCategory ?? '');
        setPaymentMethod(current.paymentMethod);
        setSupplier(current.supplier ?? '');
        setReference(current.reference ?? '');
        setNote(current.note ?? '');
        setStatus(current.status);
      }
    }).catch((caught: unknown) => setError(caught instanceof Error ? caught.message : 'Chargement impossible'));
  }, [expenseId]);

  const save = async () => {
    setPending(true);
    setError('');
    try {
      const amountMinor = parseExpenseAmount(amountText || '0', scale);
      const input: ExpenseInput = {
        expenseDate,
        description,
        amountMinor,
        currency,
        currencyScale: scale,
        category,
        customCategory: customCategory || undefined,
        paymentMethod,
        supplier: supplier || undefined,
        reference: reference || undefined,
        note: note || undefined,
      };

      if (expenseId) {
        await manage.update(expenseId, input);
      } else {
        await manage.create(input);
      }
      router.push('/expenses');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Enregistrement impossible');
    } finally {
      setPending(false);
    }
  };

  const cancel = async () => {
    if (!cancellationReason.trim()) {
      setError('Motif d\'annulation requis');
      return;
    }
    setPending(true);
    setError('');
    try {
      await manage.cancel(expenseId!, cancellationReason);
      router.push('/expenses');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Annulation impossible');
    } finally {
      setPending(false);
    }
  };

  if (settings === undefined) return <p className="p-4">Chargement...</p>;

  return (
    <main className="mx-auto max-w-2xl space-y-5 p-4 md:p-8">
      <header>
        <h1 className="text-2xl font-bold">{expenseId ? `Modifier la dépense` : `Nouvelle dépense`}</h1>
      </header>
      
      {error && <p role="alert" className="rounded-md bg-red-500/10 p-3 text-red-800 dark:text-red-200">{error}</p>}
      
      {status === 'CANCELLED' && (
        <div className="rounded-md bg-amber-500/10 p-4 text-amber-800 dark:text-amber-200 border border-amber-500/20">
          <p className="font-bold">Cette dépense a été annulée.</p>
          <p className="text-sm mt-1">Motif: {cancellationReason}</p>
        </div>
      )}

      <section className="grid gap-4 rounded-xl border bg-card text-card-foreground p-4">
        <label className="text-sm font-medium">Date de dépense
          <input disabled={status === 'CANCELLED'} type="date" className="mt-1 h-11 w-full rounded-md border px-3" value={expenseDate} onChange={e => setExpenseDate(e.target.value)} />
        </label>
        
        <label className="text-sm font-medium">Description
          <input disabled={status === 'CANCELLED'} className="mt-1 h-11 w-full rounded-md border px-3" value={description} onChange={e => setDescription(e.target.value)} placeholder="Achat de fournitures..." />
        </label>

        <div className="grid sm:grid-cols-2 gap-4">
          <label className="text-sm font-medium">Montant ({currency})
            <input disabled={status === 'CANCELLED'} inputMode="decimal" type="number" step={scale === 0 ? "1" : "0.01"} min="0" className="mt-1 h-11 w-full rounded-md border px-3" value={amountText} onChange={e => setAmountText(e.target.value)} />
          </label>

          <label className="text-sm font-medium">Mode de règlement
            <select disabled={status === 'CANCELLED'} className="mt-1 h-11 w-full rounded-md border px-3" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as ExpenseInput['paymentMethod'])}>
              {EXPENSE_PAYMENT_METHODS.map(m => (
                <option key={m} value={m}>{EXPENSE_PAYMENT_METHOD_LABELS[m]}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <label className="text-sm font-medium">Catégorie
            <select disabled={status === 'CANCELLED'} className="mt-1 h-11 w-full rounded-md border px-3" value={category} onChange={e => setCategory(e.target.value as ExpenseInput['category'])}>
              {EXPENSE_CATEGORIES.map(c => (
                <option key={c} value={c}>{EXPENSE_CATEGORY_LABELS[c]}</option>
              ))}
            </select>
          </label>

          {category === 'OTHER' && (
            <label className="text-sm font-medium">Précisez la catégorie
              <input disabled={status === 'CANCELLED'} className="mt-1 h-11 w-full rounded-md border px-3" value={customCategory} onChange={e => setCustomCategory(e.target.value)} />
            </label>
          )}
        </div>

        <label className="text-sm font-medium text-muted-foreground">Fournisseur / Bénéficiaire (Optionnel)
          <input disabled={status === 'CANCELLED'} className="mt-1 h-11 w-full rounded-md border px-3" value={supplier} onChange={e => setSupplier(e.target.value)} />
        </label>

        <label className="text-sm font-medium text-muted-foreground">Référence (Optionnel)
          <input disabled={status === 'CANCELLED'} className="mt-1 h-11 w-full rounded-md border px-3" value={reference} onChange={e => setReference(e.target.value)} />
        </label>

        <label className="text-sm font-medium text-muted-foreground">Notes (Optionnel)
          <textarea disabled={status === 'CANCELLED'} className="mt-1 w-full rounded-md border p-3 min-h-[80px]" value={note} onChange={e => setNote(e.target.value)} />
        </label>
      </section>

      {status === 'ACTIVE' && (
        <div className="flex flex-col gap-3">
          <button type="button" disabled={pending} onClick={() => void save()} className="h-12 w-full rounded-md bg-blue-700 text-white font-medium">
            {pending ? 'Enregistrement...' : (expenseId ? 'Mettre à jour la dépense' : 'Enregistrer la dépense')}
          </button>
          
          {expenseId && (
            <div className="mt-8 p-4 border border-red-500/20 rounded-xl bg-red-500/5">
              <h3 className="text-red-700 font-bold mb-2">Annuler cette dépense</h3>
              <p className="text-sm text-red-700/80 mb-3">Si cette dépense est une erreur, vous pouvez l'annuler. Elle sera conservée dans l'historique mais ne sera plus comptabilisée.</p>
              <input 
                className="h-11 w-full rounded-md border border-red-500/30 px-3 mb-3 bg-white" 
                placeholder="Motif de l'annulation obligatoire" 
                value={cancellationReason} 
                onChange={e => setCancellationReason(e.target.value)} 
              />
              <button type="button" disabled={pending || !cancellationReason.trim()} onClick={() => void cancel()} className="h-11 px-4 rounded-md border border-red-500/50 text-red-700 font-medium hover:bg-red-500/10 transition-colors">
                Annuler la dépense
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
