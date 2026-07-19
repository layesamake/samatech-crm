import { EncryptedBackupHeaderV1, EncryptedBackupContainerV1 } from '../domain/encrypted-backup';

export class WebCryptoService {
  private base64ToBuffer(b64: string): Uint8Array {
    const binStr = atob(b64);
    const len = binStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binStr.charCodeAt(i);
    }
    return bytes;
  }

  private bufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private async deriveKey(password: string, salt: Uint8Array, iterations: number = 600000): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password.normalize('NFKC')),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  async encryptContainer(clearText: string, password: string): Promise<EncryptedBackupContainerV1> {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const header: EncryptedBackupHeaderV1 = {
      product: 'samtech-crm',
      containerVersion: 1,
      encrypted: true,
      createdAt: new Date().toISOString(),
      kdf: {
        name: 'PBKDF2',
        hash: 'SHA-256',
        iterations: 600000,
        salt: this.bufferToBase64(salt),
      },
      cipher: {
        name: 'AES-GCM',
        keyLength: 256,
        iv: this.bufferToBase64(iv),
        tagLength: 128,
      },
      payloadEncoding: 'base64',
    };

    const encoder = new TextEncoder();
    const aad = encoder.encode(JSON.stringify(header));
    const data = encoder.encode(clearText);

    const key = await this.deriveKey(password, salt, 600000);

    const encryptedContent = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv,
        additionalData: aad,
      },
      key,
      data
    );

    return {
      ...header,
      payload: this.bufferToBase64(encryptedContent),
    };
  }

  async decryptContainer(container: EncryptedBackupContainerV1, password: string): Promise<string> {
    const headerOnly = { ...container } as any;
    delete headerOnly.payload;
    const encoder = new TextEncoder();
    const aad = encoder.encode(JSON.stringify(headerOnly));

    const salt = this.base64ToBuffer(container.kdf.salt);
    const iv = this.base64ToBuffer(container.cipher.iv);
    const data = this.base64ToBuffer(container.payload);

    const key = await this.deriveKey(password, salt, container.kdf.iterations);

    try {
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv,
          additionalData: aad,
        },
        key,
        data
      );

      const decoder = new TextDecoder('utf-8', { fatal: true });
      return decoder.decode(decryptedBuffer);
    } catch (e: unknown) {
      // Pour éviter les fuites d'information, on donne toujours le même message.
      throw new Error('Mot de passe incorrect ou fichier altéré');
    }
  }
}
