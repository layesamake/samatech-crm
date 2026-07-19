import { WebCryptoService } from '../infrastructure/web-crypto-service';
import { isValidEncryptedContainerHeader } from '../domain/encrypted-backup';

describe('WebCryptoService', () => {
  const service = new WebCryptoService();
  const password = 'SuperSecretPassword123!';
  const clearText = JSON.stringify({ hello: 'world' });

  it('encrypts and decrypts correctly', async () => {
    // Encryption
    const container = await service.encryptContainer(clearText, password);
    
    expect(isValidEncryptedContainerHeader(container)).toBe(true);
    expect(container.payloadEncoding).toBe('base64');
    expect(container.payload).toBeTruthy();
    
    // Decryption
    const decryptedText = await service.decryptContainer(container, password);
    expect(decryptedText).toBe(clearText);
  });

  it('fails decryption with wrong password', async () => {
    const container = await service.encryptContainer(clearText, password);
    
    await expect(service.decryptContainer(container, 'WrongPassword!')).rejects.toThrow('Mot de passe incorrect ou fichier altéré');
  });

  it('fails decryption if container is altered', async () => {
    const container = await service.encryptContainer(clearText, password);
    
    // Alter the payload
    container.payload = container.payload.slice(0, -1) + 'A';
    
    await expect(service.decryptContainer(container, password)).rejects.toThrow('Mot de passe incorrect ou fichier altéré');
  });
});
