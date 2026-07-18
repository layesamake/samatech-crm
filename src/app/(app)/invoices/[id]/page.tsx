/* eslint-disable @next/next/no-img-element */
'use client';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ManageInvoicesUseCase } from '@/modules/invoices/application/manage-invoices';
import { formatMinor, formatQuantity, InvoiceAggregate } from '@/modules/invoices/domain/invoice';
import { downloadPdf, generateInvoicePdf, safePdfFilename, shareOrDownloadPdf } from '@/modules/invoices/pdf/invoice-pdf';
import { PaymentPanel } from '@/modules/payments/presentation/PaymentPanel';
const manage = new ManageInvoicesUseCase();
export default function InvoiceDetailPage() { const { id } = useParams<{ id: string }>(); const [value, setValue] = useState<InvoiceAggregate | null>(); const [error, setError] = useState(''); const [cancelReason, setCancelReason] = useState(''); const [pending, setPending] = useState(false); const refresh = useCallback(() => manage.get(id).then(setValue), [id]); useEffect(() => { void manage.get(id).then(setValue).catch((caught: unknown) => setError(caught instanceof Error ? caught.message : 'Chargement impossible')); }, [id]);
  if (value === undefined) return <p className="p-4">Chargement...</p>; if (value === null) return <p className="p-4">Facture introuvable.</p>; const { invoice, lines } = value; const pdf = async (mode: 'DOWNLOAD' | 'SHARE') => { setPending(true); setError(''); try { const bytes = await generateInvoicePdf(value); const filename = safePdfFilename(invoice.number, invoice.status); if (mode === 'DOWNLOAD') downloadPdf(bytes, filename); else await shareOrDownloadPdf(bytes, filename); } catch (caught) { setError(caught instanceof Error ? caught.message : 'Génération PDF impossible'); } finally { setPending(false); } };
  return <main className="mx-auto max-w-4xl space-y-5 p-4 md:p-8"><Link href="/invoices" className="text-blue-700">← Factures</Link><header className={`rounded-xl border bg-white p-5 ${invoice.status === 'ANNULEE' ? 'border-red-400' : ''}`}><div className="flex flex-wrap justify-between gap-3"><div><h1 className="text-2xl font-bold">{invoice.number || 'Brouillon sans numéro'}</h1><p>{value.clientName} · {invoice.issueDate || 'Non émise'}</p></div><strong className={invoice.status === 'ANNULEE' ? 'text-red-700' : ''}>{invoice.status}</strong></div><div className="mt-4 flex flex-wrap gap-2">{invoice.status === 'BROUILLON' && <><Link href={`/invoices/${id}/edit`} className="rounded-md border px-4 py-3">Modifier</Link><button disabled={pending} onClick={async () => { if (!confirm('Émettre définitivement cette facture et consommer le prochain numéro ?')) return; setPending(true); try { const result = await manage.issue(id); setValue(result); } catch (caught) { setError(caught instanceof Error ? caught.message : 'Émission impossible'); } finally { setPending(false); } }} className="rounded-md bg-emerald-700 px-4 py-3 text-white">Émettre la facture</button></>}<button disabled={pending} onClick={() => void pdf('DOWNLOAD')} className="rounded-md border px-4 py-3">Télécharger PDF</button><button disabled={pending} onClick={() => void pdf('SHARE')} className="rounded-md border px-4 py-3">Partager ou télécharger</button></div>{error && <p role="alert" className="mt-3 text-red-700">{error}</p>}</header>
    <section className="grid gap-3 rounded-xl border bg-white p-5 sm:grid-cols-2">
      <div>
        <h2 className="font-semibold">Entreprise</h2>
        {invoice.companySnapshot.logoDataUri && (
           <img src={invoice.companySnapshot.logoDataUri} alt="Logo" className="w-24 h-24 object-contain mb-2" />
        )}
        <p>{invoice.companySnapshot.displayName || 'Figée à l’émission'}</p>
        <p>{invoice.companySnapshot.address}</p>
        <p>{invoice.companySnapshot.phone}</p>
      </div>
      <div>
        <h2 className="font-semibold">Client</h2>
        <p>{invoice.clientSnapshot.displayName || value.clientName}</p>
        <p>{invoice.clientSnapshot.address}</p>
        <p>{invoice.clientSnapshot.phone}</p>
      </div>
    </section>
    <section className="space-y-3"><h2 className="font-semibold">Lignes</h2>{lines.length === 0 ? <p>Aucune ligne.</p> : lines.map((line) => <article key={line.id} className="rounded-xl border bg-white p-4"><strong>{line.designationSnapshot}</strong>{line.descriptionSnapshot && <p>{line.descriptionSnapshot}</p>}<p>{formatQuantity(line.quantityScaled, line.quantityScale)} × {formatMinor(line.unitPriceMinor, invoice.currency, invoice.currencyScale)}</p><p className="text-right font-semibold">{formatMinor(line.lineTotalMinor, invoice.currency, invoice.currencyScale)}</p></article>)}</section>
    <section className="space-y-1 rounded-xl border bg-slate-50 p-5 text-right"><p>Sous-total : {formatMinor(invoice.subtotalMinor, invoice.currency, invoice.currencyScale)}</p><p>Remises : {formatMinor(invoice.discountTotalMinor, invoice.currency, invoice.currencyScale)}</p><p>Taxes : {formatMinor(invoice.taxTotalMinor, invoice.currency, invoice.currencyScale)}</p><strong className="text-xl">Total : {formatMinor(invoice.grandTotalMinor, invoice.currency, invoice.currencyScale)}</strong><p>Payé : {formatMinor(invoice.paidTotalMinor, invoice.currency, invoice.currencyScale)}</p><p>Solde : {formatMinor(invoice.balanceMinor, invoice.currency, invoice.currencyScale)}</p></section>
    
    {(invoice.companySnapshot.managerName || invoice.companySnapshot.managerSignatureDataUri) && (
       <section className="rounded-xl border bg-white p-5 flex flex-col items-end text-right">
         <p className="text-sm font-medium mb-2">Pour l&apos;entreprise :</p>
         {invoice.companySnapshot.managerSignatureDataUri && (
           <img src={invoice.companySnapshot.managerSignatureDataUri} alt="Signature" className="w-32 h-16 object-contain mb-1" />
         )}
         {invoice.companySnapshot.managerName && (
           <p className="font-semibold">{invoice.companySnapshot.managerName}</p>
         )}
       </section>
    )}
    
    <PaymentPanel value={value} onInvoiceChanged={refresh} />{invoice.notes && <section className="rounded-xl border p-4"><h2 className="font-semibold">Notes</h2><p className="whitespace-pre-wrap">{invoice.notes}</p></section>}{invoice.terms && <section className="rounded-xl border p-4"><h2 className="font-semibold">Conditions</h2><p className="whitespace-pre-wrap">{invoice.terms}</p></section>}
    {value.timelineEvents && value.timelineEvents.length > 0 && <section className="rounded-xl border bg-white p-4"><h2 className="font-semibold">Chronologie de la facture</h2><ol className="mt-3 space-y-2">{value.timelineEvents.map((event) => <li key={event.id} className="border-l-2 pl-3"><strong>{event.title}</strong><p className="text-sm text-slate-600">{event.summary}</p><time className="text-xs text-slate-500">{new Date(event.occurredAt).toLocaleString('fr-FR')}</time></li>)}</ol></section>}
    {invoice.status === 'EMISE' && <section className="rounded-xl border border-red-200 p-4"><h2 className="font-semibold">Annuler la facture</h2><p className="text-sm">Le numéro et les lignes seront conservés. Aucun paiement ne doit exister.</p><textarea aria-label="Motif d’annulation" className="mt-2 w-full rounded-md border p-3" value={cancelReason} onChange={(event) => setCancelReason(event.target.value)}/><button disabled={pending} className="mt-2 h-11 rounded-md bg-red-700 px-4 text-white" onClick={async () => { if (!confirm('Confirmer l’annulation définitive de cette facture ?')) return; setPending(true); try { const result = await manage.cancel(id, cancelReason); setValue(result); } catch (caught) { setError(caught instanceof Error ? caught.message : 'Annulation impossible'); } finally { setPending(false); } }}>Confirmer l’annulation</button></section>}{invoice.status === 'ANNULEE' && <p className="rounded-xl bg-red-50 p-4 text-red-800">ANNULÉE — {invoice.cancellationReason}</p>}</main>;
}
