import Dexie from 'dexie';
import { db } from '@/infrastructure/database/db';
import type { TimelineEventRecord } from '@/modules/follow-ups/domain/follow-up';
import { buildWhatsAppUrl, MessageTemplateRecord } from '@/modules/messages/domain/message-template';
import type { ContactSource, InterestLevel, ProspectStatus } from '@/modules/prospects/domain/prospect';
import {
  assertCampaignCanBeReady,
  buildCampaignPreview,
  calculateCampaignProgress,
  CampaignAudienceType,
  CampaignDraftInput,
  CampaignErrorCode,
  CampaignPreview,
  CampaignProgress,
  CampaignRecipientRecord,
  CampaignRecord,
  CampaignSegmentationData,
  CampaignStatus,
} from '../domain/campaign';

export interface CampaignAggregate { campaign: CampaignRecord; recipients: CampaignRecipientRecord[]; progress: CampaignProgress; template?: { name: string; archived: boolean }; }
export interface CampaignListCriteria { query?: string; status?: CampaignStatus; audienceType?: CampaignAudienceType; from?: string; to?: string; sort?: 'RECENT' | 'NAME'; }
export interface CampaignFormOptions {
  locations: Array<{ id: string; name: string; level: string }>;
  products: Array<{ id: string; name: string }>;
  tags: Array<{ id: string; name: string }>;
  templates: MessageTemplateRecord[];
  prospectStatuses: ProspectStatus[];
  interestLevels: InterestLevel[];
  sources: ContactSource[];
}

