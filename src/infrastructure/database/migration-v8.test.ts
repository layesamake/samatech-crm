import Dexie from 'dexie';
import { afterEach, describe, expect, it } from 'vitest';
import { SamtechCRMDatabase } from './db';

const V7_STORES = {
  contacts: 'id, normalizedWhatsappPhone, displayName, locationId, source, createdAt, updatedAt, archivedAt',
  prospectProfiles: 'id, &contactId, status, interestLevel, firstContactDate, convertedAt, lastStatusChangedAt, archivedAt, [status+interestLevel]',
  settings: '&key, updatedAt',
  sequences: '&key, updatedAt',
  locations: 'id, name, normalizedName, level, parentId, archivedAt, [parentId+level], [parentId+normalizedName]',
  categories: 'id, name, normalizedName, archivedAt',
  products: 'id, name, normalizedName, type, categoryId, sku, isActive, archivedAt, [categoryId+isActive]',
  prospectInterests: 'id, prospectProfileId, productId, interestLevel, requestedAt, archivedAt, [prospectProfileId+productId], [productId+requestedAt]',
  followUps: 'id, contactId, channel, dueAt, priority, status, completedAt, previousFollowUpId, archivedAt, [status+dueAt], [contactId+status]',
  messageTemplates: 'id, name, category, isActive, archivedAt, [category+isActive]',
  timelineEvents: 'id, contactId, type, occurredAt, sourceEntityId, [contactId+occurredAt], [sourceEntityType+sourceEntityId]',
  clientProfiles: 'id, &contactId, convertedAt, clientNumber, lastPurchaseAt, archivedAt',
  tags: 'id, &normalizedName, name, archivedAt',
  contactTags: 'id, contactId, tagId, &[contactId+tagId]',
  notes: 'id, contactId, pinned, createdAt, updatedAt, archivedAt, [contactId+createdAt]',
  invoices: 'id, &number, clientProfileId, status, issueDate, dueDate, issuedAt, archivedAt, [clientProfileId+issueDate], [status+dueDate]',
  invoiceLines: 'id, invoiceId, productId, position, [invoiceId+position], [productId+createdAt]',
};

