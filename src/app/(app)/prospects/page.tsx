"use client";

import { useState, useDeferredValue, memo, useEffect } from "react";
import { createPortal } from "react-dom";
import { useLiveQuery } from "dexie-react-hooks";
import Link from "next/link";
import { Plus, Filter, X } from "lucide-react";
import { DexieProspectRepository } from "@/modules/prospects/infrastructure/dexie-prospect-repository";
import { ListProspectsUseCase } from "@/modules/prospects/application/list-prospects";
import { Prospect } from "@/modules/prospects/domain/prospect";
import { Button } from "@/components/ui/button";
import { DexieLocationRepository } from "@/modules/locations/infrastructure/dexie-location-repository";
import { DexieCatalogRepository } from "@/modules/catalog/infrastructure/dexie-catalog-repository";

const repository = new DexieProspectRepository();
const listUseCase = new ListProspectsUseCase(repository);
const locationRepository = new DexieLocationRepository();
const catalogRepository = new DexieCatalogRepository();

const ProspectCard = memo(({ p }: { p: Prospect }) => (
  <Link href={`/prospects/${p.contact.id}`}>
    <div className="bg-card text-card-foreground p-4 rounded-xl shadow-sm border border-border active:scale-[0.98] transition-transform">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-foreground line-clamp-1">{p.contact.displayName}</h3>
        <span className="text-[10px] font-bold px-2 py-1 rounded bg-blue-100 text-blue-800 dark:text-blue-200">
          {p.profile.status}
        </span>
      </div>
      <div className="text-sm text-muted-foreground mb-1">{p.contact.whatsappPhone}</div>
      <div className="text-xs text-slate-400">
        Niveau: {p.profile.interestLevel.replace('_', ' ')}
      </div>
    </div>
  </Link>
));
ProspectCard.displayName = 'ProspectCard';

export default function ProspectsPage() {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [limit, setLimit] = useState(50);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [showArchived, setShowArchived] = useState(false);
  const [locationId, setLocationId] = useState("");
  const [productId, setProductId] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const locations = useLiveQuery(() => locationRepository.getAllActive(), []) ?? [];
  const products = useLiveQuery(() => catalogRepository.getAllProductsActive(), []) ?? [];

  const prospects = useLiveQuery(
    () => listUseCase.execute({ 
      query: deferredSearch, 
      status: filterStatus ? [filterStatus] : undefined,
      showArchived,
      locationId: locationId || undefined,
      productIds: productId ? [productId] : undefined,
      limit
    }),
    [deferredSearch, filterStatus, showArchived, locationId, productId, limit]
  );

  const hasActiveFilters = Boolean(search || filterStatus || locationId || productId || showArchived);

  const clearFilters = () => {
    setSearch("");
    setFilterStatus("");
    setLocationId("");
    setProductId("");
    setShowArchived(false);
  };

  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setPortalContainer(document.getElementById('topbar-actions'));
  }, []);

  const actionButtons = (
    <button
      type="button"
      onClick={() => setFiltersOpen((prev) => !prev)}
      aria-label={filtersOpen ? 'Fermer les filtres' : 'Ouvrir les filtres'}
      aria-expanded={filtersOpen}
      className="relative flex h-10 w-10 items-center justify-center rounded-full text-nav-muted hover:text-nav-fg hover:bg-white/10"
    >
      {filtersOpen ? <X className="h-5 w-5" /> : <Filter className="h-5 w-5" />}
      {hasActiveFilters && !filtersOpen && (
        <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-blue-600 border border-nav-bg" />
      )}
    </button>
  );

  return (
    <div className="relative flex flex-col h-full bg-muted/50 min-h-screen">
      <div className="flex-1 max-w-6xl w-full mx-auto p-4 pb-24 md:p-8 space-y-5">
        {/* Header Mobile-First */}
        <header className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-foreground hidden md:block">Prospects</h1>
          {portalContainer ? createPortal(actionButtons, portalContainer) : <div className="ml-auto">{actionButtons}</div>}
        </header>

        {/* Collapsible filters panel */}
        <div
          className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
            filtersOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
          }`}
        >
          <div className="overflow-hidden">
            <section
              className="space-y-3 rounded-xl border bg-card p-4"
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
                className="w-full h-11 bg-transparent border rounded-md px-3 text-sm outline-none transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <div className="grid gap-2 sm:grid-cols-2">
                <select 
                  aria-label="Filtrer par statut"
                  className="w-full h-11 bg-transparent border rounded-md px-3 text-sm outline-none"
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
                  className="w-full h-11 bg-transparent border rounded-md px-3 text-sm" 
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
                  className="w-full h-11 bg-transparent border rounded-md px-3 text-sm" 
                  value={productId} 
                  onChange={(e) => setProductId(e.target.value)}
                >
                  <option value="">Tous les produits</option>
                  {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
                </select>
                
                <label className="flex items-center gap-2 h-11 text-sm text-foreground bg-transparent border px-3 rounded-md cursor-pointer">
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
            <div className="flex flex-col items-center justify-center p-8 text-center bg-card text-card-foreground rounded-xl border border-dashed border-border">
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
                <ProspectCard key={p.contact.id} p={p} />
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
        className="fixed bottom-20 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30 transition-transform hover:scale-110 active:scale-95 md:bottom-8 md:right-8"
      >
        <Plus className="h-6 w-6" />
      </Link>
    </div>
  );
}
