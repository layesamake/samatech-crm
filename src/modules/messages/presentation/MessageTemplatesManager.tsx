/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
'use client';

import { useEffect, useState } from 'react';
import { MESSAGE_CATEGORIES, MessageTemplateInput, MessageTemplateRecord, extractVariables } from '../domain/message-template';
import { ManageMessageTemplatesUseCase } from '../application/manage-message-templates';

const useCase = new ManageMessageTemplatesUseCase();
const empty: MessageTemplateInput = { name: '', category: 'FOLLOW_UP', content: '' };

export default function MessageTemplatesManager() {
  const [items, setItems] = useState<MessageTemplateRecord[]>([]);
  const [form, setForm] = useState<MessageTemplateInput>(empty);
  const [editingId, setEditingId] = useState<string>();
  const [showArchived, setShowArchived] = useState(false);
  const [message, setMessage] = useState('');
  const load = async () => setItems(showArchived ? await useCase.getAll() : await useCase.getActive());
  useEffect(() => { void load(); }, [showArchived]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setMessage('');
    try {
      if (editingId) await useCase.update(editingId, form); else await useCase.create(form);
      setMessage(`Modèle ${editingId ? 'modifié' : 'créé'} avec succès`); setEditingId(undefined); setForm(empty); await load();
    } catch (error: unknown) { setMessage(error instanceof Error ? error.message : 'Erreur du modèle'); }
  };
  return <div className="grid gap-6 lg:grid-cols-[minmax(280px,360px)_1fr]">
    <form onSubmit={submit} className="space-y-4 rounded-xl border bg-white p-4">
      <h2 className="text-lg font-semibold">{editingId ? 'Modifier le modèle' : 'Nouveau modèle'}</h2>
      {message && <p role="status" className={message.includes('succès') ? 'text-green-700' : 'text-red-700'}>{message}</p>}
      <label className="block text-sm font-medium">Nom<input aria-label="Nom du modèle" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 h-11 w-full rounded-md border px-3" /></label>
      <label className="block text-sm font-medium">Catégorie<select aria-label="Catégorie du modèle" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as MessageTemplateInput['category'] })} className="mt-1 h-11 w-full rounded-md border px-3">{MESSAGE_CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></label>
      <label className="block text-sm font-medium">Contenu<textarea aria-label="Contenu du modèle" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={7} className="mt-1 w-full rounded-md border p-3" /></label>
      <p className="text-xs text-muted-foreground">Variables : prenom, nom, contact, entreprise, produit, localite, nom_entreprise.</p>
      <div className="rounded-md bg-slate-50 p-3"><strong>Aperçu texte</strong><p className="mt-2 whitespace-pre-wrap">{form.content || 'Votre message apparaîtra ici.'}</p><p className="mt-2 text-xs">Détectées : {extractVariables(form.content).join(', ') || 'aucune'}</p></div>
      <button className="h-11 w-full rounded-md bg-blue-600 text-white" type="submit">{editingId ? 'Enregistrer les modifications' : 'Créer le modèle'}</button>
    </form>
    <section className="space-y-3"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Modèles</h2><label className="flex gap-2 text-sm"><input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} /> Archives</label></div>
      {items.length === 0 && <p className="rounded-xl border border-dashed p-6 text-center">Aucun modèle.</p>}
      {items.map((item) => <article key={item.id} className="rounded-xl border bg-white p-4"><div className="flex justify-between gap-3"><div><h3 className="font-semibold">{item.name} {item.archivedAt && <span className="text-amber-700">(Archivé)</span>}</h3><p className="text-xs text-muted-foreground">{item.category}</p></div>{!item.archivedAt && <div className="flex flex-wrap gap-2"><button onClick={() => { setEditingId(item.id); setForm({ name: item.name, category: item.category, content: item.content }); }} className="text-blue-700">Modifier</button><button onClick={async () => { await useCase.duplicate(item.id); await load(); }} className="text-blue-700">Dupliquer</button><button onClick={async () => { if (confirm('Archiver ce modèle ?')) { await useCase.archive(item.id); await load(); } }} className="text-red-700">Archiver</button></div>}</div><p className="mt-3 whitespace-pre-wrap text-sm">{item.content}</p></article>)}
    </section>
  </div>;
}
