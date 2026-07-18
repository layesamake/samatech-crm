'use client';

import { useMemo, useState } from 'react';

export interface ProductInterestOption {
  id: string;
  name: string;
  archived?: boolean;
}

interface ProductInterestSelectorProps {
  products: ProductInterestOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  onCreateProduct?: (name: string) => void;
}

export function ProductInterestSelector({ products, selectedIds, onChange, onCreateProduct }: ProductInterestSelectorProps) {
  const [query, setQuery] = useState('');
  const visibleProducts = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('fr');
    return products.filter((product) => product.name.toLocaleLowerCase('fr').includes(normalized));
  }, [products, query]);

  const toggle = (id: string, checked: boolean) => {
    onChange(checked ? [...new Set([...selectedIds, id])] : selectedIds.filter((selectedId) => selectedId !== id));
  };

  const exactMatch = products.some((p) => p.name.trim().toLocaleLowerCase('fr') === query.trim().toLocaleLowerCase('fr'));

  return (
    <fieldset className="space-y-3 rounded-lg border p-3">
      <legend className="px-1 text-sm font-medium">Produits / Services d&apos;intérêt</legend>
      <input
        type="search"
        aria-label="Rechercher un produit à associer"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Rechercher ou ajouter un produit..."
        className="h-11 w-full rounded-md border bg-background px-3 text-base"
      />
      <p aria-live="polite" className="text-xs text-muted-foreground">
        {selectedIds.length} élément{selectedIds.length > 1 ? 's' : ''} sélectionné{selectedIds.length > 1 ? 's' : ''}
      </p>
      <div className="max-h-56 space-y-2 overflow-y-auto">
        {visibleProducts.map((product) => {
          const selected = selectedIds.includes(product.id);
          return (
            <label key={product.id} className={`flex min-h-11 items-center gap-3 rounded-md border px-3 py-2 ${selected ? 'border-blue-500 bg-blue-500/10' : ''} ${product.archived ? 'text-muted-foreground' : ''}`}>
              <input
                type="checkbox"
                name="productIds"
                value={product.id}
                checked={selected}
                disabled={product.archived}
                onChange={(event) => toggle(product.id, event.target.checked)}
                className="h-5 w-5"
              />
              <span>{product.name}{product.archived ? ' (Inactif)' : ''}</span>
            </label>
          );
        })}
        {visibleProducts.length === 0 && !query.trim() && <p className="py-3 text-sm text-muted-foreground">Aucun produit disponible.</p>}
        {query.trim() && !exactMatch && onCreateProduct && (
          <button
            type="button"
            onClick={() => {
              onCreateProduct(query.trim());
              setQuery('');
            }}
            className="flex w-full items-center gap-2 rounded-md border border-dashed border-primary px-3 py-3 text-sm text-primary hover:bg-primary/10"
          >
            + Créer &quot;{query.trim()}&quot;
          </button>
        )}
      </div>
    </fieldset>
  );
}
