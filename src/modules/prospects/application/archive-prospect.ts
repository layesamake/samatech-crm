import { DexieProspectRepository } from '../infrastructure/dexie-prospect-repository';

export class ArchiveProspectUseCase {
  constructor(private repository: DexieProspectRepository) {}

  async execute(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.repository.archive(id);
      return { success: true };
    } catch (e: unknown) {
      const error = e as Error;
      return { success: false, error: error.message || 'Erreur lors de l\'archivage' };
    }
  }
}
