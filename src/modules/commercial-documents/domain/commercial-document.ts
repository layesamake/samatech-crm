import { z } from 'zod';
import { PartySnapshot } from '@/modules/invoices/domain/invoice';
import { DiscountType, DISCOUNT_TYPES } from '@/modules/invoices/domain/invoice';

export type CommercialDocumentType =
  | 'QUOTE'
  | 'PROFORMA'
  | 'DELIVERY_NOTE'
  | 'LEGACY_ESTIMATE';

export type CommercialDocumentStatus =
  | 'DRAFT'
  | 'ISSUED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'CONVERTED'
  | 'DELIVERED'
  | 'CANCELLED';

export interface CommercialDocumentRecord {
  id: string;
  type: CommercialDocumentType;
  status: CommercialDocumentStatus;
  number?: string;
  clientProfileId: string;
  currency: string;
  currencyScale: number;
  companySnapshot: PartySnapshot;
  clientSnapshot: PartySnapshot;
  issueDate?: string;
  validUntil?: string;
  deliveryDate?: string;
  deliveryAddress?: string;
  recipientName?: string;
  customerReference?: string;
  notes?: string;
  terms?: string;
  subtotalMinor: number;
  discountTotalMinor: number;
  taxTotalMinor: number;
  grandTotalMinor: number;
  issuedAt?: string;
  acceptedAt?: string;
  rejectedAt?: string;
  deliveredAt?: string;
  convertedAt?: string;
  cancelledAt?: string;
  statusReason?: string;
  legacyInvoiceId?: string;
  legacyNumber?: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
}

export interface CommercialDocumentLineRecord {
  id: string;
  documentId: string;
  productId?: string;
  position: number;
  designationSnapshot: string;
  descriptionSnapshot?: string;
  unitLabelSnapshot?: string;
  quantityScaled: number;
  quantityScale: number;
  unitPriceMinor: number;
  grossMinor: number;
  discountType: DiscountType;
  discountValue: number;
  discountMinor: number;
  taxRateBasisPoints: number;
  taxMinor: number;
  lineTotalMinor: number;
  sourceEntityType?: 'COMMERCIAL_DOCUMENT_LINE' | 'INVOICE_LINE';
  sourceLineId?: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
}

export type LinkedEntityType = 'COMMERCIAL_DOCUMENT' | 'INVOICE';
export type CommercialDocumentRelation =
  | 'QUOTE_TO_PROFORMA'
  | 'QUOTE_TO_INVOICE'
  | 'PROFORMA_TO_INVOICE'
  | 'DELIVERY_FOR'
  | 'SUPERSEDES';

export interface CommercialDocumentLinkRecord {
  id: string;
  relation: CommercialDocumentRelation;
  sourceType: LinkedEntityType;
  sourceId: string;
  targetType: LinkedEntityType;
  targetId: string;
  createdAt: string;
}

export interface CommercialDocumentAggregate {
  document: CommercialDocumentRecord;
  lines: CommercialDocumentLineRecord[];
  clientName: string;
  links: CommercialDocumentLinkRecord[];
}

export const DraftCommercialDocumentLineSchema = z.object({
  id: z.string().uuid().optional(),
  productId: z.string().uuid().optional(),
  designation: z.string().trim().min(1, 'La désignation est obligatoire').max(200),
  description: z.string().trim().max(1000).optional(),
  unitLabel: z.string().trim().max(50).optional(),
  quantityScaled: z.number().int(),
  quantityScale: z.number().int().min(0).max(3),
  unitPriceMinor: z.number().int().nonnegative().default(0),
  discountType: z.enum(DISCOUNT_TYPES).optional().default('NONE'),
  discountValue: z.number().int().min(0).optional().default(0),
  taxRateBasisPoints: z.number().int().min(0).max(10000).optional().default(0),
});
export type DraftCommercialDocumentLine = z.infer<typeof DraftCommercialDocumentLineSchema>;

export const DraftCommercialDocumentSchema = z.object({
  type: z.enum(['QUOTE', 'PROFORMA', 'DELIVERY_NOTE']),
  clientProfileId: z.string().uuid('Client invalide'),
  currency: z.string().regex(/^[A-Z]{3}$/, 'Devise invalide'),
  currencyScale: z.number().int().min(0).max(3),
  issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
  validUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
  deliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
  deliveryAddress: z.string().trim().max(500).optional(),
  recipientName: z.string().trim().max(100).optional(),
  customerReference: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(5000).optional(),
  terms: z.string().trim().max(5000).optional(),
  lines: z.array(DraftCommercialDocumentLineSchema).min(1, 'Au moins une ligne est requise'),
  taxesEnabled: z.boolean().optional().default(false),
});
export type DraftCommercialDocumentInput = z.input<typeof DraftCommercialDocumentSchema>;
export type ValidatedDraftCommercialDocumentInput = z.output<typeof DraftCommercialDocumentSchema>;
