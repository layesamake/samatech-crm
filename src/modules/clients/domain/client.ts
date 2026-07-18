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

export interface ClientSearchCriteria {
  query?: string;
  locationId?: string;
  convertedFrom?: string;
  convertedTo?: string;
  showArchived?: boolean;
}
