import { z } from 'zod';
import type { ClientProfileRecord } from '@/modules/clients/domain/client';
import type { InvoiceLineRecord, InvoiceRecord } from '@/modules/invoices/domain/invoice';
import type { LocationRecord } from '@/modules/locations/domain/location';
import { ALLOWED_MESSAGE_VARIABLES, extractVariables, MessageVariable, resolveMessage } from '@/modules/messages/domain/message-template';
import type { ContactRecord, ContactSource, ContactTagRecord, InterestLevel, ProspectInterestRecord, ProspectProfileRecord, ProspectStatus, TagRecord } from '@/modules/prospects/domain/prospect';
import type { ProductRecord } from '@/modules/catalog/domain/catalog';
import type { TimelineEventRecord } from '@/modules/follow-ups/domain/follow-up';

export const CAMPAIGN_STATUSES = ['BROUILLON', 'PRETE', 'EN_COURS', 'TERMINEE', 'ANNULEE'] as const;
export const CAMPAIGN_AUDIENCES = ['PROSPECTS', 'CLIENTS', 'ALL_CONTACTS'] as const;
export const CAMPAIGN_RECIPIENT_STATUSES = ['A_TRAITER', 'OUVERT_DANS_WHATSAPP', 'CONFIRME_CONTACTE', 'IGNORE', 'ERREUR'] as const;
export const CAMPAIGN_ERROR_CODES = ['NUMERO_INJOIGNABLE', 'WHATSAPP_INDISPONIBLE', 'CONTACT_INDISPONIBLE', 'AUTRE'] as const;

export type CampaignStatus = typeof CAMPAIGN_STATUSES[number];
export type CampaignAudienceType = typeof CAMPAIGN_AUDIENCES[number];
export type CampaignRecipientStatus = typeof CAMPAIGN_RECIPIENT_STATUSES[number];
export type CampaignErrorCode = typeof CAMPAIGN_ERROR_CODES[number];

export interface CampaignCriteria {
  locationIds?: string[];
  productInterestIds?: string[];
  purchasedProductIds?: string[];
  prospectStatuses?: ProspectStatus[];
  interestLevels?: InterestLevel[];
  tagIds?: string[];
  sources?: ContactSource[];
  createdFrom?: string;
  createdTo?: string;
  inactiveSince?: string;
  excludedContactIds?: string[];
  allowEmptyVariableContactIds?: string[];
}

export interface CampaignRecord {
  id: string;
  name: string;
  objective?: string;
  status: CampaignStatus;
  audienceType: CampaignAudienceType;
  criteria: CampaignCriteria;
  messageTemplateId?: string;
  messageSnapshot: string;
  launchedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
}

export interface CampaignRecipientRecord {
  id: string;
  campaignId: string;
  contactId: string;
  normalizedPhoneSnapshot: string;
  displayNameSnapshot: string;
  resolvedMessageSnapshot: string;
  position: number;
  status: CampaignRecipientStatus;
  openedAt?: string;
  confirmedAt?: string;
  errorCode?: CampaignErrorCode;
  resultNote?: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
}

const OptionalIdArray = z.array(z.string().uuid()).optional();
const OptionalDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal(''));
export const CampaignCriteriaSchema = z.object({
  locationIds: OptionalIdArray,
  productInterestIds: OptionalIdArray,
  purchasedProductIds: OptionalIdArray,
  prospectStatuses: z.array(z.enum(['NOUVEAU', 'CONTACTE', 'INTERESSE', 'A_RELANCER', 'NEGOCIATION', 'CONVERTI', 'PERDU'])).optional(),
  interestLevels: z.array(z.enum(['NON_QUALIFIE', 'FROID', 'TIEDE', 'CHAUD'])).optional(),
  tagIds: OptionalIdArray,
  sources: z.array(z.enum(['WHATSAPP', 'FACEBOOK', 'INSTAGRAM', 'LINKEDIN', 'WEBSITE', 'REFERRAL', 'EVENT', 'MANUAL', 'OTHER'])).optional(),
  createdFrom: OptionalDate,
  createdTo: OptionalDate,
  inactiveSince: OptionalDate,
  excludedContactIds: OptionalIdArray,
  allowEmptyVariableContactIds: OptionalIdArray,
}).superRefine((value, context) => {
  if (value.createdFrom && value.createdTo && value.createdFrom > value.createdTo) context.addIssue({ code: 'custom', path: ['createdTo'], message: 'La fin de période doit suivre le début' });
});

