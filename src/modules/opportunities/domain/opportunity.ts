import { z } from 'zod';

export const OPPORTUNITY_STAGES = [
  'NOUVEAU',
  'QUALIFIE',
  'PROPOSITION',
  'NEGOCIATION',
  'GAGNE',
  'PERDU'
] as const;
export type OpportunityStage = (typeof OPPORTUNITY_STAGES)[number];

export const OPPORTUNITY_STATUSES = ['OPEN', 'WON', 'LOST'] as const;
export type OpportunityStatus = (typeof OPPORTUNITY_STATUSES)[number];

export interface OpportunityRecord {
  id: string;
  contactId: string;
  title: string;
  valueMinor?: number;
  currency?: string;
  stage: OpportunityStage;
  probability?: number;
  expectedCloseDate?: string;
  status: OpportunityStatus;
  lostReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
}

export const CreateOpportunitySchema = z.object({
  contactId: z.string().uuid('Le contact est invalide'),
  title: z.string().trim().min(1, 'Le titre est obligatoire'),
  valueMinor: z.number().int().min(0).optional(),
  currency: z.string().length(3).optional(),
  stage: z.enum(OPPORTUNITY_STAGES).default('NOUVEAU'),
  probability: z.number().int().min(0).max(100).optional(),
  expectedCloseDate: z.string().optional(),
  notes: z.string().trim().optional(),
});
export type CreateOpportunityInput = z.infer<typeof CreateOpportunitySchema>;

export const UpdateOpportunitySchema = CreateOpportunitySchema.extend({
  id: z.string().uuid(),
  status: z.enum(OPPORTUNITY_STATUSES),
  lostReason: z.string().trim().optional(),
});
export type UpdateOpportunityInput = z.infer<typeof UpdateOpportunitySchema>;
