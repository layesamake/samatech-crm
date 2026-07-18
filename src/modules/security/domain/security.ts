export const LOCAL_SECURITY_ID = 'local-security' as const;
export const PIN_ALGORITHM_VERSION = 1;
export const PIN_ITERATIONS = 210_000;
export const PIN_HASH = 'SHA-256' as const;
export const PIN_OUTPUT_BITS = 256;
export const DEFAULT_AUTO_LOCK_MINUTES = 5;
export const AUTO_LOCK_OPTIONS = [0, 1, 5, 15, 30] as const;
export const FORGOT_PIN_PHRASE = 'EFFACER MES DONNÉES';

export interface SecuritySettingsRecord {
  id: typeof LOCAL_SECURITY_ID;
  pinEnabled: boolean;
  pinHash?: string;
  pinSalt?: string;
  pinAlgorithmVersion?: number;
  failedAttempts: number;
  lockedUntil?: string;
  autoLockMinutes: number;
  updatedAt: string;
}

export interface PinMaterial {
  hash: string;
  salt: string;
  algorithmVersion: number;
}

export function validatePin(pin: string): void {
  if (!/^\d{4,6}$/.test(pin)) {
    throw new Error('Le PIN doit contenir uniquement 4 à 6 chiffres.');
  }
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

export async function derivePin(
  pin: string,
  saltBase64?: string,
  cryptoApi: Crypto = globalThis.crypto,
): Promise<PinMaterial> {
  validatePin(pin);
  const salt = saltBase64 ? base64ToBytes(saltBase64) : cryptoApi.getRandomValues(new Uint8Array(16));
  const key = await cryptoApi.subtle.importKey(
    'raw',
    new TextEncoder().encode(pin),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await cryptoApi.subtle.deriveBits(
    { name: 'PBKDF2', hash: PIN_HASH, salt: salt as BufferSource, iterations: PIN_ITERATIONS },
    key,
    PIN_OUTPUT_BITS,
  );
  return {
    hash: bytesToBase64(new Uint8Array(bits)),
    salt: bytesToBase64(salt),
    algorithmVersion: PIN_ALGORITHM_VERSION,
  };
}

export function constantTimeEqual(left: string, right: string): boolean {
  const length = Math.max(left.length, right.length);
  let difference = left.length ^ right.length;
  for (let index = 0; index < length; index += 1) {
    difference |= (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0);
  }
  return difference === 0;
}

export function lockoutDurationMs(failedAttempts: number): number {
  if (failedAttempts < 5) return 0;
  return Math.min(15 * 60_000, 30_000 * 2 ** (failedAttempts - 5));
}

export function isAutoLockValue(value: number): boolean {
  return AUTO_LOCK_OPTIONS.some((option) => option === value);
}