export const CampaignDraftInputSchema = z.object({
  name: z.string().trim().min(1, 'Le nom est obligatoire').max(200),
  objective: z.string().trim().max(1000).optional(),
  audienceType: z.enum(CAMPAIGN_AUDIENCES),
  criteria: CampaignCriteriaSchema,
  messageTemplateId: z.string().uuid().optional().or(z.literal('')),
  messageSnapshot: z.string().max(5000),
});
export type CampaignDraftInput = z.infer<typeof CampaignDraftInputSchema>;

export interface CampaignSegmentationData {
  contacts: ContactRecord[];
  prospectProfiles: ProspectProfileRecord[];
  clientProfiles: ClientProfileRecord[];
  locations: LocationRecord[];
  products: ProductRecord[];
  prospectInterests: ProspectInterestRecord[];
  tags: TagRecord[];
  contactTags: ContactTagRecord[];
  invoices: InvoiceRecord[];
  invoiceLines: InvoiceLineRecord[];
  timelineEvents: TimelineEventRecord[];
}

export interface CampaignPreviewEntry {
  contactId: string;
  displayName: string;
  contactType: 'PROSPECT' | 'CLIENT';
  maskedPhone: string;
  normalizedPhone: string;
  locationName?: string;
  inclusionReasons: string[];
  exclusionReasons: string[];
  unresolvedVariables: MessageVariable[];
  resolvedMessage: string;
  eligible: boolean;
}

export interface CampaignPreview {
  rawCount: number;
  eligibleCount: number;
  invalidPhoneCount: number;
  archivedCount: number;
  duplicateCount: number;
  manualExclusionCount: number;
  unknownVariables: string[];
  entries: CampaignPreviewEntry[];
}

export interface CampaignProgress {
  total: number;
  pending: number;
  opened: number;
  confirmed: number;
  ignored: number;
  errors: number;
  finalized: number;
  processedPercent: number;
  confirmationPercent: number;
}

function ids(values: string[] | undefined): Set<string> { return new Set(values ?? []); }
function localDate(value: string): string { return value.slice(0, 10); }
function isValidPhone(value: string): boolean { const digits = value.replace(/\D/g, ''); return digits.length >= 8 && digits.length <= 15; }
export function maskPhone(value: string): string { const digits = value.replace(/\D/g, ''); return digits.length < 4 ? '••••' : `${digits.slice(0, 3)}••••${digits.slice(-2)}`; }

function locationScope(selected: string[], locations: LocationRecord[]): Set<string> {
  const result = new Set(selected);
  let changed = true;
  while (changed) {
    changed = false;
    for (const location of locations) if (location.parentId && result.has(location.parentId) && !result.has(location.id)) { result.add(location.id); changed = true; }
  }
  return result;
}

function latestActivity(contact: ContactRecord, events: TimelineEventRecord[]): string {
  return events.filter((event) => event.contactId === contact.id).reduce((latest, event) => event.occurredAt > latest ? event.occurredAt : latest, contact.createdAt);
}

