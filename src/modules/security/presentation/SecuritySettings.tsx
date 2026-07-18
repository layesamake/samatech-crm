'use client';

import { FormEvent, useEffect, useState } from 'react';
import { ManageSecurityUseCase } from '../application/manage-security';
import { AUTO_LOCK_OPTIONS, SecuritySettingsRecord } from '../domain/security';
import { DexieSecurityRepository } from '../infrastructure/dexie-security-repository';
import { useSecuritySession } from './SecurityGate';

const useCase = new ManageSecurityUseCase(new DexieSecurityRepository());

export default function SecuritySettings() {
  const session = useSecuritySession();
  const [settings, setSettings] = useState<SecuritySettingsRecord | null>(null);
  const [pin, setPin] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [newConfirmation, setNewConfirmation] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const reload = async () => {
    setSettings(await useCase.getSettings());
    await session.refreshSecurity();
  };
  useEffect(() => { void useCase.getSettings().then(setSettings); }, []);

  const run = async (action: () => Promise<void>, success: string) => {
    setBusy(true); setMessage('');
    try {
      await action(); await reload(); setMessage(success);
      setPin(''); setConfirmation(''); setCurrentPin(''); setNewPin(''); setNewConfirmation('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Action impossible.');
    } finally { setBusy(false); }
  };

  const activate = (event: FormEvent) => { event.preventDefault(); void run(() => useCase.enable(pin, confirmation), 'PIN activé.'); };
  const change = (event: FormEvent) => { event.preventDefault(); void run(() => useCase.change(currentPin, newPin, newConfirmation), 'PIN modifié.'); };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
      <div><h1 className="text-2xl font-bold">Sécurité locale</h1><p className="text-muted-foreground">Le PIN masque l’application sur cet appareil. Il ne chiffre pas IndexedDB.</p></div>
      {message && <p role="status" className="rounded-md border p-3 text-sm">{message}</p>}
      <section className="rounded-xl border p-5 space-y-4">
        <h2 className="text-lg font-semibold">État du PIN</h2>
        <p data-testid="pin-status" className="font-medium">{settings?.pinEnabled ? 'PIN actif' : 'PIN inactif'}</p>
        {!settings?.pinEnabled ? (
          <form onSubmit={activate} className="space-y-3 max-w-sm">
            <p className="text-sm text-muted-foreground">Activation recommandée : choisissez 4 à 6 chiffres.</p>
            <label className="block text-sm font-medium">Nouveau PIN<input data-testid="enable-pin" type="password" inputMode="numeric" maxLength={6} value={pin} onChange={(event) => setPin(event.target.value)} className="mt-1 h-10 w-full rounded-md border px-3" /></label>
            <label className="block text-sm font-medium">Confirmer le PIN<input data-testid="enable-pin-confirm" type="password" inputMode="numeric" maxLength={6} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="mt-1 h-10 w-full rounded-md border px-3" /></label>
            <button data-testid="enable-pin-submit" disabled={busy} className="h-10 rounded-md bg-primary px-4 text-primary-foreground disabled:opacity-50">Activer le PIN</button>
          </form>
        ) : (
          <div className="space-y-6">
            <form onSubmit={change} className="space-y-3 max-w-sm">
              <h3 className="font-semibold">Modifier le PIN</h3>
              <input aria-label="PIN actuel" type="password" inputMode="numeric" placeholder="PIN actuel" value={currentPin} onChange={(event) => setCurrentPin(event.target.value)} className="h-10 w-full rounded-md border px-3" />
              <input aria-label="Nouveau PIN" type="password" inputMode="numeric" placeholder="Nouveau PIN" value={newPin} onChange={(event) => setNewPin(event.target.value)} className="h-10 w-full rounded-md border px-3" />
              <input aria-label="Confirmation du nouveau PIN" type="password" inputMode="numeric" placeholder="Confirmer le nouveau PIN" value={newConfirmation} onChange={(event) => setNewConfirmation(event.target.value)} className="h-10 w-full rounded-md border px-3" />
              <button disabled={busy} className="h-10 rounded-md border px-4">Modifier</button>
            </form>
            <div className="space-y-2 max-w-sm">
              <label className="block text-sm font-medium">Verrouillage automatique</label>
              <select data-testid="auto-lock" value={settings.autoLockMinutes} onChange={(event) => void run(() => useCase.setAutoLockMinutes(Number(event.target.value)), 'Délai enregistré.')} className="h-10 w-full rounded-md border px-3">
                {AUTO_LOCK_OPTIONS.map((minutes) => <option key={minutes} value={minutes}>{minutes === 0 ? 'Jamais automatiquement' : `${minutes} minute${minutes > 1 ? 's' : ''}`}</option>)}
              </select>
            </div>
            <div className="flex flex-wrap gap-3">
              <button data-testid="lock-now" onClick={session.lockNow} className="h-10 rounded-md bg-primary px-4 text-primary-foreground">Verrouiller maintenant</button>
              <button disabled={busy || currentPin.length === 0} onClick={() => void run(() => useCase.disable(currentPin), 'PIN désactivé.')} className="h-10 rounded-md bg-destructive px-4 text-white disabled:opacity-50">Désactiver avec le PIN actuel</button>
            </div>
          </div>
        )}
      </section>
      <section className="rounded-xl border p-5 text-sm text-muted-foreground space-y-2"><h2 className="text-base font-semibold text-foreground">Limites</h2><p>Cette protection est locale et peut être contournée par une personne contrôlant entièrement le stockage du navigateur. Aucun compte, PIN maître ou récupération par e-mail n’existe.</p></section>
    </div>
  );
}

