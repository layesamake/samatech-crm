import { z } from 'zod';

export type UUID = string;
export type ISODateTime = string;
export type MinorAmount = number;
export type CurrencyCode = string;

export interface AuditFields {
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  archivedAt?: ISODateTime;
}

export interface CategoryRecord extends AuditFields {
  id: UUID;
  name: string;
  normalizedName: string;
  description?: string;
  sortOrder?: number;
}

export interface ProductRecord extends AuditFields {
  id: UUID;
  name: string;
  normalizedName: string;
  type: 'PRODUCT' | 'SERVICE';
  categoryId?: UUID;
  sku?: string;
  barcode?: string;
  description?: string;
  unitLabel?: string;
  unitPriceMinor: MinorAmount;
  currency: CurrencyCode;
  currencyScale: number;
  defaultTaxRateBasisPoints?: number;
  isActive: boolean;
}

export const CreateCategorySchema = z.object({
  name: z.string().trim().min(1, 'Le nom est obligatoire'),
  description: z.string().trim().optional(),
});
export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;

export const UpdateCategorySchema = CreateCategorySchema;
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;

export const CreateProductSchema = z.object({
  name: z.string().trim().min(1, 'Le nom est obligatoire'),
  type: z.enum(['PRODUCT', 'SERVICE']),
  categoryId: z.string().uuid().optional().or(z.literal('')),
  sku: z.string().trim().optional(),
  barcode: z.string().trim().optional(),
  description: z.string().trim().optional(),
  unitLabel: z.string().trim().optional(),
  unitPriceMinor: z.number().int().min(0, 'Le prix ne peut pas être négatif'),
  currency: z.string().min(1, 'La devise est obligatoire'),
  currencyScale: z.number().int().min(0),
  defaultTaxRateBasisPoints: z.number().int().min(0).max(10000).optional(),
});
export type CreateProductInput = z.infer<typeof CreateProductSchema>;

export const UpdateProductSchema = CreateProductSchema.extend({
  isActive: z.boolean()
});
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;

export function normalizeCatalogName(name: string): string {
  return name.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
