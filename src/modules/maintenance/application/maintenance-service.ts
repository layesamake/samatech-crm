import { masterDb } from '@/infrastructure/database/master-db';
import { db } from '@/infrastructure/database/db';
import {
  DiagnosticResult,
  DatabaseClassification,
  DatabaseInfo,
  SystemHealthStatus,
  StorageEstimate,
  MaintenanceLog,
} from '../domain/maintenance';
import { BusinessDatabaseManager } from '@/infrastructure/database/business-manager';

const MAINTENANCE_LOGS_KEY = 'samtech_maintenance_logs';

export class MaintenanceService {
  async runDiagnostic(): Promise<DiagnosticResult> {
    const isIndexedDBSupported = typeof indexedDB !== 'undefined' && 'databases' in indexedDB;
    const allMasterRecords = await masterDb.businesses.toArray();
    const activeCount = allMasterRecords.filter((b) => b.status !== 'archived').length;
    const archivedCount = allMasterRecords.filter((b) => b.status === 'archived').length;
    
    const masterDbNames = new Map(allMasterRecords.map((r) => [r.databaseName, r]));
    const restoreInProgress = localStorage.getItem('samtech_restore_in_progress');
    const activeBusinessId = localStorage.getItem('samtech_active_business_id');

    let accessibleDatabases: string[] = [];
    let missingDatabases: string[] = [];
    let orphanDatabases: DatabaseInfo[] = [];
    
    if (isIndexedDBSupported) {
      try {
        const dbs = await indexedDB.databases();
        const physicalDbNames = new Set(dbs.map((d) => d.name).filter(Boolean) as string[]);

        // 1. Check referenced DBs (accessible vs missing)
        for (const [dbName] of masterDbNames) {
          if (physicalDbNames.has(dbName)) {
            accessibleDatabases.push(dbName);
          } else {
            missingDatabases.push(dbName);
          }
        }

        // 2. Find orphan databases
        for (const dbName of physicalDbNames) {
          if (dbName.startsWith('SamtechCRMDatabase') && dbName !== 'SamtechCRM_Master' && !masterDbNames.has(dbName)) {
            // It's an orphan
            let classification: DatabaseClassification = 'unknown';
            let isDeletable = false;
            let deletionReason = undefined;

            if (dbName === 'SamtechCRMDatabase') {
              classification = 'legacy';
            } else if (dbName.includes('_restored_')) {
              classification = 'orphan-historical';
              isDeletable = true;
              deletionReason = "Base historique issue d'une ancienne restauration Zero-Copy.";
            } else if (restoreInProgress) {
              // Might be a partial restore from the current interrupted restore
              classification = 'orphan-partial-restore';
            } else {
              classification = 'orphan-recoverable';
            }

            // A fallback safety check: if it's the currently open DB, never deletable
            if (dbName === db.name) {
              isDeletable = false;
              deletionReason = 'Protection : Base actuellement active.';
            }

            orphanDatabases.push({
              name: dbName,
              classification,
              isDeletable,
              deletionReason,
            });
          }
        }
      } catch (e) {
        console.error('[MaintenanceService] Error during diagnostic:', e);
      }
    }

    // Determine System Health
    let status: SystemHealthStatus = 'healthy';
    
    if (!isIndexedDBSupported) {
      status = 'unknown';
    } else if (missingDatabases.length > 0 || restoreInProgress) {
      status = 'critical';
    } else if (orphanDatabases.length > 0) {
      status = 'warning';
    }

    return {
      status,
      activeCount,
      archivedCount,
      accessibleDatabases,
      missingDatabases,
      orphanDatabases,
      isRestoreInterrupted: !!restoreInProgress,
      isIndexedDBSupported,
    };
  }

  async getStorageEstimate(): Promise<StorageEstimate | null> {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        return {
          usageBytes: estimate.usage || 0,
          quotaBytes: estimate.quota || 0,
          available: true,
        };
      } catch (e) {
        return { usageBytes: 0, quotaBytes: 0, available: false };
      }
    }
    return { usageBytes: 0, quotaBytes: 0, available: false };
  }

  getLogs(): MaintenanceLog[] {
    if (typeof localStorage === 'undefined') return [];
    try {
      const logs = localStorage.getItem(MAINTENANCE_LOGS_KEY);
      if (logs) return JSON.parse(logs);
    } catch (e) {
      console.error('[MaintenanceService] Failed to parse logs', e);
    }
    return [];
  }

  addLog(action: MaintenanceLog['action'], result: MaintenanceLog['result'], databaseName?: string, details?: string) {
    const logs = this.getLogs();
    const newLog: MaintenanceLog = {
      id: crypto.randomUUID(),
      action,
      databaseName,
      timestamp: new Date().toISOString(),
      result,
      details,
    };
    logs.unshift(newLog);
    // Keep only last 50 logs
    if (logs.length > 50) logs.length = 50;
    
    try {
      localStorage.setItem(MAINTENANCE_LOGS_KEY, JSON.stringify(logs));
    } catch (e) {
      console.error('[MaintenanceService] Failed to save log', e);
    }
  }

  async deletePhysicalDatabase(dbName: string): Promise<void> {
    // 1. Revalidation en temps réel
    const allMasterRecords = await masterDb.businesses.toArray();
    const isReferenced = allMasterRecords.some((r) => r.databaseName === dbName);
    
    if (isReferenced) {
      this.addLog('DELETE', 'ERROR', dbName, 'Rejeté: La base est référencée par un espace actif ou archivé.');
      throw new Error('La base est référencée par un espace. Suppression interdite.');
    }

    const restoreInProgress = localStorage.getItem('samtech_restore_in_progress');
    if (restoreInProgress) {
      this.addLog('DELETE', 'ERROR', dbName, 'Rejeté: Une restauration est en cours ou interrompue.');
      throw new Error('Une restauration est en cours. Suppression interdite.');
    }

    if (dbName === db.name) {
      this.addLog('DELETE', 'ERROR', dbName, 'Rejeté: La base est actuellement ouverte.');
      throw new Error('La base est actuellement ouverte. Suppression interdite.');
    }

    // 2. Suppression via IndexedDB
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(dbName);
      
      request.onsuccess = () => {
        this.addLog('DELETE', 'SUCCESS', dbName, 'Base supprimée avec succès.');
        resolve();
      };
      
      request.onerror = () => {
        this.addLog('DELETE', 'ERROR', dbName, 'Échec de la suppression par le navigateur.');
        reject(new Error('Échec de la suppression de la base de données.'));
      };

      request.onblocked = () => {
        // En cas de blocage (base ouverte dans un autre onglet), on rejette aussi
        this.addLog('DELETE', 'ERROR', dbName, 'Suppression bloquée (base potentiellement ouverte ailleurs).');
        reject(new Error("Suppression bloquée. Veuillez fermer les autres onglets de l'application."));
      };
    });
  }

  async recoverOrphanDatabase(dbName: string): Promise<void> {
    try {
      // On utilise le manager existant
      const business = await BusinessDatabaseManager.recoverOrphanDatabase(dbName);
      this.addLog('RECOVER', 'SUCCESS', dbName, `Base récupérée sous le nom "${business.name}".`);
    } catch (e) {
      this.addLog('RECOVER', 'ERROR', dbName, e instanceof Error ? e.message : 'Erreur inconnue');
      throw e;
    }
  }
}
