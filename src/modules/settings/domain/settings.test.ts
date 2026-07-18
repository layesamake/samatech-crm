import { describe, it, expect } from 'vitest';
import { CompanyProfileSchema, InvoiceSettingsSchema } from './settings';

describe('Settings Domain', () => {
  describe('CompanyProfileSchema', () => {
    it('valide un profil entreprise correct', () => {
      const data = {
        name: 'SAMTECH CRM',
        phone: '+221770001122',
        email: 'contact@samatech.dev',
        currencyCode: 'XOF',
        currencySymbol: 'FCFA'
      };
      const result = CompanyProfileSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('refuse un nom vide', () => {
      const result = CompanyProfileSchema.safeParse({
        name: '   ',
        phone: '+221770001122',
        currencyCode: 'XOF',
        currencySymbol: 'FCFA'
      });
      expect(result.success).toBe(false);
    });

    it('refuse une devise vide', () => {
      const result = CompanyProfileSchema.safeParse({
        name: 'SAMTECH',
        phone: '+221',
        currencyCode: '',
        currencySymbol: 'FCFA'
      });
      expect(result.success).toBe(false);
    });
  });

  describe('InvoiceSettingsSchema', () => {
    it('valide une configuration correcte', () => {
      const data = {
        currencyCode: 'XOF',
        prefix: 'FACT-',
        nextValue: 1,
        enableTaxes: false
      };
      const result = InvoiceSettingsSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('refuse un préfixe vide', () => {
      const result = InvoiceSettingsSchema.safeParse({
        currencyCode: 'XOF',
        prefix: '  ',
        nextValue: 1,
        enableTaxes: false
      });
      expect(result.success).toBe(false);
    });

    it('refuse une valeur suivante invalide (zéro ou négatif)', () => {
      const result = InvoiceSettingsSchema.safeParse({
        currencyCode: 'XOF',
        prefix: 'FACT-',
        nextValue: 0,
        enableTaxes: false
      });
      expect(result.success).toBe(false);
    });
  });
});
