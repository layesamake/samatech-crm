import { DexieTreasuryRepository } from '../infrastructure/dexie-treasury-repository';
import { TreasuryAllocationRecord, TreasurySourceType } from '../domain/treasury';

export class AllocateTreasurySourcesUseCase {
  constructor(private readonly repository: DexieTreasuryRepository) {}

  async allocate(sourceType: TreasurySourceType, sourceId: string, accountId: string): Promise<string> {
    const existing = await this.repository.getAllocationForSource(sourceType, sourceId);
    const now = new Date().toISOString();

    if (existing) {
      if (existing.accountId === accountId && existing.status === 'ACTIVE') {
        return existing.id; // Déjà affecté
      }
      
      // Si c'est déjà affecté ailleurs, on annule l'ancien
      if (existing.status === 'ACTIVE') {
        await this.repository.saveAllocation({
          ...existing,
          status: 'CANCELLED',
          cancelledAt: now,
          cancellationReason: 'Réaffectation',
          updatedAt: now
        });
      }
    }

    const id = crypto.randomUUID();
    const allocation: TreasuryAllocationRecord = {
      id,
      sourceType,
      sourceId,
      accountId,
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now
    };

    await this.repository.saveAllocation(allocation);
    return id;
  }

  async cancelAllocation(sourceType: TreasurySourceType, sourceId: string, reason?: string): Promise<void> {
    const existing = await this.repository.getAllocationForSource(sourceType, sourceId);
    if (existing && existing.status === 'ACTIVE') {
      const now = new Date().toISOString();
      await this.repository.saveAllocation({
        ...existing,
        status: 'CANCELLED',
        cancelledAt: now,
        cancellationReason: reason || 'Annulation manuelle',
        updatedAt: now
      });
    }
  }
}
