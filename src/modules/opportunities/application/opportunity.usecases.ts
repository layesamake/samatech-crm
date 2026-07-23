import { v4 as uuidv4 } from 'uuid';
import { OpportunityRecord, CreateOpportunityInput, UpdateOpportunityInput, OpportunityStage, OpportunityStatus } from '../domain/opportunity';
import { opportunityRepository } from '../infrastructure/dexie-opportunity-repository';
import { db } from '@/infrastructure/database/db';
import { TimelineEventRecord } from '@/modules/follow-ups/domain/follow-up';

export class OpportunityUseCases {
  async createOpportunity(input: CreateOpportunityInput): Promise<OpportunityRecord> {
    const now = new Date().toISOString();
    const opportunity: OpportunityRecord = {
      id: uuidv4(),
      contactId: input.contactId,
      title: input.title,
      valueMinor: input.valueMinor,
      currency: input.currency,
      stage: input.stage,
      probability: input.probability,
      expectedCloseDate: input.expectedCloseDate,
      status: 'OPEN',
      notes: input.notes,
      createdAt: now,
      updatedAt: now,
    };

    const timelineEvent: TimelineEventRecord = {
      id: uuidv4(),
      contactId: input.contactId,
      type: 'OPPORTUNITY_CREATED',
      occurredAt: now,
      createdAt: now,
      sourceEntityType: 'OPPORTUNITY',
      sourceEntityId: opportunity.id,
      title: 'Opportunité créée',
      summary: `${input.title} (${input.stage})`,
      payloadVersion: 1,
    };

    await db.transaction('rw', db.opportunities, db.timelineEvents, async () => {
      await opportunityRepository.save(opportunity);
      await db.timelineEvents.put(timelineEvent);
    });

    return opportunity;
  }

  async updateOpportunity(input: UpdateOpportunityInput): Promise<OpportunityRecord> {
    const existing = await opportunityRepository.findById(input.id);
    if (!existing) throw new Error('Opportunity not found');

    const now = new Date().toISOString();
    const updated: OpportunityRecord = {
      ...existing,
      ...input,
      updatedAt: now,
    };

    await opportunityRepository.save(updated);
    return updated;
  }

  async changeStage(id: string, newStage: OpportunityStage): Promise<OpportunityRecord> {
    const existing = await opportunityRepository.findById(id);
    if (!existing) throw new Error('Opportunity not found');

    if (existing.stage === newStage) return existing;

    const now = new Date().toISOString();
    const updated: OpportunityRecord = {
      ...existing,
      stage: newStage,
      updatedAt: now,
    };

    const timelineEvent: TimelineEventRecord = {
      id: uuidv4(),
      contactId: existing.contactId,
      type: 'OPPORTUNITY_STAGE_CHANGED',
      occurredAt: now,
      createdAt: now,
      sourceEntityType: 'OPPORTUNITY',
      sourceEntityId: updated.id,
      title: 'Changement d\'étape',
      summary: `Opportunité passée à l'étape : ${newStage}`,
      payloadVersion: 1,
    };

    await db.transaction('rw', db.opportunities, db.timelineEvents, async () => {
      await opportunityRepository.save(updated);
      await db.timelineEvents.put(timelineEvent);
    });

    return updated;
  }

  async markAsWon(id: string): Promise<OpportunityRecord> {
    const existing = await opportunityRepository.findById(id);
    if (!existing) throw new Error('Opportunity not found');

    const now = new Date().toISOString();
    const updated: OpportunityRecord = {
      ...existing,
      status: 'WON',
      stage: 'GAGNE',
      updatedAt: now,
    };

    const timelineEvent: TimelineEventRecord = {
      id: uuidv4(),
      contactId: existing.contactId,
      type: 'OPPORTUNITY_WON',
      occurredAt: now,
      createdAt: now,
      sourceEntityType: 'OPPORTUNITY',
      sourceEntityId: updated.id,
      title: 'Opportunité gagnée !',
      summary: existing.title,
      payloadVersion: 1,
    };

    await db.transaction('rw', db.opportunities, db.timelineEvents, async () => {
      await opportunityRepository.save(updated);
      await db.timelineEvents.put(timelineEvent);
    });

    return updated;
  }

  async markAsLost(id: string, reason?: string): Promise<OpportunityRecord> {
    const existing = await opportunityRepository.findById(id);
    if (!existing) throw new Error('Opportunity not found');

    const now = new Date().toISOString();
    const updated: OpportunityRecord = {
      ...existing,
      status: 'LOST',
      stage: 'PERDU',
      lostReason: reason,
      updatedAt: now,
    };

    const timelineEvent: TimelineEventRecord = {
      id: uuidv4(),
      contactId: existing.contactId,
      type: 'OPPORTUNITY_LOST',
      occurredAt: now,
      createdAt: now,
      sourceEntityType: 'OPPORTUNITY',
      sourceEntityId: updated.id,
      title: 'Opportunité perdue',
      summary: reason ? `Motif: ${reason}` : undefined,
      payloadVersion: 1,
    };

    await db.transaction('rw', db.opportunities, db.timelineEvents, async () => {
      await opportunityRepository.save(updated);
      await db.timelineEvents.put(timelineEvent);
    });

    return updated;
  }

  async getContactOpportunities(contactId: string): Promise<OpportunityRecord[]> {
    return opportunityRepository.findByContactId(contactId);
  }

  async getPipeline(): Promise<OpportunityRecord[]> {
    return opportunityRepository.findAllActive();
  }
}

export const opportunityUseCases = new OpportunityUseCases();
