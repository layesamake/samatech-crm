import { db } from '../../../infrastructure/database/db';
import { SettingsRecord } from '../domain/settings';

export class DexieSettingsRepository {
  async getByKey<T>(key: string): Promise<T | null> {
    const record = await db.settings.get(key);
    if (!record) return null;
    return record.value as T;
  }

  async save(key: string, value: unknown, schemaVersion: number = 1): Promise<void> {
    const record: SettingsRecord = {
      key,
      value,
      schemaVersion,
      updatedAt: new Date().toISOString()
    };
    await db.settings.put(record);
  }
}
