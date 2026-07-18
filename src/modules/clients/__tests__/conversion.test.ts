import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/infrastructure/database/db';
import { FixedClock } from '@/modules/follow-ups/domain/follow-up';
import { UpdateProspectUseCase } from '@/modules/prospects/application/update-prospect';
import { CreateProspectUseCase } from '@/modules/prospects/application/create-prospect';
import { DexieProspectRepository } from '@/modules/prospects/infrastructure/dexie-prospect-repository';
import { ConvertProspectToClientUseCase } from '../application/convert-prospect-to-client';
import { DexieClientRepository } from '../infrastructure/dexie-client-repository';

const contactId = '11111111-1111-4111-8111-111111111111'; const profileId = '22222222-2222-4222-8222-222222222222'; const historicalEventId = '44444444-4444-4444-8444-444444444444'; const now = '2026-07-17T12:00:00.000Z';
describe('Conversion prospect vers client BR-032 et BR-040 à BR-046', () => {
  const clock = new FixedClock(new Date(now));
  beforeEach(async () => {
    await db.transaction('rw', [db.contacts, db.prospectProfiles, db.prospectInterests, db.followUps, db.clientProfiles, db.timelineEvents, db.tags, db.contactTags, db.notes], async () => Promise.all([db.contacts.clear(), db.prospectProfiles.clear(), db.prospectInterests.clear(), db.followUps.clear(), db.clientProfiles.clear(), db.timelineEvents.clear(), db.tags.clear(), db.contactTags.clear(), db.notes.clear()]));
    await db.contacts.add({ id: contactId, displayName: 'Awa Ndiaye', whatsappPhone: '+221771234567', normalizedWhatsappPhone: '+221771234567', createdAt: now, updatedAt: now });
    await db.prospectProfiles.add({ id: profileId, contactId, status: 'INTERESSE', interestLevel: 'CHAUD', firstContactDate: '2026-07-17', lastStatusChangedAt: now, createdAt: now, updatedAt: now });
    await db.prospectInterests.add({ id: crypto.randomUUID(), prospectProfileId: profileId, productId: crypto.randomUUID(), requestedAt: now, createdAt: now, updatedAt: now });
    await db.followUps.add({ id: crypto.randomUUID(), contactId, channel: 'PHONE', dueAt: '2026-07-20T12:00:00.000Z', timezone: 'Africa/Dakar', priority: 'NORMAL', status: 'PLANIFIEE', createdAt: now, updatedAt: now });
    await db.notes.add({ id: crypto.randomUUID(), contactId, content: 'Note commerciale conservée', pinned: true, createdAt: now, updatedAt: now });
    const tagId = crypto.randomUUID(); await db.tags.add({ id: tagId, name: 'Prioritaire', normalizedName: 'prioritaire', createdAt: now, updatedAt: now });
    await db.contactTags.add({ id: crypto.randomUUID(), contactId, tagId, createdAt: now });
    await db.timelineEvents.add({ id: historicalEventId, contactId, type: 'FOLLOW_UP_CREATED', occurredAt: '2026-07-15T12:00:00.000Z', createdAt: now, title: 'Relance planifiée', payloadVersion: 1 });
  });
  it('convertit sans dupliquer le contact et conserve intérêts, relances et historique', async () => {
    const result = await new ConvertProspectToClientUseCase(undefined, undefined, clock).execute(contactId, { convertedAt: '2026-07-16T10:00:00.000Z' });
    expect(result.profile.contactId).toBe(contactId); expect(await db.contacts.count()).toBe(1); expect(await db.clientProfiles.count()).toBe(1);
    expect((await db.prospectProfiles.get(profileId))?.status).toBe('CONVERTI'); expect((await db.prospectProfiles.get(profileId))?.convertedAt).toBe('2026-07-16T10:00:00.000Z');
    expect(await db.prospectInterests.count()).toBe(1); expect(await db.followUps.count()).toBe(1); expect(await db.notes.count()).toBe(1); expect(await db.contactTags.count()).toBe(1);
    expect(result.notes[0].content).toBe('Note commerciale conservée'); expect(result.tags[0].name).toBe('Prioritaire'); expect(result.followUps[0].contactId).toBe(contactId);
    const events = await db.timelineEvents.toArray(); expect(events).toHaveLength(2); expect(events.find((event) => event.type === 'PROSPECT_CONVERTED')).toMatchObject({ contactId }); expect(events.find((event) => event.type === 'FOLLOW_UP_CREATED')).toMatchObject({ id: historicalEventId, contactId });
  });
  it('refuse une seconde conversion', async () => { const useCase = new ConvertProspectToClientUseCase(undefined, undefined, clock); await useCase.execute(contactId, { convertedAt: now }); await expect(useCase.execute(contactId, { convertedAt: now })).rejects.toThrow(/déjà converti/); });
  it('fait respecter le profil client unique par le stockage', async () => { await new ConvertProspectToClientUseCase(undefined, undefined, clock).execute(contactId, { convertedAt: now }); await expect(db.clientProfiles.add({ id: crypto.randomUUID(), contactId, convertedAt: now, createdAt: now, updatedAt: now })).rejects.toThrow(); expect(await db.clientProfiles.count()).toBe(1); });
  it('interdit le statut converti manuel et le retour client vers prospect', async () => {
    const update = new UpdateProspectUseCase(new DexieProspectRepository());
    const input = { displayName: 'Awa Ndiaye', whatsappPhone: '+221771234567', interestLevel: 'CHAUD' as const };
    expect((await new CreateProspectUseCase(new DexieProspectRepository()).execute({ ...input, status: 'CONVERTI' })).error).toMatch(/Convertir en client/);
    expect((await update.execute(contactId, { ...input, status: 'CONVERTI' })).error).toMatch(/Convertir en client/);
    await new ConvertProspectToClientUseCase(undefined, undefined, clock).execute(contactId, { convertedAt: now });
    expect((await update.execute(contactId, { ...input, status: 'CONTACTE' })).error).toMatch(/ne peut pas redevenir prospect/);
  });
  it('annule toute la transaction si l’événement échoue', async () => {
    const fail = () => { throw new Error('Événement impossible'); }; db.timelineEvents.hook('creating').subscribe(fail);
    try { await expect(new ConvertProspectToClientUseCase(undefined, undefined, clock).execute(contactId, { convertedAt: now })).rejects.toThrow(/impossible/); } finally { db.timelineEvents.hook('creating').unsubscribe(fail); }
    expect(await db.clientProfiles.count()).toBe(0); expect((await db.prospectProfiles.get(profileId))?.status).toBe('INTERESSE'); expect((await db.prospectProfiles.get(profileId))?.convertedAt).toBeUndefined(); expect(await db.timelineEvents.count()).toBe(1); expect(await db.contacts.count()).toBe(1);
  });
  it('refuse contact absent, archivé et date invalide', async () => {
    const useCase = new ConvertProspectToClientUseCase(undefined, undefined, clock); await expect(useCase.execute(crypto.randomUUID(), { convertedAt: now })).rejects.toThrow(/introuvable/); await expect(useCase.execute(contactId, { convertedAt: 'invalide' })).rejects.toThrow(/Date de conversion invalide/); await db.contacts.update(contactId, { archivedAt: now }); await expect(useCase.execute(contactId, { convertedAt: now })).rejects.toThrow(/archivé/); await db.contacts.update(contactId, { archivedAt: undefined }); await db.prospectProfiles.update(profileId, { archivedAt: now }); await expect(useCase.execute(contactId, { convertedAt: now })).rejects.toThrow(/archivé/);
  });
  it('refuse un prospect perdu tant qu’il n’est pas réactivé', async () => { await db.prospectProfiles.update(profileId, { status: 'PERDU' }); await expect(new ConvertProspectToClientUseCase(undefined, undefined, clock).execute(contactId, { convertedAt: now })).rejects.toThrow(/Réactivez/); expect(await db.clientProfiles.count()).toBe(0); });
  it('recherche par nom, téléphone et entreprise, combine les filtres et ordonne la chronologie', async () => { await db.contacts.update(contactId, { companyName: 'SAMATECH', locationId: '33333333-3333-4333-8333-333333333333' }); await new ConvertProspectToClientUseCase(undefined, undefined, clock).execute(contactId, { convertedAt: now }); const repository = new DexieClientRepository(); expect(await repository.search({ query: ' awa ' })).toHaveLength(1); expect(await repository.search({ query: '771234567' })).toHaveLength(1); expect(await repository.search({ query: 'samatech' })).toHaveLength(1); expect(await repository.search({ locationId: '33333333-3333-4333-8333-333333333333', convertedFrom: now, convertedTo: now })).toHaveLength(1); expect((await repository.search({ convertedFrom: '2026-07-18T00:00:00.000Z' }))).toHaveLength(0); const client = (await repository.search())[0]; expect(client.events.map((event) => event.type)).toEqual(['PROSPECT_CONVERTED', 'FOLLOW_UP_CREATED']); expect(client.events.every((event) => event.contactId === contactId)).toBe(true); });
  it('exclut les prospects convertis et les clients archivés par défaut', async () => { await new ConvertProspectToClientUseCase(undefined, undefined, clock).execute(contactId, { convertedAt: now }); expect(await new DexieProspectRepository().search({})).toHaveLength(0); expect(await new DexieClientRepository().search()).toHaveLength(1); await db.contacts.update(contactId, { archivedAt: now }); expect(await new DexieClientRepository().search()).toHaveLength(0); expect(await new DexieClientRepository().search({ showArchived: true })).toHaveLength(1); });
});
