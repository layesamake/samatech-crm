'use client';
import { useEffect, useState, useDeferredValue, useMemo, memo } from 'react';
import { ManageCatalogUseCase } from '@/modules/catalog/application/manage-catalog';
import { DexieCatalogRepository } from '@/modules/catalog/infrastructure/dexie-catalog-repository';
import { ProductRecord, CategoryRecord } from '@/modules/catalog/domain/catalog';
import { ListSkeleton } from '@/components/ui/loading-skeletons';
import { SwipeableActionItem } from '@/components/ui/swipeable-action-item';
import { Plus, Search, SlidersHorizontal, ChevronDown, Archive, Edit2, FolderOpen, Package, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProductForm } from '@/modules/catalog/presentation/ProductForm';
import { CategoryForm } from '@/modules/catalog/presentation/CategoryForm';
import { GetSettingsUseCase } from '@/modules/settings/application/get-settings';
import { DexieSettingsRepository } from '@/modules/settings/infrastructure/dexie-settings-repository';

const repository = new DexieCatalogRepository();
const manageCatalogUseCase = new ManageCatalogUseCase(repository);
const settingsRepo = new DexieSettingsRepository();
const getSettingsUseCase = new GetSettingsUseCase(settingsRepo);

const CatalogCard = memo(({ 
  item, 
  currencySymbol, 
  onEdit, 
  onArchive 
}: { 
  item: ProductRecord; 
  currencySymbol: string; 
  onEdit: (item: ProductRecord) => void;
  onArchive: (id: string) => void;
}) => {
  const isArchived = Boolean(item.archivedAt);
  const displayStatus = isArchived ? 'ARCHIVÉ' : !item.isActive ? 'INACTIF' : '';
  const typeLabel = item.type === 'PRODUCT' ? 'Produit' : 'Service';

  return (
    <SwipeableActionItem 
      onSwipeLeft={() => onEdit(item)}
      leftIcon={Edit2} leftLabel="Modifier" leftBgColor="bg-blue-600"
      onSwipeRight={isArchived ? undefined : () => onArchive(item.id)}
      rightIcon={Archive} rightLabel="Archiver" rightBgColor="bg-red-600"
    >
      <div onClick={() => onEdit(item)} className="bg-background text-foreground p-4 cursor-pointer border-b hover:bg-muted/50 transition-colors">
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-1 flex-1">
            <strong className="text-base font-semibold">{item.name}</strong>
            <span className="text-sm text-muted-foreground flex items-center gap-2">
              <Package className="w-3.5 h-3.5" />
              {item.sku || 'Sans réf'} • {typeLabel}
            </span>
            {displayStatus && (
              <span className={cn("text-xs font-semibold mt-1 uppercase", isArchived ? "text-red-500" : "text-amber-500")}>
                {displayStatus}
              </span>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 text-right">
            <strong className="text-base font-semibold whitespace-nowrap">
              {item.unitPriceMinor} {currencySymbol}
              {item.unitLabel ? <span className="text-sm text-muted-foreground font-normal"> / {item.unitLabel}</span> : ''}
            </strong>
          </div>
        </div>
      </div>
    </SwipeableActionItem>
  );
});
CatalogCard.displayName = 'CatalogCard';

const CategoryCard = memo(({ 
  category, 
  onEdit, 
  onArchive 
}: { 
  category: CategoryRecord; 
  onEdit: (cat: CategoryRecord) => void;
  onArchive: (id: string) => void;
}) => {
  const isArchived = Boolean(category.archivedAt);
  return (
    <SwipeableActionItem 
      onSwipeLeft={() => onEdit(category)}
      leftIcon={Edit2} leftLabel="Modifier" leftBgColor="bg-blue-600"
      onSwipeRight={isArchived ? undefined : () => onArchive(category.id)}
      rightIcon={Archive} rightLabel="Archiver" rightBgColor="bg-red-600"
    >
      <div onClick={() => onEdit(category)} className="bg-background text-foreground p-4 cursor-pointer border-b hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <FolderOpen className="w-5 h-5" />
          </div>
          <div className="flex flex-col flex-1">
            <strong className="text-base font-semibold">{category.name}</strong>
            {category.description && (
              <span className="text-sm text-muted-foreground line-clamp-1">{category.description}</span>
            )}
            {isArchived && <span className="text-xs font-semibold text-red-500 mt-1">ARCHIVÉE</span>}
          </div>
        </div>
      </div>
    </SwipeableActionItem>
  );
});
CategoryCard.displayName = 'CategoryCard';

type TabType = 'Tous' | 'Produits' | 'Services' | 'Catégories' | 'Archives';

export default function CatalogPage() { 
  const [products, setProducts] = useState<ProductRecord[]>([]); 
  const [categories, setCategories] = useState<CategoryRecord[]>([]); 
  const [currencySymbol, setCurrencySymbol] = useState('FCFA');
  const [currencyCode, setCurrencyCode] = useState('XOF');

  const [query, setQuery] = useState(''); 
  const deferredQuery = useDeferredValue(query); 
  
  const [activeTab, setActiveTab] = useState<TabType>('Tous');
  
  const [showFilters, setShowFilters] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');
  
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState(''); 
  const [limit, setLimit] = useState(50);

  // Forms state
  const [viewState, setViewState] = useState<'LIST' | 'PRODUCT_FORM' | 'CATEGORY_FORM'>('LIST');
  const [editingProduct, setEditingProduct] = useState<ProductRecord | null>(null);
  const [editingCategory, setEditingCategory] = useState<CategoryRecord | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prods, cats, settings] = await Promise.all([
        repository.getAllProducts(), // Fetch all, we filter client-side
        repository.getAllCategories(),
        getSettingsUseCase.getCompanyProfile(),
      ]);
      setProducts(prods);
      setCategories(cats);
      
      if (settings) {
        setCurrencySymbol(settings.currencySymbol);
        setCurrencyCode(settings.currencyCode);
      }
      setError('');
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : 'Chargement impossible');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    void loadData();
  }, []);

  const handleArchiveProduct = async (id: string) => {
    if (confirm('Voulez-vous vraiment archiver cet élément ?')) {
      try {
        await manageCatalogUseCase.archiveProduct(id);
        await loadData();
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const handleArchiveCategory = async (id: string) => {
    if (confirm('Voulez-vous vraiment archiver cette catégorie ?')) {
      try {
        await manageCatalogUseCase.archiveCategory(id);
        await loadData();
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const activeCategories = useMemo(() => categories.filter(c => !c.archivedAt), [categories]);

  // Filtering Logic
  const filteredItems = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    if (activeTab === 'Catégories') {
      return categories.filter(c => {
        if (c.archivedAt) return false;
        if (q && !c.normalizedName.includes(q)) return false;
        return true;
      });
    }

    if (activeTab === 'Archives') {
      return {
        products: products.filter(p => p.archivedAt && (!q || p.normalizedName.includes(q))),
        categories: categories.filter(c => c.archivedAt && (!q || c.normalizedName.includes(q))),
      };
    }

    // Products & Services
    return products.filter(p => {
      if (p.archivedAt) return false;
      if (activeTab === 'Produits' && p.type !== 'PRODUCT') return false;
      if (activeTab === 'Services' && p.type !== 'SERVICE') return false;
      if (categoryFilter && p.categoryId !== categoryFilter) return false;
      if (q && !p.normalizedName.includes(q)) return false;
      return true;
    });
  }, [products, categories, deferredQuery, activeTab, categoryFilter]);

  if (viewState === 'PRODUCT_FORM') {
    return (
      <ProductForm 
        initialData={editingProduct}
        categories={activeCategories}
        currencyCode={currencyCode}
        currencySymbol={currencySymbol}
        onCancel={() => {
          setViewState('LIST');
          setEditingProduct(null);
        }}
        onCreateCategory={async (name) => {
          const cat = await manageCatalogUseCase.createCategory({ name, description: '' });
          await loadData();
          return cat;
        }}
        onSave={async (data) => {
          if (editingProduct) {
            await manageCatalogUseCase.updateProduct(editingProduct.id, data);
          } else {
            await manageCatalogUseCase.createProduct(data);
          }
          await loadData();
          setViewState('LIST');
          setEditingProduct(null);
        }}
      />
    );
  }

  if (viewState === 'CATEGORY_FORM') {
    return (
      <CategoryForm 
        initialData={editingCategory}
        onCancel={() => {
          setViewState('LIST');
          setEditingCategory(null);
        }}
        onSave={async (data) => {
          if (editingCategory) {
            await manageCatalogUseCase.updateCategory(editingCategory.id, data);
          } else {
            await manageCatalogUseCase.createCategory(data);
          }
          await loadData();
          setViewState('LIST');
          setEditingCategory(null);
        }}
      />
    );
  }

  return (
    <main className="flex flex-col min-h-screen bg-background pb-24 md:pb-8">
      <header className="sticky top-0 z-10 bg-background border-b pt-2 md:pt-4">
        <div className="flex items-center justify-between px-4 pb-2">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">Catalogue</h1>
          </div>
          <div className="flex items-center gap-4">
            <button 
              className="p-2 border rounded-xl hover:bg-muted" 
              aria-label="Trier"
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="w-5 h-5" />
            </button>
            <button 
              className="p-2 border rounded-xl hover:bg-muted" 
              aria-label="Rechercher"
              onClick={() => setShowSearch(!showSearch)}
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {showSearch && (
          <div className="px-4 pb-3 animate-in slide-in-from-top-2">
            <input 
              autoFocus
              aria-label="Rechercher dans le catalogue" 
              className="w-full h-12 rounded-xl border px-4 bg-muted/30 focus:bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all" 
              placeholder="Rechercher un produit, service..." 
              value={query} 
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        )}

        <div className="flex overflow-x-auto no-scrollbar border-b px-2">
          {(['Tous', 'Produits', 'Services', 'Catégories', 'Archives'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setLimit(50); }}
              className={cn(
                "flex-1 min-w-[80px] py-3 text-sm font-medium text-center relative transition-colors whitespace-nowrap px-4",
                activeTab === tab ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          ))}
        </div>
        
        {showFilters && activeTab !== 'Catégories' && activeTab !== 'Archives' && (
          <div className="px-4 py-3 bg-muted/10 border-b animate-in slide-in-from-top-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Filtrer par catégorie</label>
              <select 
                className="w-full h-11 rounded-xl border px-3 text-sm bg-background" 
                value={categoryFilter} 
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">Toutes les catégories</option>
                {activeCategories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </header>

      <section className="flex-1">
        {error ? (
          <p role="alert" className="p-4 text-red-800 dark:text-red-200">{error}</p>
        ) : loading ? (
          <div className="mt-4"><ListSkeleton count={5} /></div>
        ) : (
          <div className="flex flex-col">
            {activeTab === 'Catégories' && (
              (filteredItems as CategoryRecord[]).length === 0 ? (
                <p className="p-8 text-center text-muted-foreground">Aucune catégorie trouvée.</p>
              ) : (
                (filteredItems as CategoryRecord[]).slice(0, limit).map((cat) => (
                  <CategoryCard 
                    key={cat.id} 
                    category={cat} 
                    onEdit={(c) => { setEditingCategory(c); setViewState('CATEGORY_FORM'); }} 
                    onArchive={handleArchiveCategory} 
                  />
                ))
              )
            )}

            {activeTab === 'Archives' && (
              <>
                {(filteredItems as any).categories.length > 0 && (
                  <div className="bg-muted px-4 py-2 text-sm font-semibold text-muted-foreground">Catégories archivées</div>
                )}
                {(filteredItems as any).categories.map((cat: CategoryRecord) => (
                  <CategoryCard key={cat.id} category={cat} onEdit={(c) => { setEditingCategory(c); setViewState('CATEGORY_FORM'); }} onArchive={() => {}} />
                ))}

                {(filteredItems as any).products.length > 0 && (
                  <div className="bg-muted px-4 py-2 text-sm font-semibold text-muted-foreground">Produits/Services archivés</div>
                )}
                {(filteredItems as any).products.map((p: ProductRecord) => (
                  <CatalogCard key={p.id} item={p} currencySymbol={currencySymbol} onEdit={(p) => { setEditingProduct(p); setViewState('PRODUCT_FORM'); }} onArchive={() => {}} />
                ))}

                {(filteredItems as any).categories.length === 0 && (filteredItems as any).products.length === 0 && (
                  <p className="p-8 text-center text-muted-foreground">Aucune archive trouvée.</p>
                )}
              </>
            )}

            {activeTab !== 'Catégories' && activeTab !== 'Archives' && (
              (filteredItems as ProductRecord[]).length === 0 ? (
                <p className="p-8 text-center text-muted-foreground">Aucun article ne correspond aux critères.</p>
              ) : (
                (filteredItems as ProductRecord[]).slice(0, limit).map((p) => (
                  <CatalogCard 
                    key={p.id} 
                    item={p} 
                    currencySymbol={currencySymbol}
                    onEdit={(p) => { setEditingProduct(p); setViewState('PRODUCT_FORM'); }} 
                    onArchive={handleArchiveProduct} 
                  />
                ))
              )
            )}
          </div>
        )}
        
        {/* Load more logic */}
        {((activeTab === 'Catégories' && (filteredItems as CategoryRecord[]).length > limit) || 
          (activeTab !== 'Catégories' && activeTab !== 'Archives' && (filteredItems as ProductRecord[]).length > limit)) && (
          <div className="p-4 flex justify-center">
            <button className="px-6 py-2.5 bg-muted text-muted-foreground hover:bg-muted/80 rounded-xl text-sm font-medium transition-colors" onClick={() => setLimit(l => l + 50)}>
              Charger plus
            </button>
          </div>
        )}
      </section>

      {/* FAB - Actions multiples (Produit / Service / Catégorie) */}
      <div className="fixed bottom-[84px] lg:bottom-8 right-4 z-40 group">
        <div className="absolute bottom-16 right-0 flex-col gap-2 items-end mb-2 hidden group-hover:flex">
          <button 
            onClick={() => { setEditingCategory(null); setViewState('CATEGORY_FORM'); }}
            className="flex items-center gap-2 bg-background border shadow-md rounded-full px-4 py-2 text-sm font-medium hover:bg-muted whitespace-nowrap transition-transform translate-y-2 group-hover:translate-y-0"
          >
            Nouvelle Catégorie <FolderOpen className="w-4 h-4 ml-1" />
          </button>
          <button 
            onClick={() => { setEditingProduct(null); setViewState('PRODUCT_FORM'); }}
            className="flex items-center gap-2 bg-background border shadow-md rounded-full px-4 py-2 text-sm font-medium hover:bg-muted whitespace-nowrap transition-transform translate-y-4 group-hover:translate-y-0"
          >
            Nouveau Produit / Service <Package className="w-4 h-4 ml-1" />
          </button>
        </div>
        <button 
          className="w-14 h-14 bg-foreground text-background rounded-[20px] flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
      </div>
    </main>
  );
}
