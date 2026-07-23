import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { masterDb } from './master-db';
import { BusinessDatabaseManager } from './business-manager';
import { db, setDb, SamtechCRMDatabase } from './db';
import Dexie from 'dexie';

describe('Multi-Business Architecture', () => {
  beforeEach(async () => {
    // Clear localStorage
    localStorage.clear();

    // Reset Master DB
    await masterDb.businesses.clear();
    
    // Fermer toute instance DB ouverte
    if (db.isOpen()) {
      db.close();
    }

    // Effacer toutes les bases de données existantes dans l'environnement fake-indexeddb
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
    
    // Mock window.location.reload
    Object.defineProperty(window, 'location', {
      value: { reload: vi.fn() },
      writable: true
    });
  });

  afterEach(async () => {
    if (db.isOpen()) db.close();
  });

  it('devrait détecter la base V1 et effectuer une migration Zéro-Copie', async () => {
    // Étape 1 : Créer une base V1 nommée 'SamtechCRMDatabase' avec une table settings contenant le nom de la compagnie
    const v1Db = new SamtechCRMDatabase('SamtechCRMDatabase');
    await v1Db.open();
    await v1Db.settings.put({ key: 'company.profile', value: { name: 'Ancienne Compagnie V1' }, updatedAt: new Date().toISOString(), schemaVersion: 1 });
    v1Db.close();

    // Vérifier que le MasterDB est vide
    expect(await masterDb.businesses.count()).toBe(0);

    // Initialiser le BusinessDatabaseManager
    await BusinessDatabaseManager.initialize();

    // Vérifier que le business 'default' a été créé dans le MasterDB
    const businesses = await masterDb.businesses.toArray();
    expect(businesses.length).toBe(1);
    expect(businesses[0].id).toBe('default');
    expect(businesses[0].name).toBe('Ancienne Compagnie V1');
    expect(businesses[0].databaseName).toBe('SamtechCRMDatabase');

    // Vérifier que le business actif a été mis à jour dans le localStorage
    expect(localStorage.getItem('samtech_active_business_id')).toBe('default');
    expect(localStorage.getItem('samtech_active_business_db')).toBe('SamtechCRMDatabase');
  });

  it('devrait créer de nouveaux business et isoler complètement les données (POC A/B)', async () => {
    // Créer Business A
    const businessA = await BusinessDatabaseManager.createBusiness({ name: 'Business A' });
    expect(businessA.databaseName).toMatch(/^SamtechCRMDatabase_/);

    // Créer Business B
    const businessB = await BusinessDatabaseManager.createBusiness({ name: 'Business B' });

    // --- Basculer vers Business A ---
    // (Puisque switchBusiness fait reload, on va simuler la re-initialisation en injectant manuellement)
    await BusinessDatabaseManager.switchBusiness(businessA.id);
    expect(window.location.reload).toHaveBeenCalled();
    // Simulation du comportement après reload:
    setDb(new SamtechCRMDatabase(businessA.databaseName));
    await db.open();

    // Insérer une donnée dans Business A
    await db.contacts.put({
      id: 'contactA',
      displayName: 'PROSPECT TEST BUSINESS A',
      whatsappPhone: '+22111111111',
      normalizedWhatsappPhone: '11111111',
      source: 'MANUAL',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Vérifier l'insertion
    expect(await db.contacts.count()).toBe(1);

    // --- Basculer vers Business B ---
    await BusinessDatabaseManager.switchBusiness(businessB.id);
    setDb(new SamtechCRMDatabase(businessB.databaseName));
    await db.open();

    // Vérifier l'isolation : Business B ne doit pas voir le prospect A
    expect(await db.contacts.count()).toBe(0);

    // Insérer une donnée dans Business B
    await db.contacts.put({
      id: 'contactB',
      displayName: 'PROSPECT TEST BUSINESS B',
      whatsappPhone: '+22122222222',
      normalizedWhatsappPhone: '22222222',
      source: 'MANUAL',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    expect(await db.contacts.count()).toBe(1);

    // --- Retourner vers Business A ---
    await BusinessDatabaseManager.switchBusiness(businessA.id);
    setDb(new SamtechCRMDatabase(businessA.databaseName));
    await db.open();

    // Vérifier la présence du contact A et l'absence du contact B
    const contactsA = await db.contacts.toArray();
    expect(contactsA.length).toBe(1);
    expect(contactsA[0].id).toBe('contactA');
    expect(contactsA[0].displayName).toBe('PROSPECT TEST BUSINESS A');
  });
});
