import { z } from 'zod';

export type UUID = string;
export type ISODateTime = string;

export interface AuditFields {
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  archivedAt?: ISODateTime;
}

export interface LocationRecord extends AuditFields {
  id: UUID;
  name: string;
  normalizedName: string;
  level: 'COUNTRY' | 'REGION' | 'CITY' | 'DISTRICT';
  parentId?: UUID;
  sortOrder?: number;
}

export const CreateLocationSchema = z.object({
  name: z.string().trim().min(1, 'Le nom est obligatoire'),
  level: z.enum(['COUNTRY', 'REGION', 'CITY', 'DISTRICT']),
  parentId: z.string().uuid().optional().or(z.literal('')),
});

export type CreateLocationInput = z.infer<typeof CreateLocationSchema>;

export const UpdateLocationSchema = CreateLocationSchema;
export type UpdateLocationInput = z.infer<typeof UpdateLocationSchema>;

export function normalizeLocationName(name: string): string {
  return name.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
