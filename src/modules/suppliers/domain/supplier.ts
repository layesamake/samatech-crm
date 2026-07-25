import { z } from 'zod';

export const SUPPLIER_KINDS = ['SUPPLIER', 'BENEFICIARY', 'BOTH'] as const;
export type SupplierKind = (typeof SUPPLIER_KINDS)[number];

export interface SupplierRecord {
  id: string;
  name: string;
  normalizedName: string;
  kind: SupplierKind;
  phone?: string;
  email?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
}

export const SupplierInputSchema = z.object({
  name: z.string().trim().min(1, 'Le nom est obligatoire').max(100),
  kind: z.enum(SUPPLIER_KINDS).default('BOTH'),
  phone: z.string().trim().max(30).optional(),
  email: z.string().trim().email('Email invalide').optional().or(z.literal('')),
  note: z.string().trim().max(500).optional(),
});
export type SupplierInput = z.infer<typeof SupplierInputSchema>;

export function normalizeSupplierName(name: string): string {
  return name.trim().toLocaleLowerCase('fr').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
