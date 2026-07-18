import { db } from '@/infrastructure/database/db';
import { currencyScaleFor } from '@/modules/invoices/domain/invoice';
import type { CompanyProfile, InvoiceSettings } from '@/modules/settings/domain/settings';
import type { StatisticsData } from '../domain/statistics';

export interface StatisticsSnapshot {
  data: StatisticsData;
  primaryCurrency: string;
  primaryCurrencyScale: number;
}

export interface StatisticsReadRepository {
  loadSnapshot(): Promise<StatisticsSnapshot>;
}

export class DexieStatisticsReadRepository implements StatisticsReadRepository {
  async loadSnapshot(): Promise<StatisticsSnapshot> {
    const [contacts, prospectProfiles, clientProfiles, locations, products, prospectInterests, followUps, invoices, invoiceLines, payments, campaigns, campaignRecipients, companyRecord, invoiceSettingsRecord] = await Promise.all([
      db.contacts.toArray(), db.prospectProfiles.toArray(), db.clientProfiles.toArray(), db.locations.toArray(), db.products.toArray(),
      db.prospectInterests.toArray(), db.followUps.toArray(), db.invoices.toArray(), db.invoiceLines.toArray(), db.payments.toArray(),
      db.campaigns.toArray(), db.campaignRecipients.toArray(), db.settings.get('company.profile'), db.settings.get('invoice.settings'),
    ]);
    const company = companyRecord?.value as CompanyProfile | undefined;
    const invoiceSettings = invoiceSettingsRecord?.value as InvoiceSettings | undefined;
    const primaryCurrency = company?.currencyCode || invoiceSettings?.currencyCode || 'XOF';
    return {
      data: { contacts, prospectProfiles, clientProfiles, locations, products, prospectInterests, followUps, invoices, invoiceLines, payments, campaigns, campaignRecipients },
      primaryCurrency,
      primaryCurrencyScale: currencyScaleFor(primaryCurrency),
    };
  }
}
