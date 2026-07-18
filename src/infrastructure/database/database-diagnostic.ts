import type Dexie from 'dexie';
import { db } from './db';

export interface DatabaseDiagnostic {
  available: boolean;
  databaseName: string;
  version: number;
  tables: string[];
  missingTables: string[];
}

export const EXPECTED_TABLES = ['contacts', 'prospectProfiles', 'settings', 'sequences', 'locations', 'categories', 'products', 'prospectInterests', 'followUps', 'messageTemplates', 'timelineEvents', 'clientProfiles', 'tags', 'contactTags', 'notes', 'invoices', 'invoiceLines', 'payments', 'campaigns', 'campaignRecipients', 'securitySettings'] as const;

export class DatabaseDiagnosticService {
  constructor(private readonly database: Dexie = db) {}

  async inspect(): Promise<DatabaseDiagnostic> {
    if (typeof indexedDB === 'undefined') {
      return { available: false, databaseName: this.database.name, version: 0, tables: [], missingTables: [...EXPECTED_TABLES] };
    }
    await this.database.open();
    const tables = this.database.tables.map((table) => table.name).sort();
    return {
      available: true,
      databaseName: this.database.name,
      version: this.database.verno,
      tables,
      missingTables: EXPECTED_TABLES.filter((table) => !tables.includes(table)),
    };
  }
}
