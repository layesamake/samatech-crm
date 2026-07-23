'use client';

import { ChangeEvent, useState } from 'react';
import { ManageGlobalBackupsUseCase, PreparedGlobalBackup } from '../application/manage-global-backups';
import { GlobalBackupEnvelope, GlobalBackupPreview } from '../domain/global-backup';
import { BusinessDatabaseManager } from '@/infrastructure/database/business-manager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ShieldAlert, FileWarning, RefreshCw, Archive } from 'lucide-react';

const globalUseCase = new ManageGlobalBackupsUseCase();
const REPLACE_PHRASE = 'REMPLACER TOUT MON ENVIRONNEMENT';

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

export default function GlobalBackupSettings() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  
  // Export states
  const [showExport, setShowExport] = useState(false);

  // Restore states
  const [envelope, setEnvelope] = useState<GlobalBackupEnvelope | null>(null);
  const [preview, setPreview] = useState<GlobalBackupPreview | null>(null);
  const [confirmation, setConfirmation] = useState('');

  // Diagnostic states
  const [diagnosticRun, setDiagnosticRun] = useState(false);
  const [orphans, setOrphans] = useState<string[]>([]);
  const [diagnosticMessage, setDiagnosticMessage] = useState('');

  // 1. Export Global
  const exportGlobalBackup = async () => {
    setBusy(true);
    setMessage('');
    try {
      const prepared = await globalUseCase.prepareGlobalExport();
      triggerDownload(prepared.text, prepared.filename);
      setMessage(`Sauvegarde globale créée avec succès (${prepared.envelope.metadata.businessCount} espaces sauvegardés).`);
      setShowExport(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde globale.');
    } finally {
      setBusy(false);
    }
  };

  // 2. Select File for Restore
  const selectFile = async (event: ChangeEvent<HTMLInputElement>) => {
    setEnvelope(null);
    setPreview(null);
    setConfirmation('');
    setMessage('');
    
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (file.size === 0) { setMessage('Le fichier est vide.'); return; }
    
    setBusy(true);
    try {
      const text = await file.text();
      const resultPreview = await globalUseCase.preview(text);
      setPreview(resultPreview);
      setEnvelope(JSON.parse(text) as GlobalBackupEnvelope);
      setMessage('Sauvegarde globale valide. Vérifiez le résumé avant de procéder à la restauration destructrice.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Fichier non lisible ou invalide.');
    } finally {
      setBusy(false);
    }
  };

  // 3. Restore Global
  const restoreGlobal = async () => {
    if (!envelope || confirmation !== REPLACE_PHRASE) return;
    setBusy(true);
    setMessage('');
    try {
      await globalUseCase.restoreGlobal(envelope);
      setMessage('Restauration globale terminée. Rechargement de l’environnement...');
      window.setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'La restauration globale a échoué.');
      setBusy(false);
    }
  };

  // 4. Diagnostic (Detect Orphans)
  const runDiagnostic = async () => {
    setBusy(true);
    setDiagnosticMessage('');
    setDiagnosticRun(false);
    try {
      const detectedOrphans = await BusinessDatabaseManager.detectOrphanDatabases();
      setOrphans(detectedOrphans);
      setDiagnosticRun(true);
      if (detectedOrphans.length === 0) {
        setDiagnosticMessage('Aucune base de données orpheline détectée. Votre environnement est sain.');
      } else {
        setDiagnosticMessage(`${detectedOrphans.length} espace(s) orphelin(s) détecté(s).`);
      }
    } catch (error) {
      setDiagnosticMessage('Erreur lors du diagnostic.');
    } finally {
      setBusy(false);
    }
  };

  // 5. Recover Orphan
  const recoverOrphan = async (databaseName: string) => {
    setBusy(true);
    try {
      await BusinessDatabaseManager.recoverOrphanDatabase(databaseName);
      setDiagnosticMessage(`Base ${databaseName} récupérée avec succès.`);
      // Refresh list
      const detectedOrphans = await BusinessDatabaseManager.detectOrphanDatabases();
      setOrphans(detectedOrphans);
    } catch (error) {
      setDiagnosticMessage('Échec de la récupération.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 mt-8">
      <div className="border-t pt-8">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-indigo-500" />
          Sauvegarde Globale Multi-Business
        </h2>
        <p className="text-muted-foreground mt-1">
          Ces outils permettent de sauvegarder, restaurer ou diagnostiquer l'intégralité de votre environnement SAMTECH CRM, incluant tous vos espaces actifs et archivés.
        </p>
      </div>

      {message && <div role="status" className="p-3 text-sm rounded-md bg-secondary text-secondary-foreground">{message}</div>}

      <div className="grid gap-6 md:grid-cols-2">
        {/* EXPORT GLOBAL */}
        <Card className="border-indigo-100 dark:border-indigo-900">
          <CardHeader>
            <CardTitle>Sauvegarder tous mes espaces</CardTitle>
            <CardDescription>
              Crée un fichier unique `.samtech-global-backup` contenant la totalité de vos données.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!showExport ? (
              <Button onClick={() => setShowExport(true)} variant="outline" className="w-full">
                Préparer la sauvegarde globale
              </Button>
            ) : (
              <div className="space-y-4 rounded-md border p-4 bg-muted/50">
                <div className="text-sm">
                  <strong>Cette sauvegarde contiendra :</strong>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>Tous vos espaces</li>
                    <li>Toutes les données de vos espaces</li>
                    <li>La configuration Multi-Business</li>
                  </ul>
                </div>
                <div className="flex gap-2">
                  <Button onClick={exportGlobalBackup} disabled={busy} className="flex-1">
                    {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Télécharger (.samtech-global-backup)
                  </Button>
                  <Button onClick={() => setShowExport(false)} variant="ghost" disabled={busy}>Annuler</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* DIAGNOSTIC */}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle>Diagnostic des Espaces</CardTitle>
            <CardDescription>
              Vérifie l'intégrité de vos espaces et détecte les bases IndexedDB orphelines.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={runDiagnostic} disabled={busy} variant="secondary" className="w-full">
              {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Vérifier l'intégrité de mes espaces
            </Button>
            
            {diagnosticMessage && (
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{diagnosticMessage}</p>
            )}
            
            {diagnosticRun && orphans.length > 0 && (
              <div className="space-y-2 mt-4">
                {orphans.map(orphanDb => (
                  <div key={orphanDb} className="flex flex-col sm:flex-row gap-2 justify-between items-center p-3 border rounded-md bg-amber-50 dark:bg-amber-950/20">
                    <span className="text-sm font-mono truncate max-w-[200px]">{orphanDb}</span>
                    <Button size="sm" onClick={() => recoverOrphan(orphanDb)} disabled={busy} variant="outline" className="text-amber-700 border-amber-300 hover:bg-amber-100 dark:text-amber-400 dark:border-amber-800 dark:hover:bg-amber-900">
                      Récupérer cet espace
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* RESTORE GLOBAL */}
      <Card className="border-destructive/20 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <FileWarning className="w-5 h-5" />
            Restaurer une sauvegarde globale
          </CardTitle>
          <CardDescription>
            Cette opération supprimera l'ensemble de vos espaces actuels pour les remplacer par ceux de la sauvegarde.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Label htmlFor="global-backup-file">Fichier de sauvegarde globale (.samtech-global-backup)</Label>
          <Input id="global-backup-file" type="file" accept=".samtech-global-backup,.json" onChange={selectFile} />
          
          {preview && (
            <div className="rounded-lg border border-destructive/20 bg-background p-4 space-y-4 mt-4">
              <h3 className="font-semibold text-destructive">⚠️ Restauration Complète</h3>
              <p className="text-sm">
                Sauvegarde globale détectée.<br />
                Créée le : <strong>{new Date(preview.exportedAt).toLocaleString('fr-FR')}</strong><br />
                Nombre d'espaces : <strong>{preview.totalBusinesses}</strong>
              </p>
              
              <div className="text-sm">
                <strong>Espaces inclus :</strong>
                <ul className="list-disc pl-5 mt-1">
                  {preview.businesses.map(b => (
                    <li key={b.id}>
                      {b.name} {b.status === 'archived' && <span className="text-muted-foreground">(Archivé)</span>}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-md border border-destructive p-4 bg-destructive/10 text-destructive text-sm mt-4">
                <strong>Cette opération remplacera l'environnement SAMTECH CRM actuellement présent sur cet appareil.</strong>
                <p className="mt-2">Il est fortement recommandé d'effectuer une sauvegarde globale avant de procéder.</p>
              </div>

              <div className="border-t pt-4 space-y-3">
                <div className="space-y-2">
                  <Label>Saisissez exactement « {REPLACE_PHRASE} »</Label>
                  <Input 
                    value={confirmation} 
                    onChange={(e) => setConfirmation(e.target.value)} 
                    placeholder={REPLACE_PHRASE} 
                    className="border-destructive focus-visible:ring-destructive"
                  />
                </div>
                
                <Button 
                  onClick={restoreGlobal} 
                  disabled={busy || confirmation !== REPLACE_PHRASE}
                  variant="destructive"
                  className="w-full"
                >
                  {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  RESTAURER TOUT L'ENVIRONNEMENT
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
