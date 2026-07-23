'use client';

import { ChangeEvent, useEffect, useState } from 'react';
import { ManageBackupsUseCase, PreparedBackup } from '../application/manage-backups';
import { BackupEnvelope, BackupPreview, MAX_BACKUP_BYTES } from '../domain/backup';
import { DexieBackupRepository } from '../infrastructure/dexie-backup-repository';
import { ManageSecurityUseCase } from '@/modules/security/application/manage-security';
import { DexieSecurityRepository } from '@/modules/security/infrastructure/dexie-security-repository';
import { useSecuritySession } from '@/modules/security/presentation/SecurityGate';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBusiness } from '@/components/providers/BusinessProvider';
import { Eye, EyeOff, Loader2, CloudUpload } from 'lucide-react';
import { loadGoogleIdentityClient, requestGoogleDriveAccessToken, uploadFileToGoogleDrive } from '@/lib/google-drive';

const backupUseCase = new ManageBackupsUseCase(
  new DexieBackupRepository(),
  new ManageSecurityUseCase(new DexieSecurityRepository()),
);
const REPLACE_PHRASE = 'REMPLACER MES DONNÉES';

function triggerDownload(text: string, filename: string): void {
  const blob = new Blob([text], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

export default function BackupSettings() {
  const session = useSecuritySession();
  const { activeBusiness } = useBusiness();
  const [lastExportedAt, setLastExportedAt] = useState<string | null>(null);
  const [envelope, setEnvelope] = useState<BackupEnvelope | null>(null);
  const [preview, setPreview] = useState<BackupPreview | null>(null);
  const [confirmation, setConfirmation] = useState('');
  const [crossBusinessConsent, setCrossBusinessConsent] = useState(false);
  const [pin, setPin] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  
  const [exportPassword, setExportPassword] = useState('');
  const [showExportPassword, setShowExportPassword] = useState(false);
  
  const [fileText, setFileText] = useState<string>('');
  const [isEncryptedFile, setIsEncryptedFile] = useState(false);
  const [importPassword, setImportPassword] = useState('');
  const [showImportPassword, setShowImportPassword] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [googleDriveBusy, setGoogleDriveBusy] = useState(false);

  useEffect(() => { 
    void backupUseCase.getLastExportedAt().then(setLastExportedAt); 
    void loadGoogleIdentityClient().catch((err) => console.warn(err));
  }, []);

  const exportEncryptedBackup = async () => {
    if (exportPassword.length < 12) {
      setMessage('Le mot de passe doit contenir au moins 12 caractères.');
      return;
    }
    setBusy(true); setMessage('');
    try {
      const prepared = await backupUseCase.prepareEncryptedExport(exportPassword, activeBusiness?.id, activeBusiness?.name);
      triggerDownload(prepared.text, prepared.filename);
      await backupUseCase.confirmExported(prepared as unknown as PreparedBackup); // using envelope structure
      setLastExportedAt(prepared.envelope.exportedAt);
      setMessage('Sauvegarde chiffrée créée et téléchargée avec succès.');
      setExportPassword(''); // clear state
    } catch {
      setMessage('Erreur lors de la création de la sauvegarde chiffrée.');
    } finally { setBusy(false); }
  };

  const exportToGoogleDrive = async () => {
    if (exportPassword.length < 12) {
      setMessage('Le mot de passe doit contenir au moins 12 caractères.');
      return;
    }
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setMessage('La configuration Google Drive est manquante (NEXT_PUBLIC_GOOGLE_CLIENT_ID).');
      return;
    }

    setGoogleDriveBusy(true);
    setMessage('');
    try {
      const token = await requestGoogleDriveAccessToken(clientId);
      const prepared = await backupUseCase.prepareEncryptedExport(exportPassword, activeBusiness?.id, activeBusiness?.name);
      await uploadFileToGoogleDrive(token, prepared.text, prepared.filename);
      
      await backupUseCase.confirmExported(prepared as unknown as PreparedBackup);
      setLastExportedAt(prepared.envelope.exportedAt);
      setMessage('Sauvegarde chiffrée uploadée avec succès sur votre Google Drive.');
      setExportPassword('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erreur lors de l’upload sur Google Drive.');
    } finally {
      setGoogleDriveBusy(false);
    }
  };

  const exportClearBackup = async () => {
    setBusy(true); setMessage('');
    try {
      const prepared = await backupUseCase.prepareExport(activeBusiness?.id, activeBusiness?.name);
      triggerDownload(prepared.text, prepared.filename);
      await backupUseCase.confirmExported(prepared);
      setLastExportedAt(prepared.envelope.exportedAt);
      setMessage('Sauvegarde JSON non chiffrée téléchargée avec succès.');
    } catch {
      setMessage('Erreur lors de la création de la sauvegarde.');
    } finally { setBusy(false); }
  };

  const selectFile = async (event: ChangeEvent<HTMLInputElement>) => {
    setEnvelope(null); setPreview(null); setConfirmation(''); setPin(''); setMessage(''); setFileText(''); setIsEncryptedFile(false); setImportPassword('');
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (file.size === 0) { setMessage('Le fichier est vide.'); return; }
    if (file.size > MAX_BACKUP_BYTES) { setMessage('Le fichier dépasse la limite autorisée.'); return; }
    
    setBusy(true);
    try {
      const text = await file.text();
      setFileText(text);
      if (file.name.endsWith('.samtech-backup') || text.includes('"encrypted":true')) {
        setIsEncryptedFile(true);
        setMessage('Fichier chiffré détecté. Veuillez saisir le mot de passe de sauvegarde.');
      } else {
        const result = await backupUseCase.inspect(text);
        setEnvelope(result.envelope); setPreview(result.preview);
        setMessage('Sauvegarde en clair valide. Vérifiez le résumé avant de continuer.');
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Fichier non lisible.');
    } finally { setBusy(false); }
  };

  const inspectEncrypted = async () => {
    setBusy(true); setMessage('');
    try {
      const result = await backupUseCase.inspectEncrypted(fileText, importPassword);
      setEnvelope(result.envelope); setPreview(result.preview);
      setCrossBusinessConsent(false);
      setMessage('Mot de passe correct. Sauvegarde déchiffrée et valide.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Mot de passe incorrect ou fichier altéré.');
    } finally { setBusy(false); }
  };

  const restore = async () => {
    const isCrossBusiness = preview?.businessId && preview.businessId !== activeBusiness?.id;
    if (!envelope || confirmation !== REPLACE_PHRASE || (isCrossBusiness && !crossBusinessConsent)) return;
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
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      <PageHeader 
        title={`Sauvegarde et restauration : ${activeBusiness?.name || 'Votre espace'}`} 
        description={`Toutes les opérations sont locales et restent disponibles hors connexion. Les données exportées ou importées concernent uniquement cet espace professionnel.`}
      />
      {message && <div data-testid="backup-message" role="status" className="p-3 text-sm rounded-md bg-secondary text-secondary-foreground">{message}</div>}
      
      <Card>
        <CardHeader>
          <CardTitle>Exporter une sauvegarde</CardTitle>
          <CardDescription>Dernière sauvegarde : {lastExportedAt ? new Date(lastExportedAt).toLocaleString('fr-FR') : 'Aucune'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-900 dark:text-amber-400">
            Protégez votre sauvegarde avec un mot de passe fort (12 caractères min.). <strong className="text-amber-950 dark:text-amber-200">Attention : Sans ce mot de passe, vos données seront impossibles à restaurer. Ce mot de passe est indépendant de votre PIN.</strong>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="export-password">Mot de passe de la sauvegarde</Label>
            <div className="relative">
              <Input
                id="export-password"
                type={showExportPassword ? 'text' : 'password'}
                value={exportPassword}
                onChange={(e) => setExportPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="12 caractères minimum"
              />
              <button
                type="button"
                onClick={() => setShowExportPassword(!showExportPassword)}
                className="absolute right-3 top-2.5 text-muted-foreground"
              >
                {showExportPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">Recommandation : utilisez une phrase d&apos;au moins quatre mots.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button disabled={busy || googleDriveBusy || exportPassword.length < 12} onClick={exportEncryptedBackup} className="w-full sm:w-auto">
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Exporter (.samtech-backup)
            </Button>
            
            <Button variant="outline" disabled={busy || googleDriveBusy || exportPassword.length < 12} onClick={exportToGoogleDrive} className="w-full sm:w-auto border-blue-200 text-blue-700 hover:bg-blue-50">
              {googleDriveBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CloudUpload className="mr-2 h-4 w-4" />} Sauvegarder sur Google Drive
            </Button>
          </div>
          
          <div className="pt-4">
            <Button variant="link" size="sm" onClick={() => setShowAdvanced(!showAdvanced)} className="px-0">
              Options avancées
            </Button>
            {showAdvanced && (
              <div className="mt-2 p-4 border rounded-md space-y-2">
                <p className="text-sm text-destructive">Exporter un JSON non chiffré est risqué pour la confidentialité de vos données.</p>
                <Button variant="outline" disabled={busy} onClick={exportClearBackup}>Exporter un JSON non chiffré</Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Restaurer une sauvegarde</CardTitle>
          <CardDescription>La restauration remplacera toutes les données actuelles de l'espace <strong>{activeBusiness?.name}</strong> sur cet appareil.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Label htmlFor="backup-file">Fichier de sauvegarde (.samtech-backup ou .json)</Label>
          <Input id="backup-file" type="file" accept=".json,.samtech-backup" onChange={selectFile} />
          
          {isEncryptedFile && !preview && (
            <div className="space-y-3 pt-4 border-t">
              <Label htmlFor="import-password">Mot de passe de la sauvegarde</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="import-password"
                    type={showImportPassword ? 'text' : 'password'}
                    value={importPassword}
                    onChange={(e) => setImportPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowImportPassword(!showImportPassword)}
                    className="absolute right-3 top-2.5 text-muted-foreground"
                  >
                    {showImportPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <Button onClick={inspectEncrypted} disabled={busy || !importPassword}>Déchiffrer</Button>
              </div>
            </div>
          )}

          {preview && (
            <div className="rounded-lg bg-muted p-4 space-y-3 mt-4">
              <h3 className="font-semibold">Aperçu validé</h3>
              <dl className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div><dt className="text-muted-foreground">Date</dt><dd>{new Date(preview.exportedAt).toLocaleString('fr-FR')}</dd></div>
                <div><dt className="text-muted-foreground">Format</dt><dd>v{preview.formatVersion}</dd></div>
                <div><dt className="text-muted-foreground">Total Enregistrements</dt><dd>{preview.totalRecords}</dd></div>
                {preview.businessName && <div><dt className="text-muted-foreground">Espace Source</dt><dd>{preview.businessName}</dd></div>}
              </dl>
              
              {preview.businessId && preview.businessId !== activeBusiness?.id && (
                <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive mt-4">
                  <h4 className="font-semibold mb-1">⚠️ Avertissement de sécurité</h4>
                  <p>Cette sauvegarde provient d'un espace différent ({preview.businessName || 'Inconnu'}). La restaurer ici écrasera les données actuelles de l'espace <strong>{activeBusiness?.name}</strong> avec celles de <strong>{preview.businessName || 'Inconnu'}</strong>.</p>
                  <label className="flex items-center gap-2 mt-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={crossBusinessConsent} 
                      onChange={(e) => setCrossBusinessConsent(e.target.checked)} 
                      className="rounded border-destructive"
                    />
                    <span className="font-medium">Je comprends et je confirme vouloir écraser cet espace avec une sauvegarde provenant d'un autre espace.</span>
                  </label>
                </div>
              )}

              <div className="border-t pt-3 space-y-3">
                <div className="space-y-2">
                  <Label>Saisissez exactement « {REPLACE_PHRASE} »</Label>
                  <Input value={confirmation} onChange={(e) => setConfirmation(e.target.value)} />
                </div>
                {session.settings?.pinEnabled && (
                  <div className="space-y-2">
                    <Label>PIN actuel de l&apos;application</Label>
                    <Input type="password" inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value)} />
                  </div>
                )}
                <Button 
                  variant="destructive" 
                  className="w-full"
                  disabled={
                    busy || 
                    confirmation !== REPLACE_PHRASE || 
                    Boolean(session.settings?.pinEnabled && !pin) ||
                    Boolean(preview?.businessId && preview.businessId !== activeBusiness?.id && !crossBusinessConsent)
                  } 
                  onClick={restore}
                >
                  Remplacer toutes les données métier
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
