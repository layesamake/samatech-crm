import Dexie from 'dexie';
import { ContactRecord, ContactTagRecord, NoteRecord, ProspectInterestRecord, ProspectProfileRecord, TagRecord } from '../../modules/prospects/domain/prospect';

import { SequenceRecord, SettingsRecord } from '../../modules/settings/domain/settings';
import { LocationRecord } from '../../modules/locations/domain/location';
import { CategoryRecord, ProductRecord } from '../../modules/catalog/domain/catalog';
import { FollowUpRecord, TimelineEventRecord } from '../../modules/follow-ups/domain/follow-up';
import { MessageTemplateRecord } from '../../modules/messages/domain/message-template';
import { ClientProfileRecord } from '../../modules/clients/domain/client';
import { InvoiceLineRecord, InvoiceRecord } from '../../modules/invoices/domain/invoice';
import { PaymentRecord } from '../../modules/payments/domain/payment';
import { CampaignRecord, CampaignRecipientRecord } from '../../modules/campaigns/domain/campaign';
import { SecuritySettingsRecord } from '../../modules/security/domain/security';
import { ExpenseRecord } from '../../modules/expenses/domain/expense';
import { TreasuryAccountRecord, TreasuryAllocationRecord, TreasuryOperationRecord } from '../../modules/treasury/domain/treasury';
import { ExpenseBudgetRecord } from '../../modules/treasury/domain/budget';
import { TreasuryForecastItemRecord } from '../../modules/treasury/domain/forecast';
import { CommercialDocumentRecord, CommercialDocumentLineRecord, CommercialDocumentLinkRecord } from '../../modules/commercial-documents/domain/commercial-document';

export const CURRENT_SCHEMA_VERSION = 13;

export class SamtechCRMDatabase extends Dexie {
  contacts!: Dexie.Table<ContactRecord, string>;
  prospectProfiles!: Dexie.Table<ProspectProfileRecord, string>;
  
  // V3 stores
  settings!: Dexie.Table<SettingsRecord, string>;
  sequences!: Dexie.Table<SequenceRecord, string>;
  locations!: Dexie.Table<LocationRecord, string>;
  categories!: Dexie.Table<CategoryRecord, string>;
  products!: Dexie.Table<ProductRecord, string>;
  prospectInterests!: Dexie.Table<ProspectInterestRecord, string>;
  followUps!: Dexie.Table<FollowUpRecord, string>;
  messageTemplates!: Dexie.Table<MessageTemplateRecord, string>;
  timelineEvents!: Dexie.Table<TimelineEventRecord, string>;
  clientProfiles!: Dexie.Table<ClientProfileRecord, string>;
  tags!: Dexie.Table<TagRecord, string>;
  contactTags!: Dexie.Table<ContactTagRecord, string>;
  notes!: Dexie.Table<NoteRecord, string>;
  invoices!: Dexie.Table<InvoiceRecord, string>;
  invoiceLines!: Dexie.Table<InvoiceLineRecord, string>;
  payments!: Dexie.Table<PaymentRecord, string>;
  campaigns!: Dexie.Table<CampaignRecord, string>;
  campaignRecipients!: Dexie.Table<CampaignRecipientRecord, string>;
  securitySettings!: Dexie.Table<SecuritySettingsRecord, string>;
  expenses!: Dexie.Table<ExpenseRecord, string>;
  treasuryAccounts!: Dexie.Table<TreasuryAccountRecord, string>;
  treasuryAllocations!: Dexie.Table<TreasuryAllocationRecord, string>;
  treasuryOperations!: Dexie.Table<TreasuryOperationRecord, string>;
  expenseBudgets!: Dexie.Table<ExpenseBudgetRecord, string>;
  treasuryForecastItems!: Dexie.Table<TreasuryForecastItemRecord, string>;
  commercialDocuments!: Dexie.Table<CommercialDocumentRecord, string>;
  commercialDocumentLines!: Dexie.Table<CommercialDocumentLineRecord, string>;
  commercialDocumentLinks!: Dexie.Table<CommercialDocumentLinkRecord, string>;

