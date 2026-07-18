/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ProductRecord, CreateProductSchema, CreateProductInput, CategoryRecord } from '../domain/catalog';
import { ManageCatalogUseCase } from '../application/manage-catalog';
import { DexieCatalogRepository } from '../infrastructure/dexie-catalog-repository';
import { GetSettingsUseCase } from '@/modules/settings/application/get-settings';
import { DexieSettingsRepository } from '@/modules/settings/infrastructure/dexie-settings-repository';

const repository = new DexieCatalogRepository();
const manageCatalogUseCase = new ManageCatalogUseCase(repository);

const settingsRepo = new DexieSettingsRepository();
const getSettingsUseCase = new GetSettingsUseCase(settingsRepo);

export default function ProductsManager() {
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [currencySymbol, setCurrencySymbol] = useState('FCFA');
  const [currencyCode, setCurrencyCode] = useState('XOF');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ACTIVE' | 'INACTIVE' | 'ARCHIVED' | ''>('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const [categoryMode, setCategoryMode] = useState<'SELECT' | 'NEW'>('SELECT');
  const [newCategoryName, setNewCategoryName] = useState('');

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<CreateProductInput>({
    resolver: zodResolver(CreateProductSchema),
    defaultValues: {
      type: 'PRODUCT',
      currency: 'XOF',
      currencyScale: 0,
    }
  });

  const loadData = async () => {
    try {
      const [prods, cats, settings] = await Promise.all([
        statusFilter ? repository.getAllProducts() : repository.getAllProductsActive(),
        repository.getAllCategoriesActive(),
        getSettingsUseCase.getCompanyProfile(),
      ]);
      setProducts(prods);
      setCategories(cats);
      
      if (settings) {
        setCurrencySymbol(settings.currencySymbol);
        setCurrencyCode(settings.currencyCode);
      }
    } catch (error) {
      console.error(error);
      setMessage('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [statusFilter]);

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const newCategory = await manageCatalogUseCase.createCategory({
        name: newCategoryName.trim(),
        description: ''
      });
      setCategories(prev => [...prev, newCategory]);
      setValue('categoryId', newCategory.id);
      setCategoryMode('SELECT');
      setNewCategoryName('');
      setMessage('Catégorie ajoutée avec succès.');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erreur création catégorie");
    }
  };

  const onSubmit = async (data: CreateProductInput) => {
    setSaving(true);
    setMessage('');
    try {
      if (data.categoryId === '') data.categoryId = undefined;
      // Forcer la devise de l'entreprise (simplification)
      data.currency = currencyCode;
      if (editingId) await manageCatalogUseCase.updateProduct(editingId, { ...data, isActive: true });
      else await manageCatalogUseCase.createProduct(data);
      setMessage(`Produit/Service ${editingId ? 'modifié' : 'ajouté'} avec succès !`);
      setEditingId(null);
      reset({ ...data, name: '', description: '', sku: '', barcode: '' });
      await loadData();
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : "Erreur lors de l'ajout");
    } finally {
      setSaving(false);
    }
  };

  const onArchive = async (id: string) => {
    if (confirm('Voulez-vous vraiment archiver cet élément ?')) {
      try {
        await manageCatalogUseCase.archiveProduct(id);
        await loadData();
      } catch (error: unknown) {
        setMessage(error instanceof Error ? error.message : "Erreur lors de l'archivage");
      }
    }
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-4 rounded-md ${message.includes('succès') ? 'bg-green-500/10 text-green-800 dark:text-green-200' : 'bg-red-500/10 text-red-800 dark:text-red-200'}`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 border rounded-md p-4 space-y-4">
          <h3 className="font-semibold text-lg">{editingId ? 'Modifier' : 'Ajouter'} au catalogue</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <label className="text-sm font-medium">Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input type="radio" value="PRODUCT" {...register('type')} /> Produit
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" value="SERVICE" {...register('type')} /> Service
                  </label>
                </div>
              </div>

              <div className="space-y-2 col-span-2">
                <label htmlFor="catalog-name" className="text-sm font-medium">Nom *</label>
                <input 
                  id="catalog-name"
                  {...register('name')} 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" 
                />
                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="catalog-price" className="text-sm font-medium">Prix Unitaire *</label>
                <div className="relative">
                  <input 
                    id="catalog-price"
                    type="number"
                    {...register('unitPriceMinor', { valueAsNumber: true })} 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pr-12 text-sm" 
                  />
                  <div className="absolute right-3 top-2.5 text-sm text-muted-foreground">{currencySymbol}</div>
                </div>
                {errors.unitPriceMinor && <p className="text-xs text-red-500">{errors.unitPriceMinor.message}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="catalog-category" className="text-sm font-medium">Catégorie</label>
                {categoryMode === 'SELECT' ? (
                  <select 
                    id="catalog-category"
                    {...register('categoryId')} 
                    onChange={(e) => {
                      if (e.target.value === 'NEW') {
                        setCategoryMode('NEW');
                        setValue('categoryId', undefined);
                      } else {
                        setValue('categoryId', e.target.value || undefined);
                      }
                    }}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Aucune</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                    <option value="NEW">+ Nouvelle catégorie...</option>
                  </select>
                ) : (
                  <div className="flex gap-2 rounded-md border p-2 bg-muted/30">
                    <input autoFocus placeholder="Nom catégorie" className="h-9 flex-1 rounded-md border px-2 text-sm" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} />
                    <button type="button" className="rounded-md border px-2 py-1 text-sm bg-secondary text-secondary-foreground" onClick={handleCreateCategory}>Créer</button>
                    <button type="button" className="rounded-md border px-2 py-1 text-sm" onClick={() => { setCategoryMode('SELECT'); setNewCategoryName(''); }}>Annuler</button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="catalog-sku" className="text-sm font-medium">SKU / Réf</label>
                <input 
                  id="catalog-sku"
                  {...register('sku')} 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" 
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="catalog-barcode" className="text-sm font-medium">Code-barres</label>
                <input 
                  id="catalog-barcode"
                  {...register('barcode')} 
                  placeholder="EAN, UPC, QR..."
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" 
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="catalog-unit" className="text-sm font-medium">Unité (ex: kg, heure)</label>
                <input 
                  id="catalog-unit"
                  {...register('unitLabel')} 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" 
                />
              </div>

              <div className="space-y-2 col-span-2">
                <label htmlFor="catalog-description" className="text-sm font-medium">Description</label>
                <textarea 
                  id="catalog-description"
                  {...register('description')} 
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  rows={2}
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={saving}
              className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              {saving ? 'Enregistrement...' : editingId ? 'Enregistrer' : 'Ajouter'}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 border rounded-md p-4">
          <div className="mb-4 grid gap-2 sm:grid-cols-4"><input aria-label="Rechercher dans le catalogue" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher..." className="h-10 rounded-md border px-3" /><select aria-label="Filtrer par catégorie" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="h-10 rounded-md border px-2"><option value="">Toutes catégories</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select><select aria-label="Filtrer par type" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="h-10 rounded-md border px-2"><option value="">Tous types</option><option value="PRODUCT">Produits</option><option value="SERVICE">Services</option></select><select aria-label="Filtrer par statut" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="h-10 rounded-md border px-2"><option value="">Actifs</option><option value="INACTIVE">Inactifs</option><option value="ARCHIVED">Archivés</option></select></div>
          <h3 className="font-semibold text-lg mb-4">Liste des éléments</h3>
          {products.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun produit ou service défini.</p>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted text-foreground border-b">
                  <tr>
                    <th className="px-4 py-3 font-medium">Réf</th>
                    <th className="px-4 py-3 font-medium">Nom</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium text-right">Prix</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {products.filter((p) => p.normalizedName.includes(query.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')) && (!typeFilter || p.type === typeFilter) && (!categoryFilter || p.categoryId === categoryFilter) && (!statusFilter || (statusFilter === 'ARCHIVED' ? !!p.archivedAt : statusFilter === 'INACTIVE' ? !p.isActive && !p.archivedAt : true))).map(p => (
                    <tr key={p.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3 text-muted-foreground">{p.sku || '-'}</td>
                      <td className="px-4 py-3 font-medium">{p.name} {p.archivedAt && <span className="text-xs text-amber-800 dark:text-amber-200">(Archivé)</span>}{!p.archivedAt && !p.isActive && <span className="text-xs text-amber-800 dark:text-amber-200">(Inactif)</span>}</td>
                      <td className="px-4 py-3">{p.type === 'PRODUCT' ? 'Produit' : 'Service'}</td>
                      <td className="px-4 py-3 text-right font-medium">
                        {p.unitPriceMinor} {currencySymbol} {p.unitLabel ? `/ ${p.unitLabel}` : ''}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!p.archivedAt && <><button onClick={() => { setEditingId(p.id); reset({ name: p.name, type: p.type, categoryId: p.categoryId || '', sku: p.sku, description: p.description, unitLabel: p.unitLabel, unitPriceMinor: p.unitPriceMinor, currency: p.currency, currencyScale: p.currencyScale, defaultTaxRateBasisPoints: p.defaultTaxRateBasisPoints }); }} className="mr-2 min-h-11 px-2 text-blue-800 dark:text-blue-200 font-medium">Modifier</button><button 
                          onClick={() => onArchive(p.id)}
                          className="min-h-11 px-2 text-red-800 dark:text-red-200 hover:text-red-800 dark:text-red-200 font-medium"
                        >
                          Archiver
                        </button></>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
