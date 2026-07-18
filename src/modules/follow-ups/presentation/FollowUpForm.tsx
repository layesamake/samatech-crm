'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FOLLOW_UP_CHANNELS, FOLLOW_UP_PRIORITIES, FollowUpInput, FollowUpRecord } from '../domain/follow-up';
import { ManageFollowUpsUseCase } from '../application/manage-follow-ups';
import { ListProspectsUseCase } from '@/modules/prospects/application/list-prospects';
import { DexieProspectRepository } from '@/modules/prospects/infrastructure/dexie-prospect-repository';
import { ManageMessageTemplatesUseCase } from '@/modules/messages/application/manage-message-templates';
import { MessageTemplateRecord } from '@/modules/messages/domain/message-template';

const manage = new ManageFollowUpsUseCase();
const listProspects = new ListProspectsUseCase(new DexieProspectRepository());
const templatesUseCase = new ManageMessageTemplatesUseCase();
function toLocalInput(iso: string) { const date = new Date(iso); const offset = date.getTimezoneOffset() * 60_000; return new Date(date.getTime() - offset).toISOString().slice(0, 16); }

export default function FollowUpForm({ initial, contactId }: { initial?: FollowUpRecord; contactId?: string }) {
  const router = useRouter();
  const [contacts, setContacts] = useState<Array<{ id: string; name: string }>>([]);
  const [templates, setTemplates] = useState<MessageTemplateRecord[]>([]);
  const [warning, setWarning] = useState<'PAST_DUE' | 'CLOSE_DUPLICATE'>();
  const [similar, setSimilar] = useState<FollowUpRecord>();
  const [error, setError] = useState('');
  const [form, setForm] = useState({ contactId: initial?.contactId || contactId || '', channel: initial?.channel || 'WHATSAPP', dueAt: initial ? toLocalInput(initial.dueAt) : '', timezone: initial?.timezone || 'Africa/Dakar', priority: initial?.priority || 'NORMAL', reason: initial?.reason || '', messageTemplateId: initial?.messageTemplateId || '' });
  useEffect(() => { void Promise.all([listProspects.execute({}), templatesUseCase.getActive()]).then(([prospects, activeTemplates]) => { setContacts(prospects.map((prospect) => ({ id: prospect.contact.id, name: prospect.contact.displayName }))); setTemplates(activeTemplates); }); }, []);
  const submit = async (event: React.FormEvent, confirmed = false) => {
    event.preventDefault(); setError('');
    try {
      const input: FollowUpInput = { ...form, channel: form.channel as FollowUpInput['channel'], priority: form.priority as FollowUpInput['priority'], dueAt: new Date(form.dueAt).toISOString() };
      if (initial) { await manage.update(initial.id, input); router.push(`/follow-ups/${initial.id}`); return; }
      const result = await manage.create(input, { confirmPast: confirmed, confirmDuplicate: confirmed });
      if (result.warning) { setWarning(result.warning); setSimilar(result.similar); return; }
      router.push(`/follow-ups/${result.followUp?.id}`);
    } catch (caught: unknown) { setError(caught instanceof Error ? caught.message : 'Relance invalide'); }
  };
  return <form onSubmit={submit} className="mx-auto max-w-xl space-y-4 rounded-xl border bg-card text-card-foreground p-4">
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {warning && <div className="rounded-md border border-amber-300 bg-amber-50 p-3"><p>{warning === 'PAST_DUE' ? 'Cette échéance est passée. Confirmez l’enregistrement historique.' : 'Une relance proche existe déjà. Confirmez la création.'}</p>{similar && <p className="mt-1 text-sm">Relance similaire : {new Date(similar.dueAt).toLocaleString('fr-FR', { timeZone: similar.timezone })} · {similar.channel} · {similar.reason || 'Sans motif'}</p>}<button type="button" onClick={(event) => void submit(event, true)} className="mt-2 font-medium text-amber-900">Confirmer quand même</button></div>}
    <label className="block">Contact *<select name="contactId" value={form.contactId} disabled={Boolean(initial || contactId)} onChange={(e) => setForm({ ...form, contactId: e.target.value })} className="mt-1 h-11 w-full rounded-md border px-3"><option value="">Sélectionnez...</option>{contacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.name}</option>)}</select></label>
    <label className="block">Date et heure *<input name="dueAt" type="datetime-local" value={form.dueAt} onChange={(e) => setForm({ ...form, dueAt: e.target.value })} className="mt-1 h-11 w-full rounded-md border px-3" /></label>
    <div className="grid grid-cols-2 gap-3"><label>Canal<select name="channel" value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value as FollowUpInput['channel'] })} className="mt-1 h-11 w-full rounded-md border px-3">{FOLLOW_UP_CHANNELS.map((value) => <option key={value}>{value}</option>)}</select></label><label>Priorité<select name="priority" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as FollowUpInput['priority'] })} className="mt-1 h-11 w-full rounded-md border px-3">{FOLLOW_UP_PRIORITIES.map((value) => <option key={value}>{value}</option>)}</select></label></div>
    <label className="block">Motif<textarea name="reason" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="mt-1 w-full rounded-md border p-3" /></label>
    {form.channel === 'WHATSAPP' && <label className="block">Modèle<select name="messageTemplateId" value={form.messageTemplateId} onChange={(e) => setForm({ ...form, messageTemplateId: e.target.value })} className="mt-1 h-11 w-full rounded-md border px-3"><option value="">Sans modèle</option>{templates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}</select></label>}
    <button type="submit" className="h-11 w-full rounded-md bg-blue-600 text-white">{initial ? 'Enregistrer les modifications' : 'Planifier la relance'}</button>
  </form>;
}
