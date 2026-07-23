import Dexie from 'dexie';
import { afterEach, describe, expect, it } from 'vitest';
import { SamtechCRMDatabase } from './db';

describe('Migration Dexie V3 vers V4', () => {
  const name = 'samtech-v3-v4-migration';
  afterEach(async () => Dexie.delete(name));
  it('préserve toutes les tables V3 et ajoute les trois tables Sprint 3 après réouverture', async () => {
    const v3 = new Dexie(name); const now = new Date().toISOString();
    const v3Fixtures = {
      contacts: { id: 'c1', normalizedWhatsappPhone: '+22177' },
      prospectProfiles: { id: 'p1', contactId: 'c1' },
      settings: { key: 'company.profile', value: { name: 'SAMTECH' }, updatedAt: now },
      sequences: { key: 'invoice', updatedAt: now },
      locations: { id: 'l1', normalizedName: 'dakar' },
      categories: { id: 'cat1', normalizedName: 'services' },
      products: { id: 'prod1', normalizedName: 'audit' },
      prospectInterests: { id: 'i1', prospectProfileId: 'p1', productId: 'prod1' },
    } as const;
    const primaryKeys = { contacts: 'c1', prospectProfiles: 'p1', settings: 'company.profile', sequences: 'invoice', locations: 'l1', categories: 'cat1', products: 'prod1', prospectInterests: 'i1' } as const;
    v3.version(3).stores({
      contacts: 'id, normalizedWhatsappPhone, displayName, locationId, source, createdAt, updatedAt, archivedAt',
      prospectProfiles: 'id, &contactId, status, interestLevel, firstContactDate, convertedAt, lastStatusChangedAt, archivedAt, [status+interestLevel]',
      settings: '&key, updatedAt',
      sequences: '&key, updatedAt',
      locations: 'id, name, normalizedName, level, parentId, archivedAt, [parentId+level], [parentId+normalizedName]',
      categories: 'id, name, normalizedName, archivedAt',
      products: 'id, name, normalizedName, type, categoryId, sku, isActive, archivedAt, [categoryId+isActive]',
      prospectInterests: 'id, prospectProfileId, productId, interestLevel, requestedAt, archivedAt, [prospectProfileId+productId], [productId+requestedAt]',
    });
    await v3.open();
    for (const [table, value] of Object.entries(v3Fixtures)) await v3.table(table).add(value);
    v3.close();
    const v4 = new SamtechCRMDatabase(name); await v4.open();
    expect(v4.verno).toBeGreaterThanOrEqual(13);
    for (const [table, key] of Object.entries(primaryKeys)) expect(await v4.table(table).get(key), `${table} doit être conservée après migration`).toMatchObject(v3Fixtures[table as keyof typeof v3Fixtures]);
    await v4.followUps.add({ id: 'f1', contactId: 'c1', channel: 'PHONE', dueAt: now, timezone: 'Africa/Dakar', priority: 'NORMAL', status: 'PLANIFIEE', createdAt: now, updatedAt: now });
    await v4.messageTemplates.add({ id: 'm1', name: 'R', category: 'FOLLOW_UP', content: 'Bonjour', variables: [], isActive: true, createdAt: now, updatedAt: now });
    await v4.timelineEvents.add({ id: 'e1', contactId: 'c1', type: 'FOLLOW_UP_CREATED', occurredAt: now, createdAt: now, title: 'Créée', payloadVersion: 1 });
    v4.close();
    const reopened = new SamtechCRMDatabase(name); await reopened.open();
    expect(await Promise.all([reopened.followUps.count(), reopened.messageTemplates.count(), reopened.timelineEvents.count(), reopened.clientProfiles.count()])).toEqual([1, 1, 1, 0]);
    for (const [table, key] of Object.entries(primaryKeys)) expect(await reopened.table(table).get(key), `${table} doit rester intacte après réouverture`).toMatchObject(v3Fixtures[table as keyof typeof v3Fixtures]);
    reopened.close();
  });
});
