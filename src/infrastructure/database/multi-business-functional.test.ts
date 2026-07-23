import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { masterDb } from './master-db';
import { BusinessDatabaseManager } from './business-manager';
import { db, setDb, SamtechCRMDatabase } from './db';

const STORAGE_KEY_ACTIVE_ID = 'samtech_active_business_id';
const STORAGE_KEY_ACTIVE_DB = 'samtech_active_business_db';

describe('Phase 2 - Intégration Fonctionnelle', () => {
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

  afterEach(async () => {
    if (db.isOpen()) db.close();
  });

  it('devrait isoler les paramètres de facturation (préfixes, séquences)', async () => {
    const businessA = await BusinessDatabaseManager.createBusiness({ name: 'Entreprise A' });
    const businessB = await BusinessDatabaseManager.createBusiness({ name: 'Entreprise B' });

    // --- Business A ---
    await BusinessDatabaseManager.switchBusiness(businessA.id);
    setDb(new SamtechCRMDatabase(businessA.databaseName));
    await db.open();

    await db.settings.put({ key: 'invoice.defaults', value: { prefix: 'ENT-A' }, updatedAt: new Date().toISOString(), schemaVersion: 1 });
    await db.sequences.put({ key: 'invoice', nextValue: 10, padding: 4, updatedAt: new Date().toISOString(), prefix: 'ENT-A' });

    // --- Business B ---
    await BusinessDatabaseManager.switchBusiness(businessB.id);
    setDb(new SamtechCRMDatabase(businessB.databaseName));
    await db.open();

    await db.settings.put({ key: 'invoice.defaults', value: { prefix: 'ENT-B' }, updatedAt: new Date().toISOString(), schemaVersion: 1 });
    await db.sequences.put({ key: 'invoice', nextValue: 5, padding: 4, updatedAt: new Date().toISOString(), prefix: 'ENT-B' });

    // --- Vérification B ---
    let bSettings = await db.settings.get('invoice.defaults') as { value: { prefix: string } };
    let bSequence = await db.sequences.get('invoice');
    expect(bSettings?.value.prefix).toBe('ENT-B');
    expect(bSequence?.nextValue).toBe(5);

    // --- Vérification A ---
    await BusinessDatabaseManager.switchBusiness(businessA.id);
    setDb(new SamtechCRMDatabase(businessA.databaseName));
    await db.open();

    let aSettings = await db.settings.get('invoice.defaults') as { value: { prefix: string } };
    let aSequence = await db.sequences.get('invoice');
    expect(aSettings?.value.prefix).toBe('ENT-A');
    expect(aSequence?.nextValue).toBe(10);
  });

  it('devrait isoler les statistiques du dashboard (Prospects, Factures)', async () => {
    const businessA = await BusinessDatabaseManager.createBusiness({ name: 'Entreprise A' });
    const businessB = await BusinessDatabaseManager.createBusiness({ name: 'Entreprise B' });

    // Insertion A
    await BusinessDatabaseManager.switchBusiness(businessA.id);
    setDb(new SamtechCRMDatabase(businessA.databaseName));
    await db.open();

    // 2 prospects, 1 facture
    await db.contacts.put({ id: 'p1', displayName: 'P1', whatsappPhone: '1', normalizedWhatsappPhone: '1', source: 'MANUAL', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    await db.contacts.put({ id: 'p2', displayName: 'P2', whatsappPhone: '2', normalizedWhatsappPhone: '2', source: 'MANUAL', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    await db.invoices.put({ id: 'inv1', number: 'A-01', clientProfileId: 'c1', status: 'BROUILLON', issueDate: '2026-07-23', dueDate: '2026-08-23', issuedAt: new Date().toISOString() } as unknown as any);

    // Insertion B
    await BusinessDatabaseManager.switchBusiness(businessB.id);
    setDb(new SamtechCRMDatabase(businessB.databaseName));
    await db.open();

    // 3 prospects, 2 factures
    await db.contacts.put({ id: 'pb1', displayName: 'PB1', whatsappPhone: 'b1', normalizedWhatsappPhone: 'b1', source: 'MANUAL', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    await db.contacts.put({ id: 'pb2', displayName: 'PB2', whatsappPhone: 'b2', normalizedWhatsappPhone: 'b2', source: 'MANUAL', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    await db.contacts.put({ id: 'pb3', displayName: 'PB3', whatsappPhone: 'b3', normalizedWhatsappPhone: 'b3', source: 'MANUAL', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    await db.invoices.put({ id: 'invb1', number: 'B-01', clientProfileId: 'cb1', status: 'BROUILLON', issueDate: '2026-07-23', dueDate: '2026-08-23', issuedAt: new Date().toISOString() } as unknown as any);
    await db.invoices.put({ id: 'invb2', number: 'B-02', clientProfileId: 'cb2', status: 'BROUILLON', issueDate: '2026-07-23', dueDate: '2026-08-23', issuedAt: new Date().toISOString() } as unknown as any);

    // Verif B
    expect(await db.contacts.count()).toBe(3);
    expect(await db.invoices.count()).toBe(2);

    // Verif A
    await BusinessDatabaseManager.switchBusiness(businessA.id);
    setDb(new SamtechCRMDatabase(businessA.databaseName));
    await db.open();

    expect(await db.contacts.count()).toBe(2);
    expect(await db.invoices.count()).toBe(1);
  });
});
