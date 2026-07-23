import Dexie from 'dexie';
import { masterDb, BusinessRecord } from './master-db';
import { db, setDb, SamtechCRMDatabase } from './db';

const STORAGE_KEY_ACTIVE_ID = 'samtech_active_business_id';
const STORAGE_KEY_ACTIVE_DB = 'samtech_active_business_db';

export type BusinessResolutionStatus = 
  | 'INITIALIZING'
  | 'READY'
  | 'NO_BUSINESS'
  | 'BUSINESS_SELECTION_REQUIRED'
  | 'RESTORE_INTERRUPTED'
  | 'ERROR';

export class BusinessDatabaseManager {
  /**
   * Initializes the database subsystem.
   * Handles V1 migration and implements the strict Phase 1.1 resolution logic.
   */
  static async initialize(): Promise<BusinessResolutionStatus> {
    try {
      if (typeof window !== 'undefined') {
        const restoreProgress = localStorage.getItem('samtech_restore_in_progress');
        if (restoreProgress) {
          console.warn('[BusinessManager] Interrupted restore detected:', restoreProgress);
          return 'RESTORE_INTERRUPTED';
        }
      }

      const businessesCount = await masterDb.businesses.count();
      
      // V1 Migration Detection
      if (businessesCount === 0) {
        const v1Exists = await Dexie.exists('SamtechCRMDatabase');
        if (v1Exists) {
          console.log('[BusinessManager] V1 Database detected. Migrating to Multi-Business architecture...');
          
          let companyName = 'Mon entreprise';
          try {
            // Using a temporary instance to read V1 parameters without mutating global state
            const tempDb = new SamtechCRMDatabase('SamtechCRMDatabase');
            await tempDb.open();
            const settingsRecord = await tempDb.table('settings').get('company.profile');
            if (settingsRecord && settingsRecord.value && settingsRecord.value.name) {
              companyName = settingsRecord.value.name;
            }
            tempDb.close();
          } catch (e) {
            console.error('[BusinessManager] Failed to read company profile during migration', e);
          }

          const defaultBusiness: BusinessRecord = {
            id: 'default',
            name: companyName,
            databaseName: 'SamtechCRMDatabase',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastAccessedAt: new Date().toISOString(),
            status: 'active'
          };

          await masterDb.businesses.add(defaultBusiness);
          this._setActiveLocally(defaultBusiness);
          console.log('[BusinessManager] V1 Migration complete. Default business created.');
          return 'READY';
        }
      }

      // CAS 1 — activeBusinessId existe dans localStorage
      const activeId = this.getActiveBusinessId();
      if (activeId) {
        const business = await masterDb.businesses.get(activeId);
        if (business && business.status !== 'archived') {
          // Business trouvé et valide
          this._setActiveLocally(business);
          return 'READY';
        } else {
          // ID invalide ou supprimé/archivé
          this._clearActiveLocally();
        }
      }

      // CAS 2 — Aucun activeBusinessId valide
      const allBusinesses = await masterDb.businesses.filter(b => b.status !== 'archived').toArray();
      
      if (allBusinesses.length === 0) {
        // 0 Business
        return 'NO_BUSINESS';
      } else if (allBusinesses.length === 1) {
        // Exactement 1 Business -> Sélection explicite
        this._setActiveLocally(allBusinesses[0]);
        return 'READY';
      } else {
        // Plusieurs Business -> Ne choisir aucun Business arbitrairement
        return 'BUSINESS_SELECTION_REQUIRED';
      }
    } catch (err) {
      console.error('[BusinessManager] Error during initialization:', err);
      return 'ERROR';
    }
  }

  private static _setActiveLocally(business: BusinessRecord) {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem(STORAGE_KEY_ACTIVE_ID, business.id);
    localStorage.setItem(STORAGE_KEY_ACTIVE_DB, business.databaseName);
    
    // Assurer que le singleton DB pointe bien vers cette base
    if (db.name !== business.databaseName) {
      if (db.isOpen()) db.close();
      setDb(new SamtechCRMDatabase(business.databaseName));
    }
    
    // Mettre à jour lastAccessedAt en arrière-plan sans bloquer
    masterDb.businesses.update(business.id, { lastAccessedAt: new Date().toISOString() }).catch(e => {
      console.warn('[BusinessManager] Failed to update lastAccessedAt', e);
    });
  }

