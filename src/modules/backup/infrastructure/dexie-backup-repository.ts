import { db } from '@/infrastructure/database/db';
import { SettingsRecord } from '@/modules/settings/domain/settings';
import { BackupCollection, BackupEnvelope, BUSINESS_COLLECTIONS, BusinessCollectionName } from '../domain/backup';

export class DexieBackupRepository {
  async readCollections(): Promise<BackupCollection[]> {
    const collections: BackupCollection[] = [];
    for (const name of BUSINESS_COLLECTIONS) {
      const rawRecords = await db.table(name).toArray();
      const records = JSON.parse(JSON.stringify(rawRecords)) as Record<string, unknown>[];
      collections.push({ name, version: 1, count: records.length, records });
    }
    return collections;
  }

  async replaceCollections(envelope: BackupEnvelope, beforeCommit?: () => Promise<void>): Promise<void> {
    const tables = BUSINESS_COLLECTIONS.map((name) => db.table(name));
    const byName = new Map(envelope.collections.map((collection) => [collection.name, collection.records]));
    await db.transaction('rw', tables, async () => {
      for (const table of tables) await table.clear();
      for (const name of BUSINESS_COLLECTIONS) {
        const records = byName.get(name) ?? [];
        if (records.length > 0) await db.table(name).bulkAdd(records);
      }
      if (beforeCommit) await beforeCommit();
      for (const name of BUSINESS_COLLECTIONS) {
        const expected = byName.get(name)?.length ?? 0;
        if (await db.table(name).count() !== expected) throw new Error(`Restauration incomplète: ${name}.`);
      }
    });
  }

  async getLastExportedAt(): Promise<string | null> {
    const record = await db.settings.get('backup.lastExportedAt');
    return typeof record?.value === 'string' ? record.value : null;
  }

  async markExportedAt(exportedAt: string): Promise<void> {
    const record: SettingsRecord = { key: 'backup.lastExportedAt', value: exportedAt, schemaVersion: 1, updatedAt: exportedAt };
    await db.settings.put(record);
  }

  async counts(): Promise<Record<BusinessCollectionName, number>> {
    const pairs = await Promise.all(BUSINESS_COLLECTIONS.map(async (name) => [name, await db.table(name).count()] as const));
    return Object.fromEntries(pairs) as Record<BusinessCollectionName, number>;
  }
}

