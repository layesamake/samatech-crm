'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, useDeferredValue, memo } from 'react';
import { ManageFollowUpsUseCase } from '@/modules/follow-ups/application/manage-follow-ups';
import { FOLLOW_UP_CHANNELS, FOLLOW_UP_PRIORITIES, FollowUpRecord } from '@/modules/follow-ups/domain/follow-up';
import { DexieProspectRepository } from '@/modules/prospects/infrastructure/dexie-prospect-repository';

const manage = new ManageFollowUpsUseCase();
const prospects = new DexieProspectRepository();
const views = [['TODAY', "Aujourd’hui"], ['OVERDUE', 'En retard'], ['UPCOMING', 'À venir'], ['COMPLETED', 'Terminées']] as const;

const FollowUpCard = memo(({ item, view }: { item: FollowUpRecord & { contactName: string }, view: string }) => (
  <Link href={`/follow-ups/${item.id}`} className="rounded-xl border bg-card text-card-foreground p-4">
    <div className="flex justify-between">
      <h2 className="font-semibold">{item.contactName}</h2>
      <span className="text-xs font-semibold">{item.priority}</span>
    </div>
    <p className="mt-2">{new Date(item.dueAt).toLocaleString('fr-FR', { timeZone: item.timezone })}</p>
    <p className="text-sm text-muted-foreground">{item.channel} · {item.reason || 'Sans motif'} · {item.status}{view === 'OVERDUE' ? ' · En retard' : ''}</p>
  </Link>
));
FollowUpCard.displayName = 'FollowUpCard';
export default function FollowUpsPage() {
  const [view, setView] = useState<typeof views[number][0]>('TODAY');
  const [items, setItems] = useState<Array<FollowUpRecord & { contactName: string }>>([]);
  const [query, setQuery] = useState(''); const deferredQuery = useDeferredValue(query); const [priority, setPriority] = useState(''); const [channel, setChannel] = useState('');
  const [sort, setSort] = useState<'DUE_AT' | 'PRIORITY'>('DUE_AT'); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [limit, setLimit] = useState(50);
  useEffect(() => { const requested = new URLSearchParams(window.location.search).get('view'); if (!views.some(([value]) => value === requested)) return; const timer = window.setTimeout(() => setView(requested as typeof views[number][0]), 0); return () => window.clearTimeout(timer); }, []);
  useEffect(() => {
    void manage.list(view)
      .then(async (records) => setItems(await Promise.all(records.map(async (record) => ({ ...record, contactName: (await prospects.getById(record.contactId))?.contact.displayName || 'Contact archivé' })))))
      .catch((caught: unknown) => setError(caught instanceof Error ? caught.message : 'Chargement impossible'))
      .finally(() => setLoading(false));
  }, [view]);
  const filtered = useMemo(() => {
    const weights = { HIGH: 0, NORMAL: 1, LOW: 2 } as const;
    return items.filter((item) => item.contactName.toLowerCase().includes(deferredQuery.toLowerCase()) && (!priority || item.priority === priority) && (!channel || item.channel === channel)).sort((a, b) => sort === 'PRIORITY' ? weights[a.priority] - weights[b.priority] || a.dueAt.localeCompare(b.dueAt) : a.dueAt.localeCompare(b.dueAt));
  }, [items, deferredQuery, priority, channel, sort]);
  
  const paginatedFiltered = useMemo(() => filtered.slice(0, limit), [filtered, limit]);
  return <main className="mx-auto max-w-5xl space-y-5 p-4 md:p-8"><header className="flex items-center justify-between"><div><h1 className="text-2xl font-bold">Relances</h1><p className="text-muted-foreground">Les retards sont recalculés à chaque ouverture.</p></div><Link href="/follow-ups/new" className="rounded-md bg-blue-600 px-4 py-3 text-white">Nouvelle</Link></header>
    <div className="flex gap-2 overflow-x-auto">{views.map(([value, label]) => <button key={value} onClick={() => { if (value !== view) { setLoading(true); setError(''); setView(value); } }} className={`min-h-11 whitespace-nowrap rounded-md px-4 ${view === value ? 'bg-slate-900 text-white' : 'bg-muted'}`}>{label}</button>)}</div>
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"><input aria-label="Rechercher une relance" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher un contact" className="h-11 rounded-md border px-3"/><select aria-label="Filtrer par priorité" value={priority} onChange={(e) => setPriority(e.target.value)} className="h-11 rounded-md border px-3"><option value="">Toutes priorités</option>{FOLLOW_UP_PRIORITIES.map((value) => <option key={value}>{value}</option>)}</select><select aria-label="Filtrer par canal" value={channel} onChange={(e) => setChannel(e.target.value)} className="h-11 rounded-md border px-3"><option value="">Tous canaux</option>{FOLLOW_UP_CHANNELS.map((value) => <option key={value}>{value}</option>)}</select><select aria-label="Trier les relances" value={sort} onChange={(e) => setSort(e.target.value as 'DUE_AT' | 'PRIORITY')} className="h-11 rounded-md border px-3"><option value="DUE_AT">Échéance</option><option value="PRIORITY">Priorité</option></select></div>
    {error ? <p role="alert" className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-800 dark:text-red-200">{error}</p> : loading ? <p role="status" className="rounded-xl border p-8 text-center">Chargement des relances...</p> : filtered.length === 0 ? <p className="rounded-xl border border-dashed p-8 text-center">Aucune relance dans cette vue.</p> : <div className="grid gap-3 md:grid-cols-2">{paginatedFiltered.map((item) => <FollowUpCard key={item.id} item={item} view={view} />)}</div>}
    {filtered.length > limit && (
      <div className="p-4 flex justify-center">
        <button className="px-6 py-2 bg-muted text-muted-foreground hover:bg-muted/80 rounded-lg text-sm font-medium transition-colors" onClick={() => setLimit(l => l + 50)}>Charger plus</button>
      </div>
    )}
  </main>;
}
