'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { formatMinor } from '@/modules/invoices/domain/invoice';
import { ManagePaymentsUseCase } from '@/modules/payments/application/manage-payments';
import { PAYMENT_METHOD_LABELS, PAYMENT_METHODS, PAYMENT_STATUSES, PaymentAggregate, PaymentIndicators, PaymentMethod, PaymentStatus, ReceivableRecord, sumActivePayments } from '@/modules/payments/domain/payment';

const manage = new ManagePaymentsUseCase();
const EMPTY_INDICATORS: PaymentIndicators = { activeCollectedMinor: 0, remainingMinor: 0, partiallyPaidCount: 0, paidCount: 0, overdueReceivablesCount: 0 };

export default function PaymentsPage() {
  const [view, setView] = useState<'PAYMENTS' | 'RECEIVABLES'>('PAYMENTS');
  const [items, setItems] = useState<PaymentAggregate[]>([]);
  const [allItems, setAllItems] = useState<PaymentAggregate[]>([]);
  const [receivables, setReceivables] = useState<ReceivableRecord[]>([]);
  const [allReceivables, setAllReceivables] = useState<ReceivableRecord[]>([]);
  const [indicators, setIndicators] = useState(EMPTY_INDICATORS);
  const [query, setQuery] = useState('');
  const [from, setFrom] = useState(''); const [to, setTo] = useState('');
  const [method, setMethod] = useState(''); const [status, setStatus] = useState('');
  const [clientId, setClientId] = useState(''); const [invoiceId, setInvoiceId] = useState('');
  const [due, setDue] = useState(''); const [sort, setSort] = useState<'DUE_DATE' | 'BALANCE_DESC'>('DUE_DATE');
  const [loading, setLoading] = useState(true); const [error, setError] = useState('');

  useEffect(() => { const requested = new URLSearchParams(window.location.search).get('view'); if (requested !== 'RECEIVABLES' && requested !== 'PAYMENTS') return; const timer = window.setTimeout(() => setView(requested), 0); return () => window.clearTimeout(timer); }, []);

  useEffect(() => { void Promise.all([manage.list(), manage.receivables(), manage.indicators()]).then(([values, debts, stats]) => { setAllItems(values); setAllReceivables(debts); setIndicators(stats); }).catch((caught: unknown) => setError(caught instanceof Error ? caught.message : 'Chargement impossible')); }, []);
  useEffect(() => { void manage.list({ query, from: from || undefined, to: to || undefined, method: method ? method as PaymentMethod : undefined, status: status ? status as PaymentStatus : undefined, clientProfileId: clientId || undefined, invoiceId: invoiceId || undefined }).then(setItems).catch((caught: unknown) => setError(caught instanceof Error ? caught.message : 'Chargement impossible')).finally(() => setLoading(false)); }, [query, from, to, method, status, clientId, invoiceId]);
  useEffect(() => { void manage.receivables({ query, due: due ? due as 'OVERDUE' | 'UPCOMING' : undefined, from: from || undefined, to: to || undefined, clientProfileId: clientId || undefined, sort }).then(setReceivables).catch((caught: unknown) => setError(caught instanceof Error ? caught.message : 'Chargement des créances impossible')); }, [query, due, from, to, clientId, sort]);

  const clients = useMemo(() => Array.from(new Map([
    ...allItems.map((item) => [item.payment.clientProfileId, item.clientName] as const),
    ...allReceivables.map((item) => [item.invoice.clientProfileId, item.clientName] as const),
  ]).entries()).sort((a, b) => a[1].localeCompare(b[1], 'fr')), [allItems, allReceivables]);
  const invoices = useMemo(() => Array.from(new Map(allItems.map((item) => [item.payment.invoiceId, item.invoiceNumber])).entries()).sort((a, b) => a[1].localeCompare(b[1], 'fr')), [allItems]);
  const currency = allItems[0]?.payment.currency ?? receivables[0]?.invoice.currency ?? 'XOF';
  const scale = allItems[0]?.payment.currencyScale ?? receivables[0]?.invoice.currencyScale ?? 0;
  const filteredActive = sumActivePayments(items.map((item) => item.payment));

  return <main className="mx-auto max-w-6xl space-y-5 p-4 md:p-8">
    <header><h1 className="text-2xl font-bold">Paiements et créances</h1><p className="text-slate-600">Encaissements manuels, soldes et factures à recouvrer — disponibles hors ligne.</p></header>
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5" aria-label="Indicateurs d’encaissement">
      <article className="rounded-xl border bg-card text-card-foreground p-4"><p className="text-xs text-slate-500">Total encaissé actif</p><strong>{formatMinor(indicators.activeCollectedMinor, currency, scale)}</strong></article>
      <article className="rounded-xl border bg-card text-card-foreground p-4"><p className="text-xs text-slate-500">Restant à encaisser</p><strong>{formatMinor(indicators.remainingMinor, currency, scale)}</strong></article>
      <article className="rounded-xl border bg-card text-card-foreground p-4"><p className="text-xs text-slate-500">Partiellement payées</p><strong>{indicators.partiallyPaidCount}</strong></article>
      <article className="rounded-xl border bg-card text-card-foreground p-4"><p className="text-xs text-slate-500">Factures payées</p><strong>{indicators.paidCount}</strong></article>
      <article className="rounded-xl border bg-card text-card-foreground p-4"><p className="text-xs text-slate-500">Créances échues</p><strong>{indicators.overdueReceivablesCount}</strong></article>
    </section>
    <div className="flex gap-2" role="tablist" aria-label="Vue financière"><button role="tab" aria-selected={view === 'PAYMENTS'} className={`h-11 rounded-md px-4 ${view === 'PAYMENTS' ? 'bg-blue-700 text-white' : 'border'}`} onClick={() => setView('PAYMENTS')}>Paiements</button><button role="tab" aria-selected={view === 'RECEIVABLES'} className={`h-11 rounded-md px-4 ${view === 'RECEIVABLES' ? 'bg-blue-700 text-white' : 'border'}`} onClick={() => setView('RECEIVABLES')}>Créances</button></div>
    <section className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4" aria-label="Filtres">
      <input aria-label="Rechercher un paiement ou une créance" className="h-11 rounded-md border px-3" placeholder="Facture, client, référence" value={query} onChange={(event) => setQuery(event.target.value)} />
      <input aria-label="Paiements ou échéances depuis" type="date" className="h-11 rounded-md border px-3" value={from} onChange={(event) => setFrom(event.target.value)} />
      <input aria-label="Paiements ou échéances avant" type="date" className="h-11 rounded-md border px-3" value={to} onChange={(event) => setTo(event.target.value)} />
      <select aria-label="Filtrer par client" className="h-11 rounded-md border px-3" value={clientId} onChange={(event) => setClientId(event.target.value)}><option value="">Tous clients</option>{clients.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select>
      {view === 'PAYMENTS' ? <><select aria-label="Filtrer par mode" className="h-11 rounded-md border px-3" value={method} onChange={(event) => setMethod(event.target.value)}><option value="">Tous modes</option>{PAYMENT_METHODS.map((item) => <option key={item} value={item}>{PAYMENT_METHOD_LABELS[item]}</option>)}</select><select aria-label="Filtrer par statut de paiement" className="h-11 rounded-md border px-3" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Tous statuts</option>{PAYMENT_STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}</select><select aria-label="Filtrer par facture" className="h-11 rounded-md border px-3" value={invoiceId} onChange={(event) => setInvoiceId(event.target.value)}><option value="">Toutes factures</option>{invoices.map(([id, number]) => <option key={id} value={id}>{number}</option>)}</select></> : <><select aria-label="Filtrer les créances par échéance" className="h-11 rounded-md border px-3" value={due} onChange={(event) => setDue(event.target.value)}><option value="">Toutes créances</option><option value="OVERDUE">Échues</option><option value="UPCOMING">Non échues</option></select><select aria-label="Trier les créances" className="h-11 rounded-md border px-3" value={sort} onChange={(event) => setSort(event.target.value as 'DUE_DATE' | 'BALANCE_DESC')}><option value="DUE_DATE">Échéance</option><option value="BALANCE_DESC">Solde décroissant</option></select></>}
    </section>
    {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-red-800">{error}</p>}
    {view === 'PAYMENTS' ? <section aria-label="Liste des paiements"><div className="mb-3 flex flex-wrap justify-between gap-2"><p role="status">{items.length} paiement(s)</p><strong>Total actif filtré : {formatMinor(filteredActive, currency, scale)}</strong></div>{loading ? <p>Chargement…</p> : items.length === 0 ? <p className="rounded-xl border border-dashed p-8 text-center">Aucun paiement ne correspond aux critères.</p> : <div className="grid gap-3 md:grid-cols-2">{items.map(({ payment, invoiceNumber, clientName }) => <article key={payment.id} className={`rounded-xl border p-4 ${payment.status === 'REVERSED' ? 'bg-slate-100 text-slate-600' : 'bg-card text-card-foreground'}`}><div className="flex justify-between gap-2"><Link className="font-semibold text-blue-700" href={`/invoices/${payment.invoiceId}`}>{invoiceNumber}</Link><span>{payment.status}</span></div><p>{clientName}</p><strong>{formatMinor(payment.amountMinor, payment.currency, payment.currencyScale)}</strong><p className="text-sm">{payment.paymentDate} · {PAYMENT_METHOD_LABELS[payment.method]}</p>{payment.reference && <p className="text-sm">Référence : {payment.reference}</p>}{payment.reversalReason && <p className="text-sm">Motif : {payment.reversalReason}</p>}</article>)}</div>}</section>
      : <section aria-label="Liste des créances"><p role="status" className="mb-3">{receivables.length} créance(s)</p>{receivables.length === 0 ? <p className="rounded-xl border border-dashed p-8 text-center">Aucune créance ne correspond aux critères.</p> : <div className="grid gap-3 md:grid-cols-2">{receivables.map(({ invoice, clientName, daysOverdue }) => <article key={invoice.id} className="rounded-xl border bg-card text-card-foreground p-4"><div className="flex justify-between gap-2"><Link className="font-semibold text-blue-700" href={`/invoices/${invoice.id}`}>{invoice.number}</Link><span>{invoice.status}</span></div><p>{clientName}</p><p className="text-sm">Émission : {invoice.issueDate} · Échéance : {invoice.dueDate || 'Non renseignée'}</p>{daysOverdue > 0 && <p className="font-semibold text-red-700">Échue depuis {daysOverdue} jour(s)</p>}<dl className="mt-2 grid grid-cols-3 gap-2 text-sm"><div><dt>Total</dt><dd>{formatMinor(invoice.grandTotalMinor, invoice.currency, invoice.currencyScale)}</dd></div><div><dt>Payé</dt><dd>{formatMinor(invoice.paidTotalMinor, invoice.currency, invoice.currencyScale)}</dd></div><div><dt>Solde</dt><dd className="font-semibold">{formatMinor(invoice.balanceMinor, invoice.currency, invoice.currencyScale)}</dd></div></dl></article>)}</div>}</section>}
  </main>;
}
