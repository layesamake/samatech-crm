'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useDeferredValue, useMemo, memo } from 'react';
import { ManageInvoicesUseCase } from '@/modules/invoices/application/manage-invoices';
import { formatMinor, InvoiceAggregate, INVOICE_STATUSES } from '@/modules/invoices/domain/invoice';
import { ListSkeleton } from '@/components/ui/loading-skeletons';
import { SwipeableActionItem } from '@/components/ui/swipeable-action-item';
import { CreditCard, Eye, Download } from 'lucide-react';

const InvoiceCard = memo(({ invoiceAggr, router }: { invoiceAggr: InvoiceAggregate, router: any }) => {
  const { invoice, clientName } = invoiceAggr;
  return (
    <SwipeableActionItem 
      onSwipeRight={() => router.push(`/payments?invoiceId=${invoice.id}`)}
      leftIcon={CreditCard} leftLabel="Payer" leftBgColor="bg-emerald-600"
      onSwipeLeft={() => router.push(`/invoices/${invoice.id}`)}
      rightIcon={Eye} rightLabel="Détails" rightBgColor="bg-blue-600"
    >
      <div onClick={() => router.push(`/invoices/${invoice.id}`)} className="bg-card text-card-foreground p-4 cursor-pointer border-b last:border-b-0 md:border md:rounded-lg">
        <div className="flex justify-between gap-2">
          <strong>{invoice.number || 'Brouillon sans numéro'}</strong>
          <span className={invoice.status === 'ANNULEE' ? 'text-red-800 dark:text-red-200' : ''}>{invoice.status}</span>
        </div>
        <p>{clientName}</p>
        <p className="text-sm text-muted-foreground">Émission : {invoice.issueDate || 'Non émise'} · Échéance : {invoice.dueDate || 'Non renseignée'}</p>
        <p className="mt-2 font-semibold text-lg">{formatMinor(invoice.grandTotalMinor, invoice.currency, invoice.currencyScale)}</p>
      </div>
    </SwipeableActionItem>
  );
});
InvoiceCard.displayName = 'InvoiceCard';

const manage = new ManageInvoicesUseCase();
export default function InvoicesPage() { 
  const router = useRouter();
  const [items, setItems] = useState<InvoiceAggregate[]>([]); const [query, setQuery] = useState(''); const deferredQuery = useDeferredValue(query); const [status, setStatus] = useState(''); const [from, setFrom] = useState(''); const [to, setTo] = useState(''); const [due, setDue] = useState(''); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [limit, setLimit] = useState(50);
  useEffect(() => { void manage.list({ query: deferredQuery, status: status ? status as InvoiceAggregate['invoice']['status'] : undefined, from: from || undefined, to: to || undefined, due: due ? due as 'OVERDUE' | 'UPCOMING' : undefined }).then((result) => { setItems(result); setError(''); }).catch((caught: unknown) => setError(caught instanceof Error ? caught.message : 'Chargement impossible')).finally(() => setLoading(false)); }, [deferredQuery, status, from, to, due]);
  const paginatedItems = useMemo(() => items.slice(0, limit), [items, limit]);

  const exportToCsv = () => {
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += "Date Emission;Echeance;Facture;Client;Statut;Montant Total;Solde\n";
    items.forEach(({ invoice, clientName }) => {
      const scale = 10 ** invoice.currencyScale;
      csvContent += `${invoice.issueDate || ''};${invoice.dueDate || ''};${invoice.number || 'Brouillon'};"${clientName}";${invoice.status};${invoice.grandTotalMinor / scale};${invoice.balanceMinor / scale}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `export_factures_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return <main className="mx-auto max-w-5xl space-y-5 p-4 md:p-8"><header className="flex flex-col sm:flex-row sm:items-start justify-between gap-4"><div><h1 className="text-2xl font-bold">Factures</h1><p className="text-muted-foreground">Brouillons et factures émises localement.</p></div><div className="flex gap-2"><button onClick={exportToCsv} className="flex items-center gap-2 h-11 rounded-md border bg-card px-4 hover:bg-muted"><Download className="w-4 h-4" />Exporter CSV</button><Link href="/invoices/new" className="flex items-center h-11 rounded-md bg-blue-700 px-4 text-white">Nouvelle facture</Link></div></header><section className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5"><input aria-label="Rechercher une facture" className="h-11 rounded-md border px-3" placeholder="Numéro ou client" value={query} onChange={(event) => setQuery(event.target.value)}/><select aria-label="Filtrer par statut" className="h-11 rounded-md border px-3" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Tous statuts</option>{INVOICE_STATUSES.map((value) => <option key={value} value={value}>{value}</option>)}</select><input aria-label="Factures depuis" type="date" className="h-11 rounded-md border px-3" value={from} onChange={(event) => setFrom(event.target.value)}/><input aria-label="Factures avant" type="date" className="h-11 rounded-md border px-3" value={to} onChange={(event) => setTo(event.target.value)}/><select aria-label="Filtrer par échéance" className="h-11 rounded-md border px-3" value={due} onChange={(event) => setDue(event.target.value)}><option value="">Toutes échéances</option><option value="OVERDUE">En retard</option><option value="UPCOMING">À venir</option></select></section><p role="status" className="text-sm">{items.length} facture(s)</p>{error ? <p role="alert" className="text-red-800 dark:text-red-200">{error}</p> : loading ? <div className="mt-4"><ListSkeleton count={4} /></div> : items.length === 0 ? <p className="rounded-xl border border-dashed p-8 text-center">Aucune facture ne correspond aux critères.</p> : <>
  <section className="grid gap-3 md:grid-cols-2">
    {paginatedItems.map((invoiceAggr) => <InvoiceCard key={invoiceAggr.invoice.id} invoiceAggr={invoiceAggr} router={router} />)}
  </section>
  {items.length > limit && (
    <div className="p-4 flex justify-center">
      <button className="px-6 py-2 bg-muted text-muted-foreground hover:bg-muted/80 rounded-lg text-sm font-medium transition-colors" onClick={() => setLimit(l => l + 50)}>Charger plus</button>
    </div>
  )}
</>}</main>;
}
