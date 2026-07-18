import { CompanyProfile, InvoiceSettings } from '../domain/settings';
import { DexieSettingsRepository } from '../infrastructure/dexie-settings-repository';

export class GetSettingsUseCase {
  constructor(private readonly repository: DexieSettingsRepository) {}

  async getCompanyProfile(): Promise<CompanyProfile | null> {
    return this.repository.getByKey<CompanyProfile>('company.profile');
  }

  async getInvoiceSettings(): Promise<InvoiceSettings | null> {
    return this.repository.getByKey<InvoiceSettings>('invoice.defaults');
  }
}