export function buildCampaignPreview(input: CampaignDraftInput, data: CampaignSegmentationData, companyName?: string): CampaignPreview {
  const value = CampaignDraftInputSchema.parse(input);
  const unknownVariables = extractVariables(value.messageSnapshot).filter((variable) => !ALLOWED_MESSAGE_VARIABLES.includes(variable as MessageVariable));
  const prospectByContact = new Map(data.prospectProfiles.map((item) => [item.contactId, item]));
  const clientByContact = new Map(data.clientProfiles.map((item) => [item.contactId, item]));
  const locationById = new Map(data.locations.map((item) => [item.id, item]));
  const productById = new Map(data.products.map((item) => [item.id, item]));
  const interestsByProfile = new Map<string, ProspectInterestRecord[]>();
  for (const item of data.prospectInterests) interestsByProfile.set(item.prospectProfileId, [...(interestsByProfile.get(item.prospectProfileId) ?? []), item]);
  const tagsByContact = new Map<string, Set<string>>();
  for (const item of data.contactTags) tagsByContact.set(item.contactId, new Set([...(tagsByContact.get(item.contactId) ?? []), item.tagId]));
  const purchasedByClient = new Map<string, Set<string>>();
  const eligibleInvoiceIds = new Set(data.invoices.filter((item) => !item.archivedAt && ['EMISE', 'PARTIELLEMENT_PAYEE', 'PAYEE'].includes(item.status)).map((item) => item.id));
  const invoiceClient = new Map(data.invoices.map((item) => [item.id, item.clientProfileId]));
  for (const line of data.invoiceLines) if (!line.archivedAt && line.productId && eligibleInvoiceIds.has(line.invoiceId)) {
    const clientId = invoiceClient.get(line.invoiceId); if (clientId) purchasedByClient.set(clientId, new Set([...(purchasedByClient.get(clientId) ?? []), line.productId]));
  }
  const locationIds = locationScope(value.criteria.locationIds ?? [], data.locations);
  const manual = ids(value.criteria.excludedContactIds);
  const allowEmpty = ids(value.criteria.allowEmptyVariableContactIds);
  const wantedInterests = ids(value.criteria.productInterestIds); const wantedPurchases = ids(value.criteria.purchasedProductIds); const wantedTags = ids(value.criteria.tagIds);
  const entries: CampaignPreviewEntry[] = [];
  const contacts = [...data.contacts].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));

  for (const contact of contacts) {
    const prospect = prospectByContact.get(contact.id); const client = clientByContact.get(contact.id);
    const convertedClient = Boolean(client && prospect?.status === 'CONVERTI');
    let contactType: 'PROSPECT' | 'CLIENT' | null = null;
    if (value.audienceType === 'PROSPECTS' && prospect && !convertedClient) contactType = 'PROSPECT';
    if (value.audienceType === 'CLIENTS' && client) contactType = 'CLIENT';
    if (value.audienceType === 'ALL_CONTACTS') contactType = client ? 'CLIENT' : prospect ? 'PROSPECT' : null;
    if (!contactType) continue;

    const exclusionReasons: string[] = []; const inclusionReasons: string[] = [contactType === 'CLIENT' ? 'Client' : 'Prospect'];
    const profile = contactType === 'CLIENT' ? client : prospect;
    if (contact.archivedAt || profile?.archivedAt) exclusionReasons.push('Contact ou profil archivé');
    if (!isValidPhone(contact.normalizedWhatsappPhone)) exclusionReasons.push('Numéro WhatsApp absent ou invalide');
    const segmentationFailures: string[] = [];
    if (locationIds.size && (!contact.locationId || !locationIds.has(contact.locationId))) segmentationFailures.push('localité'); else if (locationIds.size) inclusionReasons.push('Localité correspondante');
    const contactInterests = prospect ? (interestsByProfile.get(prospect.id) ?? []).filter((item) => !item.archivedAt) : [];
    if (wantedInterests.size && !contactInterests.some((item) => wantedInterests.has(item.productId))) segmentationFailures.push('produit demandé'); else if (wantedInterests.size) inclusionReasons.push('Produit demandé');
    const purchases = client ? purchasedByClient.get(client.id) ?? new Set<string>() : new Set<string>();
    if (wantedPurchases.size && ![...wantedPurchases].some((id) => purchases.has(id))) segmentationFailures.push('produit acheté'); else if (wantedPurchases.size) inclusionReasons.push('Produit acheté');
    if (value.criteria.prospectStatuses?.length && (!prospect || !value.criteria.prospectStatuses.includes(prospect.status))) segmentationFailures.push('statut prospect'); else if (value.criteria.prospectStatuses?.length) inclusionReasons.push('Statut prospect');
    if (value.criteria.interestLevels?.length && (!prospect || !value.criteria.interestLevels.includes(prospect.interestLevel))) segmentationFailures.push('niveau d’intérêt'); else if (value.criteria.interestLevels?.length) inclusionReasons.push('Niveau d’intérêt');
    const contactTagIds = tagsByContact.get(contact.id) ?? new Set<string>();
    if (wantedTags.size && ![...wantedTags].some((id) => contactTagIds.has(id))) segmentationFailures.push('tag'); else if (wantedTags.size) inclusionReasons.push('Tag');
    if (value.criteria.sources?.length && (!contact.source || !value.criteria.sources.includes(contact.source))) segmentationFailures.push('source'); else if (value.criteria.sources?.length) inclusionReasons.push('Source');
    const created = localDate(contact.createdAt);
    if (value.criteria.createdFrom && created < value.criteria.createdFrom) segmentationFailures.push('date de création');
    if (value.criteria.createdTo && created > value.criteria.createdTo) segmentationFailures.push('date de création');
    if (value.criteria.inactiveSince && localDate(latestActivity(contact, data.timelineEvents)) > value.criteria.inactiveSince) segmentationFailures.push('activité trop récente'); else if (value.criteria.inactiveSince) inclusionReasons.push('Inactivité');
    if (segmentationFailures.length) exclusionReasons.push(`Ne correspond pas : ${segmentationFailures.join(', ')}`);
    if (manual.has(contact.id)) exclusionReasons.push('Exclusion manuelle');

    const productNames = [...new Set([...contactInterests.map((item) => productById.get(item.productId)?.name), ...[...purchases].map((id) => productById.get(id)?.name)].filter((name): name is string => Boolean(name)))];
    const resolution = resolveMessage(value.messageSnapshot, { prenom: contact.firstName, nom: contact.lastName, contact: contact.displayName, entreprise: contact.companyName, produits: productNames, localite: contact.locationId ? locationById.get(contact.locationId)?.name : undefined, nomEntreprise: companyName }, allowEmpty.has(contact.id));
    if (resolution.unresolved.length && !allowEmpty.has(contact.id)) exclusionReasons.push(`Variables manquantes : ${resolution.unresolved.join(', ')}`);
    entries.push({ contactId: contact.id, displayName: contact.displayName, contactType, maskedPhone: maskPhone(contact.normalizedWhatsappPhone), normalizedPhone: contact.normalizedWhatsappPhone, locationName: contact.locationId ? locationById.get(contact.locationId)?.name : undefined, inclusionReasons, exclusionReasons, unresolvedVariables: resolution.unresolved, resolvedMessage: resolution.text, eligible: exclusionReasons.length === 0 && unknownVariables.length === 0 });
  }

  const phoneOwner = new Map<string, CampaignPreviewEntry>();
  for (const entry of entries) if (entry.eligible) {
    const key = entry.normalizedPhone.replace(/\D/g, ''); const owner = phoneOwner.get(key);
    if (owner) { entry.exclusionReasons.push(`Numéro déjà retenu pour ${owner.displayName}`); entry.eligible = false; } else phoneOwner.set(key, entry);
  }
  return {
    rawCount: entries.length,
    eligibleCount: entries.filter((item) => item.eligible).length,
    invalidPhoneCount: entries.filter((item) => item.exclusionReasons.some((reason) => reason.includes('invalide'))).length,
    archivedCount: entries.filter((item) => item.exclusionReasons.some((reason) => reason.includes('archivé'))).length,
    duplicateCount: entries.filter((item) => item.exclusionReasons.some((reason) => reason.includes('déjà retenu'))).length,
    manualExclusionCount: entries.filter((item) => item.exclusionReasons.includes('Exclusion manuelle')).length,
    unknownVariables,
    entries,
  };
}

