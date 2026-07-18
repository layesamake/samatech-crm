import { z } from 'zod';

export type ISODateTime = string;

export interface SettingsRecord {
  key: string;
  value: unknown;
  schemaVersion: number;
  updatedAt: ISODateTime;
}

export interface SequenceRecord {
  key: string;
  prefix: string;
  period?: string;
  nextValue: number;
  padding: number;
  updatedAt: ISODateTime;
}

export interface CompanyProfile {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  country?: string;
  currencyCode: string;
  currencySymbol: string;
  invoiceDefaults?: string;
  logoDataUri?: string;
  managerName?: string;
  managerSignatureDataUri?: string;
}

export interface InvoiceSettings {
  currencyCode: string;
  prefix: string;
  nextValue: number;
  enableTaxes: boolean;
  defaultTaxRate?: number;
}

export const CompanyProfileSchema = z.object({
  name: z.string().trim().min(1, 'Le nom de l\'entreprise est obligatoire'),
  phone: z.string().trim().min(1, 'Le téléphone est obligatoire'),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  address: z.string().trim().optional(),
  city: z.string().trim().optional(),
  country: z.string().trim().optional(),
  currencyCode: z.string().trim().regex(/^[A-Z]{3}$/, 'La devise doit être un code ISO 4217 de 3 lettres'),
  currencySymbol: z.string().trim().min(1, 'Le symbole monétaire est obligatoire'),
  invoiceDefaults: z.string().optional(),
  logoDataUri: z.string().optional(),
  managerName: z.string().trim().optional(),
  managerSignatureDataUri: z.string().optional(),
});

export const InvoiceSettingsSchema = z.object({
  currencyCode: z.string().trim().regex(/^[A-Z]{3}$/, 'La devise doit être un code ISO 4217 de 3 lettres'),
  prefix: z.string().trim().min(1, 'Le préfixe est obligatoire').max(20, 'Le préfixe est trop long'),
  nextValue: z.number().int().positive('La valeur doit être positive'),
  enableTaxes: z.boolean(),
  defaultTaxRate: z.number().min(0).max(100).optional(),
});
