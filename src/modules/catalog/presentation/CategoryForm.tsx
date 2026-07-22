import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CategoryRecord, CreateCategoryInput, CreateCategorySchema, UpdateCategoryInput } from '../domain/catalog';

interface CategoryFormProps {
  initialData?: CategoryRecord | null;
  onSave: (data: UpdateCategoryInput) => Promise<void>;
  onCancel: () => void;
}

export function CategoryForm({ 
  initialData, 
  onSave, 
  onCancel
}: CategoryFormProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<CreateCategoryInput>({
    resolver: zodResolver(CreateCategorySchema),
    defaultValues: initialData ? {
      name: initialData.name,
      description: initialData.description || '',
    } : {
      name: '',
      description: ''
    }
  });

  const onSubmit = async (data: CreateCategoryInput) => {
    setSaving(true);
    setError('');
    try {
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
        <h2 className="text-lg font-bold">{initialData ? 'Modifier' : 'Ajouter'} une catégorie</h2>
        <button type="button" onClick={onCancel} className="text-sm font-medium px-3 py-1.5 border rounded-xl hover:bg-muted">Annuler</button>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-6 max-w-lg mx-auto">
        {error && <div className="p-3 bg-red-50 text-red-800 rounded-md text-sm">{error}</div>}

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="category-name" className="text-sm font-medium">Nom de la catégorie *</label>
            <input 
              id="category-name"
              {...register('name')} 
              className="flex h-12 w-full rounded-xl border border-input bg-background px-4 text-base" 
              placeholder="Ex: Électronique, Prestations web..."
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="category-description" className="text-sm font-medium">Description</label>
            <textarea 
              id="category-description"
              {...register('description')} 
              className="flex w-full rounded-xl border border-input bg-background px-4 py-3 text-base min-h-[100px]"
              placeholder="Description détaillée (optionnelle)"
            />
          </div>
        </div>

        <div className="pt-4 pb-8">
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
