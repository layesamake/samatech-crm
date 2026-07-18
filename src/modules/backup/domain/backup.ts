export const BACKUP_PRODUCT = 'samtech-crm';
export const BACKUP_FORMAT_VERSION = 1;
export const CURRENT_SCHEMA_VERSION = 10;
export const MAX_BACKUP_BYTES = 25 * 1024 * 1024;
export const MAX_BACKUP_RECORDS = 250_000;

export const BUSINESS_COLLECTIONS = [
  'settings',
  'sequences',
  'locations',
  'categories',
  'products',
  'contacts',
  'prospectProfiles',
  'prospectInterests',
  'clientProfiles',
  'tags',
  'contactTags',
  'notes',
  'timelineEvents',
  'followUps',
  'messageTemplates',
  'invoices',
  'invoiceLines',
  'payments',
  'campaigns',
  'campaignRecipients',
] as const;

export type BusinessCollectionName = (typeof BUSINESS_COLLECTIONS)[number];
export type BackupRecord = Record<string, unknown>;

export interface BackupCollection {
  name: BusinessCollectionName;
  version: 1;
  count: number;
  records: BackupRecord[];
}

export interface BackupIntegrity {
  algorithm: 'SHA-256';
  digest: string;
}

export interface BackupEnvelope {
  product: typeof BACKUP_PRODUCT;
  formatVersion: typeof BACKUP_FORMAT_VERSION;
  appVersion: string;
  sourceSchemaVersion: number;
  exportedAt: string;
  metadata: {
    generator: 'SAMTECH CRM';
    collectionCount: number;
    recordCount: number;
  };
  collections: BackupCollection[];
  integrity: BackupIntegrity;
}

export interface BackupPreview {
  exportedAt: string;
  appVersion: string;
  formatVersion: number;
  totalRecords: number;
  counts: Record<BusinessCollectionName, number>;
}

