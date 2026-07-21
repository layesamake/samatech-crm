import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ProductRecord, CreateProductInput, CategoryRecord, UpdateProductInput, UpdateProductSchema } from '../domain/catalog';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const [imageBase64, setImageBase64] = useState<string | undefined>(initialData?.imageBase64);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<UpdateProductInput>({
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
      imageBase64: initialData.imageBase64,
    } : {
      type: 'PRODUCT',
      currency: currencyCode,
      currencyScale: 0,
      isActive: true,
      unitPriceMinor: 0,
    }
  });

  const watchType = watch('type');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError("L'image est trop volumineuse (max 2MB)");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImageBase64(result);
        setValue('imageBase64', result);
        setError('');
      };
      reader.readAsDataURL(file);
    }
  };

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

  const InputField = ({ label, id, errorMsg, required = false, type = 'text', ...props }: any) => (
    <div className="space-y-1 relative pt-4">
      <label htmlFor={id} className="absolute top-0 left-0 text-xs font-medium text-blue-600 transition-all">
        {label} {required && '*'}
      </label>
      <input 
        id={id}
        type={type}
        className={cn(
          "flex w-full border-0 border-b border-gray-300 bg-transparent px-0 py-2 text-base text-gray-900 placeholder:text-gray-400 focus:border-blue-600 focus:ring-0",
          errorMsg && "border-red-500 focus:border-red-500"
        )}
        {...props}
      />
      {errorMsg && <p className="text-xs text-red-500 mt-1">{errorMsg}</p>}
    </div>
  );

  return (
    <div className="bg-slate-50 min-h-screen pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b px-2 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <button type="button" onClick={onCancel} className="p-2 hover:bg-muted rounded-full">
            <ArrowLeft className="w-6 h-6 text-gray-800" />
          </button>
          <h2 className="text-lg font-bold text-gray-900">{initialData ? 'Modifier un article' : 'Ajouter un article'}</h2>
        </div>
        <button 
          onClick={handleSubmit(onSubmit)}
          disabled={saving}
          className="text-sm font-bold text-gray-800 hover:text-blue-600 px-4 py-2 uppercase tracking-wide"
        >
          {saving ? 'EN COURS...' : 'ENREGISTRER'}
        </button>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4 max-w-lg mx-auto">
        {error && <div className="p-3 bg-red-50 text-red-800 rounded-md text-sm">{error}</div>}

        {/* Card 1: Informations Générales */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-3">
              <label className="text-xs font-medium text-blue-600">Type de l'article</label>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center", watchType === 'PRODUCT' ? "border-blue-600" : "border-gray-400")}>
                    {watchType === 'PRODUCT' && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />}
                  </div>
                  <input type="radio" value="PRODUCT" {...register('type')} className="sr-only" /> 
                  <span className="text-base text-gray-800">Produits</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center", watchType === 'SERVICE' ? "border-blue-600" : "border-gray-400")}>
                    {watchType === 'SERVICE' && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />}
                  </div>
                  <input type="radio" value="SERVICE" {...register('type')} className="sr-only" /> 
                  <span className="text-base text-gray-800">Service</span>
                </label>
              </div>
            </div>
            <div 
              className="relative w-24 h-24 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center rounded-lg bg-gray-50 text-gray-500 cursor-pointer hover:bg-gray-100 overflow-hidden"
              onClick={() => fileInputRef.current?.click()}
            >
              {imageBase64 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageBase64} alt="Produit" className="w-full h-full object-cover" />
              ) : (
                <>
                  <span className="text-xl leading-none mb-1">+</span>
                  <span className="text-xs text-center leading-tight">Ajouter<br/>une image</span>
                </>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageChange} 
                accept="image/*" 
                className="hidden" 
              />
            </div>
          </div>

          <InputField 
            label="Nom de l'article" 
            id="catalog-name" 
            required 
            {...register('name')} 
            errorMsg={errors.name?.message} 
          />

          <InputField 
            label="Unité" 
            id="catalog-unit" 
            placeholder="Sélectionner ou taper pour ajouter"
            {...register('unitLabel')} 
          />

          <div className="space-y-1 relative pt-4">
            <label htmlFor="catalog-category" className="absolute top-0 left-0 text-xs font-medium text-blue-600 transition-all">Catégorie</label>
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
                className="flex w-full border-0 border-b border-gray-300 bg-transparent px-0 py-2 text-base text-gray-900 focus:border-blue-600 focus:ring-0"
              >
                <option value="">Aucune</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
                <option value="NEW">+ Nouvelle catégorie...</option>
              </select>
            ) : (
              <div className="flex gap-2 pt-2 border-b border-gray-300 pb-1">
                <input autoFocus placeholder="Nom catégorie" className="flex-1 bg-transparent border-none px-0 text-base text-gray-900 placeholder:text-gray-400 focus:ring-0" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} />
                <button type="button" className="text-sm font-semibold text-blue-600" onClick={handleCreateCategory}>Créer</button>
                <button type="button" className="text-sm font-semibold text-gray-500" onClick={() => { setCategoryMode('SELECT'); setNewCategoryName(''); }}>X</button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <InputField 
              label="SKU / Réf" 
              id="catalog-sku" 
              {...register('sku')} 
            />
            <InputField 
              label="Code-barres" 
              id="catalog-barcode" 
              placeholder="EAN, UPC..."
              {...register('barcode')} 
            />
          </div>
        </div>

        {/* Card 2: Informations sur les ventes */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 space-y-6">
          <h3 className="font-semibold text-gray-900 text-base">Informations sur les ventes</h3>

          <InputField 
            label={`Prix de vente(${currencyCode})`} 
            id="catalog-price" 
            required 
            type="number"
            {...register('unitPriceMinor', { valueAsNumber: true })} 
            errorMsg={errors.unitPriceMinor?.message} 
          />

          <InputField 
            label="Description" 
            id="catalog-description" 
            {...register('description')} 
          />

          <div className="space-y-1 relative pt-4">
            <label htmlFor="catalog-tax" className="absolute top-0 left-0 text-xs font-medium text-blue-600 transition-all">Taxe</label>
            <select 
              id="catalog-tax"
              className="flex w-full border-0 border-b border-gray-300 bg-transparent px-0 py-2 text-base text-gray-900 focus:border-blue-600 focus:ring-0"
              defaultValue=""
            >
              <option value="" disabled className="text-gray-400">Sélectionnez une Taxe</option>
              <option value="1800">TVA (18%)</option>
              <option value="0">Aucune</option>
            </select>
          </div>
          
          <div className="pt-2 flex items-center gap-3">
             <div className="flex items-center">
                <input 
                  id="catalog-active"
                  type="checkbox"
                  {...register('isActive')} 
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-600"
                />
             </div>
             <div>
               <label htmlFor="catalog-active" className="text-base font-medium text-gray-900">Élément actif</label>
               <p className="text-xs text-gray-500">Sera visible lors de la création de factures</p>
             </div>
          </div>
        </div>
      </form>
    </div>
  );
}