  constructor(name = 'SamtechCRMDatabase') {
    super(name);
    
    // Initial schema (version 1 is empty, version 2 adds prospects tables)
    this.version(1).stores({});
    
    this.version(2).stores({
      contacts: 'id, normalizedWhatsappPhone, displayName, locationId, source, createdAt, updatedAt, archivedAt',
      prospectProfiles: 'id, &contactId, status, interestLevel, firstContactDate, convertedAt, lastStatusChangedAt, archivedAt, [status+interestLevel]'
    });

    this.version(3).stores({
      settings: '&key, updatedAt',
      sequences: '&key, updatedAt',
      locations: 'id, name, normalizedName, level, parentId, archivedAt, [parentId+level], [parentId+normalizedName]',
      categories: 'id, name, normalizedName, archivedAt',
      products: 'id, name, normalizedName, type, categoryId, sku, isActive, archivedAt, [categoryId+isActive]',
      prospectInterests: 'id, prospectProfileId, productId, interestLevel, requestedAt, archivedAt, [prospectProfileId+productId], [productId+requestedAt]'
    });

    this.version(4).stores({
      followUps: 'id, contactId, channel, dueAt, priority, status, completedAt, previousFollowUpId, archivedAt, [status+dueAt], [contactId+status]',
      messageTemplates: 'id, name, category, isActive, archivedAt, [category+isActive]',
      timelineEvents: 'id, contactId, type, occurredAt, sourceEntityId, [contactId+occurredAt], [sourceEntityType+sourceEntityId]',
    });

    this.version(5).stores({
      clientProfiles: 'id, &contactId, convertedAt, clientNumber, lastPurchaseAt, archivedAt',
    });

    this.version(6).stores({
      tags: 'id, &normalizedName, name, archivedAt',
      contactTags: 'id, contactId, tagId, &[contactId+tagId]',
      notes: 'id, contactId, pinned, createdAt, updatedAt, archivedAt, [contactId+createdAt]',
    });

    this.version(7).stores({
      invoices: 'id, &number, clientProfileId, status, issueDate, dueDate, issuedAt, archivedAt, [clientProfileId+issueDate], [status+dueDate]',
      invoiceLines: 'id, invoiceId, productId, position, [invoiceId+position], [productId+createdAt]',
    });

    this.version(8).stores({
      payments: 'id, invoiceId, clientProfileId, paymentDate, method, status, createdAt, [invoiceId+status], [clientProfileId+paymentDate]',
    });

    this.version(9).stores({
      campaigns: 'id, name, status, audienceType, launchedAt, completedAt, createdAt, archivedAt, [status+createdAt]',
      campaignRecipients: 'id, campaignId, contactId, status, position, normalizedPhoneSnapshot, &[campaignId+contactId], [campaignId+status], [campaignId+position]',
    });

    this.version(10).stores({
      securitySettings: '&id, updatedAt',
    });

    this.version(11).stores({
      expenses: 'id, expenseDate, status, category, [status+expenseDate]',
    });

    this.version(12).stores({
      treasuryAccounts: 'id, type, normalizedName, archivedAt',
      treasuryAllocations: 'id, accountId, sourceType, sourceId, status, cancelledAt, [accountId+status], [sourceType+sourceId]',
      treasuryOperations: 'id, accountId, kind, status, operationDate, sourceAccountId, destinationAccountId, cancelledAt, [accountId+status+operationDate], [status+operationDate]',
      expenseBudgets: 'id, status, startDate, endDate, [status+startDate]',
      treasuryForecastItems: 'id, type, expectedDate, status, [status+expectedDate]'
    });

    this.version(13).stores({
      commercialDocuments: 'id, type, status, &number, clientProfileId, issueDate, validUntil, deliveryDate, legacyInvoiceId, [type+status], [clientProfileId+issueDate]',
      commercialDocumentLines: 'id, documentId, position, productId, sourceLineId, [documentId+position], [sourceEntityType+sourceLineId]',
      commercialDocumentLinks: 'id, relation, sourceId, targetId, [sourceType+sourceId], [targetType+targetId]'
    }).upgrade(async (tx) => {
      const invoices = await tx.table('invoices').toArray();
      const estimates = invoices.filter((inv) => (inv as Record<string, unknown>).type === 'ESTIMATE');
      
      const docPromises = estimates.map(async (estimate) => {
        const id = estimate.id;
        
        const document = {
          ...estimate,
          type: 'LEGACY_ESTIMATE',
          legacyInvoiceId: id,
          legacyNumber: estimate.number,
        };
        delete document.type;
        document.type = 'LEGACY_ESTIMATE';
        
        const lines = await tx.table('invoiceLines').where('invoiceId').equals(id).toArray();
        const docLines = lines.map((line: Record<string, unknown>) => {
          const docLine = { ...line, documentId: document.id };
          delete docLine.invoiceId;
          return docLine;
        });
        
        await tx.table('commercialDocuments').put(document);
        await tx.table('commercialDocumentLines').bulkPut(docLines);
      });
      
      await Promise.all(docPromises);
      
      const estimateIds = estimates.map((e) => e.id);
      if (estimateIds.length > 0) {
        await tx.table('invoices').bulkDelete(estimateIds);
        const allLines = await tx.table('invoiceLines').toArray();
        const linesToDelete = allLines.filter((l: Record<string, unknown>) => estimateIds.includes(l.invoiceId as string)).map((l: Record<string, unknown>) => l.id);
        await tx.table('invoiceLines').bulkDelete(linesToDelete);
      }
    });
  }
}

export const db = new SamtechCRMDatabase();
