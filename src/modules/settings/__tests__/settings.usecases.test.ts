import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../../../infrastructure/database/db';
import { GetSettingsUseCase } from '../application/get-settings';
import { UpdateSettingsUseCase } from '../application/update-settings';
import { DexieSettingsRepository } from '../infrastructure/dexie-settings-repository';

describe('Sprint 2 - paramètres', () => {
  const repository = new DexieSettingsRepository();
  const getSettings = new GetSettingsUseCase(repository);
  const updateSettings = new UpdateSettingsUseCase(repository);
  beforeEach(async () => db.settings.clear());

  it('crée, lit, modifie et persiste le profil unique', async () => {
    await updateSettings.updateCompanyProfile({ name: 'SAMTECH', phone: '+221770000000', currencyCode: 'XOF', currencySymbol: 'FCFA' });
    await updateSettings.updateCompanyProfile({ name: 'SAMTECH CRM', phone: '+221770000000', currencyCode: 'EUR', currencySymbol: '€' });
    expect(await db.settings.where('key').equals('company.profile').count()).toBe(1);
    expect((await getSettings.getCompanyProfile())?.name).toBe('SAMTECH CRM');
    expect((await new GetSettingsUseCase(new DexieSettingsRepository()).getCompanyProfile())?.currencyCode).toBe('EUR');
  });

  it('refuse une devise et un préfixe invalides sans consommer la séquence', async () => {
    await expect(updateSettings.updateCompanyProfile({ name: 'SAMTECH', phone: '+221', currencyCode: 'franc', currencySymbol: 'F' })).rejects.toThrow();
    await expect(updateSettings.updateInvoiceSettings({ currencyCode: 'XOF', prefix: '  ', nextValue: 1, enableTaxes: false })).rejects.toThrow();
    expect(await db.settings.count()).toBe(0);
    expect(await db.sequences.count()).toBe(0);
  });

  it('enregistre les réglages préparatoires sans activer arbitrairement la TVA', async () => {
    await updateSettings.updateInvoiceSettings({ currencyCode: 'XOF', prefix: 'FACT-', nextValue: 7, enableTaxes: false });
    expect(await getSettings.getInvoiceSettings()).toEqual({ currencyCode: 'XOF', prefix: 'FACT-', nextValue: 7, enableTaxes: false });
  });
});
