import { describe, expect, it } from 'vitest';
import { ManageSecurityUseCase, SecurityRepository } from '../application/manage-security';
import { derivePin, FORGOT_PIN_PHRASE, SecuritySettingsRecord } from '../domain/security';

class MemorySecurityRepository implements SecurityRepository {
  settings: SecuritySettingsRecord | null = null;
  resetCount = 0;
  async get() { return this.settings ? { ...this.settings } : null; }
  async save(settings: SecuritySettingsRecord) { this.settings = { ...settings }; }
  async delete() { this.settings = null; }
  async resetAllLocalData() { this.settings = null; this.resetCount += 1; }
}

describe('Sécurité locale par PIN', () => {
  it('refuse les formats invalides et une confirmation différente', async () => {
    const useCase = new ManageSecurityUseCase(new MemorySecurityRepository());
    await expect(useCase.enable('123', '123')).rejects.toThrow('4 à 6');
    await expect(useCase.enable('12a4', '12a4')).rejects.toThrow('4 à 6');
    await expect(useCase.enable('1234', '4321')).rejects.toThrow('confirmation');
  });

  it('stocke uniquement une dérivation salée et accepte le bon PIN', async () => {
    const repository = new MemorySecurityRepository();
    const useCase = new ManageSecurityUseCase(repository);
    await useCase.enable('2486', '2486');
    expect(JSON.stringify(repository.settings)).not.toContain('2486');
    expect(repository.settings?.pinHash).toBeTruthy();
    expect(repository.settings?.pinSalt).toBeTruthy();
    await expect(useCase.verify('2486')).resolves.toEqual({ ok: true });
  });

  it('produit des dérivations différentes avec deux sels aléatoires', async () => {
    const first = await derivePin('2486');
    const second = await derivePin('2486');
    expect(first.salt).not.toBe(second.salt);
    expect(first.hash).not.toBe(second.hash);
  });

  it('incrémente les échecs, temporise au cinquième et remet à zéro après succès', async () => {
    let current = new Date('2026-07-18T10:00:00.000Z');
    const repository = new MemorySecurityRepository();
    const useCase = new ManageSecurityUseCase(repository, () => current);
    await useCase.enable('2486', '2486');
    for (let index = 1; index <= 4; index += 1) {
      await expect(useCase.verify('1111')).resolves.toMatchObject({ ok: false, failedAttempts: index });
    }
    const fifth = await useCase.verify('1111');
    expect(fifth).toMatchObject({ ok: false, failedAttempts: 5 });
    expect(fifth.ok || fifth.lockedUntil).toBeTruthy();
    current = new Date('2026-07-18T10:00:31.000Z');
    await expect(useCase.verify('2486')).resolves.toEqual({ ok: true });
    expect(repository.settings?.failedAttempts).toBe(0);
  });

  it('modifie et désactive le PIN après vérification', async () => {
    const repository = new MemorySecurityRepository();
    const useCase = new ManageSecurityUseCase(repository);
    await useCase.enable('2486', '2486');
    await useCase.change('2486', '1357', '1357');
    expect((await useCase.verify('2486')).ok).toBe(false);
    expect((await useCase.verify('1357')).ok).toBe(true);
    await useCase.disable('1357');
    expect(repository.settings).toBeNull();
  });

  it('refuse la réinitialisation sans phrase exacte puis efface avec la phrase exacte', async () => {
    const repository = new MemorySecurityRepository();
    const useCase = new ManageSecurityUseCase(repository);
    await useCase.enable('2486', '2486');
    await expect(useCase.forgotPinReset('effacer')).rejects.toThrow('exactement');
    expect(repository.resetCount).toBe(0);
    await useCase.forgotPinReset(FORGOT_PIN_PHRASE);
    expect(repository.resetCount).toBe(1);
    expect(repository.settings).toBeNull();
  });
});
