import { masterDb, BusinessRecord } from '@/infrastructure/database/master-db';
import { SamtechCRMDatabase } from '@/infrastructure/database/db';
import { DexieBackupRepository } from '../infrastructure/dexie-backup-repository';
import {
  calculateGlobalIntegrity,
  GLOBAL_BACKUP_FORMAT_VERSION,
  GLOBAL_BACKUP_PRODUCT,
  GlobalBackupEnvelope,
  globalBackupFilename,
  GlobalBackupPreview,
  GlobalBusinessBackup,
  validateGlobalBackupText,
} from '../domain/global-backup';
import { BusinessDatabaseManager } from '@/infrastructure/database/business-manager';
import Dexie from 'dexie';

export interface PreparedGlobalBackup {
  envelope: GlobalBackupEnvelope;
  text: string;
  filename: string;
}

export class ManageGlobalBackupsUseCase {
  constructor(private readonly now: () => Date = () => new Date()) {}

  async prepareGlobalExport(): Promise<PreparedGlobalBackup> {
    const date = this.now();
    const businessesRecord = await masterDb.businesses.toArray();
    
    const activeBusinessId = BusinessDatabaseManager.getActiveBusinessId() || undefined;

    const businesses: GlobalBusinessBackup[] = [];

    for (const record of businessesRecord) {
      // Connect to the business DB temporarily
      const tempDb = new SamtechCRMDatabase(record.databaseName);
      await tempDb.open();
      const repo = new DexieBackupRepository(tempDb);
      const collections = await repo.readCollections();
      
      businesses.push({
        id: record.id,
        name: record.name,
        originalDatabaseName: record.databaseName,
        collections,
      });

      tempDb.close();
    }

    const base: Omit<GlobalBackupEnvelope, 'integrity'> = {
      product: GLOBAL_BACKUP_PRODUCT,
      formatVersion: GLOBAL_BACKUP_FORMAT_VERSION,
      appVersion: '0.1.0',
      exportedAt: date.toISOString(),
      metadata: {
        generator: 'SAMTECH CRM',
        businessCount: businessesRecord.length,
        activeBusinessId,
      },
      master: {
        businesses: businessesRecord,
      },
      businesses,
    };

    // Normalize base to remove undefined fields matching JSON stringify behavior
    const normalizedBase = JSON.parse(JSON.stringify(base));
    const integrityDigest = await calculateGlobalIntegrity(normalizedBase);

    const envelope: GlobalBackupEnvelope = {
      ...base,
      integrity: {
        algorithm: 'SHA-256',
        digest: integrityDigest,
      },
    };

    const text = JSON.stringify(envelope, null, 2);
    // Extra validation to make sure we didn't miss anything
    await validateGlobalBackupText(text);

    return {
      envelope,
      text,
      filename: globalBackupFilename(date),
    };
  }

  async preview(text: string): Promise<GlobalBackupPreview> {
    const envelope = await validateGlobalBackupText(text);
    return {
      exportedAt: envelope.exportedAt,
      appVersion: envelope.appVersion,
      formatVersion: envelope.formatVersion,
      totalBusinesses: envelope.metadata.businessCount,
      businesses: envelope.master.businesses.map(b => ({
        id: b.id,
        name: b.name,
        status: b.status,
      })),
      activeBusinessId: envelope.metadata.activeBusinessId,
    };
  }

  async restoreGlobal(envelope: GlobalBackupEnvelope): Promise<void> {
    // 1. Check if it's a valid envelope
    await validateGlobalBackupText(JSON.stringify(envelope));

    // PREPARE
    // Enregistrement de l'état en cours de restauration pour reprise sur erreur
    if (typeof window !== 'undefined') {
      localStorage.setItem('samtech_restore_in_progress', JSON.stringify({
        startedAt: new Date().toISOString(),
        formatVersion: envelope.formatVersion,
        status: 'preparing'
      }));
    }

    const newRecords: BusinessRecord[] = [];
    const restoredDbs: SamtechCRMDatabase[] = [];

    try {
      for (const businessBackup of envelope.businesses) {
        // Create a NEW physical database name to avoid collisions with existing/old DBs
        const newDatabaseName = `SamtechCRMDatabase_${crypto.randomUUID()}`;
        
        // Find the corresponding Master DB record from the backup
        const originalRecord = envelope.master.businesses.find(b => b.id === businessBackup.id);
        if (!originalRecord) {
          throw new Error(`Business record missing for ID ${businessBackup.id}`);
        }

        const newRecord: BusinessRecord = {
          ...originalRecord,
          databaseName: newDatabaseName, // Overwrite with new physical name
        };
        newRecords.push(newRecord);

        // Open new physical database and import collections
        const newDb = new SamtechCRMDatabase(newDatabaseName);
        restoredDbs.push(newDb);
        await newDb.open();
        const repo = new DexieBackupRepository(newDb);
        
        // Convert GlobalBusinessBackup into BackupEnvelope for repository
        const tempEnvelope = {
          product: 'samtech-crm' as const,
          formatVersion: 1 as const,
          appVersion: envelope.appVersion,
          sourceSchemaVersion: 13,
          exportedAt: envelope.exportedAt,
          metadata: {
            generator: 'SAMTECH CRM' as const,
            collectionCount: businessBackup.collections.length,
            recordCount: businessBackup.collections.reduce((sum, c) => sum + c.count, 0),
          },
          collections: businessBackup.collections,
          integrity: { algorithm: 'SHA-256' as const, digest: 'IGNORED_DURING_INTERNAL_RESTORE' }
        };

        await repo.replaceCollections(tempEnvelope);
      }

      // VALIDATE
      if (typeof window !== 'undefined') {
        localStorage.setItem('samtech_restore_in_progress', JSON.stringify({
          startedAt: new Date().toISOString(),
          formatVersion: envelope.formatVersion,
          status: 'committing'
        }));
      }

      // COMMIT: Point of no return
      await masterDb.transaction('rw', masterDb.businesses, async () => {
        await masterDb.businesses.clear();
        await masterDb.businesses.bulkAdd(newRecords);
      });

      // Restore the active business pointer safely
      if (envelope.metadata.activeBusinessId) {
        const activeRecord = newRecords.find(b => b.id === envelope.metadata.activeBusinessId);
        if (activeRecord && activeRecord.status !== 'archived') {
          if (typeof window !== 'undefined') {
            localStorage.setItem('samtech_active_business_id', activeRecord.id);
            localStorage.setItem('samtech_active_business_db', activeRecord.databaseName);
          }
        } else {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('samtech_active_business_id');
            localStorage.removeItem('samtech_active_business_db');
          }
        }
      } else {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('samtech_active_business_id');
          localStorage.removeItem('samtech_active_business_db');
        }
      }

      // CLEAR JOURNAL
      if (typeof window !== 'undefined') {
        localStorage.removeItem('samtech_restore_in_progress');
      }

    } catch (e) {
      // ROLLBACK PREPARE / VALIDATE
      // Fermer et nettoyer physiquement les DB partielles pour ne pas polluer l'espace avec des bases orphelines cassées
      for (const db of restoredDbs) {
        if (db.isOpen()) {
          db.close();
        }
        try {
          await db.delete(); // Destruction physique
        } catch (ignore) {
          console.error('[RestoreGlobal] Failed to cleanup partial DB', ignore);
        }
      }
      
      if (typeof window !== 'undefined') {
        localStorage.removeItem('samtech_restore_in_progress');
      }
      
      throw e;
    } finally {
      // Ensure all instances are closed to avoid locks
      for (const db of restoredDbs) {
        if (db.isOpen()) {
          db.close();
        }
      }
    }
  }
}
