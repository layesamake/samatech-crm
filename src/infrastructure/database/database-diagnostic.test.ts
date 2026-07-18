import Dexie from 'dexie';
import { afterEach, describe, expect, it } from 'vitest';
import { DatabaseDiagnosticService } from './database-diagnostic';
import { SamtechCRMDatabase } from './db';

describe('DatabaseDiagnosticService', () => {
  const name = 'samtech-diagnostic-test';
  afterEach(async () => Dexie.delete(name));

  it('rapporte la version et toutes les tables livrées sans lire les données métier', async () => {
    const database = new SamtechCRMDatabase(name);
    const result = await new DatabaseDiagnosticService(database).inspect();
    expect(result).toMatchObject({ available: true, databaseName: name, version: 10, missingTables: [] });
    expect(result.tables).toEqual(expect.arrayContaining(['contacts', 'locations', 'products', 'prospectInterests', 'clientProfiles', 'invoices', 'payments', 'securitySettings']));
    database.close();
  });
});
