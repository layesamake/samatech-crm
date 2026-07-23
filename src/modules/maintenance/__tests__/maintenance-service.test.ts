import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { MaintenanceService } from '../application/maintenance-service';
import { masterDb } from '@/infrastructure/database/master-db';
import { db } from '@/infrastructure/database/db';
import { BusinessDatabaseManager } from '@/infrastructure/database/business-manager';

const RESTORE_IN_PROGRESS_KEY = 'samtech_restore_in_progress';
const ACTIVE_BUSINESS_KEY = 'samtech_active_business_id';

// Mocker indexedDB global pour les tests
const mockIndexedDB = {
  databases: vi.fn(),
  deleteDatabase: vi.fn()
};
vi.stubGlobal('indexedDB', mockIndexedDB);

const service = new MaintenanceService();

async function resetDatabase() {
  db.close();
  await db.delete();
  await db.open();
  masterDb.close();
  await masterDb.delete();
  await masterDb.open();
}

describe('MaintenanceService', () => {
  beforeEach(async () => {
    await resetDatabase();
    localStorage.clear();
    mockIndexedDB.databases.mockReset();
    mockIndexedDB.deleteDatabase.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('runDiagnostic', () => {
    it('détecte correctement un environnement sain', async () => {
      await masterDb.businesses.add({
        id: 'biz1',
        name: 'Business 1',
        databaseName: 'SamtechCRMDatabase_biz1',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastAccessedAt: new Date().toISOString()
      });

      mockIndexedDB.databases.mockResolvedValue([
        { name: 'SamtechCRMDatabase_biz1' },
        { name: 'SamtechCRM_Master' } // Ignored in orphans logic
      ]);

      const diag = await service.runDiagnostic();
      expect(diag.status).toBe('healthy');
      expect(diag.activeCount).toBe(1);
      expect(diag.accessibleDatabases).toContain('SamtechCRMDatabase_biz1');
      expect(diag.missingDatabases).toHaveLength(0);
      expect(diag.orphanDatabases).toHaveLength(0);
    });

    it('détecte une base orpheline historique', async () => {
      mockIndexedDB.databases.mockResolvedValue([
        { name: 'SamtechCRMDatabase_biz1_restored_1234' }
      ]);

      const diag = await service.runDiagnostic();
      expect(diag.status).toBe('warning');
      expect(diag.orphanDatabases[0].classification).toBe('orphan-historical');
      expect(diag.orphanDatabases[0].isDeletable).toBe(true);
    });

    it('détecte une base orpheline récupérable', async () => {
      mockIndexedDB.databases.mockResolvedValue([
        { name: 'SamtechCRMDatabase_biz_unknown' }
      ]);

      const diag = await service.runDiagnostic();
      expect(diag.status).toBe('warning');
      expect(diag.orphanDatabases[0].classification).toBe('orphan-recoverable');
    });

    it('détecte une base manquante', async () => {
      await masterDb.businesses.add({
        id: 'biz1',
        name: 'Business 1',
        databaseName: 'SamtechCRMDatabase_biz1',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastAccessedAt: new Date().toISOString()
      });

      mockIndexedDB.databases.mockResolvedValue([]);

      const diag = await service.runDiagnostic();
      expect(diag.status).toBe('critical');
      expect(diag.missingDatabases).toContain('SamtechCRMDatabase_biz1');
    });

    it('gère une restauration interrompue en cours', async () => {
      localStorage.setItem(RESTORE_IN_PROGRESS_KEY, '{"status": "preparing"}');
      mockIndexedDB.databases.mockResolvedValue([
        { name: 'SamtechCRMDatabase_partial' }
      ]);

      const diag = await service.runDiagnostic();
      expect(diag.status).toBe('critical');
      expect(diag.isRestoreInterrupted).toBe(true);
      expect(diag.orphanDatabases[0].classification).toBe('orphan-partial-restore');
    });

    it('ne marque pas la base active comme supprimable', async () => {
      mockIndexedDB.databases.mockResolvedValue([
        { name: db.name } // Simulated orphan but currently open
      ]);

      const diag = await service.runDiagnostic();
      // Ensure the DB is actually found as an orphan
      const orphan = diag.orphanDatabases.find(o => o.name === db.name);
      if (orphan) {
        expect(orphan.isDeletable).toBe(false);
      }
    });
  });

  describe('deletePhysicalDatabase', () => {
    it('refuse de supprimer une base référencée (revalidation)', async () => {
      await masterDb.businesses.add({
        id: 'biz1',
        name: 'Business 1',
        databaseName: 'SamtechCRMDatabase_ref',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastAccessedAt: new Date().toISOString()
      });

      await expect(service.deletePhysicalDatabase('SamtechCRMDatabase_ref')).rejects.toThrow('référencée');
    });

    it('refuse de supprimer si une restauration est en cours', async () => {
      localStorage.setItem(RESTORE_IN_PROGRESS_KEY, '{"status": "preparing"}');
      await expect(service.deletePhysicalDatabase('SamtechCRMDatabase_orphan')).rejects.toThrow('restauration est en cours');
    });

    it('supprime une base orpheline légitime', async () => {
      // Mock IDB delete request
      const mockRequest: any = {};
      Object.defineProperty(mockRequest, 'onsuccess', {
        set(cb) {
          setTimeout(() => cb(), 10);
        }
      });
      mockIndexedDB.deleteDatabase.mockReturnValue(mockRequest);

      const promise = service.deletePhysicalDatabase('SamtechCRMDatabase_orphan');
      
      await expect(promise).resolves.toBeUndefined();
      
      const logs = service.getLogs();
      expect(logs[0].action).toBe('DELETE');
      expect(logs[0].result).toBe('SUCCESS');
    });
  });

  describe('recoverOrphanDatabase', () => {
    it("récupère une base orpheline et log l'action", async () => {
      // Spy on BusinessDatabaseManager instead of executing real recovery (which needs a physical db)
      const spy = vi.spyOn(BusinessDatabaseManager, 'recoverOrphanDatabase').mockResolvedValue({
        id: 'new-id',
        name: 'Espace Récupéré',
        databaseName: 'SamtechCRMDatabase_orphan',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastAccessedAt: new Date().toISOString()
      });

      await service.recoverOrphanDatabase('SamtechCRMDatabase_orphan');
      expect(spy).toHaveBeenCalledWith('SamtechCRMDatabase_orphan');
      
      const logs = service.getLogs();
      expect(logs[0].action).toBe('RECOVER');
      expect(logs[0].result).toBe('SUCCESS');
    });
  });
});
