import { describe, it, expect, beforeEach, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { masterDb, BusinessRecord } from './master-db';
import { BusinessDatabaseManager } from './business-manager';
import { db, SamtechCRMDatabase } from './db';
import Dexie from 'dexie';

const STORAGE_KEY_ACTIVE_ID = 'samtech_active_business_id';
const STORAGE_KEY_ACTIVE_DB = 'samtech_active_business_db';

describe('Phase 1.1 - Business Resolution', () => {
  beforeEach(async () => {
    localStorage.clear();
    await masterDb.businesses.clear();
    if (db.isOpen()) db.close();
    
    const dbs = await indexedDB.databases();
    for (const d of dbs) {
      if (d.name) {
        await new Promise((resolve) => {
          const req = indexedDB.deleteDatabase(d.name!);
          req.onsuccess = resolve;
          req.onerror = resolve;
        });
      }
    }

    Object.defineProperty(window, 'location', {
      value: { reload: vi.fn() },
      writable: true
    });
  });

  const createFakeBusiness = async (id: string, name: string): Promise<BusinessRecord> => {
    const b: BusinessRecord = {
      id, name, databaseName: `SamtechCRMDatabase_${id}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), status: 'active'
    };
    await masterDb.businesses.add(b);
    return b;
  };

  it('Test A: activeBusinessId valide -> Ouvre la bonne DB', async () => {
    const b1 = await createFakeBusiness('b1', 'Business 1');
    localStorage.setItem(STORAGE_KEY_ACTIVE_ID, b1.id);
    localStorage.setItem(STORAGE_KEY_ACTIVE_DB, b1.databaseName);

    const status = await BusinessDatabaseManager.initialize();
    
    expect(status).toBe('READY');
    expect(db.name).toBe(b1.databaseName);
  });

  it('Test B: activeBusinessId inexistant dans Master DB -> Efface le cache et resout selon fallback', async () => {
    localStorage.setItem(STORAGE_KEY_ACTIVE_ID, 'invalid_id');
    localStorage.setItem(STORAGE_KEY_ACTIVE_DB, 'invalid_db');
    
    // Simuler qu'il n'y a plus aucun business
    const status = await BusinessDatabaseManager.initialize();
    
    expect(status).toBe('NO_BUSINESS');
    expect(localStorage.getItem(STORAGE_KEY_ACTIVE_ID)).toBeNull();
    // Le systeme ne s'initialise pas aveuglement sur invalid_db
  });

  it('Test C: activeBusinessId absent + 0 business -> État NO_BUSINESS', async () => {
    const status = await BusinessDatabaseManager.initialize();
    expect(status).toBe('NO_BUSINESS');
  });

  it('Test D: activeBusinessId absent + 1 business -> Sélectionne le business unique', async () => {
    const b1 = await createFakeBusiness('unique_id', 'Unique Business');
    const status = await BusinessDatabaseManager.initialize();
    
    expect(status).toBe('READY');
    expect(localStorage.getItem(STORAGE_KEY_ACTIVE_ID)).toBe('unique_id');
    expect(db.name).toBe(b1.databaseName);
  });

  it('Test E: Suppression du localStorage + plusieurs business -> BUSINESS_SELECTION_REQUIRED', async () => {
    await createFakeBusiness('b1', 'Business 1');
    await createFakeBusiness('b2', 'Business 2');
    
    const status = await BusinessDatabaseManager.initialize();
    
    expect(status).toBe('BUSINESS_SELECTION_REQUIRED');
    expect(localStorage.getItem(STORAGE_KEY_ACTIVE_ID)).toBeNull(); // Aucun fallback arbitraire
  });

  it('Test F: Migration V1 -> Business default créé', async () => {
    const v1Db = new SamtechCRMDatabase('SamtechCRMDatabase');
    await v1Db.open();
    await v1Db.settings.put({ key: 'company.profile', value: { name: 'Ancienne V1' }, updatedAt: new Date().toISOString(), schemaVersion: 1 });
    v1Db.close();

    const status = await BusinessDatabaseManager.initialize();
    
    expect(status).toBe('READY');
    const businesses = await masterDb.businesses.toArray();
    expect(businesses.length).toBe(1);
    expect(businesses[0].id).toBe('default');
    expect(businesses[0].databaseName).toBe('SamtechCRMDatabase');
  });

  it('Test G: Apres migration V1, si on vide localStorage -> Retombe sur default (Test D)', async () => {
    await createFakeBusiness('default', 'Ancienne V1');
    // Le constructeur initial aura genere databaseName: SamtechCRMDatabase_default mais forçons-le:
    await masterDb.businesses.update('default', { databaseName: 'SamtechCRMDatabase' });

    // localStorage est vide
    const status = await BusinessDatabaseManager.initialize();
    
    expect(status).toBe('READY');
    expect(localStorage.getItem(STORAGE_KEY_ACTIVE_ID)).toBe('default');
    expect(localStorage.getItem(STORAGE_KEY_ACTIVE_DB)).toBe('SamtechCRMDatabase');
  });

  it('Test H: SamtechCRM_Uninitialized ne doit contenir aucune donnée métier utilisateur', async () => {
    const uninitializedDb = new SamtechCRMDatabase('SamtechCRM_Uninitialized');
    await uninitializedDb.open();
    
    // Verifier que les tables sont vides
    expect(await uninitializedDb.contacts.count()).toBe(0);
    expect(await uninitializedDb.prospectProfiles.count()).toBe(0);
    expect(await uninitializedDb.invoices.count()).toBe(0);
    
    uninitializedDb.close();
  });
});
