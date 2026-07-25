"use client";

import { useState, useDeferredValue, memo, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useLiveQuery } from "dexie-react-hooks";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Filter, X, MessageCircle, MapPin, CalendarClock } from "lucide-react";
import { DexieProspectRepository } from "@/modules/prospects/infrastructure/dexie-prospect-repository";
import { ListProspectsUseCase } from "@/modules/prospects/application/list-prospects";
import { Prospect } from "@/modules/prospects/domain/prospect";
import { Button } from "@/components/ui/button";
import { DexieLocationRepository } from "@/modules/locations/infrastructure/dexie-location-repository";
import { DexieCatalogRepository } from "@/modules/catalog/infrastructure/dexie-catalog-repository";
import { DexieTagRepository } from "@/modules/tags/infrastructure/dexie-tag-repository";
import { ManageFollowUpsUseCase } from "@/modules/follow-ups/application/manage-follow-ups";
import { TagIcon } from '@/modules/tags/presentation/TagIcon';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const repository = new DexieProspectRepository();
const listUseCase = new ListProspectsUseCase(repository);
const locationRepository = new DexieLocationRepository();
const catalogRepository = new DexieCatalogRepository();
const tagRepository = new DexieTagRepository();
const followUpsUseCase = new ManageFollowUpsUseCase();

const ProspectCard = memo(({ p, onOpen, locationName, nextFollowUp }: { p: Prospect; onOpen: () => void; locationName?: string; nextFollowUp?: string }) => (
  <article
    role="link"
    tabIndex={0}
    onClick={onOpen}
    onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onOpen(); } }}
    className="cursor-pointer bg-card text-card-foreground p-4 rounded-xl shadow-sm border border-border active:scale-[0.98] transition-transform bg-background text-foreground"
  >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-foreground line-clamp-1">{p.contact.displayName}</h3>
        <span className="text-[10px] font-bold px-2 py-1 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
          {p.profile.status}
        </span>
      </div>
      <div className="text-sm text-muted-foreground mb-2">{p.contact.companyName || p.contact.whatsappPhone}</div>
{p.tags?.length ? <div className="mb-3 flex flex-wrap gap-2">{p.tags.map((tag) => <span key={tag.id} className="inline-flex items-center gap-1.5 rounded-lg border-2 px-3 py-1 text-xs font-bold uppercase tracking-wide shadow-sm" style={{ color: tag.color || '#0B6B2D', borderColor: tag.color || '#0B6B2D', backgroundColor: `${tag.color || '#0B6B2D'}33` }}><TagIcon icon={tag.icon} className="size-4" />{tag.name}</span>)}</div> : null}
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {locationName && <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" />{locationName}</span>}
        {nextFollowUp && <span className="inline-flex items-center gap-1"><CalendarClock className="size-3.5" />{nextFollowUp}</span>}
        <span>Niveau : {p.profile.interestLevel.replace('_', ' ')}</span>
      </div>
      <div className="mt-3 flex gap-2 border-t pt-3">
        <a
          href={`https://wa.me/${p.contact.normalizedWhatsappPhone.replace(/\D/g, '')}`}
          onClick={(event) => event.stopPropagation()}
          className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-primary/10 px-3 text-sm font-semibold text-primary"
        >
          <MessageCircle className="size-4" /> WhatsApp
        </a>
        <button type="button" onClick={(event) => { event.stopPropagation(); onOpen(); }} className="min-h-11 rounded-lg px-3 text-sm font-semibold text-muted-foreground hover:bg-muted">
          Détails
        </button>
      </div>
  </article>
));
ProspectCard.displayName = 'ProspectCard';