export class BackupValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BackupValidationError';
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const object = value as Record<string, unknown>;
  return `{${Object.keys(object).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(object[key])}`).join(',')}}`;
}

export async function sha256Hex(value: string, cryptoApi: Crypto = globalThis.crypto): Promise<string> {
  const digest = await cryptoApi.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function integrityPayload(envelope: Omit<BackupEnvelope, 'integrity'> | BackupEnvelope): Record<string, unknown> {
  const { integrity: _integrity, ...payload } = envelope as BackupEnvelope;
  void _integrity;
  return payload;
}

export async function calculateIntegrity(envelope: Omit<BackupEnvelope, 'integrity'> | BackupEnvelope): Promise<string> {
  return sha256Hex(stableStringify(integrityPayload(envelope)));
}

function assertSafeStructure(value: unknown, depth = 0, state = { nodes: 0 }): void {
  state.nodes += 1;
  if (depth > 30 || state.nodes > MAX_BACKUP_RECORDS * 30) {
    throw new BackupValidationError('La structure du fichier est excessive.');
  }
  if (!value || typeof value !== 'object') return;
  for (const key of Object.keys(value)) {
    if (key === '__proto__' || key === 'prototype' || key === 'constructor') {
      throw new BackupValidationError('Le fichier contient une clé interdite.');
    }
    assertSafeStructure((value as Record<string, unknown>)[key], depth + 1, state);
  }
}

function requiredString(record: BackupRecord, key: string, collection: string): string {
  const value = record[key];
  if (typeof value !== 'string' || value.trim() === '') {
    throw new BackupValidationError(`Champ ${key} invalide dans ${collection}.`);
  }
  return value;
}

function validateRecords(collection: BackupCollection): void {
  const primaryKey = collection.name === 'settings' || collection.name === 'sequences' ? 'key' : 'id';
  const seen = new Set<string>();
  for (const record of collection.records) {
    if (!isPlainObject(record)) throw new BackupValidationError(`Enregistrement invalide dans ${collection.name}.`);
    const id = requiredString(record, primaryKey, collection.name);
    if (seen.has(id)) throw new BackupValidationError(`Identifiant dupliqué dans ${collection.name}.`);
    seen.add(id);
    for (const [key, value] of Object.entries(record)) {
      const isFinancial = /(?:Minor|Scaled|BasisPoints|position|nextValue|padding)$/.test(key);
      if (isFinancial && value !== undefined && (!Number.isSafeInteger(value) || (value as number) < 0)) {
        throw new BackupValidationError(`Valeur numérique invalide (${key}) dans ${collection.name}.`);
      }
    }
  }
}

function collectionMap(collections: BackupCollection[]): Map<BusinessCollectionName, BackupCollection> {
  return new Map(collections.map((collection) => [collection.name, collection]));
}

function ids(map: Map<BusinessCollectionName, BackupCollection>, collection: BusinessCollectionName): Set<string> {
  const key = collection === 'settings' || collection === 'sequences' ? 'key' : 'id';
  return new Set((map.get(collection)?.records ?? []).map((record) => String(record[key])));
}

function assertReferences(map: Map<BusinessCollectionName, BackupCollection>): void {
  const rules: Array<[BusinessCollectionName, string, BusinessCollectionName, boolean]> = [
    ['prospectProfiles', 'contactId', 'contacts', false],
    ['clientProfiles', 'contactId', 'contacts', false],
    ['prospectInterests', 'prospectProfileId', 'prospectProfiles', false],
    ['prospectInterests', 'productId', 'products', false],
    ['contactTags', 'contactId', 'contacts', false],
    ['contactTags', 'tagId', 'tags', false],
    ['notes', 'contactId', 'contacts', false],
    ['followUps', 'contactId', 'contacts', false],
    ['timelineEvents', 'contactId', 'contacts', false],
    ['products', 'categoryId', 'categories', true],
    ['invoices', 'clientProfileId', 'clientProfiles', false],
    ['invoiceLines', 'invoiceId', 'invoices', false],
    ['invoiceLines', 'productId', 'products', true],
    ['payments', 'invoiceId', 'invoices', false],
    ['payments', 'clientProfileId', 'clientProfiles', false],
    ['campaignRecipients', 'campaignId', 'campaigns', false],
    ['campaignRecipients', 'contactId', 'contacts', false],
  ];
  for (const [source, field, target, optional] of rules) {
    const targetIds = ids(map, target);
    for (const record of map.get(source)?.records ?? []) {
      const value = record[field];
      if (optional && (value === undefined || value === null || value === '')) continue;
      if (typeof value !== 'string' || !targetIds.has(value)) {
        throw new BackupValidationError(`Référence ${source}.${field} inexistante.`);
      }
    }
  }
}

function parseCollection(value: unknown): BackupCollection {
  if (!isPlainObject(value)) throw new BackupValidationError('Collection invalide.');
  const name = value.name;
  if (typeof name !== 'string' || !BUSINESS_COLLECTIONS.includes(name as BusinessCollectionName)) {
    throw new BackupValidationError('Le fichier contient une collection inconnue.');
  }
  if (value.version !== 1 || !Number.isSafeInteger(value.count) || !Array.isArray(value.records)) {
    throw new BackupValidationError(`Métadonnées invalides pour ${name}.`);
  }
  if (value.count !== value.records.length) throw new BackupValidationError(`Comptage incohérent pour ${name}.`);
  return { name: name as BusinessCollectionName, version: 1, count: value.count as number, records: value.records as BackupRecord[] };
}

export async function validateBackupText(text: string): Promise<{ envelope: BackupEnvelope; preview: BackupPreview }> {
  const byteSize = new TextEncoder().encode(text).byteLength;
  if (byteSize === 0) throw new BackupValidationError('Le fichier est vide.');
  if (byteSize > MAX_BACKUP_BYTES) throw new BackupValidationError('Le fichier dépasse la taille maximale autorisée.');
  let raw: unknown;
  try {
    raw = JSON.parse(text) as unknown;
  } catch {
    throw new BackupValidationError('Le fichier ne contient pas un JSON valide.');
  }
  assertSafeStructure(raw);
  if (!isPlainObject(raw)) throw new BackupValidationError('Enveloppe de sauvegarde invalide.');
  if (raw.product !== BACKUP_PRODUCT) throw new BackupValidationError('Ce fichier ne provient pas de SAMTECH CRM.');
  if (raw.formatVersion !== BACKUP_FORMAT_VERSION) {
    throw new BackupValidationError('La version de cette sauvegarde est incompatible.');
  }
  if (!Number.isSafeInteger(raw.sourceSchemaVersion) || (raw.sourceSchemaVersion as number) < 1 || (raw.sourceSchemaVersion as number) > CURRENT_SCHEMA_VERSION) {
    throw new BackupValidationError('La version de base source est incompatible.');
  }
  if (typeof raw.appVersion !== 'string' || raw.appVersion.length > 50 || Number.isNaN(Date.parse(String(raw.exportedAt)))) {
    throw new BackupValidationError('Les métadonnées de la sauvegarde sont invalides.');
  }
  if (!isPlainObject(raw.metadata) || raw.metadata.generator !== 'SAMTECH CRM') throw new BackupValidationError('Métadonnées invalides.');
  if (!Array.isArray(raw.collections)) throw new BackupValidationError('La liste des collections est absente.');
  const collections = raw.collections.map(parseCollection);
  const names = new Set(collections.map((collection) => collection.name));
  if (names.size !== collections.length || BUSINESS_COLLECTIONS.some((name) => !names.has(name))) {
    throw new BackupValidationError('Une collection obligatoire est absente ou dupliquée.');
  }
  const totalRecords = collections.reduce((sum, collection) => sum + collection.count, 0);
  if (totalRecords > MAX_BACKUP_RECORDS) throw new BackupValidationError('La sauvegarde contient trop d’enregistrements.');
  if (raw.metadata.collectionCount !== BUSINESS_COLLECTIONS.length || raw.metadata.recordCount !== totalRecords) {
    throw new BackupValidationError('Les totaux de la sauvegarde sont incohérents.');
  }
  if (!isPlainObject(raw.integrity) || raw.integrity.algorithm !== 'SHA-256' || !/^[a-f0-9]{64}$/.test(String(raw.integrity.digest))) {
    throw new BackupValidationError('Le contrôle d’intégrité est absent ou invalide.');
  }
  const envelope = raw as unknown as BackupEnvelope;
  const expectedDigest = await calculateIntegrity(envelope);
  if (expectedDigest !== envelope.integrity.digest) throw new BackupValidationError('Le contrôle d’intégrité ne correspond pas.');
  for (const collection of collections) validateRecords(collection);
  const map = collectionMap(collections);
  assertReferences(map);
  const counts = Object.fromEntries(BUSINESS_COLLECTIONS.map((name) => [name, map.get(name)?.count ?? 0])) as Record<BusinessCollectionName, number>;
  return {
    envelope,
    preview: {
      exportedAt: envelope.exportedAt,
      appVersion: envelope.appVersion,
      formatVersion: envelope.formatVersion,
      totalRecords,
      counts,
    },
  };
}

export function backupFilename(date: Date): string {
  const stamp = date.toISOString().slice(0, 16).replace('T', '-').replace(':', '');
  return `samtech-crm-backup-${stamp}.json`;
}