  private static _clearActiveLocally() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY_ACTIVE_ID);
    localStorage.removeItem(STORAGE_KEY_ACTIVE_DB);
  }

  static getActiveBusinessId(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEY_ACTIVE_ID);
  }

  static async getActiveBusiness(): Promise<BusinessRecord | null> {
    const activeId = this.getActiveBusinessId();
    if (!activeId) return null;
    
    const business = await masterDb.businesses.get(activeId);
    return business || null;
  }

  static async createBusiness(params: { name: string, logoBase64?: string }): Promise<BusinessRecord> {
    const id = crypto.randomUUID();
    const databaseName = `SamtechCRMDatabase_${id}`;
    
    const newBusiness: BusinessRecord = {
      id,
      name: params.name,
      databaseName,
      logoBase64: params.logoBase64,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastAccessedAt: new Date().toISOString(),
      status: 'active' // Adding active status
    };

    await masterDb.businesses.add(newBusiness);

    // Initialiser la base pour créer le schéma
    const tempDb = new SamtechCRMDatabase(databaseName);
    await tempDb.open();
    tempDb.close();

    return newBusiness;
  }

  static async switchBusiness(businessId: string): Promise<void> {
    const business = await masterDb.businesses.get(businessId);
    if (!business || business.status === 'archived') {
      throw new Error(`Business with ID ${businessId} not found or archived`);
    }

    // Mettre à jour l'accès
    await masterDb.businesses.update(businessId, { lastAccessedAt: new Date().toISOString() });

    // Fermeture de l'instance active
    if (db.isOpen()) {
      db.close();
    }

    // Enregistrement des clés synchrones pour le prochain démarrage
    this._setActiveLocally(business);

    // Rechargement contrôlé de l'application
    window.location.reload();
  }

  static async getAllBusinesses(): Promise<BusinessRecord[]> {
    const records = await masterDb.businesses.toArray();
    return records.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  /**
   * Diagnostic: Detects orphan databases (physical DBs not referenced in Master DB)
   */
  static async detectOrphanDatabases(): Promise<string[]> {
    if (typeof indexedDB === 'undefined' || !indexedDB.databases) {
      console.warn('[BusinessManager] indexedDB.databases() is not supported in this environment');
      return [];
    }

    try {
      const allDbs = await indexedDB.databases();
      const allMasterRecords = await this.getAllBusinesses();
      const masterDbNames = new Set(allMasterRecords.map(r => r.databaseName));

      const orphans: string[] = [];
      for (const dbInfo of allDbs) {
        if (dbInfo.name && dbInfo.name.startsWith('SamtechCRMDatabase_')) {
          if (!masterDbNames.has(dbInfo.name)) {
            orphans.push(dbInfo.name);
          }
        }
      }
      return orphans;
    } catch (e) {
      console.error('[BusinessManager] Error detecting orphan databases:', e);
      return [];
    }
  }

  /**
   * Diagnostic: Recovers an orphan database by extracting its profile and adding it to Master DB
   */
  static async recoverOrphanDatabase(databaseName: string): Promise<BusinessRecord> {
    const tempDb = new SamtechCRMDatabase(databaseName);
    await tempDb.open();
    
    let companyName = 'Espace récupéré';
    let logoBase64: string | undefined;

    try {
      const settingsRecord = await tempDb.table('settings').get('company.profile');
      if (settingsRecord && settingsRecord.value) {
        if (settingsRecord.value.name) companyName = settingsRecord.value.name;
        if (settingsRecord.value.logoDataUri) logoBase64 = settingsRecord.value.logoDataUri;
      }
    } catch (e) {
      console.error(`[BusinessManager] Failed to read company profile from orphan DB ${databaseName}`, e);
    } finally {
      tempDb.close();
    }

    const newBusiness: BusinessRecord = {
      id: crypto.randomUUID(),
      name: companyName,
      databaseName,
      logoBase64,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastAccessedAt: new Date().toISOString(),
      status: 'active'
    };

    await masterDb.businesses.add(newBusiness);
    return newBusiness;
  }
}
