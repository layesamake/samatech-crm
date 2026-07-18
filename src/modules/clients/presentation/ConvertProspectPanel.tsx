'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ConvertProspectToClientUseCase } from '../application/convert-prospect-to-client';

const convert = new ConvertProspectToClientUseCase();
function toLocalInput(date: Date) { const offset = date.getTimezoneOffset() * 60_000; return new Date(date.getTime() - offset).toISOString().slice(0, 16); }

export default function ConvertProspectPanel({ contactId, displayName }: { contactId: string; displayName: string }) {
  const router = useRouter(); const [open, setOpen] = useState(false); const [error, setError] = useState(''); const [pending, setPending] = useState(false);
  const [convertedAt, setConvertedAt] = useState(() => toLocalInput(new Date()));
  if (!open) return <button onClick={() => setOpen(true)} className="h-11 w-full rounded-md bg-emerald-700 px-4 text-white">Convertir en client</button>;
  return <section className="space-y-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
    <h2 className="font-semibold">Convertir {displayName}</h2>
    <p className="text-sm">Le contact ne sera pas dupliqué. Ses coordonnées, intérêts, relances et événements resteront accessibles.</p>
    {error && <p role="alert" className="text-sm text-red-800 dark:text-red-200">{error}</p>}
    <label className="block text-sm">Date et heure de conversion<input aria-label="Date de conversion" type="datetime-local" value={convertedAt} onChange={(event) => setConvertedAt(event.target.value)} className="mt-1 h-11 w-full rounded-md border bg-card text-card-foreground px-3" /></label>
    <p className="text-xs text-muted-foreground">La création d’une facture sera disponible au Sprint 5.</p>
    <div className="flex gap-2"><button disabled={pending} onClick={async () => { setPending(true); setError(''); try { const client = await convert.execute(contactId, { convertedAt: new Date(convertedAt).toISOString() }); router.push(`/clients/${client.profile.id}`); } catch (caught: unknown) { setError(caught instanceof Error ? caught.message : 'Conversion impossible'); setPending(false); } }} className="h-11 flex-1 rounded-md bg-emerald-700 text-white">{pending ? 'Conversion...' : 'Confirmer la conversion'}</button><button onClick={() => setOpen(false)} className="h-11 rounded-md border bg-card text-card-foreground px-4">Fermer</button></div>
  </section>;
}
