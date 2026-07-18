import { ClientSearchCriteria } from '../domain/client';
import { DexieClientRepository } from '../infrastructure/dexie-client-repository';

export class ManageClientsUseCase {
  constructor(private readonly repository = new DexieClientRepository()) {}
  list(criteria: ClientSearchCriteria = {}) { return this.repository.search(criteria); }
  get(id: string) { return this.repository.getById(id); }
  getByContactId(contactId: string) { return this.repository.getByContactId(contactId); }
}
