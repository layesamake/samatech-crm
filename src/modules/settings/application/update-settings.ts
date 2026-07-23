import { CompanyProfile, CompanyProfileSchema, InvoiceSettings, InvoiceSettingsSchema } from '../domain/settings';
import { DexieSettingsRepository } from '../infrastructure/dexie-settings-repository';
import { masterDb } from '@/infrastructure/database/master-db';
import { BusinessDatabaseManager } from '@/infrastructure/database/business-manager';

export class UpdateSettingsUseCase {
  constructor(private readonly repository: DexieSettingsRepository) {}

  async updateCompanyProfile(input: CompanyProfile): Promise<CompanyProfile> {
    const validated = CompanyProfileSchema.parse(input);
    await this.repository.save('company.profile', validated, 1);
    
    // Sync to Master DB for Business Switcher UI
    const activeBusinessId = BusinessDatabaseManager.getActiveBusinessId();
    if (activeBusinessId) {
      await masterDb.businesses.update(activeBusinessId, {
        name: validated.name || 'Sans Nom',
        logoBase64: validated.logoDataUri || undefined
      });
    }

    return validated;
  }

  async updateInvoiceSettings(input: InvoiceSettings): Promise<InvoiceSettings> {
    const validated = InvoiceSettingsSchema.parse(input);
    await this.repository.save('invoice.defaults', validated, 1);
    return validated;
  }
}
