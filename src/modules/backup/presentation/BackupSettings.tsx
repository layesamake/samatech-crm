'use client';

import { ChangeEvent, useEffect, useState } from 'react';
import { ManageBackupsUseCase, PreparedBackup } from '../application/manage-backups';
import { BackupEnvelope, BackupPreview, MAX_BACKUP_BYTES } from '../domain/backup';
import { DexieBackupRepository } from '../infrastructure/dexie-backup-repository';
import { ManageSecurityUseCase } from '@/modules/security/application/manage-security';
import { DexieSecurityRepository } from '@/modules/security/infrastructure/dexie-security-repository';
import { useSecuritySession } from '@/modules/security/presentation/SecurityGate';

const backupUseCase = new ManageBackupsUseCase(
  new DexieBackupRepository(),
  new ManageSecurityUseCase(new DexieSecurityRepository()),
);
const REPLACE_PHRASE = 'REMPLACER MES DONNÉES';

function triggerDownload(prepared: PreparedBackup): void {
  const blob = new Blob([prepared.text], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = prepared.filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

export default function BackupSettings() {
  const session = useSecuritySession();
  const [lastExportedAt, setLastExportedAt] = useState<string | null>(null);
  const [envelope, setEnvelope] = useState<BackupEnvelope | null>(null);
  const [preview, setPreview] = useState<BackupPreview | null>(null);
  const [confirmation, setConfirmation] = useState('');
  const [pin, setPin] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { void backupUseCase.getLastExportedAt().then(setLastExportedAt); }, []);

  const exportBackup = async () => {
    setBusy(true); setMessage('');
    try {
      const prepared = await backupUseCase.prepareExport();
      triggerDownload(prepared);
      await backupUseCase.confirmExported(prepared);
      setLastExportedAt(prepared.envelope.exportedAt);
      setMessage('Sauvegarde créée et proposée au téléchargement. Vérifiez sa présence dans vos téléchargements.');
    } catch {
      setMessage('La sauvegarde n’a pas pu être créée. Aucune date de succès n’a été enregistrée.');
    } finally { setBusy(false); }
  };

  const selectFile = async (event: ChangeEvent<HTMLInputElement>) => {
    setEnvelope(null); setPreview(null); setConfirmation(''); setPin(''); setMessage('');
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.json')) { setMessage('Sélectionnez un fichier .json de sauvegarde SAMTECH CRM.'); return; }
    if (file.size === 0) { setMessage('Le fichier est vide.'); return; }
    if (file.size > MAX_BACKUP_BYTES) { setMessage('Le fichier dépasse 25 Mo.'); return; }
    if (file.type && !['application/json', 'text/json', 'text/plain'].includes(file.type)) { setMessage('Le type du fichier n’est pas accepté.'); return; }
    setBusy(true);
    try {
      const result = await backupUseCase.inspect(await file.text());
      setEnvelope(result.envelope); setPreview(result.preview);
      setMessage('Sauvegarde valide. Vérifiez le résumé avant de continuer.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Sauvegarde invalide.');
    } finally { setBusy(false); }
  };

  const restore = async () => {
    if (!envelope || confirmation !== REPLACE_PHRASE) return;
    setBusy(true); setMessage('');
    try {
      await backupUseCase.restore(envelope, pin || undefined);
      setMessage('Restauration terminée. Actualisation de l’application…');
      window.setTimeout(() => window.location.reload(), 300);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'La restauration a échoué. Les données précédentes ont été conservées.');
      setBusy(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <div><h1 className="text-2xl font-bold">Sauvegarde et restauration</h1><p className="text-muted-foreground">Toutes les opérations sont locales et restent disponibles hors connexion.</p></div>
      {message && <p data-testid="backup-message" role="status" className="rounded-md border p-3 text-sm">{message}</p>}
      <section className="rounded-xl border p-5 space-y-4">
        <h2 className="text-lg font-semibold">Exporter une sauvegarde</h2>
        <p data-testid="last-backup" className="text-sm">Dernière sauvegarde : {lastExportedAt ? new Date(lastExportedAt).toLocaleString('fr-FR') : 'Aucune sauvegarde effectuée'}</p>
        <p className="text-sm text-muted-foreground">Effectuez une sauvegarde au minimum chaque semaine. Les données du navigateur peuvent être effacées.</p>
        <div className="rounded-md border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-950">Cette sauvegarde peut contenir vos contacts, factures, paiements et autres données commerciales. Conservez-la dans un emplacement sûr. Le fichier JSON n’est pas chiffré.</div>
        <button data-testid="export-backup" disabled={busy} onClick={() => void exportBackup()} className="h-10 rounded-md bg-primary px-4 text-primary-foreground disabled:opacity-50">Exporter une sauvegarde</button>
      </section>
      <section className="rounded-xl border p-5 space-y-4">
        <h2 className="text-lg font-semibold">Restaurer une sauvegarde</h2>
        <p className="text-sm font-medium">La restauration remplacera toutes les données métier actuellement présentes sur cet appareil. Cette opération ne fusionne pas les bases.</p>
        <button type="button" onClick={() => void exportBackup()} className="h-10 rounded-md border px-4">Sauvegarder les données actuelles avant de continuer</button>
        <label className="block text-sm font-medium">Fichier JSON<input data-testid="backup-file" type="file" accept=".json,application/json" onChange={(event) => void selectFile(event)} className="mt-2 block w-full text-sm" /></label>
        {preview && (
          <div data-testid="backup-preview" className="rounded-lg bg-muted p-4 space-y-3">
            <h3 className="font-semibold">Aperçu validé</h3>
            <dl className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div><dt className="text-muted-foreground">Date</dt><dd>{new Date(preview.exportedAt).toLocaleString('fr-FR')}</dd></div>
              <div><dt className="text-muted-foreground">Application</dt><dd>{preview.appVersion}</dd></div>
              <div><dt className="text-muted-foreground">Format</dt><dd>v{preview.formatVersion}</dd></div>
              <div><dt className="text-muted-foreground">Total</dt><dd>{preview.totalRecords}</dd></div>
              <div><dt>Contacts</dt><dd>{preview.counts.contacts}</dd></div><div><dt>Prospects</dt><dd>{preview.counts.prospectProfiles}</dd></div>
              <div><dt>Clients</dt><dd>{preview.counts.clientProfiles}</dd></div><div><dt>Produits/services</dt><dd>{preview.counts.products}</dd></div>
              <div><dt>Factures</dt><dd>{preview.counts.invoices}</dd></div><div><dt>Paiements</dt><dd>{preview.counts.payments}</dd></div><div><dt>Campagnes</dt><dd>{preview.counts.campaigns}</dd></div>
            </dl>
            <div className="border-t pt-3 space-y-3">
              <label className="block text-sm font-medium">Saisissez exactement « {REPLACE_PHRASE} »<input data-testid="restore-confirmation" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="mt-1 h-10 w-full rounded-md border bg-background px-3" /></label>
              {session.settings?.pinEnabled && <label className="block text-sm font-medium">PIN actuel<input data-testid="restore-pin" type="password" inputMode="numeric" value={pin} onChange={(event) => setPin(event.target.value)} className="mt-1 h-10 w-full rounded-md border bg-background px-3" /></label>}
              <button data-testid="restore-backup" disabled={busy || confirmation !== REPLACE_PHRASE || Boolean(session.settings?.pinEnabled && !pin)} onClick={() => void restore()} className="h-10 rounded-md bg-destructive px-4 text-white disabled:opacity-50">Remplacer toutes les données métier</button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

