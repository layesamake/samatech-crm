import { CompanyProfile, CompanyProfileSchema, InvoiceSettings, InvoiceSettingsSchema } from '../domain/settings';
import { DexieSettingsRepository } from '../infrastructure/dexie-settings-repository';

export class UpdateSettingsUseCase {
  constructor(private readonly repository: DexieSettingsRepository) {}

  async updateCompanyProfile(input: CompanyProfile): Promise<CompanyProfile> {
    const validated = CompanyProfileSchema.parse(input);
    await this.repository.save('company.profile', validated, 1);
    return validated;
  }

  async updateInvoiceSettings(input: InvoiceSettings): Promise<InvoiceSettings> {
    const validated = InvoiceSettingsSchema.parse(input);
    await this.repository.save('invoice.defaults', validated, 1);
    return validated;
  }
}
