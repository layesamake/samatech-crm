import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/infrastructure/database/db';
import { ResolveProspectMessageUseCase } from '../application/resolve-prospect-message';

describe('Résolution d’un message avec les données locales', () => {
  const contactId = '11111111-1111-4111-8111-111111111111';
  const profileId = '22222222-2222-4222-8222-222222222222';
  const locationId = '33333333-3333-4333-8333-333333333333';
  const productA = '44444444-4444-4444-8444-444444444444';
  const productB = '55555555-5555-4555-8555-555555555555';
  const now = '2026-07-17T12:00:00.000Z';
  beforeEach(async () => {
    await db.transaction('rw', [db.contacts, db.prospectProfiles, db.prospectInterests, db.locations, db.products, db.settings], async () => Promise.all([db.contacts.clear(), db.prospectProfiles.clear(), db.prospectInterests.clear(), db.locations.clear(), db.products.clear(), db.settings.clear()]));
    await db.contacts.add({ id: contactId, displayName: 'Awa Ndiaye', firstName: 'Awa', lastName: 'Ndiaye', companyName: 'Ndiaye Conseil', whatsappPhone: '+221771234567', normalizedWhatsappPhone: '+221771234567', locationId, createdAt: now, updatedAt: now });
    await db.prospectProfiles.add({ id: profileId, contactId, status: 'NOUVEAU', interestLevel: 'TIEDE', firstContactDate: '2026-07-17', lastStatusChangedAt: now, createdAt: now, updatedAt: now });
    await db.locations.add({ id: locationId, name: 'Dakar', normalizedName: 'dakar', level: 'CITY', createdAt: now, updatedAt: now });
    await db.products.bulkAdd([
      { id: productA, name: 'Audit', normalizedName: 'audit', type: 'SERVICE', unitPriceMinor: 0, currency: 'XOF', currencyScale: 0, isActive: true, createdAt: now, updatedAt: now },
      { id: productB, name: 'Conseil', normalizedName: 'conseil', type: 'SERVICE', unitPriceMinor: 0, currency: 'XOF', currencyScale: 0, isActive: true, createdAt: now, updatedAt: now },
    ]);
    await db.prospectInterests.bulkAdd([
      { id: crypto.randomUUID(), prospectProfileId: profileId, productId: productA, requestedAt: now, createdAt: now, updatedAt: now },
      { id: crypto.randomUUID(), prospectProfileId: profileId, productId: productB, requestedAt: now, createdAt: now, updatedAt: now },
    ]);
    await db.settings.add({ key: 'company.profile', value: { name: 'SAMTECH CRM', phone: '+221770000000', currencyCode: 'XOF', currencySymbol: 'FCFA' }, schemaVersion: 1, updatedAt: now });
  });
  it('résout toutes les variables et garde l’ordre des produits locaux', async () => {
    const result = await new ResolveProspectMessageUseCase().execute(contactId, '{{prenom}} {{nom}} · {{contact}} · {{entreprise}} · {{produit}} · {{localite}} · {{nom_entreprise}}');
    expect(result).toEqual({ text: 'Awa Ndiaye · Awa Ndiaye · Ndiaye Conseil · Audit, Conseil · Dakar · SAMTECH CRM', unresolved: [] });
  });
  it('signale une valeur manquante puis autorise sa substitution vide explicite', async () => {
    const unresolved = await new ResolveProspectMessageUseCase().execute(contactId, 'Email {{entreprise}} / {{localite}}');
    expect(unresolved.unresolved).toEqual([]);
    await db.contacts.update(contactId, { companyName: undefined });
    expect((await new ResolveProspectMessageUseCase().execute(contactId, 'Société {{entreprise}}')).unresolved).toEqual(['entreprise']);
    expect((await new ResolveProspectMessageUseCase().execute(contactId, 'Société {{entreprise}}', true)).text).toBe('Société ');
  });
});
