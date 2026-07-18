"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
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

export default function ProspectsPage() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [showArchived, setShowArchived] = useState(false);
  const [locationId, setLocationId] = useState("");
  const [productId, setProductId] = useState("");
  const locations = useLiveQuery(() => locationRepository.getAllActive(), []) ?? [];
  const products = useLiveQuery(() => catalogRepository.getAllProductsActive(), []) ?? [];

  const prospects = useLiveQuery(
    () => listUseCase.execute({ 
      query: search, 
      status: filterStatus ? [filterStatus] : undefined,
      showArchived,
      locationId: locationId || undefined,
      productIds: productId ? [productId] : undefined,
    }),
    [search, filterStatus, showArchived, locationId, productId]
  );

  return (
    <div className="flex flex-col h-full bg-slate-50 min-h-screen">
      {/* Header Mobile-First */}
      <header className="sticky top-0 z-10 bg-card text-card-foreground border-b px-4 py-3 flex flex-col gap-3 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-800">Prospects</h1>
        </div>
        
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              aria-label="Rechercher un prospect par nom ou numéro"
              type="text"
              placeholder="Rechercher par nom, numéro..."
              className="w-full bg-slate-100 border-transparent focus:bg-card text-card-foreground focus:border-blue-500 rounded-lg pl-9 pr-4 py-2 text-sm outline-none transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select 
            aria-label="Filtrer par statut"
            className="bg-slate-100 border-transparent rounded-lg px-3 py-2 text-sm outline-none"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Tous</option>
            <option value="NOUVEAU">Nouveaux</option>
            <option value="CONTACTE">Contactés</option>
            <option value="INTERESSE">Intéressés</option>
            <option value="A_RELANCER">À Relancer</option>
            <option value="NEGOCIATION">Négociation</option>
          </select>
          <select aria-label="Filtrer par localité" className="bg-slate-100 rounded-lg px-3 py-2 text-sm" value={locationId} onChange={(e) => setLocationId(e.target.value)}><option value="">Toutes localités</option>{locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select>
          <select aria-label="Filtrer par produit" className="bg-slate-100 rounded-lg px-3 py-2 text-sm" value={productId} onChange={(e) => setProductId(e.target.value)}><option value="">Tous produits</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select>
          <label className="flex items-center gap-2 text-sm text-slate-600 bg-slate-100 px-3 py-2 rounded-lg cursor-pointer hover:bg-slate-200 transition-colors">
            <input 
              type="checkbox" 
              checked={showArchived} 
              onChange={(e) => setShowArchived(e.target.checked)}
              className="rounded text-blue-600"
            />
            Archives
          </label>
        </div>
      </header>

      {/* Liste des prospects */}
      <main className="flex-1 p-4 pb-24 overflow-y-auto">
        {!prospects ? (
          <div className="flex justify-center p-8 text-slate-400">Chargement...</div>
        ) : prospects.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center bg-card text-card-foreground rounded-xl border border-dashed border-slate-300">
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-3">
              <Plus className="h-6 w-6 text-blue-500" />
            </div>
            <h3 className="font-semibold text-slate-800 mb-1">Aucun prospect</h3>
            <p className="text-sm text-slate-500 mb-4 max-w-xs">
              Commencez par ajouter votre premier prospect pour suivre vos opportunités.
            </p>
            <Link href="/prospects/nouveau">
              <Button>Créer un prospect</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {prospects.map((p: Prospect) => (
              <Link key={p.contact.id} href={`/prospects/${p.contact.id}`}>
                <div className="bg-card text-card-foreground p-4 rounded-xl shadow-sm border border-slate-100 active:scale-[0.98] transition-transform">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-slate-800 line-clamp-1">{p.contact.displayName}</h3>
                    <span className="text-[10px] font-bold px-2 py-1 rounded bg-blue-100 text-blue-700">
                      {p.profile.status}
                    </span>
                  </div>
                  <div className="text-sm text-slate-600 mb-1">{p.contact.whatsappPhone}</div>
                  <div className="text-xs text-slate-400">
                    Niveau: {p.profile.interestLevel.replace('_', ' ')}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* FAB Mobile */}
      <Link href="/prospects/nouveau" aria-label="Créer un prospect" className="fixed bottom-6 right-6 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30 transition-all hover:bg-blue-700 active:scale-95">
          <Plus className="h-6 w-6" />
      </Link>
    </div>
  );
}
