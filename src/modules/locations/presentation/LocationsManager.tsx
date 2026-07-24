/* eslint-disable react-hooks/exhaustive-deps, react-hooks/incompatible-library */
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LocationRecord, CreateLocationSchema, CreateLocationInput } from '../domain/location';
import { ManageLocationsUseCase } from '../application/manage-locations';
import { DexieLocationRepository } from '../infrastructure/dexie-location-repository';

const repository = new DexieLocationRepository();
const manageLocationsUseCase = new ManageLocationsUseCase(repository);

export default function LocationsManager() {
  const [locations, setLocations] = useState<LocationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [query, setQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<CreateLocationInput>({
    resolver: zodResolver(CreateLocationSchema),
    defaultValues: { level: 'COUNTRY', parentId: '' }
  });
  const selectedLevel = watch('level');

  const loadLocations = async () => {
    try {
      const data = showArchived ? await repository.getAll() : await repository.getAllActive();
      setLocations(data);
    } catch (error) {
      console.error(error);
      setMessage('Erreur lors du chargement des localités');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLocations();
  }, [showArchived]);

  const onSubmit = async (data: CreateLocationInput) => {
    setSaving(true);
    setMessage('');
    try {
      if (editingId) await manageLocationsUseCase.updateLocation(editingId, data);
      else await manageLocationsUseCase.createLocation(data);
      setMessage(`Localité ${editingId ? 'modifiée' : 'ajoutée'} avec succès !`);
      setEditingId(null);
      reset({ level: 'COUNTRY', parentId: '' });
      await loadLocations();
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : "Erreur lors de l'ajout");
    } finally {
      setSaving(false);
    }
  };

  const onArchive = async (id: string) => {
    if (confirm('Voulez-vous vraiment archiver cette localité ?')) {
      try {
        await manageLocationsUseCase.archiveLocation(id);
        await loadLocations();
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
          <h3 className="font-semibold text-lg">{editingId ? 'Modifier' : 'Ajouter'} une localité</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nom *</label>
              <input 
                {...register('name')} 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" 
                placeholder="ex: Dakar, Abidjan..."
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Niveau</label>
              <select 
                {...register('level')} 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="COUNTRY">Pays</option>
                <option value="REGION">Région</option>
                <option value="DEPARTMENT">Département</option>
                <option value="CITY">Commune / Ville</option>
                <option value="DISTRICT">Quartier</option>
              </select>
            </div>

            {selectedLevel !== 'COUNTRY' && <div className="space-y-2">
              <label className="text-sm font-medium">Parent *</label>
              <select {...register('parentId')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">Sélectionnez...</option>
                {locations.filter((l) => !l.archivedAt && l.level === ({ REGION: 'COUNTRY', DEPARTMENT: 'REGION', CITY: 'DEPARTMENT', DISTRICT: 'CITY' } as const)[selectedLevel]).map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
              {errors.parentId && <p className="text-xs text-red-500">{errors.parentId.message}</p>}
            </div>}

            <button 
              type="submit" 
              disabled={saving}
              className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              {saving ? 'Enregistrement...' : editingId ? 'Enregistrer' : 'Ajouter'}
            </button>
          </form>
        </div>

        <div className="md:col-span-2 border rounded-md p-4">
          <div className="mb-4 flex flex-wrap gap-2"><input aria-label="Rechercher une localité" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher..." className="h-10 flex-1 rounded-md border px-3" /><label className="flex items-center gap-2"><input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} /> Archives</label></div>
          <h3 className="font-semibold text-lg mb-4">Liste des localités</h3>
          {locations.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune localité définie.</p>
          ) : (
            <div className="rounded-md border">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted text-muted-foreground border-b">
                  <tr>
                    <th className="px-4 py-3 font-medium">Nom</th>
                    <th className="px-4 py-3 font-medium">Niveau</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {locations.filter((loc) => loc.normalizedName.includes(query.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''))).map(loc => (
                    <tr key={loc.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3">{loc.name} {loc.archivedAt && <span className="text-xs text-amber-800 dark:text-amber-200">(Archivée)</span>}</td>
                      <td className="px-4 py-3">{loc.level}</td>
                      <td className="px-4 py-3 text-right">
                        {!loc.archivedAt && <><button onClick={() => { setEditingId(loc.id); reset({ name: loc.name, level: loc.level, parentId: loc.parentId || '' }); }} className="mr-3 text-blue-600 font-medium">Modifier</button><button 
                          onClick={() => onArchive(loc.id)}
                          className="text-red-500 hover:text-red-800 dark:text-red-200 font-medium"
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
