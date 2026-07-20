/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useEffect, useRef, useState } from 'react';
import { MESSAGE_CATEGORIES, MessageTemplateInput, MessageTemplateRecord, extractVariables, resolveMessage } from '../domain/message-template';
import { ManageMessageTemplatesUseCase } from '../application/manage-message-templates';

const useCase = new ManageMessageTemplatesUseCase();
const empty: MessageTemplateInput = { name: '', category: 'FOLLOW_UP', content: '' };
const PERSONALIZATION_VARIABLES = [
  { variable: 'prenom', label: 'Prénom', example: 'Fatou' },
  { variable: 'nom', label: 'Nom', example: 'Diop' },
  { variable: 'contact', label: 'Nom complet', example: 'Fatou Diop' },
  { variable: 'entreprise', label: 'Entreprise du contact', example: 'Diop Services' },
  { variable: 'produit', label: 'Produits demandés', example: 'Conseil, Formation' },
  { variable: 'localite', label: 'Localité', example: 'Dakar' },
  { variable: 'nom_entreprise', label: 'Votre entreprise', example: 'SAMTECH' },
] as const;

export default function MessageTemplatesManager() {
  const [items, setItems] = useState<MessageTemplateRecord[]>([]);
  const [form, setForm] = useState<MessageTemplateInput>(empty);
  const [editingId, setEditingId] = useState<string>();
  const [showArchived, setShowArchived] = useState(false);
  const [message, setMessage] = useState('');
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const load = async () => setItems(showArchived ? await useCase.getAll() : await useCase.getActive());
  useEffect(() => { void load(); }, [showArchived]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setMessage('');
    try {
      if (editingId) await useCase.update(editingId, form); else await useCase.create(form);
      setMessage(`Modèle ${editingId ? 'modifié' : 'créé'} avec succès`); setEditingId(undefined); setForm(empty); await load();
    } catch (error: unknown) { setMessage(error instanceof Error ? error.message : 'Erreur du modèle'); }
  };
  const insertVariable = (variable: string) => {
    const token = `{{${variable}}}`;
    const textarea = contentRef.current;
    const start = textarea?.selectionStart ?? form.content.length;
    const end = textarea?.selectionEnd ?? start;
    const nextContent = `${form.content.slice(0, start)}${token}${form.content.slice(end)}`;
    setForm({ ...form, content: nextContent });
    requestAnimationFrame(() => {
      textarea?.focus();
      textarea?.setSelectionRange(start + token.length, start + token.length);
    });
  };
  const personalizedPreview = resolveMessage(form.content, {
    prenom: 'Fatou', nom: 'Diop', contact: 'Fatou Diop', entreprise: 'Diop Services',
    produits: ['Conseil', 'Formation'], localite: 'Dakar', nomEntreprise: 'SAMTECH',
  }, true).text;
  return <div className="grid gap-6 lg:grid-cols-[minmax(280px,360px)_1fr]">
    <form onSubmit={submit} className="space-y-4 rounded-xl border bg-card text-card-foreground p-4">
      <h2 className="text-lg font-semibold">{editingId ? 'Modifier le modèle' : 'Nouveau modèle'}</h2>
      {message && <p role="status" className={message.includes('succès') ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}>{message}</p>}
      <label className="block text-sm font-medium">Nom<input aria-label="Nom du modèle" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 h-11 w-full rounded-md border px-3" /></label>
      <label className="block text-sm font-medium">Catégorie<select aria-label="Catégorie du modèle" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as MessageTemplateInput['category'] })} className="mt-1 h-11 w-full rounded-md border px-3">{MESSAGE_CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></label>
      <div className="space-y-2">
        <span className="block text-sm font-medium">Personnaliser le message</span>
        <p className="text-xs text-muted-foreground">Placez le curseur dans le message, puis choisissez une information à insérer.</p>
        <div className="flex flex-wrap gap-2" aria-label="Variables de personnalisation">
          {PERSONALIZATION_VARIABLES.map((item) => <button key={item.variable} type="button" onClick={() => insertVariable(item.variable)} className="min-h-9 rounded-full border bg-background px-3 py-1 text-xs font-medium hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950" title={`Exemple : ${item.example}`}>+ {item.label}</button>)}
        </div>
      </div>
      <label className="block text-sm font-medium">Contenu<textarea ref={contentRef} aria-label="Contenu du modèle" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Bonjour {{prenom}}, merci pour votre confiance." rows={7} className="mt-1 w-full rounded-md border p-3" /></label>
      <div className="rounded-md border border-blue-200 bg-blue-50/60 p-3 dark:border-blue-900 dark:bg-blue-950/30"><strong>Aperçu personnalisé</strong><p className="mt-2 whitespace-pre-wrap">{personalizedPreview || 'Votre message personnalisé apparaîtra ici.'}</p><p className="mt-2 text-xs text-muted-foreground">Variables utilisées : {extractVariables(form.content).map((variable) => PERSONALIZATION_VARIABLES.find((item) => item.variable === variable)?.label ?? variable).join(', ') || 'aucune'}</p></div>
      <button className="h-11 w-full rounded-md bg-blue-600 text-white" type="submit">{editingId ? 'Enregistrer les modifications' : 'Créer le modèle'}</button>
    </form>
    <section className="space-y-3"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Modèles</h2><label className="flex gap-2 text-sm"><input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} /> Archives</label></div>
      {items.length === 0 && <p className="rounded-xl border border-dashed p-6 text-center">Aucun modèle.</p>}
      {items.map((item) => <article key={item.id} className="rounded-xl border bg-card text-card-foreground p-4"><div className="flex justify-between gap-3"><div><h3 className="font-semibold">{item.name} {item.archivedAt && <span className="text-amber-800 dark:text-amber-200">(Archivé)</span>}</h3><p className="text-xs text-muted-foreground">{item.category}</p></div>{!item.archivedAt && <div className="flex flex-wrap gap-2"><button onClick={() => { setEditingId(item.id); setForm({ name: item.name, category: item.category, content: item.content }); }} className="text-blue-800 dark:text-blue-200">Modifier</button><button onClick={async () => { await useCase.duplicate(item.id); await load(); }} className="text-blue-800 dark:text-blue-200">Dupliquer</button><button onClick={async () => { if (confirm('Archiver ce modèle ?')) { await useCase.archive(item.id); await load(); } }} className="text-red-800 dark:text-red-200">Archiver</button></div>}</div><p className="mt-3 whitespace-pre-wrap text-sm">{item.content}</p></article>)}
    </section>
  </div>;
}
