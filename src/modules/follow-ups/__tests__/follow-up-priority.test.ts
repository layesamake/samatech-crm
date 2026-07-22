import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/infrastructure/database/db';
import { ManageFollowUpsUseCase } from '../application/manage-follow-ups';
import { FixedClock, FOLLOW_UP_PRIORITIES, FollowUpRecord } from '../domain/follow-up';

const contactId = '11111111-1111-4111-8111-111111111111';

describe('Relances avec 3 niveaux de priorité différents', () => {
  const clock = new FixedClock(new Date('2026-07-22T10:00:00.000Z'));
  let useCase: ManageFollowUpsUseCase;

  beforeEach(async () => {
    await db.transaction(
      'rw',
      [db.contacts, db.prospectProfiles, db.followUps, db.timelineEvents],
      async () =>
        Promise.all([
          db.contacts.clear(),
          db.prospectProfiles.clear(),
          db.followUps.clear(),
          db.timelineEvents.clear(),
        ]),
    );
    const now = clock.now().toISOString();
    await db.contacts.add({
      id: contactId,
      displayName: 'Moussa Diallo',
      whatsappPhone: '+221776543210',
      normalizedWhatsappPhone: '+221776543210',
      createdAt: now,
      updatedAt: now,
    });
    await db.prospectProfiles.add({
      id: '22222222-2222-4222-8222-222222222222',
      contactId,
      status: 'NOUVEAU',
      interestLevel: 'TIEDE',
      firstContactDate: '2026-07-22',
      lastStatusChangedAt: now,
      createdAt: now,
      updatedAt: now,
    });
    useCase = new ManageFollowUpsUseCase(undefined, undefined, clock);
  });

  it('enregistre 3 relances avec les priorités LOW, NORMAL et HIGH', async () => {
    // --- 1. Relance priorité LOW ---
    const lowResult = await useCase.create({
      contactId,
      channel: 'EMAIL',
      dueAt: '2026-07-25T09:00:00.000Z',
      timezone: 'Africa/Dakar',
      priority: 'LOW',
      reason: 'Simple rappel de courtoisie',
    });
    expect(lowResult.followUp).toBeDefined();
    expect(lowResult.followUp!.priority).toBe('LOW');
    expect(lowResult.followUp!.status).toBe('PLANIFIEE');
    expect(lowResult.followUp!.channel).toBe('EMAIL');

    // --- 2. Relance priorité NORMAL ---
    const normalResult = await useCase.create({
      contactId,
      channel: 'WHATSAPP',
      dueAt: '2026-07-24T14:00:00.000Z',
      timezone: 'Africa/Dakar',
      priority: 'NORMAL',
      reason: 'Suivi devis envoyé',
    });
    expect(normalResult.followUp).toBeDefined();
    expect(normalResult.followUp!.priority).toBe('NORMAL');
    expect(normalResult.followUp!.status).toBe('PLANIFIEE');
    expect(normalResult.followUp!.channel).toBe('WHATSAPP');

    // --- 3. Relance priorité HIGH ---
    const highResult = await useCase.create({
      contactId,
      channel: 'PHONE',
      dueAt: '2026-07-23T08:00:00.000Z',
      timezone: 'Africa/Dakar',
      priority: 'HIGH',
      reason: 'Client en attente urgente de réponse',
    });
    expect(highResult.followUp).toBeDefined();
    expect(highResult.followUp!.priority).toBe('HIGH');
    expect(highResult.followUp!.status).toBe('PLANIFIEE');
    expect(highResult.followUp!.channel).toBe('PHONE');

    // --- Vérification de la persistance en base ---
    const allFollowUps = await db.followUps.toArray();
    expect(allFollowUps).toHaveLength(3);

    const priorities = allFollowUps.map((f: FollowUpRecord) => f.priority).sort();
    expect(priorities).toEqual(['HIGH', 'LOW', 'NORMAL']);

    // --- Vérification des événements timeline ---
    const events = await db.timelineEvents.toArray();
    expect(events).toHaveLength(3);
    expect(events.every((e) => e.type === 'FOLLOW_UP_CREATED')).toBe(true);

    // --- Vérification via le use case list() ---
    const upcoming = await useCase.list('UPCOMING');
    expect(upcoming).toHaveLength(3);
    // Le tri est par dueAt croissant
    expect(upcoming[0].priority).toBe('HIGH');   // 23 juillet
    expect(upcoming[1].priority).toBe('NORMAL');  // 24 juillet
    expect(upcoming[2].priority).toBe('LOW');     // 25 juillet
  });

  it('vérifie que les 3 niveaux de priorité sont bien distincts', async () => {
    const results: FollowUpRecord[] = [];
    for (const priority of FOLLOW_UP_PRIORITIES) {
      const result = await useCase.create({
        contactId,
        channel: 'WHATSAPP',
        // Espacement de 2h entre chaque pour éviter l'avertissement doublon
        dueAt: `2026-07-25T${10 + FOLLOW_UP_PRIORITIES.indexOf(priority) * 2}:00:00.000Z`,
        timezone: 'Africa/Dakar',
        priority,
        reason: `Test priorité ${priority}`,
      });
      expect(result.followUp).toBeDefined();
      results.push(result.followUp!);
    }

    // Chaque relance a bien une priorité unique
    const uniquePriorities = new Set(results.map((r) => r.priority));
    expect(uniquePriorities.size).toBe(3);
    expect(uniquePriorities).toContain('LOW');
    expect(uniquePriorities).toContain('NORMAL');
    expect(uniquePriorities).toContain('HIGH');

    // Vérification que chaque relance a un ID distinct
    const uniqueIds = new Set(results.map((r) => r.id));
    expect(uniqueIds.size).toBe(3);
  });
});
