import { BusinessRecord } from '@/infrastructure/database/master-db';
import { BackupCollection, stableStringify } from './backup';

export const GLOBAL_BACKUP_PRODUCT = 'samtech-crm-global';
export const GLOBAL_BACKUP_FORMAT_VERSION = 1;

export interface GlobalBusinessBackup {
  id: string;
  name: string;
  originalDatabaseName: string;
  collections: BackupCollection[];
}

export interface GlobalBackupIntegrity {
  algorithm: 'SHA-256';
  digest: string;
}

export interface GlobalBackupEnvelope {
  product: typeof GLOBAL_BACKUP_PRODUCT;
  formatVersion: typeof GLOBAL_BACKUP_FORMAT_VERSION;
  appVersion: string;
  exportedAt: string;
  metadata: {
    generator: 'SAMTECH CRM';
    businessCount: number;
    activeBusinessId?: string;
  };
  master: {
    businesses: BusinessRecord[];
  };
  businesses: GlobalBusinessBackup[];
  integrity: GlobalBackupIntegrity;
}

export interface GlobalBackupPreview {
  exportedAt: string;
  appVersion: string;
  formatVersion: number;
  totalBusinesses: number;
  businesses: { id: string; name: string; status: 'active' | 'archived' }[];
  activeBusinessId?: string;
}

export async function calculateGlobalIntegrity(envelope: Omit<GlobalBackupEnvelope, 'integrity'>): Promise<string> {
  const data = new TextEncoder().encode(stableStringify(envelope));
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function validateGlobalBackupText(text: string): Promise<GlobalBackupEnvelope> {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error('Le fichier de sauvegarde est corrompu ou invalide.');
  }

  if (!json || typeof json !== 'object') throw new Error('Structure de sauvegarde invalide.');

  const envelope = json as GlobalBackupEnvelope;
  if (envelope.product !== GLOBAL_BACKUP_PRODUCT) throw new Error('Ce fichier n’est pas une sauvegarde globale SAMTECH CRM.');
  if (typeof envelope.formatVersion !== 'number' || envelope.formatVersion > GLOBAL_BACKUP_FORMAT_VERSION) {
    throw new Error('La version de cette sauvegarde globale n’est pas supportée.');
  }

  if (!envelope.integrity || envelope.integrity.algorithm !== 'SHA-256' || !envelope.integrity.digest) {
    throw new Error('Informations d’intégrité manquantes ou non supportées.');
  }

  const { integrity, ...base } = envelope;
  const computed = await calculateGlobalIntegrity(base);

  if (computed !== integrity.digest) {
    throw new Error('Le contrôle d’intégrité ne correspond pas. Le fichier a pu être altéré.');
  }

  return envelope;
}

export function globalBackupFilename(date: Date): string {
  const iso = date.toISOString();
  const datePart = iso.split('T')[0];
  const timePart = iso.split('T')[1].replace(/:/g, '').split('.')[0];
  return `samtech-crm-global-${datePart}-${timePart}.samtech-global-backup`;
}
