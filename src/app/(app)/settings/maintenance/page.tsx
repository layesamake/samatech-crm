'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, HardDrive, ShieldAlert, CheckCircle2, AlertTriangle, AlertCircle, RefreshCw, Archive, Database, History, Trash2, ArrowLeftRight } from 'lucide-react';
import { MaintenanceService } from '@/modules/maintenance/application/maintenance-service';
import { DiagnosticResult, DatabaseInfo, MaintenanceLog, StorageEstimate } from '@/modules/maintenance/domain/maintenance';
import { DeleteDatabaseDialog } from '@/modules/maintenance/presentation/DeleteDatabaseDialog';

export default function MaintenancePage() {
  const router = useRouter();
  const [diagnostic, setDiagnostic] = useState<DiagnosticResult | null>(null);
  const [storage, setStorage] = useState<StorageEstimate | null>(null);
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<DatabaseInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const maintenanceService = new MaintenanceService();

  const loadData = async () => {
    setIsDiagnosing(true);
    setError(null);
    try {
      const diag = await maintenanceService.runDiagnostic();
      setDiagnostic(diag);
      const est = await maintenanceService.getStorageEstimate();
      setStorage(est);
      setLogs(maintenanceService.getLogs());
    } catch (err) {
      setError('Erreur lors du diagnostic local.');
    } finally {
      setIsDiagnosing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (dbName: string) => {
    try {
      await maintenanceService.deletePhysicalDatabase(dbName);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression.');
      setLogs(maintenanceService.getLogs());
    }
  };

  const handleRecover = async (dbName: string) => {
    try {
      setIsDiagnosing(true);
      await maintenanceService.recoverOrphanDatabase(dbName);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la récupération.');
      setLogs(maintenanceService.getLogs());
      setIsDiagnosing(false);
    }
  };

  const handleBackupFirst = () => {
    router.push('/settings/backup');
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16 pt-4 px-4 sm:px-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader 
          title="Maintenance des espaces" 
          description="Centre d'administration et de diagnostic du stockage local."
        />
        <Button onClick={loadData} disabled={isDiagnosing} variant="outline" className="shrink-0">
          <RefreshCw className={`w-4 h-4 mr-2 ${isDiagnosing ? 'animate-spin' : ''}`} />
          {isDiagnosing ? 'Analyse...' : 'Actualiser'}
        </Button>
      </div>

      {error && (
        <div className="p-3 text-sm rounded-md bg-destructive/10 text-destructive border border-destructive/20 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {diagnostic && (
        <div className="grid gap-6">
          {/* SANTÉ GLOBALE */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Santé de vos espaces
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">État global</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold flex items-center gap-2">
                    {diagnostic.status === 'healthy' && <><CheckCircle2 className="w-6 h-6 text-emerald-500"/> SAIN</>}
                    {diagnostic.status === 'warning' && <><AlertTriangle className="w-6 h-6 text-amber-500"/> ATTENTION</>}
                    {diagnostic.status === 'critical' && <><ShieldAlert className="w-6 h-6 text-destructive"/> CRITIQUE</>}
                    {diagnostic.status === 'unknown' && <><AlertCircle className="w-6 h-6 text-muted-foreground"/> INCONNU</>}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Espaces Actifs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{diagnostic.activeCount}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Bases Orphelines</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{diagnostic.orphanDatabases.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Stockage Utilisé</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{storage?.available ? formatBytes(storage.usageBytes) : 'Inconnu'}</div>
                </CardContent>
              </Card>
            </div>

            {diagnostic.isRestoreInterrupted && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-xl flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 mt-0.5" />
                <div>
                  <h4 className="font-semibold">Restauration interrompue</h4>
                  <p className="text-sm mt-1">Une opération de restauration précédente semble avoir échoué ou été interrompue. Votre environnement a été sécurisé mais des données partielles peuvent être présentes.</p>
                </div>
              </div>
            )}
            
            {diagnostic.missingDatabases.length > 0 && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 mt-0.5" />
                <div>
                  <h4 className="font-semibold">Bases de données manquantes</h4>
                  <p className="text-sm mt-1">Les données locales pour {diagnostic.missingDatabases.length} espace(s) sont introuvables sur cet appareil. Restaurer les à partir d'une sauvegarde.</p>
                  <ul className="list-disc pl-4 mt-2 text-sm">
                    {diagnostic.missingDatabases.map(db => <li key={db}>{db}</li>)}
                  </ul>
                </div>
              </div>
            )}

            {!diagnostic.isIndexedDBSupported && (
              <div className="bg-muted border text-muted-foreground p-4 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 mt-0.5" />
                <div>
                  <h4 className="font-semibold">Diagnostic avancé non disponible</h4>
                  <p className="text-sm mt-1">Le navigateur que vous utilisez (ex: Safari restrictif) ne permet pas de lister les bases de données existantes. La détection des orphelines n'est pas possible sur cet appareil.</p>
                </div>
              </div>
            )}
          </section>

          {/* BASES ORPHELINES */}
          {diagnostic.isIndexedDBSupported && diagnostic.orphanDatabases.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Database className="w-5 h-5" />
                Bases de données non référencées
              </h2>
              <p className="text-sm text-muted-foreground mb-4">Ces bases physiques existent sur votre appareil mais ne sont attachées à aucun de vos espaces actuels.</p>
              
              <div className="space-y-3">
                {diagnostic.orphanDatabases.map(db => (
                  <Card key={db.name} className="border-amber-200 dark:border-amber-900/50">
                    <CardHeader className="py-3">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <div>
                          <CardTitle className="text-base font-mono text-sm break-all">{db.name}</CardTitle>
                          <CardDescription className="mt-1">
                            {db.classification === 'orphan-historical' && <span className="text-amber-600 dark:text-amber-400">Ancienne base issue d'une restauration (Zero-Copy)</span>}
                            {db.classification === 'orphan-partial-restore' && <span className="text-destructive">Base partielle (Restauration interrompue)</span>}
                            {db.classification === 'legacy' && <span>Base historique SAMTECH CRM V1</span>}
                            {db.classification === 'orphan-recoverable' && <span>Base orpheline récupérable</span>}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button variant="outline" size="sm" onClick={() => handleRecover(db.name)} disabled={isDiagnosing}>
                            <ArrowLeftRight className="w-4 h-4 mr-2" />
                            Récupérer
                          </Button>
                          {db.isDeletable && (
                            <Button variant="destructive" size="sm" onClick={() => setDeleteCandidate(db)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* HISTORIQUE */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <History className="w-5 h-5" />
              Historique de maintenance
            </h2>
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune opération récente.</p>
            ) : (
              <div className="space-y-2">
                {logs.slice(0, 10).map(log => (
                  <div key={log.id} className="text-sm border p-3 rounded-lg flex flex-col gap-1">
                    <div className="flex justify-between items-center font-medium">
                      <span>{log.action} {log.databaseName ? `- ${log.databaseName}` : ''}</span>
                      <span className={log.result === 'SUCCESS' ? 'text-emerald-500' : 'text-destructive'}>{log.result}</span>
                    </div>
                    <div className="text-muted-foreground text-xs">{new Date(log.timestamp).toLocaleString()}</div>
                    {log.details && <div className="text-muted-foreground mt-1 bg-muted p-1 rounded px-2">{log.details}</div>}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      <DeleteDatabaseDialog 
        isOpen={!!deleteCandidate}
        onOpenChange={(open) => !open && setDeleteCandidate(null)}
        database={deleteCandidate}
        onConfirm={handleDelete}
        onBackupFirst={handleBackupFirst}
      />
    </div>
  );
}
