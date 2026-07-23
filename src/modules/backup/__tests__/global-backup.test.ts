import { beforeEach, describe, expect, it, vi } from 'vitest';
import { masterDb, BusinessRecord } from '@/infrastructure/database/master-db';
import { db, SamtechCRMDatabase } from '@/infrastructure/database/db';
import { ManageGlobalBackupsUseCase } from '../application/manage-global-backups';
import { BusinessDatabaseManager } from '@/infrastructure/database/business-manager';

const fixedNow = () => new Date('2026-07-23T15:30:00.000Z');
const useCase = new ManageGlobalBackupsUseCase(fixedNow);

async function resetAll() {
  if (db.isOpen()) db.close();
  await db.delete();
  
  await masterDb.businesses.clear();
  
  // Clear any potential db left
  if (typeof indexedDB !== 'undefined' && indexedDB.databases) {
    const dbs = await indexedDB.databases();
    for (const d of dbs) {
      if (d.name && d.name.startsWith('SamtechCRMDatabase_')) {
        await new Promise((resolve) => {
          const req = indexedDB.deleteDatabase(d.name!);
          req.onsuccess = resolve;
          req.onerror = resolve;
        });
      }
    }
  }
}

describe('Global Backup & Restore (Phase 3)', () => {
  beforeEach(async () => {
    await resetAll();
    localStorage.clear();
  });

  it('exporte tous les business, valide l\'intégrité, et les restaure correctement', async () => {
    const now = fixedNow().toISOString();
    
    // 1. Préparation de l'environnement (A, B, C)
    const bA = await BusinessDatabaseManager.createBusiness({ name: 'Business A' });
    const bB = await BusinessDatabaseManager.createBusiness({ name: 'Business B' });
    const bC = await BusinessDatabaseManager.createBusiness({ name: 'Business C' });
    await masterDb.businesses.update(bC.id, { status: 'archived' });
    
    // Injection de données dans A
    const dbA = new SamtechCRMDatabase(bA.databaseName);
    await dbA.open();
    await dbA.settings.put({ key: 'company.profile', value: { name: 'Business A' }, schemaVersion: 1, updatedAt: now });
    await dbA.contacts.put({ id: 'contactA1', displayName: 'Client A', source: 'REFERRAL', whatsappPhone: '111', normalizedWhatsappPhone: '+111', createdAt: now, updatedAt: now });
    dbA.close();

    // Injection de données dans B
    const dbB = new SamtechCRMDatabase(bB.databaseName);
    await dbB.open();
    await dbB.settings.put({ key: 'company.profile', value: { name: 'Business B' }, schemaVersion: 1, updatedAt: now });
    await dbB.contacts.put({ id: 'contactB1', displayName: 'Client B', source: 'REFERRAL', whatsappPhone: '222', normalizedWhatsappPhone: '+222', createdAt: now, updatedAt: now });
    dbB.close();

    // Setup active business
    localStorage.setItem('samtech_active_business_id', bB.id);
    localStorage.setItem('samtech_active_business_db', bB.databaseName);

    // 2. Export Global
    const exportResult = await useCase.prepareGlobalExport();
    expect(exportResult.envelope.metadata.businessCount).toBe(3);
    expect(exportResult.envelope.metadata.activeBusinessId).toBe(bB.id);
    expect(exportResult.envelope.master.businesses).toHaveLength(3);
    expect(exportResult.envelope.businesses).toHaveLength(3);

    // 3. Prévisualisation
    const preview = await useCase.preview(exportResult.text);
    expect(preview.totalBusinesses).toBe(3);
    expect(preview.businesses.find(b => b.id === bC.id)?.status).toBe('archived');

    // 4. Test corruption d'intégrité
    const corruptedText = exportResult.text.replace('Client A', 'Hacked Client A');
    await expect(useCase.preview(corruptedText)).rejects.toThrow(/intégrité/);

    // 5. Destruction de l'environnement pour simuler un nouveau départ
    await resetAll();
    localStorage.clear();

    // 6. Restauration Globale
    await useCase.restoreGlobal(exportResult.envelope);

    // 7. Vérifications Post-Restore
    const masterRecords = await masterDb.businesses.toArray();
    expect(masterRecords).toHaveLength(3);
    
    // Vérifier que les IDs logiques sont conservés, mais les databaseName ont changé pour éviter les collisions
    const restoredA = masterRecords.find(r => r.id === bA.id);
    expect(restoredA).toBeDefined();
    expect(restoredA!.databaseName).not.toBe(bA.databaseName); // Nouveau nom physique
    
    const restoredC = masterRecords.find(r => r.id === bC.id);
    expect(restoredC?.status).toBe('archived');

    // Vérifier les données dans la nouvelle base physique de A
    const restoredDbA = new SamtechCRMDatabase(restoredA!.databaseName);
    await restoredDbA.open();
    const contactA = await restoredDbA.contacts.get('contactA1');
    expect(contactA?.displayName).toBe('Client A');
    restoredDbA.close();

    // Vérifier que le localStorage a été correctement restauré
    expect(localStorage.getItem('samtech_active_business_id')).toBe(bB.id);
  });

  it('détecte et permet de récupérer une base orpheline (Diagnostic)', async () => {
    // Simuler une base orpheline en créant une base physique, mais absente de Master DB
    const orphanDbName = 'SamtechCRMDatabase_orphan123';
    const orphanDb = new SamtechCRMDatabase(orphanDbName);
    await orphanDb.open();
    await orphanDb.settings.put({ key: 'company.profile', value: { name: 'Entreprise Perdue' }, schemaVersion: 1, updatedAt: new Date().toISOString() });
    orphanDb.close();

    // Mock indexedDB.databases since it might not be fully supported in jsdom env used by Vitest
    const originalDatabases = indexedDB.databases;
    indexedDB.databases = vi.fn().mockResolvedValue([{ name: orphanDbName }]);

    const orphans = await BusinessDatabaseManager.detectOrphanDatabases();
    expect(orphans).toContain(orphanDbName);

    // Récupération
    const recovered = await BusinessDatabaseManager.recoverOrphanDatabase(orphanDbName);
    expect(recovered.name).toBe('Entreprise Perdue');
    expect(recovered.databaseName).toBe(orphanDbName);
    
    const masterRecords = await masterDb.businesses.toArray();
    expect(masterRecords.find(r => r.id === recovered.id)).toBeDefined();

    indexedDB.databases = originalDatabases; // restore
  });
});
