import { z } from 'zod';
import { ContactRecord, NoteRecord, ProspectInterestRecord, ProspectProfileRecord, TagRecord } from '@/modules/prospects/domain/prospect';
import { FollowUpRecord, TimelineEventRecord } from '@/modules/follow-ups/domain/follow-up';

export interface ClientProfileRecord {
  id: string;
  contactId: string;
  convertedAt: string;
  clientNumber?: string;
  lastPurchaseAt?: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
}

export interface ClientAggregate {
  contact: ContactRecord;
  profile: ClientProfileRecord;
  prospectProfile: ProspectProfileRecord;
  interests: ProspectInterestRecord[];
  productNames: string[];
  locationName?: string;
  events: TimelineEventRecord[];
  followUps: FollowUpRecord[];
  notes: NoteRecord[];
  tags: TagRecord[];
}

export const ConversionInputSchema = z.object({
  convertedAt: z.string().datetime({ offset: true, message: 'Date de conversion invalide' }),
});
export type ConversionInput = z.infer<typeof ConversionInputSchema>;

export const UpdateClientSchema = z.object({
  displayName: z.string().trim().min(1, 'Le nom est obligatoire'),
  firstName: z.string().trim().optional(),
  lastName: z.string().trim().optional(),
  companyName: z.string().trim().optional(),
  jobTitle: z.string().trim().optional(),
  whatsappPhone: z.string().trim().min(1, 'Le numéro WhatsApp est obligatoire'),
  secondaryPhone: z.string().trim().optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  locationId: z.string().uuid().optional().or(z.literal('')),
  address: z.string().trim().optional(),
  productIds: z.array(z.string().uuid()).optional(),
});
export type UpdateClientInput = z.infer<typeof UpdateClientSchema>;
export type UpdateClientFormInput = z.input<typeof UpdateClientSchema>;

export interface ClientSearchCriteria {
  query?: string;
  locationId?: string;
  convertedFrom?: string;
  convertedTo?: string;
  showArchived?: boolean;
}
