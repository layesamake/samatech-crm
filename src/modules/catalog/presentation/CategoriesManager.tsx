/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CategoryRecord, CreateCategorySchema, CreateCategoryInput } from '../domain/catalog';
import { ManageCatalogUseCase } from '../application/manage-catalog';
import { DexieCatalogRepository } from '../infrastructure/dexie-catalog-repository';

const repository = new DexieCatalogRepository();
const manageCatalogUseCase = new ManageCatalogUseCase(repository);

export default function CategoriesManager() {
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [query, setQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateCategoryInput>({
    resolver: zodResolver(CreateCategorySchema),
  });

  const loadCategories = async () => {
    try {
      const data = showArchived ? await repository.getAllCategories() : await repository.getAllCategoriesActive();
      setCategories(data);
    } catch (error) {
      console.error(error);
      setMessage('Erreur lors du chargement des catégories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadCategories();
  }, [showArchived]);

  const onSubmit = async (data: CreateCategoryInput) => {
    setSaving(true);
    setMessage('');
    try {
      if (editingId) await manageCatalogUseCase.updateCategory(editingId, data);
      else await manageCatalogUseCase.createCategory(data);
      setMessage(`Catégorie ${editingId ? 'modifiée' : 'ajoutée'} avec succès !`);
      setEditingId(null);
      reset();
      await loadCategories();
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : "Erreur lors de l'ajout");
    } finally {
      setSaving(false);
    }
  };

  const onArchive = async (id: string) => {
    if (confirm('Voulez-vous vraiment archiver cette catégorie ?')) {
      try {
        await manageCatalogUseCase.archiveCategory(id);
        await loadCategories();
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 border rounded-md p-4 space-y-4">
          <h3 className="font-semibold text-lg">{editingId ? 'Modifier' : 'Ajouter'} une catégorie</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="category-name" className="text-sm font-medium">Nom *</label>
              <input 
                id="category-name"
                {...register('name')} 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" 
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="category-description" className="text-sm font-medium">Description</label>
              <textarea 
                id="category-description"
                {...register('description')} 
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <button 
                type="submit" 
                disabled={saving}
                className="flex-1 inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
              >
                {saving ? 'Enregistrement...' : editingId ? 'Enregistrer' : 'Ajouter'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    reset({ name: '', description: '' });
                  }}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                >
                  Annuler
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="md:col-span-2 border rounded-md p-4">
          <div className="mb-4 flex gap-2"><input aria-label="Rechercher une catégorie" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher..." className="h-10 flex-1 rounded-md border px-3" /><label className="flex items-center gap-2"><input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} /> Archives</label></div>
          <h3 className="font-semibold text-lg mb-4">Liste des catégories</h3>
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune catégorie définie.</p>
          ) : (
            <div className="rounded-md border">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted text-foreground border-b">
                  <tr>
                    <th className="px-4 py-3 font-medium">Nom</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {categories.filter((cat) => cat.normalizedName.includes(query.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''))).map(cat => (
                    <tr key={cat.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <div className="font-medium">{cat.name} {cat.archivedAt && <span className="text-xs text-amber-800 dark:text-amber-200">(Archivée)</span>}</div>
                        {cat.description && <div className="text-xs text-muted-foreground">{cat.description}</div>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!cat.archivedAt && <><button onClick={() => { setEditingId(cat.id); reset({ name: cat.name, description: cat.description }); }} className="mr-2 min-h-11 px-2 text-blue-800 dark:text-blue-200 font-medium">Modifier</button><button 
                          onClick={() => onArchive(cat.id)}
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
