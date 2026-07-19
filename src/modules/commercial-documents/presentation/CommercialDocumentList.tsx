'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ManageCommercialDocumentsUseCase } from '../application/manage-commercial-documents';
import { CommercialDocumentAggregate } from '../domain/commercial-document';
import { formatMinor } from '@/modules/invoices/domain/invoice';
import { Plus, Search, FileText } from 'lucide-react';

const manage = new ManageCommercialDocumentsUseCase();

export default function CommercialDocumentList() {
  const [documents, setDocuments] = useState<CommercialDocumentAggregate[]>([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchDocs = async () => {
      setLoading(true);
      try {
        const docs = await manage.list({ 
          query, 
          status: (statusFilter || undefined) as Parameters<typeof manage.list>[0]['status'], 
          type: (typeFilter || undefined) as Parameters<typeof manage.list>[0]['type']
        });
        if (active) setDocuments(docs);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchDocs();
    return () => { active = false; };
  }, [query, statusFilter, typeFilter]);

  const typeLabel = (t: string) => {
    if (t === 'QUOTE') return 'Devis';
    if (t === 'PROFORMA') return 'Proforma';
    if (t === 'DELIVERY_NOTE') return 'BL';
    if (t === 'LEGACY_ESTIMATE') return 'Ancien Devis';
    return t;
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      case 'ISSUED': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
      case 'ACCEPTED': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
      case 'REJECTED': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
      case 'DELIVERED': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300';
      case 'CONVERTED': return 'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300';
      case 'CANCELLED': return 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 line-through';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Documents commerciaux</h1>
        <div className="flex gap-2">
          <Link href="/commercial-documents/create?type=QUOTE" className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800">
            <Plus className="h-4 w-4" /> Devis
          </Link>
          <Link href="/commercial-documents/create?type=PROFORMA" className="inline-flex items-center justify-center gap-2 rounded-md border bg-card px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
            Proforma
          </Link>
          <Link href="/commercial-documents/create?type=DELIVERY_NOTE" className="inline-flex items-center justify-center gap-2 rounded-md border bg-card px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
            Bon de livraison
          </Link>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher (numéro, client)..."
            className="h-10 w-full rounded-md border pl-9 pr-3"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select className="h-10 rounded-md border px-3" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">Tous les types</option>
          <option value="QUOTE">Devis</option>
          <option value="PROFORMA">Proforma</option>
          <option value="DELIVERY_NOTE">Bon de livraison</option>
        </select>
        <select className="h-10 rounded-md border px-3" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Tous les statuts</option>
          <option value="DRAFT">Brouillon</option>
          <option value="ISSUED">Émis</option>
          <option value="ACCEPTED">Accepté</option>
          <option value="REJECTED">Refusé</option>
          <option value="DELIVERED">Livré</option>
          <option value="CONVERTED">Converti</option>
          <option value="CANCELLED">Annulé</option>
        </select>
      </div>

      <div className="rounded-xl border bg-card">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Chargement...</div>
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium">Aucun document trouvé</p>
            <p className="text-sm text-muted-foreground max-w-sm mt-2">
              Vous n&apos;avez pas encore créé de devis, facture proforma ou bon de livraison.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {documents.map((doc) => (
              <Link key={doc.document.id} href={`/commercial-documents/${doc.document.id}`} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-muted/50 transition-colors gap-4">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{doc.document.number || 'Brouillon'}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(doc.document.status)}`}>
                      {doc.document.status}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium border bg-background text-muted-foreground">
                      {typeLabel(doc.document.type)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{doc.clientName}</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="font-semibold text-foreground">
                    {doc.document.type === 'DELIVERY_NOTE' ? '-' : formatMinor(doc.document.grandTotalMinor ?? 0, doc.document.currency, doc.document.currencyScale)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {doc.document.issueDate ? new Date(doc.document.issueDate).toLocaleDateString('fr-FR') : new Date(doc.document.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
