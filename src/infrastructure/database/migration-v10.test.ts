import Dexie from 'dexie';
import { afterEach, describe, expect, it } from 'vitest';
import { SamtechCRMDatabase } from './db';

const V9_STORES = {
  contacts: 'id, normalizedWhatsappPhone', prospectProfiles: 'id, &contactId', settings: '&key', sequences: '&key',
  locations: 'id', categories: 'id', products: 'id', prospectInterests: 'id', followUps: 'id', messageTemplates: 'id',
  timelineEvents: 'id', clientProfiles: 'id, &contactId', tags: 'id', contactTags: 'id', notes: 'id', invoices: 'id, &number',
  invoiceLines: 'id', payments: 'id', campaigns: 'id', campaignRecipients: 'id, &[campaignId+contactId]',
};

describe('Migration Dexie V9 vers V10', () => {
  const name = 'samtech-v9-v10-migration';
  afterEach(async () => Dexie.delete(name));

  it('préserve une donnée dans chacune des vingt tables et ajoute securitySettings', async () => {
    const v9 = new Dexie(name); v9.version(9).stores(V9_STORES); await v9.open();
    for (const table of Object.keys(V9_STORES)) {
      const record: Record<string, unknown> = table === 'settings' || table === 'sequences' ? { key: `${table}-1` } : { id: `${table}-1` };
      if (table === 'contacts') Object.assign(record, { normalizedWhatsappPhone: '+221770000001' });
      if (table === 'prospectProfiles' || table === 'clientProfiles') Object.assign(record, { contactId: 'contacts-1' });
      if (table === 'invoices') Object.assign(record, { number: 'FAC-1' });
      if (table === 'campaignRecipients') Object.assign(record, { campaignId: 'campaigns-1', contactId: 'contacts-1' });
      await v9.table(table).add(record);
    }
    v9.close();
    const v10 = new SamtechCRMDatabase(name); await v10.open();
    expect(v10.verno).toBeGreaterThanOrEqual(13);
    for (const table of Object.keys(V9_STORES)) expect(await v10.table(table).count(), table).toBe(1);
    await v10.securitySettings.add({ id: 'local-security', pinEnabled: false, failedAttempts: 0, autoLockMinutes: 5, updatedAt: '2026-07-18T10:00:00.000Z' });
    v10.close();
    const reopened = new SamtechCRMDatabase(name); await reopened.open();
    for (const table of Object.keys(V9_STORES)) expect(await reopened.table(table).count(), `réouverture ${table}`).toBe(1);
    expect(await reopened.securitySettings.get('local-security')).toMatchObject({ failedAttempts: 0, autoLockMinutes: 5 });
    reopened.close();
  });
});
