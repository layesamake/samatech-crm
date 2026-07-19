'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ManageCommercialDocumentsUseCase } from '../application/manage-commercial-documents';
import { CommercialDocumentAggregate } from '../domain/commercial-document';
import { formatMinor, formatQuantity } from '@/modules/invoices/domain/invoice';
import { generateCommercialDocumentPdf, shareOrDownloadPdf, safePdfFilename } from '../pdf/commercial-document-pdf';
import { Download, Share2, Edit2, Copy, FileText, CheckCircle, XCircle, ArrowRight, Ban } from 'lucide-react';

const manage = new ManageCommercialDocumentsUseCase();

export default function CommercialDocumentDetail({ documentId }: { documentId: string }) {
  const router = useRouter();
  const [data, setData] = useState<CommercialDocumentAggregate | null>(null);
  const [error, setError] = useState('');
  const [actionPending, setActionPending] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const load = () => manage.get(documentId).then(setData).catch(e => setError(e.message));
  useEffect(() => { load(); }, [documentId]);

  if (error) return <div className="p-6 text-red-600">Erreur: {error}</div>;
  if (!data) return <div className="p-6">Chargement...</div>;

  const doc = data.document;
  const isDraft = doc.status === 'DRAFT';
  const isIssued = doc.status === 'ISSUED';
  const isDelivery = doc.type === 'DELIVERY_NOTE';

  const typeLabel = (t: string) => {
    if (t === 'QUOTE') return 'Devis';
    if (t === 'PROFORMA') return 'Proforma';
    if (t === 'DELIVERY_NOTE') return 'Bon de livraison';
    if (t === 'LEGACY_ESTIMATE') return 'Ancien Devis';
    return t;
  };

  const handleAction = async (action: () => Promise<any>) => {
    setActionPending(true);
    try {
      await action();
      await load();
    } catch (e: Record<string, unknown>) {
      alert(e.message);
    } finally {
      setActionPending(false);
    }
  };

  const handleDuplicate = async (newType?: 'QUOTE' | 'PROFORMA' | 'DELIVERY_NOTE') => {
    handleAction(async () => {
      const newId = await manage.duplicateAsDraft(doc.id, newType);
      router.push(`/commercial-documents/${newId}/edit`);
    });
  };

  const pdfAction = async (share: boolean) => {
    setActionPending(true);
    try {
      const bytes = await generateCommercialDocumentPdf(data);
      await shareOrDownloadPdf(bytes, safePdfFilename(data));
    } catch (e: Record<string, unknown>) {
      alert("Erreur PDF: " + e.message);
    } finally {
      setActionPending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            {typeLabel(doc.type)} {doc.number || 'Brouillon'}
            <span className="text-sm px-2 py-1 rounded-full bg-secondary text-secondary-foreground">
              {doc.status}
            </span>
          </h1>
          <p className="text-muted-foreground">{data.clientName}</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {isDraft && (
            <>
              <Link href={`/commercial-documents/${doc.id}/edit`} className="inline-flex items-center gap-2 rounded-md border bg-card px-4 py-2 text-sm font-medium hover:bg-accent">
                <Edit2 className="w-4 h-4" /> Modifier
              </Link>
              <button disabled={actionPending} onClick={() => handleAction(() => manage.issue(doc.id))} className="inline-flex items-center gap-2 rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800">
                <CheckCircle className="w-4 h-4" /> Émettre
              </button>
            </>
          )}

          {!isDraft && (
            <>
              <button disabled={actionPending} onClick={() => pdfAction(false)} className="inline-flex items-center gap-2 rounded-md border bg-card px-4 py-2 text-sm font-medium hover:bg-accent">
                <Download className="w-4 h-4" /> Télécharger
              </button>
              <button disabled={actionPending} onClick={() => pdfAction(true)} className="inline-flex items-center gap-2 rounded-md border bg-card px-4 py-2 text-sm font-medium hover:bg-accent">
                <Share2 className="w-4 h-4" /> Partager
              </button>
            </>
          )}

          {isIssued && doc.type !== 'DELIVERY_NOTE' && (
            <>
              <button disabled={actionPending} onClick={() => handleAction(() => manage.changeStatus(doc.id, 'ACCEPTED'))} className="inline-flex items-center gap-2 rounded-md bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800">
                <CheckCircle className="w-4 h-4" /> Marquer Accepté
              </button>
              <button disabled={actionPending} onClick={() => handleAction(() => manage.changeStatus(doc.id, 'REJECTED'))} className="inline-flex items-center gap-2 rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800">
                <XCircle className="w-4 h-4" /> Marquer Refusé
              </button>
            </>
          )}

          {isIssued && doc.type === 'DELIVERY_NOTE' && (
            <button disabled={actionPending} onClick={() => handleAction(() => manage.changeStatus(doc.id, 'DELIVERED'))} className="inline-flex items-center gap-2 rounded-md bg-purple-700 px-4 py-2 text-sm font-medium text-white hover:bg-purple-800">
              <CheckCircle className="w-4 h-4" /> Marquer Livré
            </button>
          )}

          <div className="relative group">
            <button className="inline-flex items-center gap-2 rounded-md border bg-card px-4 py-2 text-sm font-medium hover:bg-accent">
              <Copy className="w-4 h-4" /> Dupliquer...
            </button>
            <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-card ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <div className="py-1">
                <button onClick={() => handleDuplicate('QUOTE')} className="block w-full text-left px-4 py-2 text-sm hover:bg-accent">En Devis brouillon</button>
                <button onClick={() => handleDuplicate('PROFORMA')} className="block w-full text-left px-4 py-2 text-sm hover:bg-accent">En Proforma brouillon</button>
                <button onClick={() => handleDuplicate('DELIVERY_NOTE')} className="block w-full text-left px-4 py-2 text-sm hover:bg-accent">En BL brouillon</button>
              </div>
            </div>
          </div>
          
          {(doc.status === 'ISSUED' || doc.status === 'ACCEPTED') && (
            <button disabled={actionPending} onClick={() => {
              const reason = prompt("Raison de l'annulation :");
              if (reason) handleAction(() => manage.cancel(doc.id, reason));
            }} className="inline-flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
              <Ban className="w-4 h-4" /> Annuler
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Description</th>
                    <th className="px-4 py-3 font-medium text-right">Qté</th>
                    {!isDelivery && (
                      <>
                        <th className="px-4 py-3 font-medium text-right">Prix unit.</th>
                        <th className="px-4 py-3 font-medium text-right">Total</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.lines.map((line) => (
                    <tr key={line.id} className="group hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <p className="font-medium">{line.designationSnapshot}</p>
                        {line.descriptionSnapshot && <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{line.descriptionSnapshot}</p>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {formatQuantity(line.quantityScaled, line.quantityScale)} {line.unitLabelSnapshot || ''}
                      </td>
                      {!isDelivery && (
                        <>
                          <td className="px-4 py-3 text-right text-muted-foreground whitespace-nowrap">
                            {formatMinor(line.unitPriceMinor ?? 0, doc.currency, doc.currencyScale)}
                          </td>
                          <td className="px-4 py-3 text-right font-medium whitespace-nowrap">
                            {formatMinor(line.lineTotalMinor ?? 0, doc.currency, doc.currencyScale)}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!isDelivery && (
              <div className="border-t bg-muted/20 p-4">
                <div className="ml-auto w-full max-w-sm space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sous-total</span>
                    <span>{formatMinor(doc.subtotalMinor ?? 0, doc.currency, doc.currencyScale)}</span>
                  </div>
                  {doc.discountTotalMinor! > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Remise</span>
                      <span>-{formatMinor(doc.discountTotalMinor!, doc.currency, doc.currencyScale)}</span>
                    </div>
                  )}
                  {doc.taxTotalMinor! > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Taxes</span>
                      <span>{formatMinor(doc.taxTotalMinor!, doc.currency, doc.currencyScale)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-2 text-base font-bold">
                    <span>Total</span>
                    <span>{formatMinor(doc.grandTotalMinor ?? 0, doc.currency, doc.currencyScale)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {(doc.notes || doc.terms) && (
            <div className="rounded-xl border bg-card p-6 space-y-4">
              {doc.notes && (
                <div>
                  <h3 className="font-semibold text-sm mb-2 text-muted-foreground">Notes</h3>
                  <p className="text-sm whitespace-pre-wrap">{doc.notes}</p>
                </div>
              )}
              {doc.terms && (
                <div>
                  <h3 className="font-semibold text-sm mb-2 text-muted-foreground">Conditions</h3>
                  <p className="text-sm whitespace-pre-wrap">{doc.terms}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border bg-card p-6 space-y-4">
            <h3 className="font-semibold border-b pb-2">Détails du document</h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground block text-xs">Date d'émission</span>
                {doc.issueDate ? new Date(doc.issueDate).toLocaleDateString('fr-FR') : 'Non définie'}
              </div>
              {doc.validUntil && (
                <div>
                  <span className="text-muted-foreground block text-xs">Valable jusqu'au</span>
                  {new Date(doc.validUntil).toLocaleDateString('fr-FR')}
                </div>
              )}
              {doc.deliveryDate && (
                <div>
                  <span className="text-muted-foreground block text-xs">Date de livraison</span>
                  {new Date(doc.deliveryDate).toLocaleDateString('fr-FR')}
                </div>
              )}
              {doc.customerReference && (
                <div>
                  <span className="text-muted-foreground block text-xs">Référence client</span>
                  {doc.customerReference}
                </div>
              )}
            </div>
          </div>

          {doc.statusReason && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 space-y-2 dark:border-red-900/50 dark:bg-red-900/20">
              <h3 className="font-semibold text-red-800 dark:text-red-300 text-sm">Raison de l'annulation</h3>
              <p className="text-sm text-red-700 dark:text-red-400">{doc.statusReason}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
