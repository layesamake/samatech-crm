import { Clock, SystemClock, TimelineEventRecord } from '@/modules/follow-ups/domain/follow-up';
import { DexieProspectRepository } from '@/modules/prospects/infrastructure/dexie-prospect-repository';
import { ClientAggregate, ClientProfileRecord, ConversionInput, ConversionInputSchema } from '../domain/client';
import { DexieClientRepository } from '../infrastructure/dexie-client-repository';

export class ConvertProspectToClientUseCase {
  constructor(private readonly clients = new DexieClientRepository(), private readonly prospects = new DexieProspectRepository(), private readonly clock: Clock = new SystemClock()) {}

  async execute(contactId: string, input: ConversionInput): Promise<ClientAggregate> {
    const { convertedAt } = ConversionInputSchema.parse(input);
    const prospect = await this.prospects.getById(contactId);
    if (!prospect) throw new Error('Prospect introuvable');
    if (prospect.contact.archivedAt || prospect.profile.archivedAt) throw new Error('Un contact archivé ne peut pas être converti');
    if (prospect.profile.status === 'PERDU') throw new Error('Réactivez le prospect perdu avant de le convertir');
    if (prospect.profile.status === 'CONVERTI' || await this.clients.getByContactId(contactId)) throw new Error('Ce prospect est déjà converti');
    const now = this.clock.now().toISOString();
    const profile: ClientProfileRecord = { id: crypto.randomUUID(), contactId, convertedAt, createdAt: now, updatedAt: now };
    const convertedProspect = { ...prospect.profile, status: 'CONVERTI' as const, convertedAt, lastStatusChangedAt: now, updatedAt: now };
    const event: TimelineEventRecord = { id: crypto.randomUUID(), contactId, type: 'PROSPECT_CONVERTED', occurredAt: convertedAt, createdAt: now, sourceEntityType: 'CLIENT_PROFILE', sourceEntityId: profile.id, title: 'Prospect converti en client', payloadVersion: 1 };
    await this.clients.convert(convertedProspect, profile, event);
    const result = await this.clients.getById(profile.id);
    if (!result) throw new Error('Client introuvable après conversion');
    return result;
  }
}
