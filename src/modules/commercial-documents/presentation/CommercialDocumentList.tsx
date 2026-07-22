'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ManageCommercialDocumentsUseCase } from '../application/manage-commercial-documents';
import { CommercialDocumentAggregate, CommercialDocumentRecord } from '../domain/commercial-document';
import { formatMinor } from '@/modules/invoices/domain/invoice';
import { Plus, Filter, X, FileText } from 'lucide-react';

const manage = new ManageCommercialDocumentsUseCase();

export default function CommercialDocumentList() {
  const [documents, setDocuments] = useState<CommercialDocumentAggregate[]>([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);

  const hasActiveFilters = Boolean(query || statusFilter || typeFilter);

  useEffect(() => {
    let active = true;
    const fetchDocs = async () => {
      setLoading(true);
      try {
        const docs = await manage.list({
          query,
          status: (statusFilter || undefined) as CommercialDocumentRecord['status'] | undefined,
          type: (typeFilter || undefined) as CommercialDocumentRecord['type'] | undefined,
        });
        if (active) setDocuments(docs);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchDocs();
    return () => {
      active = false;
    };
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
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      case 'ISSUED':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
      case 'ACCEPTED':
        return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
      case 'DELIVERED':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300';
      case 'CONVERTED':
        return 'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 line-through';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const clearFilters = () => {
    setQuery('');
    setStatusFilter('');
    setTypeFilter('');
  };

  return (
    <div className="relative space-y-5 pb-24">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Documents commerciaux</h1>

        {/* Filter toggle */}
        <button
          type="button"
          onClick={() => setFiltersOpen((prev) => !prev)}
          aria-label={filtersOpen ? 'Fermer les filtres' : 'Ouvrir les filtres'}
          aria-expanded={filtersOpen}
          className="relative flex h-11 w-11 items-center justify-center rounded-full border bg-card text-card-foreground transition-colors hover:bg-muted"
        >
          {filtersOpen ? <X className="h-5 w-5" /> : <Filter className="h-5 w-5" />}
          {hasActiveFilters && !filtersOpen && (
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-blue-600" />
          )}
        </button>
      </div>

      {/* ── Collapsible filters ── */}
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
          filtersOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <section
            className="space-y-3 rounded-xl border bg-card p-4"
            aria-label="Filtres de documents"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-muted-foreground">Filtres</span>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                >
                  Réinitialiser
                </button>
              )}
            </div>

            <input
              type="text"
              aria-label="Rechercher un document"
              placeholder="Rechercher (numéro, client)..."
              className="h-11 w-full rounded-md border bg-transparent px-3"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />

            <div className="grid gap-2 sm:grid-cols-2">
              <select
                aria-label="Filtrer par type"
                className="h-11 rounded-md border bg-transparent px-3"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="">Tous les types</option>
                <option value="QUOTE">Devis</option>
                <option value="PROFORMA">Proforma</option>
                <option value="DELIVERY_NOTE">Bon de livraison</option>
              </select>
              <select
                aria-label="Filtrer par statut"
                className="h-11 rounded-md border bg-transparent px-3"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
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
          </section>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="rounded-xl border bg-card">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Chargement...</div>
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-lg font-medium">Aucun document trouvé</p>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Vous n&apos;avez pas encore créé de devis, facture proforma ou bon de livraison.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {documents.map((doc) => (
              <Link
                key={doc.document.id}
                href={`/commercial-documents/${doc.document.id}`}
                className="flex flex-col justify-between gap-4 p-4 transition-colors hover:bg-muted/50 sm:flex-row sm:items-center"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">
                      {doc.document.number || 'Brouillon'}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(doc.document.status)}`}
                    >
                      {doc.document.status}
                    </span>
                    <span className="rounded-full border bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      {typeLabel(doc.document.type)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{doc.clientName}</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="font-semibold text-foreground">
                    {doc.document.type === 'DELIVERY_NOTE'
                      ? '-'
                      : formatMinor(
                          doc.document.grandTotalMinor ?? 0,
                          doc.document.currency,
                          doc.document.currencyScale,
                        )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {doc.document.issueDate
                      ? new Date(doc.document.issueDate).toLocaleDateString('fr-FR')
                      : new Date(doc.document.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ── FAB with document type menu ── */}
      {fabOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setFabOpen(false)}
          onKeyDown={(e) => e.key === 'Escape' && setFabOpen(false)}
          role="presentation"
        />
      )}

      <div className="fixed bottom-20 right-5 z-50 flex flex-col items-end gap-2 md:bottom-8 md:right-8">
        {/* Mini FABs */}
        <div
          className={`flex flex-col items-end gap-2 transition-all duration-200 ${
            fabOpen ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
          }`}
        >
          <Link
            href="/commercial-documents/create?type=DELIVERY_NOTE"
            className="flex items-center gap-2 rounded-full bg-card py-2 pl-4 pr-3 text-sm font-medium shadow-lg border transition-colors hover:bg-muted"
            onClick={() => setFabOpen(false)}
          >
            Bon de livraison
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-600 text-white">
              <FileText className="h-4 w-4" />
            </span>
          </Link>
          <Link
            href="/commercial-documents/create?type=PROFORMA"
            className="flex items-center gap-2 rounded-full bg-card py-2 pl-4 pr-3 text-sm font-medium shadow-lg border transition-colors hover:bg-muted"
            onClick={() => setFabOpen(false)}
          >
            Proforma
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-600 text-white">
              <FileText className="h-4 w-4" />
            </span>
          </Link>
          <Link
            href="/commercial-documents/create?type=QUOTE"
            className="flex items-center gap-2 rounded-full bg-card py-2 pl-4 pr-3 text-sm font-medium shadow-lg border transition-colors hover:bg-muted"
            onClick={() => setFabOpen(false)}
          >
            Devis
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white">
              <FileText className="h-4 w-4" />
            </span>
          </Link>
        </div>

        {/* Main FAB */}
        <button
          type="button"
          onClick={() => setFabOpen((prev) => !prev)}
          aria-label={fabOpen ? 'Fermer le menu' : 'Nouveau document'}
          className={`flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30 transition-transform duration-200 hover:scale-110 active:scale-95 ${
            fabOpen ? 'rotate-45' : ''
          }`}
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}
