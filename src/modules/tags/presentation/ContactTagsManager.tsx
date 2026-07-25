'use client';

import { useEffect, useState } from 'react';
import { Pencil } from 'lucide-react';
import { TagRecord } from '@/modules/prospects/domain/prospect';
import { ManageTagsUseCase } from '../application/manage-tags';
import { TagPicker } from './TagPicker';

const tagsUseCase = new ManageTagsUseCase();

export function ContactTagsManager({ contactId, initialTags }: { contactId: string; initialTags: TagRecord[] }) {
  const [tags, setTags] = useState<TagRecord[]>([]);
  const [selectedIds, setSelectedIds] = useState(initialTags.map((tag) => tag.id));
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { void tagsUseCase.listActive().then(setTags).catch((caught) => setError(caught instanceof Error ? caught.message : 'Chargement des tags impossible')); }, []);
  useEffect(() => setSelectedIds(initialTags.map((tag) => tag.id)), [initialTags]);

  const save = async () => {
    setSaving(true); setError('');
    try { await tagsUseCase.replaceContactTags(contactId, selectedIds); setEditing(false); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Mise à jour des tags impossible'); }
    finally { setSaving(false); }
  };

  return <section className="rounded-xl border bg-card p-4"><div className="flex items-center justify-between gap-3"><h2 className="font-semibold">Tags</h2><button type="button" onClick={() => setEditing((value) => !value)} className="inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm"><Pencil className="size-4" />{editing ? 'Fermer' : 'Modifier'}</button></div>{error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}{editing ? <div className="mt-3 space-y-3"><TagPicker tags={tags} selectedIds={selectedIds} onChange={setSelectedIds} /><button type="button" disabled={saving} onClick={() => void save()} className="h-10 rounded-md bg-emerald-700 px-4 text-sm font-medium text-white">{saving ? 'Enregistrement…' : 'Enregistrer les tags'}</button></div> : <p className="mt-2 text-sm text-muted-foreground">Ajoutez ou retirez des tags depuis ce bouton.</p>}</section>;
}