export function assertCampaignCanBeReady(campaign: CampaignRecord, preview: CampaignPreview): void {
  if (campaign.status !== 'BROUILLON') throw new Error('Seul un brouillon peut devenir prêt');
  if (!campaign.name.trim()) throw new Error('Le nom est obligatoire');
  if (!campaign.messageSnapshot.trim()) throw new Error('Le message est obligatoire');
  if (preview.unknownVariables.length) throw new Error(`Variables inconnues : ${preview.unknownVariables.join(', ')}`);
  if (!preview.eligibleCount) throw new Error('La campagne ne possède aucun destinataire admissible');
}

export function calculateCampaignProgress(recipients: readonly CampaignRecipientRecord[]): CampaignProgress {
  const total = recipients.length; const count = (status: CampaignRecipientStatus) => recipients.filter((item) => item.status === status).length;
  const confirmed = count('CONFIRME_CONTACTE'); const ignored = count('IGNORE'); const errors = count('ERREUR'); const finalized = confirmed + ignored + errors;
  return { total, pending: count('A_TRAITER'), opened: count('OUVERT_DANS_WHATSAPP'), confirmed, ignored, errors, finalized, processedPercent: total ? Math.round(finalized * 100 / total) : 0, confirmationPercent: total ? Math.round(confirmed * 100 / total) : 0 };
}

export function segmentationSummary(criteria: CampaignCriteria): string {
  const labels: string[] = [];
  if (criteria.locationIds?.length) labels.push(`${criteria.locationIds.length} localité(s)`);
  if (criteria.productInterestIds?.length) labels.push(`${criteria.productInterestIds.length} produit(s) demandé(s)`);
  if (criteria.purchasedProductIds?.length) labels.push(`${criteria.purchasedProductIds.length} produit(s) acheté(s)`);
  if (criteria.prospectStatuses?.length) labels.push(`statuts ${criteria.prospectStatuses.join(' ou ')}`);
  if (criteria.interestLevels?.length) labels.push(`intérêts ${criteria.interestLevels.join(' ou ')}`);
  if (criteria.tagIds?.length) labels.push(`${criteria.tagIds.length} tag(s)`);
  if (criteria.sources?.length) labels.push(`sources ${criteria.sources.join(' ou ')}`);
  if (criteria.createdFrom || criteria.createdTo) labels.push(`création ${criteria.createdFrom || 'origine'} → ${criteria.createdTo || 'aujourd’hui'}`);
  if (criteria.inactiveSince) labels.push(`inactif depuis le ${criteria.inactiveSince}`);
  return labels.length ? labels.join(' ET ') : 'Tous les contacts de l’audience';
}
