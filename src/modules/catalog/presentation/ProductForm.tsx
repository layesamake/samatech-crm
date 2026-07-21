import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ProductRecord, CreateProductInput, CategoryRecord, UpdateProductInput, UpdateProductSchema } from '../domain/catalog';

interface ProductFormProps {
  initialData?: ProductRecord | null;
  categories: CategoryRecord[];
  currencySymbol: string;
  currencyCode: string;
  onSave: (data: UpdateProductInput) => Promise<void>;
  onCancel: () => void;
  onCreateCategory: (name: string) => Promise<CategoryRecord>;
}

export function ProductForm({ 
  initialData, 
  categories, 
  currencySymbol, 
  currencyCode, 
  onSave, 
  onCancel,
  onCreateCategory 
}: ProductFormProps) {
  const [saving, setSaving] = useState(false);
  const [categoryMode, setCategoryMode] = useState<'SELECT' | 'NEW'>('SELECT');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [error, setError] = useState('');

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<UpdateProductInput>({
    resolver: zodResolver(UpdateProductSchema),
    defaultValues: initialData ? {
      name: initialData.name,
      type: initialData.type,
      categoryId: initialData.categoryId || '',
      sku: initialData.sku || '',
      barcode: initialData.barcode || '',
      description: initialData.description || '',
      unitLabel: initialData.unitLabel || '',
      unitPriceMinor: initialData.unitPriceMinor,
      currency: initialData.currency,
      currencyScale: initialData.currencyScale,
      defaultTaxRateBasisPoints: initialData.defaultTaxRateBasisPoints,
      isActive: initialData.isActive,
    } : {
      type: 'PRODUCT',
      currency: currencyCode,
      currencyScale: 0,
      isActive: true,
      unitPriceMinor: 0,
    }
  });

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const newCategory = await onCreateCategory(newCategoryName.trim());
      setValue('categoryId', newCategory.id);
      setCategoryMode('SELECT');
      setNewCategoryName('');
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur création catégorie");
    }
  };

  const onSubmit = async (data: UpdateProductInput) => {
    setSaving(true);
    setError('');
    try {
      if (data.categoryId === '') data.categoryId = undefined;
      data.currency = currencyCode;
      await onSave(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-background min-h-screen pb-24">
      <div className="sticky top-0 z-10 bg-background border-b px-4 py-3 flex items-center justify-between">
        <h2 className="text-lg font-bold">{initialData ? 'Modifier' : 'Ajouter'} {initialData?.type === 'SERVICE' ? 'un service' : 'un produit'}</h2>
        <button type="button" onClick={onCancel} className="text-sm font-medium px-3 py-1.5 border rounded-xl hover:bg-muted">Annuler</button>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-6 max-w-lg mx-auto">
        {error && <div className="p-3 bg-red-50 text-red-800 rounded-md text-sm">{error}</div>}

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Type</label>
            <div className="flex gap-4 p-1 bg-muted/50 rounded-xl">
              <label className="flex-1 flex items-center justify-center gap-2 bg-background shadow-sm py-2 rounded-lg border cursor-pointer">
                <input type="radio" value="PRODUCT" {...register('type')} className="sr-only" /> Produit
              </label>
              <label className="flex-1 flex items-center justify-center gap-2 hover:bg-background/50 py-2 rounded-lg cursor-pointer transition-colors">
                <input type="radio" value="SERVICE" {...register('type')} className="sr-only" /> Service
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="catalog-name" className="text-sm font-medium">Nom *</label>
            <input 
              id="catalog-name"
              {...register('name')} 
              className="flex h-12 w-full rounded-xl border border-input bg-background px-4 text-base" 
              placeholder="Nom du produit ou service"
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
                className="flex h-12 w-full rounded-xl border border-input bg-background px-4 pr-16 text-base" 
                placeholder="0"
              />
              <div className="absolute right-4 top-3 text-sm font-medium text-muted-foreground">{currencySymbol}</div>
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
                className="flex h-12 w-full rounded-xl border border-input bg-background px-4 text-base"
              >
                <option value="">Aucune</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
                <option value="NEW">+ Nouvelle catégorie...</option>
              </select>
            ) : (
              <div className="flex gap-2 rounded-xl border p-2 bg-muted/30">
                <input autoFocus placeholder="Nom catégorie" className="h-10 flex-1 rounded-lg border px-3 text-sm bg-background" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} />
                <button type="button" className="rounded-lg border px-3 py-2 text-sm bg-secondary text-secondary-foreground font-medium" onClick={handleCreateCategory}>Créer</button>
                <button type="button" className="rounded-lg border px-3 py-2 text-sm bg-background" onClick={() => { setCategoryMode('SELECT'); setNewCategoryName(''); }}>Annuler</button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="catalog-sku" className="text-sm font-medium">SKU / Réf</label>
              <input 
                id="catalog-sku"
                {...register('sku')} 
                className="flex h-12 w-full rounded-xl border border-input bg-background px-4 text-base" 
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="catalog-unit" className="text-sm font-medium">Unité (ex: kg)</label>
              <input 
                id="catalog-unit"
                {...register('unitLabel')} 
                className="flex h-12 w-full rounded-xl border border-input bg-background px-4 text-base" 
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="catalog-barcode" className="text-sm font-medium">Code-barres</label>
            <input 
              id="catalog-barcode"
              {...register('barcode')} 
              placeholder="EAN, UPC..."
              className="flex h-12 w-full rounded-xl border border-input bg-background px-4 text-base" 
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="catalog-description" className="text-sm font-medium">Description</label>
            <textarea 
              id="catalog-description"
              {...register('description')} 
              className="flex w-full rounded-xl border border-input bg-background px-4 py-3 text-base min-h-[100px]"
              placeholder="Description détaillée (optionnelle)"
            />
          </div>

          <div className="flex items-center gap-3 p-4 border rounded-xl bg-muted/20">
            <input 
              id="catalog-active"
              type="checkbox"
              {...register('isActive')} 
              className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="catalog-active" className="text-sm font-medium leading-none">
              Élément actif <span className="block text-xs text-muted-foreground font-normal mt-1">Sera visible lors de la création de factures</span>
            </label>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t">
          <div className="max-w-lg mx-auto">
            <button 
              type="submit" 
              disabled={saving}
              className="w-full flex items-center justify-center rounded-xl text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 h-14"
            >
              {saving ? 'Enregistrement...' : initialData ? 'Mettre à jour' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
