'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Archive, X } from 'lucide-react';
import { ManageSuppliersUseCase } from '../application/manage-suppliers';
import { SupplierInput, SupplierKind, SupplierRecord } from '../domain/supplier';

const manage = new ManageSuppliersUseCase();
const EMPTY: SupplierInput = { name: '', kind: 'BOTH', phone: '', email: '', note: '' };
const kindLabel: Record<SupplierKind, string> = { SUPPLIER: 'Fournisseur', BENEFICIARY: 'Bénéficiaire', BOTH: 'Fournisseur et bénéficiaire' };

export default function SuppliersManager() {
  const [items, setItems] = useState<SupplierRecord[]>([]);
  const [form, setForm] = useState<SupplierInput>(EMPTY);
  const [editingId, setEditingId] = useState<string>();
  const [formOpen, setFormOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => setItems(await manage.list());
  useEffect(() => { void load().catch((error: unknown) => setMessage(error instanceof Error ? error.message : 'Chargement impossible')); }, []);
  const closeForm = () => { setForm(EMPTY); setEditingId(undefined); setFormOpen(false); };
  const edit = (item: SupplierRecord) => { setEditingId(item.id); setForm({ name: item.name, kind: item.kind, phone: item.phone ?? '', email: item.email ?? '', note: item.note ?? '' }); setFormOpen(true); };
  const save = async (event: React.FormEvent) => { event.preventDefault(); setSaving(true); setMessage(''); try { if (editingId) await manage.update(editingId, form); else await manage.create(form); await load(); closeForm(); } catch (error) { setMessage(error instanceof Error ? error.message : 'Enregistrement impossible'); } finally { setSaving(false); } };
  const archive = async (item: SupplierRecord) => { if (!confirm(`Archiver ${item.name} ?`)) return; try { await manage.archive(item.id); await load(); } catch (error) { setMessage(error instanceof Error ? error.message : 'Archivage impossible'); } };

  return <section className="space-y-4">{message && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{message}</p>}
    {items.length === 0 ? <div className="rounded-xl border border-dashed p-8 text-center"><p className="font-medium">Aucun fournisseur ou bénéficiaire</p><p className="mt-1 text-sm text-muted-foreground">Ajoutez votre premier contact pour l’utiliser dans les dépenses.</p></div> : <div className="grid gap-3 sm:grid-cols-2">{items.map((item) => <article key={item.id} className="rounded-xl border bg-card p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold">{item.name}</h2><span className="mt-2 inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">{kindLabel[item.kind]}</span></div><div className="flex gap-1"><button type="button" aria-label={`Modifier ${item.name}`} className="rounded-md p-2 text-primary hover:bg-primary/10" onClick={() => edit(item)}><Pencil className="size-4" /></button><button type="button" aria-label={`Archiver ${item.name}`} className="rounded-md p-2 text-destructive hover:bg-destructive/10" onClick={() => void archive(item)}><Archive className="size-4" /></button></div></div>{(item.phone || item.email) && <p className="mt-3 text-sm text-muted-foreground">{[item.phone, item.email].filter(Boolean).join(' · ')}</p>}</article>)}</div>}
    <button type="button" aria-label="Ajouter un fournisseur ou bénéficiaire" onClick={() => { setForm(EMPTY); setEditingId(undefined); setFormOpen(true); }} className="fixed bottom-24 lg:bottom-12 right-6 lg:right-10 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:scale-105 active:scale-95"><Plus className="w-8 h-8" /></button>
    {formOpen && <div className="fixed inset-0 z-50 flex items-end bg-black/40 p-0 sm:items-center sm:justify-center sm:p-4"><form onSubmit={save} className="w-full space-y-4 rounded-t-2xl bg-background p-5 shadow-xl sm:max-w-md sm:rounded-2xl"><div className="flex items-center justify-between"><h2 className="font-semibold">{editingId ? 'Modifier le contact' : 'Nouveau fournisseur'}</h2><button type="button" aria-label="Fermer" className="rounded-md p-2 hover:bg-muted" onClick={closeForm}><X className="size-5" /></button></div><label className="grid gap-1 text-sm">Nom *<input autoFocus required className="h-11 rounded-md border px-3" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label><label className="grid gap-1 text-sm">Type<select className="h-11 rounded-md border px-3" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as SupplierKind })}><option value="SUPPLIER">Fournisseur</option><option value="BENEFICIARY">Bénéficiaire</option><option value="BOTH">Fournisseur et bénéficiaire</option></select></label><label className="grid gap-1 text-sm">Téléphone<input className="h-11 rounded-md border px-3" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label><label className="grid gap-1 text-sm">Email<input type="email" className="h-11 rounded-md border px-3" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label><button disabled={saving} className="min-h-11 w-full rounded-md bg-primary px-4 font-medium text-primary-foreground">{saving ? 'Enregistrement…' : 'Enregistrer'}</button></form></div>}
  </section>;
}
