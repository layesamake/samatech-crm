'use client';

import { createContext, FormEvent, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ManageSecurityUseCase } from '../application/manage-security';
import { FORGOT_PIN_PHRASE, SecuritySettingsRecord } from '../domain/security';
import { DexieSecurityRepository } from '../infrastructure/dexie-security-repository';

const securityUseCase = new ManageSecurityUseCase(new DexieSecurityRepository());

interface SecuritySessionValue {
  settings: SecuritySettingsRecord | null;
  lockNow(): void;
  refreshSecurity(): Promise<void>;
}

const SecuritySessionContext = createContext<SecuritySessionValue | null>(null);

export function useSecuritySession(): SecuritySessionValue {
  const value = useContext(SecuritySessionContext);
  if (!value) throw new Error('Le contexte de sécurité est indisponible.');
  return value;
}

function LockScreen({ onUnlocked, onReset }: { onUnlocked(): Promise<void>; onReset(): void }) {
  const [pin, setPin] = useState('');
  const [message, setMessage] = useState('');
  const [lockedUntil, setLockedUntil] = useState<string>();
  const [remaining, setRemaining] = useState(0);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [phrase, setPhrase] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const update = () => setRemaining(lockedUntil ? Math.max(0, Math.ceil((new Date(lockedUntil).getTime() - Date.now()) / 1000)) : 0);
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [lockedUntil]);

  const unlock = async (event: FormEvent) => {
    event.preventDefault();
    if (remaining > 0) return;
    setBusy(true);
    setMessage('');
    try {
      const result = await securityUseCase.verify(pin);
      if (result.ok) {
        setPin('');
        await onUnlocked();
      } else {
        setPin('');
        setLockedUntil(result.lockedUntil);
        setMessage(result.lockedUntil ? 'Trop de tentatives. Réessayez après le délai indiqué.' : `PIN incorrect. Tentative ${result.failedAttempts} sur 5 avant temporisation.`);
      }
    } catch {
      setMessage('Impossible de vérifier le PIN. Réessayez.');
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    setBusy(true);
    setMessage('');
    try {
      await securityUseCase.forgotPinReset(phrase);
      onReset();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Réinitialisation impossible.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-muted/40 flex items-center justify-center p-4" data-testid="locked-screen">
      <section className="w-full max-w-md rounded-xl border bg-background p-6 shadow-lg space-y-5" aria-labelledby="lock-title">
        <div className="text-center space-y-2">
          <p className="text-sm font-semibold tracking-wide">SAMTECH CRM</p>
          <h1 id="lock-title" className="text-2xl font-bold">Application verrouillée</h1>
          <p className="text-sm text-muted-foreground">Saisissez votre PIN local pour afficher les données commerciales.</p>
        </div>
        {!forgotOpen ? (
          <form onSubmit={unlock} className="space-y-4">
            <label className="block text-sm font-medium" htmlFor="unlock-pin">PIN</label>
            <input id="unlock-pin" data-testid="unlock-pin" autoFocus type="password" inputMode="numeric" autoComplete="off" maxLength={6} value={pin} onChange={(event) => setPin(event.target.value)} className="h-12 w-full rounded-md border px-3 text-center text-xl tracking-[0.4em]" />
            {remaining > 0 && <p role="status" className="text-sm font-medium text-destructive">Nouvelle tentative dans {remaining} s.</p>}
            {message && <p role="alert" className="text-sm text-destructive">{message}</p>}
            <button data-testid="unlock-submit" disabled={busy || remaining > 0} className="h-11 w-full rounded-md bg-primary text-primary-foreground disabled:opacity-50">Déverrouiller</button>
            <button type="button" onClick={() => { setForgotOpen(true); setMessage(''); }} className="w-full text-sm underline">PIN oublié</button>
          </form>
        ) : (
          <div className="space-y-4" data-testid="forgot-pin-panel">
            <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm space-y-2">
              <p className="font-semibold">Le PIN ne peut pas être récupéré.</p>
              <p>Toutes les données locales seront supprimées. Une restauration ne sera possible qu’avec une sauvegarde existante.</p>
            </div>
            <label className="block text-sm font-medium" htmlFor="forgot-phrase">Saisissez exactement « {FORGOT_PIN_PHRASE} »</label>
            <input id="forgot-phrase" data-testid="forgot-phrase" autoFocus value={phrase} onChange={(event) => setPhrase(event.target.value)} className="h-11 w-full rounded-md border px-3" autoComplete="off" />
            {message && <p role="alert" className="text-sm text-destructive">{message}</p>}
            <button type="button" data-testid="forgot-confirm" disabled={busy || phrase !== FORGOT_PIN_PHRASE} onClick={reset} className="h-11 w-full rounded-md bg-destructive px-4 text-white disabled:opacity-50">Effacer toutes les données locales</button>
            <button type="button" onClick={() => { setForgotOpen(false); setMessage(''); setPhrase(''); }} className="w-full text-sm underline">Retour au déverrouillage</button>
          </div>
        )}
      </section>
    </main>
  );
}

export default function SecurityGate({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SecuritySettingsRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);
  const lastActivity = useRef(0);
  const hiddenAt = useRef<number | null>(null);

  const refreshSecurity = useCallback(async () => {
    const current = await securityUseCase.getSettings();
    setSettings(current);
    if (!current?.pinEnabled) setLocked(false);
  }, []);

  useEffect(() => {
    lastActivity.current = Date.now();
    securityUseCase.getSettings().then((current) => {
      setSettings(current);
      setLocked(Boolean(current?.pinEnabled));
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!settings?.pinEnabled || locked || settings.autoLockMinutes === 0) return;
    const timeoutMs = settings.autoLockMinutes * 60_000;
    const activity = () => { lastActivity.current = Date.now(); };
    const visibility = () => {
      if (document.hidden) hiddenAt.current = Date.now();
      else if (hiddenAt.current && Date.now() - hiddenAt.current >= timeoutMs) setLocked(true);
    };
    const timer = window.setInterval(() => {
      if (Date.now() - lastActivity.current >= timeoutMs) setLocked(true);
    }, Math.min(5_000, timeoutMs));
    for (const event of ['pointerdown', 'keydown', 'touchstart'] as const) window.addEventListener(event, activity, { passive: true });
    document.addEventListener('visibilitychange', visibility);
    return () => {
      window.clearInterval(timer);
      for (const event of ['pointerdown', 'keydown', 'touchstart'] as const) window.removeEventListener(event, activity);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [locked, settings]);

  const value = useMemo<SecuritySessionValue>(() => ({ settings, lockNow: () => setLocked(true), refreshSecurity }), [settings, refreshSecurity]);
  if (loading) return <main className="min-h-screen grid place-items-center" aria-live="polite">Chargement sécurisé…</main>;
  if (locked && settings?.pinEnabled) {
    return <LockScreen onUnlocked={async () => { lastActivity.current = Date.now(); setLocked(false); await refreshSecurity(); }} onReset={() => { setSettings(null); setLocked(false); if (process.env.NODE_ENV !== 'test') window.location.assign('/settings/backup'); }} />;
  }
  return <SecuritySessionContext.Provider value={value}>{children}</SecuritySessionContext.Provider>;
}
