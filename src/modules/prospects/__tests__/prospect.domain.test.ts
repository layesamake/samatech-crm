import { describe, it, expect } from 'vitest';
import { normalizePhoneNumber, CreateProspectSchema } from '../domain/prospect';

describe('Prospect Domain Rules', () => {
  describe('normalizePhoneNumber', () => {
    it('should remove spaces, dashes and parentheses', () => {
      expect(normalizePhoneNumber(' +221 77 123-45-67 ')).toBe('+221771234567');
      expect(normalizePhoneNumber('(00221) 77 123 45 67')).toBe('+221771234567');
    });

    it('should convert 00 to +', () => {
      expect(normalizePhoneNumber('0033 6 12 34 56 78')).toBe('+33612345678');
    });
  });

  describe('CreateProspectSchema', () => {
    it('should pass valid data', () => {
      const data = {
        displayName: 'Jean Dupont',
        whatsappPhone: '+221771234567',
        status: 'NOUVEAU',
        interestLevel: 'NON_QUALIFIE',
        source: 'WHATSAPP'
      };
      const result = CreateProspectSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should fail if display name is missing', () => {
      const data = {
        whatsappPhone: '+221771234567',
      };
      const result = CreateProspectSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should fail for invalid enum values', () => {
      const data = {
        displayName: 'Jean Dupont',
        whatsappPhone: '+221771234567',
        status: 'INVALID_STATUS', // Invalide
        interestLevel: 'NON_QUALIFIE',
      };
      const result = CreateProspectSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});
