export interface EncryptedBackupHeaderV1 {
  product: 'samtech-crm';
  containerVersion: 1;
  encrypted: true;
  createdAt: string;
  kdf: {
    name: 'PBKDF2';
    hash: 'SHA-256';
    iterations: 600000;
    salt: string; // base64, 16 octets minimum
  };
  cipher: {
    name: 'AES-GCM';
    keyLength: 256;
    iv: string; // base64, 12 octets
    tagLength: 128;
  };
  payloadEncoding: 'base64';
}

export interface EncryptedBackupContainerV1 extends EncryptedBackupHeaderV1 {
  payload: string; // résultat AES-GCM, tag inclus, encodé en base64
}

export function isValidEncryptedContainerHeader(obj: any): obj is EncryptedBackupHeaderV1 {
  if (!obj || typeof obj !== 'object') return false;
  if (obj.product !== 'samtech-crm' || obj.containerVersion !== 1 || obj.encrypted !== true) return false;
  if (typeof obj.createdAt !== 'string' || Number.isNaN(Date.parse(obj.createdAt))) return false;
  
  if (!obj.kdf || obj.kdf.name !== 'PBKDF2' || obj.kdf.hash !== 'SHA-256' || obj.kdf.iterations !== 600000) return false;
  if (typeof obj.kdf.salt !== 'string' || obj.kdf.salt.length < 22) return false; // 16 bytes base64 is ~22-24 chars
  
  if (!obj.cipher || obj.cipher.name !== 'AES-GCM' || obj.cipher.keyLength !== 256 || obj.cipher.tagLength !== 128) return false;
  if (typeof obj.cipher.iv !== 'string' || obj.cipher.iv.length < 16) return false; // 12 bytes base64 is 16 chars

  if (obj.payloadEncoding !== 'base64') return false;

  return true;
}

export function isValidEncryptedContainer(obj: unknown): obj is EncryptedBackupContainerV1 {
  if (!isValidEncryptedContainerHeader(obj)) return false;
  const payload = (obj as unknown as { payload?: unknown }).payload;
  return typeof payload === 'string' && payload.length > 0;
}
