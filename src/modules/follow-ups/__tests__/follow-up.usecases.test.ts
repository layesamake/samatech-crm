import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/infrastructure/database/db';
import { ManageFollowUpsUseCase } from '../application/manage-follow-ups';
import { FixedClock, FOLLOW_UP_CHANNELS, FOLLOW_UP_PRIORITIES } from '../domain/follow-up';

const contactId = '11111111-1111-4111-8111-111111111111';
const input = (dueAt = '2026-07-18T12:00:00.000Z') => ({ contactId, channel: 'WHATSAPP' as const, dueAt, timezone: 'Africa/Dakar', priority: 'HIGH' as const, reason: 'Relancer le prospect' });
describe('Cas d’usage relances Sprint 3', () => {
  const clock = new FixedClock(new Date('2026-07-17T12:00:00.000Z'));
  let useCase: ManageFollowUpsUseCase;
  beforeEach(async () => {
    await db.transaction('rw', [db.contacts, db.prospectProfiles, db.followUps, db.timelineEvents], async () => Promise.all([db.contacts.clear(), db.prospectProfiles.clear(), db.followUps.clear(), db.timelineEvents.clear()]));
    const now = clock.now().toISOString();
    await db.contacts.add({ id: contactId, displayName: 'Awa Ndiaye', whatsappPhone: '+221771234567', normalizedWhatsappPhone: '+221771234567', createdAt: now, updatedAt: now });
    await db.prospectProfiles.add({ id: '22222222-2222-4222-8222-222222222222', contactId, status: 'NOUVEAU', interestLevel: 'TIEDE', firstContactDate: '2026-07-17', lastStatusChangedAt: now, createdAt: now, updatedAt: now });
    useCase = new ManageFollowUpsUseCase(undefined, undefined, clock);
  });
  it.each(FOLLOW_UP_CHANNELS.flatMap((channel) => FOLLOW_UP_PRIORITIES.map((priority) => [channel, priority] as const)))('crée le canal %s avec la priorité %s', async (channel, priority) => {
    const created = await useCase.create({ ...input(), channel, priority }); expect(created.followUp).toMatchObject({ status: 'PLANIFIEE', channel, priority });
    expect((await db.timelineEvents.toArray())[0].type).toBe('FOLLOW_UP_CREATED');
  });
  it('refuse un contact absent ou archivé', async () => {
    await expect(useCase.create({ ...input(), contactId: crypto.randomUUID() })).rejects.toThrow(/introuvable/);
    await db.contacts.update(contactId, { archivedAt: clock.now().toISOString() });
    await expect(useCase.create({ ...input('2026-07-19T12:00:00.000Z'), priority: 'LOW', channel: 'PHONE' })).rejects.toThrow(/archivé/);
  });
  it('refuse une date absente ou invalide', async () => {
    await expect(useCase.create({ ...input(), dueAt: '' })).rejects.toThrow(/Date et heure invalides/);
    await expect(useCase.create({ ...input(), dueAt: '17/07/2026 12:00' })).rejects.toThrow(/Date et heure invalides/);
  });
  it('avertit pour date passée et doublon proche puis autorise confirmation', async () => {
    expect((await useCase.create(input('2026-07-16T12:00:00.000Z'))).warning).toBe('PAST_DUE');
    await useCase.create(input());
    expect((await useCase.create(input('2026-07-18T12:30:00.000Z'))).warning).toBe('CLOSE_DUPLICATE');
    expect((await useCase.create(input('2026-07-18T12:30:00.000Z'), { confirmDuplicate: true })).followUp).toBeDefined();
  });
  it('réalise avec note, refuse toute modification ultérieure et conserve l’événement', async () => {
    const item = (await useCase.create(input())).followUp!;
    const completed = await useCase.complete(item.id, 'Prospect intéressé');
    expect(completed).toMatchObject({ status: 'REALISEE', resultNote: 'Prospect intéressé' });
    await expect(useCase.update(item.id, input())).rejects.toThrow(/planifiée/);
    expect((await db.timelineEvents.where('type').equals('FOLLOW_UP_COMPLETED').count())).toBe(1);
  });
  it('modifie une relance planifiée puis l’annule sans la supprimer', async () => {
    const item = (await useCase.create(input())).followUp!;
    const updated = await useCase.update(item.id, { ...input('2026-07-19T12:00:00.000Z'), channel: 'EMAIL', priority: 'LOW', reason: 'Nouveau motif' });
    expect(updated).toMatchObject({ channel: 'EMAIL', priority: 'LOW', reason: 'Nouveau motif' });
    const cancelled = await useCase.cancel(item.id); expect(cancelled.status).toBe('ANNULEE');
    expect(await db.followUps.count()).toBe(1);
    expect(await db.timelineEvents.where('type').equals('FOLLOW_UP_CANCELLED').count()).toBe(1);
    await expect(useCase.update(item.id, input())).rejects.toThrow(/planifiée/);
  });
  it('retourne les quatre vues avec une heure fixe', async () => {
    const overdue = (await useCase.create(input('2026-07-16T12:00:00.000Z'), { confirmPast: true })).followUp!;
    const today = (await useCase.create(input('2026-07-17T15:00:00.000Z'))).followUp!;
    const upcoming = (await useCase.create(input('2026-07-19T12:00:00.000Z'))).followUp!;
    await useCase.complete(today.id);
    expect((await useCase.list('OVERDUE')).map((item) => item.id)).toEqual([overdue.id]);
    expect(await useCase.list('TODAY')).toEqual([]);
    expect((await useCase.list('UPCOMING')).map((item) => item.id)).toEqual([upcoming.id]);
    expect((await useCase.list('COMPLETED')).map((item) => item.id)).toEqual([today.id]);
  });
  it('reporte atomiquement en conservant les deux occurrences liées', async () => {
    const item = (await useCase.create(input())).followUp!;
    const next = await useCase.reschedule(item.id, '2026-07-20T12:00:00.000Z', 'Africa/Dakar');
    expect(next.previousFollowUpId).toBe(item.id);
    expect((await db.followUps.get(item.id))?.status).toBe('REPORTEE');
    expect(await db.followUps.count()).toBe(2);
    expect(await db.timelineEvents.where('type').equals('FOLLOW_UP_RESCHEDULED').count()).toBe(1);
  });
  it('annule entièrement le report si l’événement ne peut pas être écrit', async () => {
    const item = (await useCase.create(input())).followUp!;
    const fail = () => { throw new Error('Écriture événement impossible'); };
    db.timelineEvents.hook('creating').subscribe(fail);
    try { await expect(useCase.reschedule(item.id, '2026-07-20T12:00:00.000Z', 'Africa/Dakar')).rejects.toThrow(/impossible/); }
    finally { db.timelineEvents.hook('creating').unsubscribe(fail); }
    expect(await db.followUps.count()).toBe(1);
    expect((await db.followUps.get(item.id))?.status).toBe('PLANIFIEE');
  });
  it('ouvre WhatsApp, fige le message et ne réalise jamais la relance', async () => {
    const item = (await useCase.create(input())).followUp!;
    const prepared = await useCase.prepareWhatsApp(item.id, 'Bonjour Awa');
    expect(prepared.url).toContain('https://wa.me/221771234567?text=Bonjour%20Awa');
    expect(prepared.followUp.status).toBe('PLANIFIEE');
    expect((await db.timelineEvents.where('type').equals('WHATSAPP_OPENED').count())).toBe(1);
  });
  it('conserve une ancienne relance après archivage du contact', async () => {
    const item = (await useCase.create(input())).followUp!;
    await db.contacts.update(contactId, { archivedAt: clock.now().toISOString() });
    expect((await useCase.list('UPCOMING')).map((followUp) => followUp.id)).toContain(item.id);
  });
});
