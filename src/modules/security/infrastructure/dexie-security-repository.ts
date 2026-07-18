import { db } from '@/infrastructure/database/db';
import { SecurityRepository } from '../application/manage-security';
import { LOCAL_SECURITY_ID, SecuritySettingsRecord } from '../domain/security';

export class DexieSecurityRepository implements SecurityRepository {
  async get(): Promise<SecuritySettingsRecord | null> {
    return (await db.securitySettings.get(LOCAL_SECURITY_ID)) ?? null;
  }

  async save(settings: SecuritySettingsRecord): Promise<void> {
    await db.securitySettings.put(settings);
  }

  async delete(): Promise<void> {
    await db.securitySettings.delete(LOCAL_SECURITY_ID);
  }

  async resetAllLocalData(): Promise<void> {
    const tables = db.tables;
    await db.transaction('rw', tables, async () => {
      for (const table of tables) await table.clear();
    });
  }
}
