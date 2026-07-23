import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Dexie from 'dexie';
import { migrateToV14 } from './migration-v14';
import { CURRENT_SCHEMA_VERSION, SamtechCRMDatabase } from './db';

describe('Migration V14', () => {
  let db: SamtechCRMDatabase;

  beforeEach(() => {
    // on cree une base temporaire
    db = new SamtechCRMDatabase('TestMigrationV14DB');
  });

  afterEach(async () => {
    if (db.isOpen()) {
      db.close();
    }
    await Dexie.delete('TestMigrationV14DB');
  });

  it('should upgrade schema and create opportunities table', async () => {
    // Ouvre la base
    await db.open();

    // Verifier que la table opportunities existe
    const tableNames = db.tables.map(t => t.name);
    expect(tableNames).toContain('opportunities');
    
    // Verifier que la migration specifique ne fait pas d'erreur
    await expect(migrateToV14(db)).resolves.toBeUndefined();
    
    // On peut inserer une donnee de test
    await db.opportunities.put({
      id: 'opp-1',
      contactId: 'contact-1',
      title: 'Deal 1',
      stage: 'NOUVEAU',
      status: 'OPEN',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    const items = await db.opportunities.toArray();
    expect(items.length).toBe(1);
    expect(items[0].id).toBe('opp-1');
  });
});