export default function ProspectsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [limit, setLimit] = useState(50);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [showArchived, setShowArchived] = useState(false);
  const [locationId, setLocationId] = useState("");
  const [productId, setProductId] = useState("");
  const [tagId, setTagId] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const locations = useLiveQuery(() => locationRepository.getAllActive(), []) ?? [];
  const products = useLiveQuery(() => catalogRepository.getAllProductsActive(), []) ?? [];
  const tags = useLiveQuery(() => tagRepository.listActive(), []) ?? [];
  const followUps = useLiveQuery(() => followUpsUseCase.list(), []) ?? [];

  const locationById = useMemo(() => new Map(locations.map((location) => [location.id, location.name])), [locations]);
  const nextFollowUpByContact = useMemo(() => {
    const next = new Map<string, string>();
    for (const followUp of followUps) {
      if (followUp.status !== 'PLANIFIEE' || next.has(followUp.contactId)) continue;
      next.set(followUp.contactId, new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(new Date(followUp.dueAt)));
    }
    return next;
  }, [followUps]);

  const prospects = useLiveQuery(
    () => listUseCase.execute({ 
      query: deferredSearch, 
      status: filterStatus ? [filterStatus] : undefined,
      showArchived,
      locationId: locationId || undefined,
      productIds: productId ? [productId] : undefined,
      tagIds: tagId ? [tagId] : undefined,
      limit
    }),
    [deferredSearch, filterStatus, showArchived, locationId, productId, tagId, limit]
  );

  const hasActiveFilters = Boolean(search || filterStatus || locationId || productId || tagId || showArchived);
  const activeFilterCount = [filterStatus, locationId, productId, tagId, showArchived ? 'archived' : ''].filter(Boolean).length;

  const clearFilters = () => {
    setSearch("");
    setFilterStatus("");
    setLocationId("");
    setProductId("");
    setTagId("");
    setShowArchived(false);
  };

  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setPortalContainer(document.getElementById('topbar-actions'));
  }, []);

  const actionButtons = (
    <SheetTrigger
      aria-label={filtersOpen ? 'Fermer les filtres' : 'Ouvrir les filtres'}
      aria-expanded={filtersOpen}
      className="relative flex h-10 w-10 items-center justify-center rounded-full text-nav-muted hover:text-nav-fg hover:bg-white/10"
    >
      {filtersOpen ? <X className="h-5 w-5" /> : <Filter className="h-5 w-5" />}
      {hasActiveFilters && !filtersOpen && (
        <span className="absolute right-0 top-0 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">{activeFilterCount || '•'}</span>
      )}
    </SheetTrigger>
  );

  return (
    <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
    <div className="relative flex flex-col h-full bg-muted/50 min-h-screen">
      <div className="flex-1 max-w-6xl w-full mx-auto p-4 pb-24 md:p-8 space-y-5">
        {/* Header Mobile-First */}
        <header className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-foreground hidden md:block">Prospects</h1>
          {portalContainer ? createPortal(actionButtons, portalContainer) : <div className="ml-auto">{actionButtons}</div>}
        </header>

        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2" aria-label="Filtres actifs">
            {filterStatus && <button type="button" onClick={() => setFilterStatus('')} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{filterStatus.replace('_', ' ')} ×</button>}
            {locationId && <button type="button" onClick={() => setLocationId('')} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{locationById.get(locationId)} ×</button>}
            {productId && <button type="button" onClick={() => setProductId('')} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{products.find((product) => product.id === productId)?.name} ×</button>}
            {tagId && <button type="button" onClick={() => setTagId('')} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">Tag : {tags.find((tag) => tag.id === tagId)?.name} ×</button>}
            {showArchived && <button type="button" onClick={() => setShowArchived(false)} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">Archives ×</button>}
            {search && <button type="button" onClick={() => setSearch('')} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">Recherche ×</button>}
            <button type="button" onClick={clearFilters} className="px-2 py-1 text-xs font-semibold text-muted-foreground underline">Tout effacer</button>
          </div>
        )}

        {/* Collapsible filters panel */}
        <div
          className={`hidden transition-[grid-template-rows] duration-300 ease-in-out ${
            filtersOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
          }`}
        >
          <div className="overflow-hidden">
            <section
              className="space-y-3 rounded-xl border bg-card p-4 bg-background text-foreground"
              aria-label="Filtres de prospects"
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
                aria-label="Rechercher un prospect par nom ou numéro"
                type="text"
                placeholder="Rechercher par nom, numéro..."
                className="w-full h-11 bg-transparent border rounded-md px-3 text-sm outline-none transition-all bg-background text-foreground"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <div className="grid gap-2 sm:grid-cols-2">
                <select 
                  aria-label="Filtrer par statut"
                  className="w-full h-11 bg-transparent border rounded-md px-3 text-sm outline-none bg-background text-foreground"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="">Tous les statuts</option>
                  <option value="NOUVEAU">Nouveaux</option>
                  <option value="CONTACTE">Contactés</option>
                  <option value="INTERESSE">Intéressés</option>
                  <option value="A_RELANCER">À Relancer</option>
                  <option value="NEGOCIATION">Négociation</option>
                </select>
                <select 
                  aria-label="Filtrer par localité" 
                  className="w-full h-11 bg-transparent border rounded-md px-3 text-sm bg-background text-foreground" 
                  value={locationId} 
                  onChange={(e) => setLocationId(e.target.value)}
                >
                  <option value="">Toutes les localités</option>
                  {locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
                </select>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <select 
                  aria-label="Filtrer par produit" 
                  className="w-full h-11 bg-transparent border rounded-md px-3 text-sm bg-background text-foreground" 
                  value={productId} 
                  onChange={(e) => setProductId(e.target.value)}
                >
                  <option value="">Tous les produits</option>
                  {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
                </select>
                <select
                  aria-label="Filtrer par tag"
                  className="w-full h-11 bg-transparent border rounded-md px-3 text-sm bg-background text-foreground"
                  value={tagId}
                  onChange={(e) => setTagId(e.target.value)}
                >
                  <option value="">Tous les tags</option>
                  {tags.map((tag) => <option key={tag.id} value={tag.id}>{tag.name}</option>)}
                </select>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <label className="flex items-center gap-2 h-11 text-sm text-foreground bg-transparent border px-3 rounded-md cursor-pointer bg-background text-foreground">
                  <input 
                    type="checkbox" 
                    checked={showArchived} 
                    onChange={(e) => setShowArchived(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  Afficher les archives
                </label>
              </div>
            </section>
          </div>
        </div>

        {/* Liste des prospects */}
        <main>
          {!prospects ? (
            <div className="flex justify-center p-8 text-slate-400">Chargement...</div>
          ) : prospects.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-card text-card-foreground rounded-xl border border-dashed border-border bg-background text-foreground">
              <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mb-3">
                <Plus className="h-6 w-6 text-blue-500" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Aucun prospect</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-xs">
                Commencez par ajouter votre premier prospect pour suivre vos opportunités.
              </p>
              <Link href="/prospects/nouveau">
                <Button>Créer un prospect</Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {prospects.map((p: Prospect) => (
                <ProspectCard key={p.contact.id} p={p} locationName={p.contact.locationId ? locationById.get(p.contact.locationId) : undefined} nextFollowUp={nextFollowUpByContact.get(p.contact.id)} onOpen={() => router.push(`/prospects/${p.contact.id}`)} />
              ))}
            </div>
          )}
          
          {prospects && prospects.length >= limit && (
            <div className="mt-6 flex justify-center pb-8">
              <Button variant="outline" onClick={() => setLimit(l => l + 50)}>Charger plus</Button>
            </div>
          )}
        </main>
      </div>

      {/* FAB : Créer un prospect */}
      <Link 
        href="/prospects/nouveau" 
        aria-label="Créer un prospect" 
        className="fixed bottom-20 right-5 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:scale-105 active:scale-95 md:bottom-8 md:right-8"
      >
        <Plus className="h-6 w-6" />
      </Link>
    </div>
    <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto rounded-t-3xl">
      <SheetHeader className="border-b">
        <SheetTitle>Filtrer les prospects</SheetTitle>
        <p className="text-sm text-muted-foreground">Affinez la liste sans perdre votre recherche.</p>
      </SheetHeader>
      <section className="space-y-4 p-4" aria-label="Filtres de prospects">
        <input aria-label="Rechercher un prospect par nom ou numéro" type="search" placeholder="Rechercher par nom, numéro ou entreprise" className="h-11 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="space-y-2"><label className="text-sm font-medium" htmlFor="prospect-filter-status">Statut</label><select id="prospect-filter-status" className="h-11 w-full rounded-md border bg-background px-3 text-sm" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}><option value="">Tous les statuts</option><option value="NOUVEAU">Nouveaux</option><option value="CONTACTE">Contactés</option><option value="INTERESSE">Intéressés</option><option value="A_RELANCER">À relancer</option><option value="NEGOCIATION">Négociation</option></select></div>
        <div className="space-y-2"><label className="text-sm font-medium" htmlFor="prospect-filter-location">Localité</label><select id="prospect-filter-location" className="h-11 w-full rounded-md border bg-background px-3 text-sm" value={locationId} onChange={(e) => setLocationId(e.target.value)}><option value="">Toutes les localités</option>{locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></div>
        <div className="space-y-2"><label className="text-sm font-medium" htmlFor="prospect-filter-product">Produit ou service</label><select id="prospect-filter-product" className="h-11 w-full rounded-md border bg-background px-3 text-sm" value={productId} onChange={(e) => setProductId(e.target.value)}><option value="">Tous les produits</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></div>
        <div className="space-y-2"><label className="text-sm font-medium" htmlFor="prospect-filter-tag">Tag</label><select id="prospect-filter-tag" className="h-11 w-full rounded-md border bg-background px-3 text-sm" value={tagId} onChange={(e) => setTagId(e.target.value)}><option value="">Tous les tags</option>{tags.map((tag) => <option key={tag.id} value={tag.id}>{tag.name}</option>)}</select></div>
        <label className="flex min-h-11 items-center gap-3 rounded-lg border px-3 text-sm font-medium"><input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} className="size-4 accent-primary" />Afficher les archives</label>
        <div className="flex gap-3 pt-2"><Button type="button" variant="outline" className="min-h-11 flex-1" onClick={clearFilters}>Réinitialiser</Button><Button type="button" className="min-h-11 flex-1" onClick={() => setFiltersOpen(false)}>Afficher les résultats</Button></div>
      </section>
    </SheetContent>
    </Sheet>
  );
}