function normalize(value: string): string { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr'); }

export class DexieCampaignRepository {
  private async segmentationData(): Promise<CampaignSegmentationData> {
    const [contacts, prospectProfiles, clientProfiles, locations, products, prospectInterests, tags, contactTags, invoices, invoiceLines, timelineEvents] = await Promise.all([
      db.contacts.toArray(), db.prospectProfiles.toArray(), db.clientProfiles.toArray(), db.locations.toArray(), db.products.toArray(), db.prospectInterests.toArray(), db.tags.toArray(), db.contactTags.toArray(), db.invoices.toArray(), db.invoiceLines.toArray(), db.timelineEvents.toArray(),
    ]);
    return { contacts, prospectProfiles, clientProfiles, locations, products, prospectInterests, tags, contactTags, invoices, invoiceLines, timelineEvents };
  }

  private async companyName(): Promise<string | undefined> {
    const setting = await db.settings.get('company.profile');
    const value = setting?.value as { name?: string } | undefined;
    return value?.name?.trim() || undefined;
  }

  async preview(input: CampaignDraftInput): Promise<CampaignPreview> { return buildCampaignPreview(input, await this.segmentationData(), await this.companyName()); }

  async formOptions(): Promise<CampaignFormOptions> {
    const [locations, products, tags, templates] = await Promise.all([
      db.locations.filter((item) => !item.archivedAt).sortBy('name'), db.products.filter((item) => item.isActive && !item.archivedAt).sortBy('name'), db.tags.filter((item) => !item.archivedAt).sortBy('name'), db.messageTemplates.filter((item) => item.isActive && !item.archivedAt).sortBy('name'),
    ]);
    return {
      locations: locations.map(({ id, name, level }) => ({ id, name, level })), products: products.map(({ id, name }) => ({ id, name })), tags: tags.map(({ id, name }) => ({ id, name })), templates,
      prospectStatuses: ['NOUVEAU', 'CONTACTE', 'INTERESSE', 'A_RELANCER', 'NEGOCIATION', 'CONVERTI', 'PERDU'], interestLevels: ['NON_QUALIFIE', 'FROID', 'TIEDE', 'CHAUD'], sources: ['WHATSAPP', 'FACEBOOK', 'INSTAGRAM', 'LINKEDIN', 'WEBSITE', 'REFERRAL', 'EVENT', 'MANUAL', 'OTHER'],
    };
  }

  async create(input: CampaignDraftInput, now: string): Promise<CampaignRecord> {
    const item: CampaignRecord = { id: crypto.randomUUID(), name: input.name.trim(), objective: input.objective?.trim() || undefined, status: 'BROUILLON', audienceType: input.audienceType, criteria: input.criteria, messageTemplateId: input.messageTemplateId || undefined, messageSnapshot: input.messageSnapshot, createdAt: now, updatedAt: now };
    await db.campaigns.add(item); return item;
  }

  async update(id: string, input: CampaignDraftInput, now: string): Promise<CampaignRecord> {
    const current = await db.campaigns.get(id); if (!current) throw new Error('Campagne introuvable');
    if (current.status !== 'BROUILLON' && current.status !== 'PRETE') throw new Error('Cette campagne est immuable');
    const updated: CampaignRecord = { ...current, ...input, objective: input.objective?.trim() || undefined, messageTemplateId: input.messageTemplateId || undefined, status: 'BROUILLON', updatedAt: now };
    await db.campaigns.put(updated); return updated;
  }

  async list(criteria: CampaignListCriteria = {}): Promise<CampaignAggregate[]> {
    const values = await db.campaigns.toArray(); const query = normalize(criteria.query ?? '');
    const filtered = values.filter((item) => !item.archivedAt && (!query || normalize(`${item.name} ${item.objective ?? ''}`).includes(query)) && (!criteria.status || item.status === criteria.status) && (!criteria.audienceType || item.audienceType === criteria.audienceType) && (!criteria.from || item.createdAt.slice(0, 10) >= criteria.from) && (!criteria.to || item.createdAt.slice(0, 10) <= criteria.to));
    const aggregates = await Promise.all(filtered.map((item) => this.get(item.id)));
    return aggregates.filter((item): item is CampaignAggregate => Boolean(item)).sort(criteria.sort === 'NAME' ? (a, b) => a.campaign.name.localeCompare(b.campaign.name, 'fr') || a.campaign.id.localeCompare(b.campaign.id) : (a, b) => b.campaign.createdAt.localeCompare(a.campaign.createdAt) || a.campaign.id.localeCompare(b.campaign.id));
  }

  async get(id: string): Promise<CampaignAggregate | null> {
    const campaign = await db.campaigns.get(id); if (!campaign) return null;
    const [recipientsValue, template] = await Promise.all([db.campaignRecipients.where('[campaignId+position]').between([id, Dexie.minKey], [id, Dexie.maxKey]).toArray(), campaign.messageTemplateId ? db.messageTemplates.get(campaign.messageTemplateId) : Promise.resolve(undefined)]);
    const recipients = recipientsValue.sort((a, b) => a.position - b.position || a.id.localeCompare(b.id));
    return { campaign, recipients, progress: calculateCampaignProgress(recipients), template: template ? { name: template.name, archived: Boolean(template.archivedAt || !template.isActive) } : undefined };
  }

  async markReady(id: string, now: string): Promise<CampaignRecord> {
    const current = await db.campaigns.get(id); if (!current) throw new Error('Campagne introuvable');
    const preview = await this.preview(current); assertCampaignCanBeReady(current, preview);
    const updated = { ...current, status: 'PRETE' as const, updatedAt: now }; await db.campaigns.put(updated); return updated;
  }

  async backToDraft(id: string, now: string): Promise<CampaignRecord> {
    const current = await db.campaigns.get(id); if (!current) throw new Error('Campagne introuvable'); if (current.status !== 'PRETE') throw new Error('Seule une campagne prête peut revenir en brouillon');
    const updated = { ...current, status: 'BROUILLON' as const, updatedAt: now }; await db.campaigns.put(updated); return updated;
  }

  async launch(id: string, now: string): Promise<CampaignAggregate> {
    const stores = [db.campaigns, db.campaignRecipients, db.contacts, db.prospectProfiles, db.clientProfiles, db.locations, db.products, db.prospectInterests, db.tags, db.contactTags, db.invoices, db.invoiceLines, db.timelineEvents, db.settings];
    await db.transaction('rw', stores, async () => {
      const current = await db.campaigns.get(id); if (!current) throw new Error('Campagne introuvable'); if (current.status !== 'PRETE') throw new Error('La campagne doit être prête avant son lancement');
      if (await db.campaignRecipients.where('campaignId').equals(id).count()) throw new Error('Cette campagne possède déjà une audience figée');
      const preview = buildCampaignPreview(current, await this.segmentationData(), await this.companyName());
      if (preview.unknownVariables.length || !preview.eligibleCount) throw new Error('L’audience ou le message n’est plus valide');
      const selected = preview.entries.filter((item) => item.eligible);
      const recipients: CampaignRecipientRecord[] = selected.map((entry, position) => ({ id: crypto.randomUUID(), campaignId: id, contactId: entry.contactId, normalizedPhoneSnapshot: entry.normalizedPhone, displayNameSnapshot: entry.displayName, resolvedMessageSnapshot: entry.resolvedMessage, position, status: 'A_TRAITER', createdAt: now, updatedAt: now }));
      await db.campaignRecipients.bulkAdd(recipients);
      await db.campaigns.put({ ...current, status: 'EN_COURS', launchedAt: now, updatedAt: now });
    });
    const result = await this.get(id); if (!result) throw new Error('Campagne introuvable après lancement'); return result;
  }

  async openWhatsApp(campaignId: string, recipientId: string, now: string): Promise<{ recipient: CampaignRecipientRecord; url: string }> {
    let result: CampaignRecipientRecord | undefined;
    await db.transaction('rw', [db.campaigns, db.campaignRecipients, db.timelineEvents], async () => {
      const campaign = await db.campaigns.get(campaignId); if (!campaign || campaign.status !== 'EN_COURS') throw new Error('La campagne n’est pas en cours');
      const recipient = await db.campaignRecipients.get(recipientId); if (!recipient || recipient.campaignId !== campaignId) throw new Error('Destinataire introuvable'); if (recipient.status !== 'A_TRAITER') throw new Error('Ce destinataire ne peut plus être ouvert');
      const updated: CampaignRecipientRecord = { ...recipient, status: 'OUVERT_DANS_WHATSAPP', openedAt: now, updatedAt: now };
      const event: TimelineEventRecord = { id: crypto.randomUUID(), contactId: recipient.contactId, type: 'WHATSAPP_OPENED', occurredAt: now, createdAt: now, sourceEntityType: 'CAMPAIGN_RECIPIENT', sourceEntityId: recipient.id, title: 'WhatsApp préparé depuis une campagne', summary: 'Ouverture assistée, sans confirmation d’envoi', payloadVersion: 1 };
      await db.campaignRecipients.put(updated); await db.timelineEvents.add(event); result = updated;
    });
    if (!result) throw new Error('Ouverture WhatsApp impossible'); return { recipient: result, url: buildWhatsAppUrl(result.normalizedPhoneSnapshot, result.resolvedMessageSnapshot) };
  }

  private async finalizeRecipient(campaignId: string, recipientId: string, status: 'CONFIRME_CONTACTE' | 'IGNORE' | 'ERREUR', now: string, note?: string, errorCode?: CampaignErrorCode): Promise<CampaignAggregate> {
    await db.transaction('rw', [db.campaigns, db.campaignRecipients, db.timelineEvents], async () => {
      const campaign = await db.campaigns.get(campaignId); if (!campaign || campaign.status !== 'EN_COURS') throw new Error('La campagne n’est pas en cours');
      const recipient = await db.campaignRecipients.get(recipientId); if (!recipient || recipient.campaignId !== campaignId) throw new Error('Destinataire introuvable');
      const allowed = status === 'CONFIRME_CONTACTE' ? recipient.status === 'OUVERT_DANS_WHATSAPP' : recipient.status === 'A_TRAITER' || recipient.status === 'OUVERT_DANS_WHATSAPP';
      if (!allowed) throw new Error('Transition de destinataire interdite'); if (status === 'ERREUR' && !errorCode) throw new Error('Le code d’erreur est obligatoire');
      const updated: CampaignRecipientRecord = { ...recipient, status, confirmedAt: status === 'CONFIRME_CONTACTE' ? now : recipient.confirmedAt, errorCode: status === 'ERREUR' ? errorCode : undefined, resultNote: note?.trim() || undefined, updatedAt: now };
      await db.campaignRecipients.put(updated);
      if (status === 'CONFIRME_CONTACTE') {
        const event: TimelineEventRecord = { id: crypto.randomUUID(), contactId: recipient.contactId, type: 'CAMPAIGN_PROCESSED', occurredAt: now, createdAt: now, sourceEntityType: 'CAMPAIGN_RECIPIENT', sourceEntityId: recipient.id, title: `Contact confirmé — ${campaign.name}`, summary: note?.trim() ? 'Résultat manuel enregistré' : 'Contact confirmé manuellement', payloadVersion: 1 };
        await db.timelineEvents.add(event);
      }
      const all = await db.campaignRecipients.where('campaignId').equals(campaignId).toArray(); const progress = calculateCampaignProgress(all.map((item) => item.id === recipientId ? updated : item));
      if (progress.total > 0 && progress.finalized === progress.total) await db.campaigns.put({ ...campaign, status: 'TERMINEE', completedAt: now, updatedAt: now });
    });
    const result = await this.get(campaignId); if (!result) throw new Error('Campagne introuvable après traitement'); return result;
  }

  confirm(campaignId: string, recipientId: string, now: string, note?: string) { return this.finalizeRecipient(campaignId, recipientId, 'CONFIRME_CONTACTE', now, note); }
  ignore(campaignId: string, recipientId: string, now: string, note?: string) { return this.finalizeRecipient(campaignId, recipientId, 'IGNORE', now, note); }
  error(campaignId: string, recipientId: string, errorCode: CampaignErrorCode, now: string, note?: string) { return this.finalizeRecipient(campaignId, recipientId, 'ERREUR', now, note, errorCode); }

  async cancel(id: string, strongConfirmation: boolean, now: string): Promise<CampaignRecord> {
    const current = await db.campaigns.get(id); if (!current) throw new Error('Campagne introuvable'); if (current.status === 'TERMINEE' || current.status === 'ANNULEE') throw new Error('Cette campagne est immuable');
    if (current.status === 'EN_COURS' && !strongConfirmation) throw new Error('Confirmez explicitement l’annulation de la campagne en cours');
    const updated = { ...current, status: 'ANNULEE' as const, updatedAt: now }; await db.campaigns.put(updated); return updated;
  }
}