describe('Migration Dexie V7 vers V8', () => {
  const name = 'samtech-v7-v8-migration';
  afterEach(async () => Dexie.delete(name));

  it('préserve toutes les tables V7, ajoute plusieurs paiements puis survit à la réouverture', async () => {
    const now = '2026-07-18T10:00:00.000Z';
    const v7 = new Dexie(name);
    v7.version(7).stores(V7_STORES);
    await v7.open();
    const fixtures: Record<string, Record<string, unknown>> = {
      contacts: { id: 'c1', displayName: 'Client Migration', whatsappPhone: '+221770000000', normalizedWhatsappPhone: '+221770000000', locationId: 'loc1', createdAt: now, updatedAt: now },
      prospectProfiles: { id: 'prospect1', contactId: 'c1', status: 'CONVERTI', interestLevel: 'CHAUD', firstContactDate: '2026-07-01', convertedAt: now, lastStatusChangedAt: now, createdAt: now, updatedAt: now },
      settings: { key: 'invoice.defaults', value: { currencyCode: 'XOF', prefix: 'FAC-' }, schemaVersion: 1, updatedAt: now },
      sequences: { key: 'invoice:2026', prefix: 'FAC-', period: '2026', nextValue: 2, padding: 4, updatedAt: now },
      locations: { id: 'loc1', name: 'Dakar', normalizedName: 'dakar', level: 'CITY', createdAt: now, updatedAt: now },
      categories: { id: 'cat1', name: 'Services', normalizedName: 'services', createdAt: now, updatedAt: now },
      products: { id: 'product1', name: 'Conseil', normalizedName: 'conseil', type: 'SERVICE', categoryId: 'cat1', unitPriceMinor: 100_000, currency: 'XOF', currencyScale: 0, isActive: true, createdAt: now, updatedAt: now },
      prospectInterests: { id: 'interest1', prospectProfileId: 'prospect1', productId: 'product1', requestedAt: now, createdAt: now, updatedAt: now },
      followUps: { id: 'follow1', contactId: 'c1', channel: 'PHONE', dueAt: now, timezone: 'Africa/Dakar', priority: 'NORMAL', status: 'REALISEE', completedAt: now, createdAt: now, updatedAt: now },
      messageTemplates: { id: 'template1', name: 'Paiement', category: 'PAYMENT', content: 'Merci', variables: [], isActive: true, createdAt: now, updatedAt: now },
      timelineEvents: { id: 'event1', contactId: 'c1', type: 'INVOICE_ISSUED', occurredAt: now, createdAt: now, sourceEntityType: 'INVOICE', sourceEntityId: 'invoice1', title: 'Facture émise', payloadVersion: 1 },
      clientProfiles: { id: 'client1', contactId: 'c1', convertedAt: now, createdAt: now, updatedAt: now },
      tags: { id: 'tag1', name: 'Fidèle', normalizedName: 'fidele', createdAt: now, updatedAt: now },
      contactTags: { id: 'contactTag1', contactId: 'c1', tagId: 'tag1', createdAt: now },
      notes: { id: 'note1', contactId: 'c1', content: 'Historique préservé', pinned: false, createdAt: now, updatedAt: now },
      invoices: { id: 'invoice1', clientProfileId: 'client1', number: 'FAC-2026-0001', status: 'EMISE', issueDate: '2026-07-17', dueDate: '2026-07-18', currency: 'XOF', currencyScale: 0, companySnapshot: { displayName: 'SAMTECH' }, clientSnapshot: { displayName: 'Client Migration' }, subtotalMinor: 100_000, discountTotalMinor: 0, taxTotalMinor: 0, grandTotalMinor: 100_000, paidTotalMinor: 0, balanceMinor: 100_000, issuedAt: now, createdAt: now, updatedAt: now },
      invoiceLines: { id: 'line1', invoiceId: 'invoice1', productId: 'product1', position: 0, designationSnapshot: 'Conseil', quantityScaled: 1, quantityScale: 0, unitPriceMinor: 100_000, grossMinor: 100_000, discountType: 'NONE', discountValue: 0, discountMinor: 0, taxRateBasisPoints: 0, taxMinor: 0, lineTotalMinor: 100_000, createdAt: now, updatedAt: now },
    };
    for (const [table, record] of Object.entries(fixtures)) await v7.table(table).add(record);
    v7.close();

    const v8 = new SamtechCRMDatabase(name);
    await v8.open();
    expect(v8.verno).toBe(10);
    for (const table of Object.keys(fixtures)) expect(await v8.table(table).count(), `V7 ${table}`).toBe(1);
    await v8.payments.bulkAdd([
      { id: 'payment1', invoiceId: 'invoice1', clientProfileId: 'client1', paymentDate: '2026-07-18', amountMinor: 30_000, currency: 'XOF', currencyScale: 0, method: 'WAVE', status: 'ACTIVE', createdAt: now, updatedAt: now },
      { id: 'payment2', invoiceId: 'invoice1', clientProfileId: 'client1', paymentDate: '2026-07-18', amountMinor: 20_000, currency: 'XOF', currencyScale: 0, method: 'CASH', status: 'ACTIVE', createdAt: now, updatedAt: now },
    ]);
    await v8.invoices.update('invoice1', { status: 'PARTIELLEMENT_PAYEE', paidTotalMinor: 50_000, balanceMinor: 50_000, updatedAt: now });
    v8.close();

    const reopened = new SamtechCRMDatabase(name);
    await reopened.open();
    for (const table of Object.keys(fixtures)) expect(await reopened.table(table).count(), `réouverture ${table}`).toBe(1);
    expect(await reopened.payments.where('[invoiceId+status]').equals(['invoice1', 'ACTIVE']).count()).toBe(2);
    expect(await reopened.invoices.get('invoice1')).toMatchObject({ number: 'FAC-2026-0001', status: 'PARTIELLEMENT_PAYEE', paidTotalMinor: 50_000, balanceMinor: 50_000 });
    reopened.close();
  });
});
