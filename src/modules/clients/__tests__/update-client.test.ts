import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/infrastructure/database/db';
import { UpdateClientUseCase } from '../application/update-client';

describe('Modification d’un client', () => {
  const contactId = '11111111-1111-4111-8111-111111111111';
  const prospectId = '22222222-2222-4222-8222-222222222222';
  const clientId = '33333333-3333-4333-8333-333333333333';
  const now = '2026-07-19T10:00:00.000Z';

  beforeEach(async () => {
    await db.transaction('rw', [db.contacts, db.prospectProfiles, db.clientProfiles, db.prospectInterests, db.timelineEvents], async () => Promise.all([db.contacts.clear(), db.prospectProfiles.clear(), db.clientProfiles.clear(), db.prospectInterests.clear(), db.timelineEvents.clear()]));
    await db.contacts.add({ id: contactId, displayName: 'Awa Ndiaye', whatsappPhone: '+221771234567', normalizedWhatsappPhone: '+221771234567', createdAt: now, updatedAt: now });
    await db.prospectProfiles.add({ id: prospectId, contactId, status: 'CONVERTI', interestLevel: 'CHAUD', firstContactDate: '2026-07-01', convertedAt: now, lastStatusChangedAt: now, createdAt: now, updatedAt: now });
    await db.clientProfiles.add({ id: clientId, contactId, convertedAt: now, createdAt: now, updatedAt: now });
  });

  it('modifie les coordonnées sans perdre le statut client ni créer un doublon', async () => {
    const result = await new UpdateClientUseCase().execute(clientId, { displayName: 'Awa Conseil', whatsappPhone: '+221 76 000 00 00', companyName: 'Awa SARL', productIds: [] });
    expect(result.error).toBeUndefined();
    expect(result.client?.contact).toMatchObject({ displayName: 'Awa Conseil', normalizedWhatsappPhone: '+221760000000', companyName: 'Awa SARL' });
    expect(result.client?.prospectProfile.status).toBe('CONVERTI');
    expect(await db.contacts.count()).toBe(1);
    expect(await db.clientProfiles.count()).toBe(1);
  });

  it('signale un numéro déjà utilisé par un autre contact', async () => {
    await db.contacts.add({ id: crypto.randomUUID(), displayName: 'Autre', whatsappPhone: '+221770000000', normalizedWhatsappPhone: '+221770000000', createdAt: now, updatedAt: now });
    const result = await new UpdateClientUseCase().execute(clientId, { displayName: 'Awa', whatsappPhone: '+221770000000' });
    expect(result.warning).toMatch(/contact.*existe déjà/i);
    expect((await db.contacts.get(contactId))?.normalizedWhatsappPhone).toBe('+221771234567');
  });
});
