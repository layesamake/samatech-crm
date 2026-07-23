import { describe, it, expect } from 'vitest';
import Dexie from 'dexie';
import { SamtechCRMDatabase } from './db';
import 'fake-indexeddb/auto';

const V12_STORES = {
  contacts: 'id', prospectProfiles: 'id',
  settings: '&key', sequences: '&key', locations: 'id', categories: 'id', products: 'id',
  prospectInterests: 'id', followUps: 'id', messageTemplates: 'id', timelineEvents: 'id',
  clientProfiles: 'id', tags: 'id', contactTags: 'id', notes: 'id',
  invoices: 'id', invoiceLines: 'id', payments: 'id',
  campaigns: 'id', campaignRecipients: 'id',
  securitySettings: '&id',
  expenses: 'id',
  treasuryAccounts: 'id', treasuryAllocations: 'id', treasuryOperations: 'id',
  expenseBudgets: 'id', treasuryForecastItems: 'id'
};

describe('Migration Dexie V12 vers V13', () => {
  const name = 'samtech-v12-v13-migration';

  it('préserve les données existantes et ajoute les 3 collections de documents commerciaux', async () => {
    const v12 = new Dexie(name);
    v12.version(12).stores(V12_STORES);
    await v12.open();

    for (const table of Object.keys(V12_STORES)) {
      const record = { id: `id-${table}` };
      if (table === 'settings' || table === 'sequences') Object.assign(record, { key: `key-${table}` });
      if (table === 'securitySettings') Object.assign(record, { id: 'local-security' });
      await v12.table(table).add(record);
    }
    v12.close();

    const v13 = new SamtechCRMDatabase(name);
    await v13.open();

    expect(v13.verno).toBeGreaterThanOrEqual(13);

    for (const table of Object.keys(V12_STORES)) {
      expect(await v13.table(table).count(), table).toBe(1);
    }

    await v13.commercialDocuments.add({
      id: 'doc1', type: 'QUOTE', status: 'DRAFT', clientProfileId: 'cl1',
      companySnapshot: { displayName: 'C' }, clientSnapshot: { displayName: 'Client' },
      currency: 'XOF', currencyScale: 0, subtotalMinor: 0, discountTotalMinor: 0,
      taxTotalMinor: 0, grandTotalMinor: 0,
      createdAt: '2026-07-01', updatedAt: '2026-07-01'
    });

    await v13.commercialDocumentLines.add({
      id: 'l1', documentId: 'doc1', position: 1, designationSnapshot: 'Ligne 1',
      quantityScaled: 1, quantityScale: 0, unitPriceMinor: 0, grossMinor: 0,
      discountType: 'NONE', discountValue: 0, discountMinor: 0,
      taxRateBasisPoints: 0, taxMinor: 0, lineTotalMinor: 0,
      createdAt: '2026-07-01', updatedAt: '2026-07-01'
    });

    await v13.commercialDocumentLinks.add({
      id: 'link1', relation: 'QUOTE_TO_PROFORMA', sourceType: 'COMMERCIAL_DOCUMENT',
      sourceId: 'doc1', targetType: 'COMMERCIAL_DOCUMENT', targetId: 'doc2',
      createdAt: '2026-07-01'
    });

    expect(await v13.commercialDocuments.count()).toBe(1);
    expect(await v13.commercialDocumentLines.count()).toBe(1);
    expect(await v13.commercialDocumentLinks.count()).toBe(1);
    
    await v13.close();
  });

  it('migre les anciens devis (ESTIMATE) vers commercialDocuments en tant que LEGACY_ESTIMATE', async () => {
    const v12 = new Dexie(name + '-migration');
    v12.version(12).stores(V12_STORES);
    await v12.open();

    await v12.table('invoices').add({ id: 'inv1', type: 'INVOICE', status: 'BROUILLON', number: 'F-1' });
    await v12.table('invoices').add({ id: 'est1', type: 'ESTIMATE', status: 'EMISE', number: 'D-1' });
    
    await v12.table('invoiceLines').add({ id: 'il1', invoiceId: 'inv1', position: 1 });
    await v12.table('invoiceLines').add({ id: 'el1', invoiceId: 'est1', position: 1 });
    await v12.table('invoiceLines').add({ id: 'el2', invoiceId: 'est1', position: 2 });
    
    v12.close();

    const v13 = new SamtechCRMDatabase(name + '-migration');
    await v13.open();

    expect(await v13.invoices.count()).toBe(1);
    expect(await v13.invoiceLines.count()).toBe(1);
    
    expect(await v13.commercialDocuments.count()).toBe(1);
    expect(await v13.commercialDocumentLines.count()).toBe(2);

    const migrated = await v13.commercialDocuments.get('est1');
    expect(migrated).toBeDefined();
    expect(migrated!.type).toBe('LEGACY_ESTIMATE');
    expect(migrated!.legacyInvoiceId).toBe('est1');
    expect(migrated!.legacyNumber).toBe('D-1');
    expect((migrated as any).invoiceId).toBeUndefined();

    const lines = await v13.commercialDocumentLines.where('documentId').equals('est1').toArray();
    expect(lines).toHaveLength(2);
    expect(lines[0].documentId).toBe('est1');
    expect((lines[0] as any).invoiceId).toBeUndefined();

    await v13.close();
  });
});
