import { z } from 'zod';
import type { TimelineEventRecord } from '@/modules/follow-ups/domain/follow-up';

export type UUID = string;
export type ISODateTime = string;
export type LocalDate = string;

export interface AuditFields {
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  archivedAt?: ISODateTime;
}

export const CONTACT_SOURCES = [
  'WHATSAPP',
  'FACEBOOK',
  'INSTAGRAM',
  'LINKEDIN',
  'WEBSITE',
  'REFERRAL',
  'EVENT',
  'MANUAL',
  'OTHER',
] as const;
export type ContactSource = (typeof CONTACT_SOURCES)[number];

export interface ContactRecord extends AuditFields {
  id: UUID;
  displayName: string;
  title?: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  jobTitle?: string;
  whatsappPhone: string;
  normalizedWhatsappPhone: string;
  secondaryPhone?: string;
  normalizedSecondaryPhone?: string;
  email?: string;
  locationId?: UUID;
  address?: string;
  source?: ContactSource;
  customSource?: string;
}

export const PROSPECT_STATUSES = [
  'NOUVEAU',
  'CONTACTE',
  'INTERESSE',
  'A_RELANCER',
  'NEGOCIATION',
  'CONVERTI',
  'PERDU',
] as const;
export type ProspectStatus = (typeof PROSPECT_STATUSES)[number];

export const INTEREST_LEVELS = [
  'NON_QUALIFIE',
  'FROID',
  'TIEDE',
  'CHAUD',
] as const;
export type InterestLevel = (typeof INTEREST_LEVELS)[number];

export interface ProspectProfileRecord extends AuditFields {
  id: UUID;
  contactId: UUID;
  status: ProspectStatus;
  interestLevel: InterestLevel;
  firstContactDate: LocalDate;
  lostReason?: string;
  convertedAt?: ISODateTime;
  lastStatusChangedAt: ISODateTime;
}

export interface ProspectInterestRecord extends AuditFields {
  id: UUID;
  prospectProfileId: UUID;
  productId: UUID;
  interestLevel?: InterestLevel;
  requestedAt: ISODateTime;
  note?: string;
}

export interface TagRecord extends AuditFields {
  id: UUID;
  name: string;
  normalizedName: string;
  color?: string;
}

export interface ContactTagRecord {
  id: UUID;
  contactId: UUID;
  tagId: UUID;
  createdAt: ISODateTime;
}

export interface NoteRecord extends AuditFields {
  id: UUID;
  contactId: UUID;
  content: string;
  pinned: boolean;
}

/**
 * Normalise un numéro de téléphone selon BR-011.
 * Supprime les espaces, tirets, parenthèses et préfixes de présentation locaux si possible.
 * Dans la V1, pour simplifier, on enlève simplement les caractères non numériques
 * et on peut traiter le + en tête.
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';
  // Garder uniquement les chiffres et le + initial s'il existe
  let normalized = phone.replace(/[^\d+]/g, '');
  
  // Convertir le préfixe 00 en +
  if (normalized.startsWith('00')) {
    normalized = '+' + normalized.substring(2).replace(/\+/g, '');
  } else if (normalized.startsWith('+')) {
    // Si plusieurs +, ne garder que le premier
    normalized = '+' + normalized.substring(1).replace(/\+/g, '');
  } else {
    normalized = normalized.replace(/\+/g, '');
  }
  return normalized;
}

/**
 * Zod Schema pour valider les données d'entrée lors de la création d'un prospect (BR-020, BR-006).
 */
export const CreateProspectSchema = z.object({
  displayName: z.string().trim().min(1, 'Le nom est obligatoire'),
  title: z.enum(['M.', 'Mme', 'Mlle']).optional().or(z.literal('')),
  firstName: z.string().trim().optional(),
  lastName: z.string().trim().optional(),
  companyName: z.string().trim().optional(),
  jobTitle: z.string().trim().optional(),
  whatsappPhone: z.string().trim().min(1, 'Le numéro WhatsApp est obligatoire'),
  secondaryPhone: z.string().trim().optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  locationId: z.string().uuid().optional().or(z.literal('')),
  address: z.string().trim().optional(),
  source: z.enum(CONTACT_SOURCES).optional().or(z.literal('')),
  customSource: z.string().trim().optional(),
  
  // Profil Prospect
  status: z.enum(PROSPECT_STATUSES).default('NOUVEAU'),
  interestLevel: z.enum(INTEREST_LEVELS).default('NON_QUALIFIE'),
  firstContactDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD)').optional(),
  notes: z.string().trim().optional(),

  // Associations produits
  productIds: z.array(z.string().uuid()).optional(),
});

export type CreateProspectInput = z.infer<typeof CreateProspectSchema>;
export type CreateProspectFormInput = z.input<typeof CreateProspectSchema>;

/**
 * Schema pour la modification d'un prospect
 */
export const UpdateProspectSchema = CreateProspectSchema.extend({
  status: z.enum(PROSPECT_STATUSES),
  interestLevel: z.enum(INTEREST_LEVELS),
  lostReason: z.string().trim().optional(),
});

export type UpdateProspectInput = z.infer<typeof UpdateProspectSchema>;
export type UpdateProspectFormInput = z.input<typeof UpdateProspectSchema>;

/**
 * Entité agglomérée pour le modèle métier riche utilisé par l'interface
 */
export interface Prospect {
  contact: ContactRecord;
  profile: ProspectProfileRecord;
  interests?: ProspectInterestRecord[];
  notes?: NoteRecord[];
  events?: TimelineEventRecord[];
}
