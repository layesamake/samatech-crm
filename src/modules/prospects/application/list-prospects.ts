import { ProspectSearchCriteria } from '../infrastructure/dexie-prospect-repository';
import { DexieProspectRepository } from '../infrastructure/dexie-prospect-repository';
import { Prospect } from '../domain/prospect';

export class ListProspectsUseCase {
  constructor(private repository: DexieProspectRepository) {}

  async execute(criteria: ProspectSearchCriteria): Promise<Prospect[]> {
    return this.repository.search(criteria);
  }
}
