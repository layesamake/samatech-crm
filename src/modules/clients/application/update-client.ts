import { UpdateProspectUseCase } from '@/modules/prospects/application/update-prospect';
import { DexieProspectRepository } from '@/modules/prospects/infrastructure/dexie-prospect-repository';
import { ClientAggregate, UpdateClientInput, UpdateClientSchema } from '../domain/client';
import { DexieClientRepository } from '../infrastructure/dexie-client-repository';

export interface UpdateClientResult {
  client?: ClientAggregate;
  warning?: string;
  error?: string;
}

export class UpdateClientUseCase {
  constructor(
    private readonly clients = new DexieClientRepository(),
    private readonly prospects = new DexieProspectRepository(),
  ) {}

  async execute(clientId: string, input: UpdateClientInput, forceDuplicate = false): Promise<UpdateClientResult> {
    const validation = UpdateClientSchema.safeParse(input);
    if (!validation.success) {
      return { error: `Données invalides : ${validation.error.issues.map((issue) => issue.message).join(', ')}` };
    }

    const client = await this.clients.getById(clientId);
    if (!client) return { error: 'Client introuvable.' };

    const result = await new UpdateProspectUseCase(this.prospects).execute(client.contact.id, {
      ...validation.data,
      status: 'CONVERTI',
      interestLevel: client.prospectProfile.interestLevel,
      source: client.contact.source,
      customSource: client.contact.customSource,
      lostReason: client.prospectProfile.lostReason,
    }, forceDuplicate);

    if (result.error) return { error: result.error };
    if (result.warning) return { warning: result.warning.replace('prospect', 'contact') };

    const updated = await this.clients.getById(clientId);
    return updated ? { client: updated } : { error: 'Client introuvable après la modification.' };
  }
}
