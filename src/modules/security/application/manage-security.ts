import {
  DEFAULT_AUTO_LOCK_MINUTES,
  derivePin,
  FORGOT_PIN_PHRASE,
  isAutoLockValue,
  LOCAL_SECURITY_ID,
  lockoutDurationMs,
  PIN_ALGORITHM_VERSION,
  SecuritySettingsRecord,
  constantTimeEqual,
  validatePin,
} from '../domain/security';

export interface SecurityRepository {
  get(): Promise<SecuritySettingsRecord | null>;
  save(settings: SecuritySettingsRecord): Promise<void>;
  delete(): Promise<void>;
  resetAllLocalData(): Promise<void>;
}

export type PinVerification =
  | { ok: true }
  | { ok: false; failedAttempts: number; lockedUntil?: string };

export class ManageSecurityUseCase {
  constructor(
    private readonly repository: SecurityRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async getSettings(): Promise<SecuritySettingsRecord | null> {
    return this.repository.get();
  }

  async enable(pin: string, confirmation: string, autoLockMinutes = DEFAULT_AUTO_LOCK_MINUTES): Promise<void> {
    if (pin !== confirmation) throw new Error('La confirmation du PIN ne correspond pas.');
    validatePin(pin);
    if (!isAutoLockValue(autoLockMinutes)) throw new Error('Le délai de verrouillage est invalide.');
    const material = await derivePin(pin);
    await this.repository.save({
      id: LOCAL_SECURITY_ID,
      pinEnabled: true,
      pinHash: material.hash,
      pinSalt: material.salt,
      pinAlgorithmVersion: material.algorithmVersion,
      failedAttempts: 0,
      autoLockMinutes,
      updatedAt: this.now().toISOString(),
    });
  }

  async verify(pin: string): Promise<PinVerification> {
    const settings = await this.repository.get();
    if (!settings?.pinEnabled) return { ok: true };
    const now = this.now();
    if (settings.lockedUntil && new Date(settings.lockedUntil).getTime() > now.getTime()) {
      return { ok: false, failedAttempts: settings.failedAttempts, lockedUntil: settings.lockedUntil };
    }
    if (!settings.pinHash || !settings.pinSalt || settings.pinAlgorithmVersion !== PIN_ALGORITHM_VERSION) {
      throw new Error('Les paramètres du PIN sont incompatibles.');
    }
    let candidateHash = '';
    try {
      candidateHash = (await derivePin(pin, settings.pinSalt)).hash;
    } catch {
      candidateHash = '';
    }
    if (constantTimeEqual(candidateHash, settings.pinHash)) {
      await this.repository.save({ ...settings, failedAttempts: 0, lockedUntil: undefined, updatedAt: now.toISOString() });
      return { ok: true };
    }
    const failedAttempts = settings.failedAttempts + 1;
    const delay = lockoutDurationMs(failedAttempts);
    const lockedUntil = delay > 0 ? new Date(now.getTime() + delay).toISOString() : undefined;
    await this.repository.save({ ...settings, failedAttempts, lockedUntil, updatedAt: now.toISOString() });
    return { ok: false, failedAttempts, lockedUntil };
  }

  async change(currentPin: string, newPin: string, confirmation: string): Promise<void> {
    const verified = await this.verify(currentPin);
    if (!verified.ok) throw new Error('Le PIN actuel est incorrect.');
    const settings = await this.repository.get();
    if (!settings?.pinEnabled) throw new Error('Aucun PIN actif.');
    if (newPin !== confirmation) throw new Error('La confirmation du nouveau PIN ne correspond pas.');
    validatePin(newPin);
    const material = await derivePin(newPin);
    await this.repository.save({
      ...settings,
      pinHash: material.hash,
      pinSalt: material.salt,
      pinAlgorithmVersion: material.algorithmVersion,
      failedAttempts: 0,
      lockedUntil: undefined,
      updatedAt: this.now().toISOString(),
    });
  }

  async disable(currentPin: string): Promise<void> {
    const verified = await this.verify(currentPin);
    if (!verified.ok) throw new Error('Le PIN actuel est incorrect.');
    await this.repository.delete();
  }

  async setAutoLockMinutes(minutes: number): Promise<void> {
    if (!isAutoLockValue(minutes)) throw new Error('Le délai de verrouillage est invalide.');
    const settings = await this.repository.get();
    if (!settings?.pinEnabled) throw new Error('Activez d’abord le PIN.');
    await this.repository.save({ ...settings, autoLockMinutes: minutes, updatedAt: this.now().toISOString() });
  }

  async forgotPinReset(confirmationPhrase: string): Promise<void> {
    if (confirmationPhrase !== FORGOT_PIN_PHRASE) {
      throw new Error(`Saisissez exactement « ${FORGOT_PIN_PHRASE} ».`);
    }
    await this.repository.resetAllLocalData();
  }
}

