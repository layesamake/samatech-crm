'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import type { InvoiceAggregate } from '@/modules/invoices/domain/invoice';
import { formatMinor } from '@/modules/invoices/domain/invoice';
import { ManagePaymentsUseCase } from '../application/manage-payments';
import { minorToPaymentInput, PAYMENT_METHOD_LABELS, PAYMENT_METHODS, PaymentMethod, PaymentRecord, parsePaymentAmount } from '../domain/payment';
import { ManageTreasuryAccountsUseCase, TreasuryAccountWithBalance } from '@/modules/treasury/application/manage-treasury-accounts';
import { AllocateTreasurySourcesUseCase } from '@/modules/treasury/application/allocate-treasury-sources';
import { treasuryRepository } from '@/modules/treasury/infrastructure/dexie-treasury-repository';

const managePayments = new ManagePaymentsUseCase();
const accountUseCase = new ManageTreasuryAccountsUseCase(treasuryRepository);
const allocateUseCase = new AllocateTreasurySourcesUseCase(treasuryRepository);

function todayLocal(): string {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function PaymentPanel({ value, onInvoiceChanged }: { value: InvoiceAggregate; onInvoiceChanged: () => Promise<void> }) {
  const { invoice } = value;
  const [items, setItems] = useState<PaymentRecord[]>([]);
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(todayLocal());
  const [method, setMethod] = useState<PaymentMethod>('CASH');
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pending, setPending] = useState(false);
  const [reverseId, setReverseId] = useState('');
  const [reverseReason, setReverseReason] = useState('');
  const [accountId, setAccountId] = useState('');
  const [accounts, setAccounts] = useState<TreasuryAccountWithBalance[]>([]);

  useEffect(() => {
    accountUseCase.listAccountsWithBalance().then(setAccounts).catch(console.error);
  }, []);

  const load = useCallback(() => managePayments.forInvoice(invoice.id).then(setItems), [invoice.id]);
  useEffect(() => { void managePayments.forInvoice(invoice.id).then(setItems).catch((caught: unknown) => setError(caught instanceof Error ? caught.message : 'Chargement des paiements impossible')); }, [invoice.id]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(''); setSuccess('');
    try {
      const amountMinor = parsePaymentAmount(amount, invoice.currencyScale);
      if (amountMinor > invoice.balanceMinor) throw new Error('Le paiement dépasse le solde restant');
      const historical = Boolean(invoice.issueDate && paymentDate < invoice.issueDate);
      if (historical && !window.confirm('La date précède l’émission. Confirmer cet historique légitime ?')) return;
      if (!window.confirm(`Enregistrer le paiement de ${formatMinor(amountMinor, invoice.currency, invoice.currencyScale)} ?`)) return;
      setPending(true);
      const agg = await managePayments.record({ invoiceId: invoice.id, clientProfileId: invoice.clientProfileId, paymentDate, amountMinor, currency: invoice.currency, currencyScale: invoice.currencyScale, method, reference, note, confirmHistoricalDate: historical });
      if (accountId) {
        await allocateUseCase.allocate('PAYMENT', agg.payment.id, accountId);
      }
      setAmount(''); setReference(''); setNote(''); setSuccess('Paiement enregistré.');
      await Promise.all([load(), onInvoiceChanged()]);
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Enregistrement impossible'); }
    finally { setPending(false); }
  };

  const reverse = async (payment: PaymentRecord) => {
    setError(''); setSuccess('');
    if (!reverseReason.trim()) { setError('Le motif de contrepassation est obligatoire'); return; }
    if (!window.confirm('Contrepasser ce paiement ? Il restera visible et la facture sera recalculée.')) return;
    setPending(true);
    try {
      await managePayments.reverse(payment.id, reverseReason);
      setReverseId(''); setReverseReason(''); setSuccess('Paiement contrepassé.');
      await Promise.all([load(), onInvoiceChanged()]);
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Contrepassation impossible'); }
    finally { setPending(false); }
  };

  return <section className="space-y-4 rounded-xl border bg-card text-card-foreground p-5" aria-labelledby="payment-history-title">
    <div className="flex flex-wrap items-center justify-between gap-2"><div><h2 id="payment-history-title" className="font-semibold">Paiements</h2><p className="text-sm text-muted-foreground">Payé {formatMinor(invoice.paidTotalMinor, invoice.currency, invoice.currencyScale)} · Solde {formatMinor(invoice.balanceMinor, invoice.currency, invoice.currencyScale)}</p></div><span className="rounded-full border px-3 py-1 text-sm font-semibold">{invoice.status}</span></div>
    {(invoice.status === 'EMISE' || invoice.status === 'PARTIELLEMENT_PAYEE') && <form onSubmit={submit} className="space-y-3 rounded-lg bg-muted/50 p-4">
      <h3 className="font-medium">Enregistrer un paiement</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">Montant ({invoice.currency})<input required inputMode="decimal" aria-label="Montant du paiement" className="mt-1 h-11 w-full rounded-md border px-3" value={amount} onChange={(event) => setAmount(event.target.value)} /></label>
        <label className="text-sm">Date<input required type="date" aria-label="Date du paiement" className="mt-1 h-11 w-full rounded-md border px-3" value={paymentDate} onChange={(event) => setPaymentDate(event.target.value)} /></label>
        <label className="text-sm">Mode<select aria-label="Mode de paiement" className="mt-1 h-11 w-full rounded-md border px-3" value={method} onChange={(event) => setMethod(event.target.value as PaymentMethod)}>{PAYMENT_METHODS.map((item) => <option key={item} value={item}>{PAYMENT_METHOD_LABELS[item]}</option>)}</select></label>
        <label className="text-sm">Compte de trésorerie<select aria-label="Compte de trésorerie" className="mt-1 h-11 w-full rounded-md border px-3" value={accountId} onChange={(event) => setAccountId(event.target.value)}><option value="">Aucun compte affecté</option>{accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}</select></label>
        <label className="text-sm sm:col-span-2">Référence facultative<input aria-label="Référence du paiement" className="mt-1 h-11 w-full rounded-md border px-3" value={reference} onChange={(event) => setReference(event.target.value)} /></label>
      </div>
      <label className="block text-sm">Note {method === 'OTHER' ? '(obligatoire pour Autre)' : 'facultative'}<textarea required={method === 'OTHER'} aria-label="Note du paiement" className="mt-1 min-h-20 w-full rounded-md border p-3" value={note} onChange={(event) => setNote(event.target.value)} /></label>
      {invoice.issueDate && paymentDate < invoice.issueDate && <p role="alert" className="rounded-md bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-200">Cette date précède l’émission du {invoice.issueDate}. Une confirmation supplémentaire sera demandée.</p>}
      <div className="flex flex-wrap gap-2"><button type="button" className="h-11 rounded-md border bg-card text-card-foreground px-4" onClick={() => setAmount(minorToPaymentInput(invoice.balanceMinor, invoice.currencyScale))}>Régler le solde</button><button disabled={pending} className="h-11 rounded-md bg-emerald-700 px-4 text-white">{pending ? 'Enregistrement…' : 'Enregistrer le paiement'}</button></div>
    </form>}
    {error && <p role="alert" className="rounded-md bg-red-500/10 p-3 text-red-800 dark:text-red-200">{error}</p>}{success && <p role="status" className="rounded-md bg-emerald-500/10 p-3 text-emerald-800 dark:text-emerald-200">{success}</p>}
    {items.length === 0 ? <p className="text-sm text-muted-foreground">Aucun paiement enregistré.</p> : <ol className="space-y-3">{items.map((payment) => <li key={payment.id} className={`rounded-lg border p-4 ${payment.status === 'REVERSED' ? 'border-border bg-muted text-muted-foreground' : ''}`}>
      <div className="flex flex-wrap justify-between gap-2"><strong>{formatMinor(payment.amountMinor, payment.currency, payment.currencyScale)}</strong><span>{payment.status === 'ACTIVE' ? 'ACTIF' : 'CONTREPASSÉ'}</span></div>
      <p className="text-sm">{payment.paymentDate} · {PAYMENT_METHOD_LABELS[payment.method]}</p>{payment.reference && <p className="text-sm">Référence : {payment.reference}</p>}{payment.note && <p className="whitespace-pre-wrap text-sm">{payment.note}</p>}{payment.reversalReason && <p className="mt-1 text-sm">Motif : {payment.reversalReason}</p>}
      {payment.status === 'ACTIVE' && (reverseId !== payment.id ? <button className="mt-2 h-11 rounded-md border border-red-500/20 px-3 text-red-800 dark:text-red-200" onClick={() => { setReverseId(payment.id); setReverseReason(''); }}>Contrepasser</button> : <div className="mt-3 space-y-2"><label className="block text-sm">Motif obligatoire<textarea aria-label={`Motif de contrepassation ${payment.id}`} className="mt-1 min-h-20 w-full rounded-md border p-3" value={reverseReason} onChange={(event) => setReverseReason(event.target.value)} /></label><div className="flex gap-2"><button disabled={pending} className="h-11 rounded-md bg-red-700 px-3 text-white" onClick={() => void reverse(payment)}>Confirmer la contrepassation</button><button className="h-11 rounded-md border px-3" onClick={() => setReverseId('')}>Garder le paiement</button></div></div>)}
    </li>)}</ol>}
  </section>;
}
