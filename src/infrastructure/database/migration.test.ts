import Dexie from 'dexie';
import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { SamtechCRMDatabase } from './db';

describe('Dexie migration V2 vers V3', () => {
  const databaseName = 'samtech-migration-v2-v3';

  afterEach(async () => Dexie.delete(databaseName));

  it('conserve contacts et profils puis rend toutes les tables V3 utilisables', async () => {
    const now = new Date().toISOString();
    const v2 = new Dexie(databaseName);
    v2.version(1).stores({});
    v2.version(2).stores({
      contacts: 'id, normalizedWhatsappPhone, displayName, locationId, source, createdAt, updatedAt, archivedAt',
      prospectProfiles: 'id, &contactId, status, interestLevel, firstContactDate, convertedAt, lastStatusChangedAt, archivedAt, [status+interestLevel]',
    });
    await v2.open();
    await v2.table('contacts').bulkAdd([
      { id: 'contact-1', displayName: 'Awa', whatsappPhone: '+221770000001', normalizedWhatsappPhone: '+221770000001', createdAt: now, updatedAt: now },
      { id: 'contact-2', displayName: 'Moussa', whatsappPhone: '+221770000002', normalizedWhatsappPhone: '+221770000002', createdAt: now, updatedAt: now },
    ]);
    await v2.table('prospectProfiles').bulkAdd([
      { id: 'profile-1', contactId: 'contact-1', status: 'NOUVEAU', interestLevel: 'TIEDE', firstContactDate: '2026-07-01', lastStatusChangedAt: now, createdAt: now, updatedAt: now },
      { id: 'profile-2', contactId: 'contact-2', status: 'CONTACTE', interestLevel: 'CHAUD', firstContactDate: '2026-07-02', lastStatusChangedAt: now, createdAt: now, updatedAt: now },
    ]);
    v2.close();

    const v3 = new SamtechCRMDatabase(databaseName);
    await v3.open();
    expect(v3.verno).toBeGreaterThanOrEqual(13);
    expect(await v3.contacts.toArray()).toHaveLength(2);
    expect(await v3.prospectProfiles.toArray()).toHaveLength(2);
    expect((await v3.contacts.get('contact-1'))?.displayName).toBe('Awa');
    expect((await v3.prospectProfiles.get('profile-2'))?.contactId).toBe('contact-2');

    await v3.transaction('rw', [v3.settings, v3.sequences, v3.locations, v3.categories, v3.products, v3.prospectInterests], async () => {
      await v3.settings.put({ key: 'company.profile', value: { name: 'SAMTECH' }, schemaVersion: 1, updatedAt: now });
      await v3.sequences.put({ key: 'invoice', prefix: 'FACT-', nextValue: 1, padding: 5, updatedAt: now });
      await v3.locations.put({ id: 'loc-1', name: 'Dakar', normalizedName: 'dakar', level: 'CITY', parentId: '', createdAt: now, updatedAt: now });
      await v3.categories.put({ id: 'cat-1', name: 'Services', normalizedName: 'services', createdAt: now, updatedAt: now });
      await v3.products.put({ id: 'prod-1', name: 'Conseil', normalizedName: 'conseil', type: 'SERVICE', categoryId: 'cat-1', unitPriceMinor: 25000, currency: 'XOF', currencyScale: 0, isActive: true, createdAt: now, updatedAt: now });
      await v3.prospectInterests.put({ id: 'interest-1', prospectProfileId: 'profile-1', productId: 'prod-1', requestedAt: now, createdAt: now, updatedAt: now });
    });
    expect(await Promise.all([v3.settings.count(), v3.sequences.count(), v3.locations.count(), v3.categories.count(), v3.products.count(), v3.prospectInterests.count()])).toEqual([1, 1, 1, 1, 1, 1]);
    v3.close();

    const reopened = new SamtechCRMDatabase(databaseName);
    await reopened.open();
    expect(await reopened.contacts.count()).toBe(2);
    expect(await reopened.prospectProfiles.count()).toBe(2);
    expect(await reopened.products.count()).toBe(1);
    expect(await reopened.clientProfiles.count()).toBe(0);
    reopened.close();
  });
});
