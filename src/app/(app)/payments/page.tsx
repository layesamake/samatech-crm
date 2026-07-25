'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { formatMinor } from '@/modules/invoices/domain/invoice';
import { ManagePaymentsUseCase } from '@/modules/payments/application/manage-payments';
import { PAYMENT_METHOD_LABELS, PAYMENT_METHODS, PAYMENT_STATUSES, PaymentAggregate, PaymentMethod, PaymentStatus, sumActivePayments } from '@/modules/payments/domain/payment';
import { Download, Filter, Plus, X } from 'lucide-react';

const manage = new ManagePaymentsUseCase();

export default function PaymentsPage() {
  const [items, setItems] = useState<PaymentAggregate[]>([]);
  const [allItems, setAllItems] = useState<PaymentAggregate[]>([]);
  const [query, setQuery] = useState('');
  const [from, setFrom] = useState(''); const [to, setTo] = useState('');
  const [method, setMethod] = useState(''); const [status, setStatus] = useState('');
  const [clientId, setClientId] = useState(''); const [invoiceId, setInvoiceId] = useState('');
  const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const hasActiveFilters = Boolean(query || from || to || method || status || clientId || invoiceId);

  useEffect(() => { void manage.list().then(setAllItems).catch((caught: unknown) => setError(caught instanceof Error ? caught.message : 'Chargement impossible')); }, []);
  useEffect(() => { void manage.list({ query, from: from || undefined, to: to || undefined, method: method ? method as PaymentMethod : undefined, status: status ? status as PaymentStatus : undefined, clientProfileId: clientId || undefined, invoiceId: invoiceId || undefined }).then(setItems).catch((caught: unknown) => setError(caught instanceof Error ? caught.message : 'Chargement impossible')).finally(() => setLoading(false)); }, [query, from, to, method, status, clientId, invoiceId]);

  const clients = useMemo(() => Array.from(new Map(
    allItems.map((item) => [item.payment.clientProfileId, item.clientName] as const)
  ).entries()).sort((a, b) => a[1].localeCompare(b[1], 'fr')), [allItems]);
  const invoices = useMemo(() => Array.from(new Map(allItems.map((item) => [item.payment.invoiceId, item.invoiceNumber])).entries()).sort((a, b) => a[1].localeCompare(b[1], 'fr')), [allItems]);
  const currency = allItems[0]?.payment.currency ?? 'XOF';
  const scale = allItems[0]?.payment.currencyScale ?? 0;
  const filteredActive = sumActivePayments(items.map((item) => item.payment));

  const exportToCsv = () => {
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += "Date;Facture;Client;Statut;Montant;Mode;Reference\n";
    items.forEach(({ payment, invoiceNumber, clientName }) => {
      const amount = payment.amountMinor / (10 ** payment.currencyScale);
      csvContent += `${payment.paymentDate};${invoiceNumber};"${clientName}";${payment.status};${amount};${PAYMENT_METHOD_LABELS[payment.method]};"${payment.reference || ''}"\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `export_paiements_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return <main className="mx-auto max-w-6xl space-y-5 p-4 md:p-8">
    <div className="flex justify-between items-center gap-2">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Paiements</h1>
        <p className="text-muted-foreground">Suivez les encaissements de votre entreprise.</p>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={exportToCsv} className="flex items-center justify-center gap-2 h-11 w-11 md:w-auto rounded-md border bg-card md:px-4 hover:bg-muted bg-background text-foreground" aria-label="Exporter CSV">
          <Download className="w-5 h-5 md:w-4 md:h-4" />
          <span className="hidden md:inline">Exporter CSV</span>
        </button>
        <button 
          type="button"
          className={`relative flex items-center justify-center h-11 w-11 rounded-md border hover:bg-muted transition-colors ${showFilters || hasActiveFilters ? 'bg-primary/10 border-primary text-primary' : 'bg-card'}`}
          onClick={() => setShowFilters(!showFilters)}
          aria-label={showFilters ? "Fermer les filtres" : "Afficher les filtres"}
          title="Filtrer les paiements"
        >
          {showFilters ? <X className="w-5 h-5" /> : <Filter className="w-5 h-5" />}
          {hasActiveFilters && !showFilters && (
            <span className="absolute -right-1 -top-1 flex size-3 rounded-full bg-primary" />
          )}
        </button>
      </div>
    </div>
    {showFilters && (
      <section className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 animate-in slide-in-from-top-2" aria-label="Filtres">
        <input aria-label="Rechercher un paiement" className="h-11 rounded-md border px-3 bg-background text-foreground" placeholder="Facture, client, référence" value={query} onChange={(event) => setQuery(event.target.value)} />
        <input aria-label="Paiements depuis" type="date" className="h-11 rounded-md border px-3 bg-background text-foreground" value={from} onChange={(event) => setFrom(event.target.value)} />
        <input aria-label="Paiements avant" type="date" className="h-11 rounded-md border px-3 bg-background text-foreground" value={to} onChange={(event) => setTo(event.target.value)} />
        <select aria-label="Filtrer par client" className="h-11 rounded-md border px-3 bg-background text-foreground" value={clientId} onChange={(event) => setClientId(event.target.value)}><option value="">Tous clients</option>{clients.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select>
        <select aria-label="Filtrer par mode" className="h-11 rounded-md border px-3 bg-background text-foreground" value={method} onChange={(event) => setMethod(event.target.value)}><option value="">Tous modes</option>{PAYMENT_METHODS.map((item) => <option key={item} value={item}>{PAYMENT_METHOD_LABELS[item]}</option>)}</select>
        <select aria-label="Filtrer par statut de paiement" className="h-11 rounded-md border px-3 bg-background text-foreground" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Tous statuts</option>{PAYMENT_STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}</select>
        <select aria-label="Filtrer par facture" className="h-11 rounded-md border px-3 bg-background text-foreground" value={invoiceId} onChange={(event) => setInvoiceId(event.target.value)}><option value="">Toutes factures</option>{invoices.map(([id, number]) => <option key={id} value={id}>{number}</option>)}</select>
      </section>
    )}
    {error && <p role="alert" className="rounded-md bg-red-500/10 p-3 text-red-800 dark:text-red-200">{error}</p>}
    <section aria-label="Liste des paiements"><div className="mb-3 flex flex-wrap justify-between gap-2"><p role="status">{items.length} paiement(s)</p><strong>Total actif filtré : {formatMinor(filteredActive, currency, scale)}</strong></div>{loading ? <p>Chargement…</p> : items.length === 0 ? <p className="rounded-xl border border-dashed p-8 text-center bg-background text-foreground">Aucun paiement ne correspond aux critères.</p> : <div className="grid gap-3 md:grid-cols-2">{items.map(({ payment, invoiceNumber, clientName }) => <article key={payment.id} className={`rounded-xl border p-4 ${payment.status === 'REVERSED' ? 'bg-muted text-muted-foreground' : 'bg-card text-card-foreground'}`}><div className="flex justify-between gap-2"><Link className="font-semibold text-blue-800 dark:text-blue-200" href={`/invoices/${payment.invoiceId}`}>{invoiceNumber}</Link><span>{payment.status}</span></div><p>{clientName}</p><strong>{formatMinor(payment.amountMinor, payment.currency, payment.currencyScale)}</strong><p className="text-sm">{payment.paymentDate} · {PAYMENT_METHOD_LABELS[payment.method]}</p>{payment.reference && <p className="text-sm">Référence : {payment.reference}</p>}{payment.reversalReason && <p className="text-sm">Motif : {payment.reversalReason}</p>}</article>)}</div>}</section>
    
    <Link
      href="/payments/new"
      aria-label="Ajouter un nouveau paiement"
      className="fixed bottom-24 lg:bottom-12 right-6 lg:right-10 z-40 flex size-14 items-center justify-center rounded-full bg-blue-700 text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
    >
      <Plus className="w-8 h-8" />
    </Link>
  </main>;
}
