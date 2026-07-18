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
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-8">
      <Link href="/invoices" className="text-blue-700">← Factures</Link>

      {/* Barre d'actions */}
      <header className={`rounded-xl border bg-white p-5 ${invoice.status === 'ANNULEE' ? 'border-red-400' : ''}`}>
        <div className="flex flex-wrap justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">Aperçu de la facture</h1>
            <p className="text-sm text-slate-500">Statut: <strong className={invoice.status === 'ANNULEE' ? 'text-red-700' : 'text-slate-700'}>{invoice.status}</strong></p>
          </div>
          <div className="flex flex-wrap gap-2">
            {invoice.status === 'BROUILLON' && (
              <>
                <Link href={`/invoices/${id}/edit`} className="rounded-md border px-4 py-2 hover:bg-slate-50">Modifier</Link>
                <button disabled={pending} onClick={async () => { if (!confirm('Émettre définitivement cette facture ?')) return; setPending(true); try { const result = await manage.issue(id); setValue(result); } catch (caught) { setError(caught instanceof Error ? caught.message : 'Émission impossible'); } finally { setPending(false); } }} className="rounded-md bg-emerald-700 px-4 py-2 text-white hover:bg-emerald-800">Émettre</button>
              </>
            )}
            <button disabled={pending} onClick={() => void pdf('DOWNLOAD')} className="rounded-md border px-4 py-2 hover:bg-slate-50">Télécharger PDF</button>
            <button disabled={pending} onClick={() => void pdf('SHARE')} className="rounded-md border px-4 py-2 hover:bg-slate-50">Partager</button>
          </div>
        </div>
        {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
      </header>

      {/* Aperçu type A4 */}
      <main className="bg-white shadow-xl w-full min-h-[1056px] mx-auto p-8 sm:p-12 md:p-16 text-sm text-slate-800 font-sans relative">
        {invoice.status === 'ANNULEE' && (
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-15deg] border-4 border-red-500 text-red-500 text-6xl font-bold p-4 opacity-20 pointer-events-none">
            ANNULÉE
          </div>
        )}

        <div className="flex justify-between items-start mb-16">
          <div className="flex flex-col">
            {invoice.companySnapshot.logoDataUri ? (
              <img src={invoice.companySnapshot.logoDataUri} alt="Logo" className="w-24 object-contain mb-4" />
            ) : (
              <div className="h-20" />
            )}
            <h2 className="font-bold text-base uppercase tracking-wider text-slate-900">
              {invoice.companySnapshot.displayName || 'ENTREPRISE'}
            </h2>
          </div>
          <div className="text-right">
            <h1 className="text-4xl mb-4" style={{ color: '#2b7fb9' }}>Facture</h1>
            <p className="font-bold text-sm text-slate-900 mb-6">
              {invoice.status === 'BROUILLON' ? 'BROUILLON' : `# ${invoice.number || ''}`}
            </p>
            <p className="font-bold text-slate-900 mb-1">Solde dû</p>
            <p className="text-lg font-bold text-slate-900">
              {invoice.currency} {formatMinor(invoice.balanceMinor, invoice.currency, invoice.currencyScale, { noCurrency: true })}
            </p>
          </div>
        </div>

        <div className="flex justify-between items-end mb-8">
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wide text-slate-900">
              {invoice.clientSnapshot.displayName || value.clientName}
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-right text-sm">
            <span className="text-slate-500">Date de facture :</span>
            <span className="text-slate-900">
              {invoice.issueDate ? new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(invoice.issueDate)) : 'Non émise'}
            </span>
            <span className="text-slate-500">Conditions :</span>
            <span className="text-slate-900">{invoice.terms || 'Payable à réception'}</span>
          </div>
        </div>

        <div className="overflow-x-auto mb-8">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr style={{ backgroundColor: '#2b7fb9' }} className="text-white">
                <th className="py-2 px-3 font-normal w-12 text-center">#</th>
                <th className="py-2 px-3 font-normal">Description</th>
                <th className="py-2 px-3 font-normal text-right">Quantité</th>
                <th className="py-2 px-3 font-normal text-right">Taux</th>
                <th className="py-2 px-3 font-normal text-right">Remise</th>
                <th className="py-2 px-3 font-normal text-right">Montant</th>
              </tr>
            </thead>
            <tbody>
              {lines.length === 0 ? (
                <tr><td colSpan={6} className="p-4 text-center text-slate-500 border-b">Aucune ligne.</td></tr>
              ) : (
                lines.map((line, idx) => (
                  <tr key={line.id} className="border-b border-slate-200">
                    <td className="py-3 px-3 text-center">{idx + 1}</td>
                    <td className="py-3 px-3 whitespace-pre-wrap">{line.designationSnapshot}</td>
                    <td className="py-3 px-3 text-right">
                      {formatQuantity(line.quantityScaled, line.quantityScale)}
                      {line.unitLabelSnapshot && <div className="text-xs text-slate-500">{line.unitLabelSnapshot}</div>}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {formatMinor(line.unitPriceMinor, invoice.currency, invoice.currencyScale, { noCurrency: true })}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {line.discountMinor > 0 ? formatMinor(line.discountMinor, invoice.currency, invoice.currencyScale, { noCurrency: true }) : ''}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {formatMinor(line.lineTotalMinor, invoice.currency, invoice.currencyScale, { noCurrency: true })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end mb-16">
          <div className="w-64">
            <div className="flex justify-between py-1 px-3">
              <span className="text-slate-900">Sous-total</span>
              <span className="text-slate-900">{formatMinor(invoice.subtotalMinor, invoice.currency, invoice.currencyScale, { noCurrency: true })}</span>
            </div>
            <div className="flex justify-between py-1 px-3 font-bold">
              <span className="text-slate-900">Total</span>
              <span className="text-slate-900">{invoice.currency}{formatMinor(invoice.grandTotalMinor, invoice.currency, invoice.currencyScale, { noCurrency: true })}</span>
            </div>
            <div className="flex justify-between py-2 px-3 font-bold mt-2" style={{ backgroundColor: '#f4f8fb' }}>
              <span className="text-slate-900">Solde dû</span>
              <span className="text-slate-900">{invoice.currency}{formatMinor(invoice.balanceMinor, invoice.currency, invoice.currencyScale, { noCurrency: true })}</span>
            </div>
          </div>
        </div>

        <footer className="mt-16">
          <p className="text-slate-500 mb-6">Merci de votre confiance.</p>
          {invoice.companySnapshot.managerSignatureDataUri && (
            <img src={invoice.companySnapshot.managerSignatureDataUri} alt="Signature" className="w-32 h-32 object-contain mb-2" />
          )}
          {(invoice.companySnapshot.managerName || invoice.companySnapshot.managerSignatureDataUri) && (
            <div className={!invoice.companySnapshot.managerSignatureDataUri ? 'mt-20' : ''}>
              {invoice.companySnapshot.managerName && <p className="font-bold text-slate-900">{invoice.companySnapshot.managerName}</p>}
              <p className="text-slate-500">Le Gérant</p>
            </div>
          )}
        </footer>
      </main>

      <PaymentPanel value={value} onInvoiceChanged={refresh} />
      
      {invoice.status === 'EMISE' && (
        <section className="rounded-xl border border-red-200 bg-white p-5">
          <h2 className="font-semibold text-red-700">Annuler la facture</h2>
          <p className="text-sm text-slate-600 mt-1">Le numéro et les lignes seront conservés. Aucun paiement ne doit exister.</p>
          <textarea aria-label="Motif d’annulation" placeholder="Motif de l'annulation..." className="mt-3 w-full rounded-md border p-3 text-sm" value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} />
          <button disabled={pending} className="mt-3 h-10 rounded-md bg-red-700 px-4 text-white text-sm font-medium hover:bg-red-800" onClick={async () => { if (!confirm('Confirmer l’annulation définitive de cette facture ?')) return; setPending(true); try { const result = await manage.cancel(id, cancelReason); setValue(result); } catch (caught) { setError(caught instanceof Error ? caught.message : 'Annulation impossible'); } finally { setPending(false); } }}>Confirmer l’annulation</button>
        </section>
      )}
    </div>
  );
}
