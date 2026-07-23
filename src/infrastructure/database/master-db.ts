import Dexie from 'dexie';

export interface BusinessRecord {
  id: string;
  name: string;
  databaseName: string;
  logoBase64?: string;
  createdAt: string;
  updatedAt: string;
  lastAccessedAt?: string;
  status: 'active' | 'archived';
}

export class SamtechCRMMasterDatabase extends Dexie {
  businesses!: Dexie.Table<BusinessRecord, string>;

  constructor() {
    super('SamtechCRM_Master');
    
    this.version(1).stores({
      businesses: 'id, name, databaseName, lastAccessedAt',
    });
  }
}

export const masterDb = new SamtechCRMMasterDatabase();
