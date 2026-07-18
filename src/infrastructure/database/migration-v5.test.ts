import Dexie from 'dexie';
import { afterEach, describe, expect, it } from 'vitest';
import { SamtechCRMDatabase } from './db';

describe('Migration Dexie V4 vers V5', () => {
  const name = 'samtech-v4-v5-migration';
  afterEach(async () => Dexie.delete(name));
  it('préserve chaque table du véritable schéma V4, utilise les tables V5 et survit à une seconde ouverture', async () => {
    const now = '2026-07-17T12:00:00.000Z'; const v4 = new Dexie(name);
    const v4Schema = {
      contacts: 'id, normalizedWhatsappPhone, displayName, locationId, source, createdAt, updatedAt, archivedAt', prospectProfiles: 'id, &contactId, status, interestLevel, firstContactDate, convertedAt, lastStatusChangedAt, archivedAt, [status+interestLevel]', settings: '&key, updatedAt', sequences: '&key, period, updatedAt', locations: 'id, name, normalizedName, level, parentId, archivedAt, [parentId+level], [parentId+normalizedName]', categories: 'id, name, normalizedName, archivedAt', products: 'id, name, normalizedName, type, categoryId, sku, isActive, archivedAt, [categoryId+isActive]', prospectInterests: 'id, prospectProfileId, productId, interestLevel, requestedAt, archivedAt, [prospectProfileId+productId], [productId+requestedAt]', followUps: 'id, contactId, channel, dueAt, priority, status, completedAt, previousFollowUpId, archivedAt, [status+dueAt], [contactId+status]', messageTemplates: 'id, name, category, isActive, archivedAt, [category+isActive]', timelineEvents: 'id, contactId, type, occurredAt, sourceEntityId, [contactId+occurredAt], [sourceEntityType+sourceEntityId]',
    };
    v4.version(4).stores(v4Schema);
    await v4.open();
    const fixtures: Record<string, Record<string, unknown>> = { contacts: { id: 'c1', displayName: 'Awa', normalizedWhatsappPhone: '+22177', locationId: 'l1', createdAt: now, updatedAt: now }, prospectProfiles: { id: 'p1', contactId: 'c1', status: 'INTERESSE', interestLevel: 'CHAUD', createdAt: now, updatedAt: now }, settings: { key: 'company.profile', updatedAt: now }, sequences: { key: 'invoice', updatedAt: now }, locations: { id: 'l1', name: 'Dakar', normalizedName: 'dakar', level: 'CITY', createdAt: now, updatedAt: now }, categories: { id: 'cat1', name: 'Services', normalizedName: 'services', createdAt: now, updatedAt: now }, products: { id: 'prod1', name: 'Audit', normalizedName: 'audit', categoryId: 'cat1', isActive: true, createdAt: now, updatedAt: now }, prospectInterests: { id: 'i1', prospectProfileId: 'p1', productId: 'prod1', requestedAt: now, createdAt: now, updatedAt: now }, followUps: { id: 'f1', contactId: 'c1', status: 'PLANIFIEE', dueAt: now, createdAt: now, updatedAt: now }, messageTemplates: { id: 'm1', name: 'Relance', category: 'FOLLOW_UP', isActive: true, createdAt: now, updatedAt: now }, timelineEvents: { id: 'e1', contactId: 'c1', type: 'FOLLOW_UP_CREATED', occurredAt: now, createdAt: now } };
    for (const [table, value] of Object.entries(fixtures)) await v4.table(table).add(value);
    v4.close();
    const v5 = new Dexie(name); v5.version(4).stores(v4Schema); v5.version(5).stores({ clientProfiles: 'id, &contactId, convertedAt, clientNumber, lastPurchaseAt, archivedAt' }); await v5.open(); expect(v5.verno).toBe(5);
    for (const table of Object.keys(fixtures)) expect(await v5.table(table).count(), table).toBe(1);
    await v5.table('clientProfiles').add({ id: 'client1', contactId: 'c1', convertedAt: now, createdAt: now, updatedAt: now });
    v5.close();
    const v6 = new SamtechCRMDatabase(name); await v6.open(); expect(v6.verno).toBe(10);
    for (const table of Object.keys(fixtures)) expect(await v6.table(table).count(), table).toBe(1);
    expect(await v6.clientProfiles.get('client1')).toMatchObject({ contactId: 'c1', convertedAt: now });
    await v6.transaction('rw', v6.tags, v6.contactTags, v6.notes, async () => {
      await v6.tags.add({ id: 'tag1', name: 'Prioritaire', normalizedName: 'prioritaire', createdAt: now, updatedAt: now });
      await v6.contactTags.add({ id: 'ct1', contactId: 'c1', tagId: 'tag1', createdAt: now });
      await v6.notes.add({ id: 'note1', contactId: 'c1', content: 'Historique conservé', pinned: true, createdAt: now, updatedAt: now });
    });
    v6.close();
    const reopened = new SamtechCRMDatabase(name); await reopened.open(); expect(reopened.verno).toBe(10);
    for (const table of Object.keys(fixtures)) expect(await reopened.table(table).count(), table).toBe(1);
    expect(await reopened.clientProfiles.get('client1')).toMatchObject({ contactId: 'c1', convertedAt: now });
    expect(await reopened.contacts.get('c1')).toMatchObject({ locationId: 'l1' });
    expect(await reopened.prospectInterests.get('i1')).toMatchObject({ productId: 'prod1' });
    expect(await reopened.followUps.get('f1')).toMatchObject({ contactId: 'c1' });
    expect(await reopened.timelineEvents.get('e1')).toMatchObject({ contactId: 'c1' });
    expect(await Promise.all([reopened.tags.count(), reopened.contactTags.count(), reopened.notes.count()])).toEqual([1, 1, 1]);
    reopened.close();
  });
});
