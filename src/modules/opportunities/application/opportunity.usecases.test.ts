import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { opportunityUseCases } from './opportunity.usecases';
import { db } from '@/infrastructure/database/db';
import { OpportunityRecord } from '../domain/opportunity';
import Dexie from 'dexie';

describe('OpportunityUseCases', () => {
  beforeEach(async () => {
    await db.open();
    await db.opportunities.clear();
    await db.timelineEvents.clear();
  });

  afterEach(async () => {
    // Nettoyage après test si besoin, mais beforeEach s'en charge.
  });

  it('devrait créer une opportunité et un événement dans la timeline', async () => {
    const opp = await opportunityUseCases.createOpportunity({
      contactId: 'contact-123',
      title: 'Devis Refonte Web',
      stage: 'QUALIFIE',
      valueMinor: 500000,
    });

    expect(opp.id).toBeDefined();
    expect(opp.contactId).toBe('contact-123');
    expect(opp.status).toBe('OPEN');
    expect(opp.stage).toBe('QUALIFIE');

    const saved = await db.opportunities.get(opp.id);
    expect(saved).toEqual(opp);

    const events = await db.timelineEvents.where('contactId').equals('contact-123').toArray();
    expect(events.length).toBe(1);
    expect(events[0].type).toBe('OPPORTUNITY_CREATED');
    expect(events[0].sourceEntityId).toBe(opp.id);
  });

  it('devrait changer l\'étape d\'une opportunité', async () => {
    const opp = await opportunityUseCases.createOpportunity({
      contactId: 'contact-123',
      title: 'Devis Refonte Web',
      stage: 'NOUVEAU',
    });

    const updated = await opportunityUseCases.changeStage(opp.id, 'NEGOCIATION');
    expect(updated.stage).toBe('NEGOCIATION');

    const events = await db.timelineEvents.where('contactId').equals('contact-123').toArray();
    events.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    // 1 creation, 1 stage change
    expect(events.length).toBe(2);
    expect(events[1].type).toBe('OPPORTUNITY_STAGE_CHANGED');
  });

  it('devrait marquer une opportunité comme gagnée', async () => {
    const opp = await opportunityUseCases.createOpportunity({
      contactId: 'contact-123',
      title: 'Devis Refonte Web',
      stage: 'NOUVEAU',
    });

    const updated = await opportunityUseCases.markAsWon(opp.id);
    expect(updated.stage).toBe('GAGNE');
    expect(updated.status).toBe('WON');

    const events = await db.timelineEvents.where('contactId').equals('contact-123').toArray();
    events.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    expect(events[1].type).toBe('OPPORTUNITY_WON');
  });

  it('devrait récupérer le pipeline (statut OPEN uniquement)', async () => {
    await opportunityUseCases.createOpportunity({ contactId: 'contact-1', title: 'Opp 1', stage: 'NOUVEAU' });
    const opp2 = await opportunityUseCases.createOpportunity({ contactId: 'contact-2', title: 'Opp 2', stage: 'NOUVEAU' });
    await opportunityUseCases.createOpportunity({ contactId: 'contact-3', title: 'Opp 3', stage: 'NOUVEAU' });
    
    await opportunityUseCases.markAsWon(opp2.id);

    const pipeline = await opportunityUseCases.getPipeline();
    expect(pipeline.length).toBe(2);
    expect(pipeline.map(o => o.title)).toEqual(expect.arrayContaining(['Opp 1', 'Opp 3']));
  });
});
