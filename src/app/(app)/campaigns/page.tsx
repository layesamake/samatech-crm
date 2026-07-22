'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Filter, Plus, X } from 'lucide-react';
import { ManageCampaignsUseCase } from '@/modules/campaigns/application/manage-campaigns';
import { CAMPAIGN_AUDIENCES, CAMPAIGN_STATUSES, CampaignAudienceType, CampaignStatus } from '@/modules/campaigns/domain/campaign';
import type { CampaignAggregate } from '@/modules/campaigns/infrastructure/dexie-campaign-repository';

const manage = new ManageCampaignsUseCase();

export default function CampaignsPage() {
  const [items, setItems] = useState<CampaignAggregate[]>([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [audience, setAudience] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [sort, setSort] = useState<'RECENT' | 'NAME'>('RECENT');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const hasActiveFilters = Boolean(query || status || audience || from || to || sort !== 'RECENT');

  useEffect(() => {
    void manage
      .list({
        query,
        status: status ? (status as CampaignStatus) : undefined,
        audienceType: audience ? (audience as CampaignAudienceType) : undefined,
        from: from || undefined,
        to: to || undefined,
        sort,
      })
      .then(setItems)
      .catch((caught: unknown) =>
        setError(caught instanceof Error ? caught.message : 'Chargement impossible'),
      )
      .finally(() => setLoading(false));
  }, [query, status, audience, from, to, sort]);

  const clearFilters = () => {
    setQuery('');
    setStatus('');
    setAudience('');
    setFrom('');
    setTo('');
    setSort('RECENT');
  };

  return (
    <main className="relative mx-auto max-w-6xl space-y-5 p-4 pb-24 md:p-8 md:pb-24">
      {/* ── Header ── */}
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Campagnes WhatsApp</h1>
          <p className="text-sm text-muted-foreground">
            Un destinataire à la fois, confirmation manuelle.
          </p>
        </div>

        {/* Filter toggle button */}
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
      </header>

      {/* ── Collapsible filters panel ── */}
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
          filtersOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <section
            className="space-y-3 rounded-xl border bg-card p-4"
            aria-label="Filtres de campagnes"
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
              aria-label="Rechercher une campagne"
              className="h-11 w-full rounded-md border bg-transparent px-3"
              placeholder="Nom ou objectif"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />

            <div className="grid gap-2 sm:grid-cols-2">
              <select
                aria-label="Filtrer par statut de campagne"
                className="h-11 rounded-md border bg-transparent px-3"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                <option value="">Tous statuts</option>
                {CAMPAIGN_STATUSES.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
              <select
                aria-label="Filtrer par audience"
                className="h-11 rounded-md border bg-transparent px-3"
                value={audience}
                onChange={(event) => setAudience(event.target.value)}
              >
                <option value="">Toutes audiences</option>
                {CAMPAIGN_AUDIENCES.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <input
                aria-label="Campagnes créées depuis"
                type="date"
                className="h-11 rounded-md border bg-transparent px-3"
                value={from}
                onChange={(event) => setFrom(event.target.value)}
              />
              <input
                aria-label="Campagnes créées jusqu'au"
                type="date"
                className="h-11 rounded-md border bg-transparent px-3"
                value={to}
                onChange={(event) => setTo(event.target.value)}
              />
            </div>

            <select
              aria-label="Trier les campagnes"
              className="h-11 w-full rounded-md border bg-transparent px-3"
              value={sort}
              onChange={(event) => setSort(event.target.value as 'RECENT' | 'NAME')}
            >
              <option value="RECENT">Plus récentes</option>
              <option value="NAME">Nom</option>
            </select>
          </section>
        </div>
      </div>

      {/* ── Content ── */}
      {error && (
        <p role="alert" className="text-red-800 dark:text-red-200">
          {error}
        </p>
      )}

      {loading ? (
        <p className="rounded-xl border p-8 text-center">Chargement…</p>
      ) : items.length === 0 ? (
        <section className="rounded-xl border border-dashed p-10 text-center">
          <p>Aucune campagne.</p>
          <Link className="text-blue-800 dark:text-blue-200" href="/campaigns/new">
            Créer le premier brouillon
          </Link>
        </section>
      ) : (
        <section className="grid gap-3 md:grid-cols-2">
          {items.map(({ campaign, progress }) => (
            <article
              key={campaign.id}
              className="rounded-xl border bg-card text-card-foreground p-4"
            >
              <div className="flex justify-between gap-2">
                <Link
                  href={`/campaigns/${campaign.id}`}
                  className="font-semibold text-blue-800 dark:text-blue-200"
                >
                  {campaign.name}
                </Link>
                <span className="shrink-0 text-xs font-medium">{campaign.status}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {campaign.audienceType} ·{' '}
                {new Date(campaign.createdAt).toLocaleDateString('fr-FR')}
              </p>
              <p className="mt-2 text-sm">
                {progress.finalized}/{progress.total} finalisés · {progress.confirmed} confirmés
              </p>
              <div className="mt-2 h-2 overflow-hidden rounded bg-slate-200 dark:bg-slate-700">
                <div
                  className="h-full bg-blue-700 transition-all"
                  style={{ width: `${progress.processedPercent}%` }}
                />
              </div>
              <div className="mt-3 flex gap-2">
                <Link className="rounded border px-3 py-2 text-sm" href={`/campaigns/${campaign.id}`}>
                  Consulter
                </Link>
                {campaign.status === 'EN_COURS' && (
                  <Link
                    className="rounded bg-emerald-700 px-3 py-2 text-sm text-white"
                    href={`/campaigns/${campaign.id}/run`}
                  >
                    Reprendre
                  </Link>
                )}
              </div>
            </article>
          ))}
        </section>
      )}

      {/* ── FAB : Nouvelle campagne ── */}
      <Link
        href="/campaigns/new"
        aria-label="Nouvelle campagne"
        className="fixed bottom-20 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30 transition-transform hover:scale-110 active:scale-95 md:bottom-8 md:right-8"
      >
        <Plus className="h-6 w-6" />
      </Link>
    </main>
  );
}
