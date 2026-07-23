import { OpportunityRecord, OpportunityStatus, OpportunityStage } from '../domain/opportunity';
import { db } from '@/infrastructure/database/db';

export class DexieOpportunityRepository {
  async findById(id: string): Promise<OpportunityRecord | null> {
    const opp = await db.opportunities.get(id);
    return opp || null;
  }

  async findByContactId(contactId: string): Promise<OpportunityRecord[]> {
    return db.opportunities.where('contactId').equals(contactId).toArray();
  }

  async findAllByStatus(status: OpportunityStatus): Promise<OpportunityRecord[]> {
    // on utilise la table opportunities et on filtre par status
    return db.opportunities.filter(opp => opp.status === status).toArray();
  }
  
  async findAllActive(): Promise<OpportunityRecord[]> {
    return this.findAllByStatus('OPEN');
  }

  async save(opportunity: OpportunityRecord): Promise<void> {
    await db.opportunities.put(opportunity);
  }

  async delete(id: string): Promise<void> {
    await db.opportunities.delete(id);
  }
}

export const opportunityRepository = new DexieOpportunityRepository();
