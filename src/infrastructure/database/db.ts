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
  }
}

export const db = new SamtechCRMDatabase();
