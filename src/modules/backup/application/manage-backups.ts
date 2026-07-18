import { ManageSecurityUseCase } from '@/modules/security/application/manage-security';
import {
  BACKUP_FORMAT_VERSION,
  BACKUP_PRODUCT,
  backupFilename,
  BackupEnvelope,
  BackupPreview,
  calculateIntegrity,
  CURRENT_SCHEMA_VERSION,
  validateBackupText,
} from '../domain/backup';
import { DexieBackupRepository } from '../infrastructure/dexie-backup-repository';

export interface PreparedBackup {
  envelope: BackupEnvelope;
  text: string;
  filename: string;
}

export class ManageBackupsUseCase {
  constructor(
    private readonly repository: DexieBackupRepository,
    private readonly security?: ManageSecurityUseCase,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async prepareExport(): Promise<PreparedBackup> {
    const date = this.now();
    const collections = await this.repository.readCollections();
    const recordCount = collections.reduce((sum, collection) => sum + collection.count, 0);
    const base: Omit<BackupEnvelope, 'integrity'> = {
      product: BACKUP_PRODUCT,
      formatVersion: BACKUP_FORMAT_VERSION,
      appVersion: '0.1.0',
      sourceSchemaVersion: CURRENT_SCHEMA_VERSION,
      exportedAt: date.toISOString(),
      metadata: { generator: 'SAMTECH CRM' as const, collectionCount: collections.length, recordCount },
      collections,
    };
    const envelope: BackupEnvelope = { ...base, integrity: { algorithm: 'SHA-256', digest: await calculateIntegrity(base) } };
    const text = JSON.stringify(envelope, null, 2);
    await validateBackupText(text);
    return { envelope, text, filename: backupFilename(date) };
  }

  async confirmExported(prepared: PreparedBackup): Promise<void> {
    await this.repository.markExportedAt(prepared.envelope.exportedAt);
  }

  async getLastExportedAt(): Promise<string | null> {
    return this.repository.getLastExportedAt();
  }

  async inspect(text: string): Promise<{ envelope: BackupEnvelope; preview: BackupPreview }> {
    return validateBackupText(text);
  }

  async restore(envelope: BackupEnvelope, currentPin?: string, beforeCommit?: () => Promise<void>): Promise<void> {
    const revalidated = await validateBackupText(JSON.stringify(envelope));
    if (this.security) {
      const settings = await this.security.getSettings();
      if (settings?.pinEnabled) {
        if (!currentPin) throw new Error('Le PIN actuel est requis.');
        const verified = await this.security.verify(currentPin);
        if (!verified.ok) throw new Error('Le PIN actuel est incorrect ou temporairement bloqué.');
      }
    }
    await this.repository.replaceCollections(revalidated.envelope, beforeCommit);
  }
}
