import { describe, it, expect } from 'vitest';
import { normalizePhoneNumber, CreateProspectSchema, UpdateProspectSchema } from './prospect';

describe('Prospect Domain', () => {
  describe('normalizePhoneNumber', () => {
    it('devrait supprimer les espaces, tirets et parenthèses', () => {
      expect(normalizePhoneNumber('77 123 45-67')).toBe('771234567');
      expect(normalizePhoneNumber('(221) 77 123 45 67')).toBe('221771234567');
    });

    it('devrait conserver le + initial', () => {
      expect(normalizePhoneNumber('+221 77 123 45 67')).toBe('+221771234567');
    });

    it('devrait supprimer les + en trop mais garder le premier', () => {
      expect(normalizePhoneNumber('++221 77+123')).toBe('+22177123');
    });

    it('devrait retourner une chaîne vide si l\'entrée est vide', () => {
      expect(normalizePhoneNumber('')).toBe('');
    });
  });

  describe('CreateProspectSchema', () => {
    it('devrait valider un prospect valide', () => {
      const input = {
        displayName: 'Jean Dupont',
        whatsappPhone: '+221 77 123 45 67',
      };
      
      const result = CreateProspectSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('NOUVEAU'); // Valeur par défaut
        expect(result.data.interestLevel).toBe('NON_QUALIFIE');
      }
    });

    it('devrait échouer si le nom est manquant', () => {
      const input = {
        displayName: '   ',
        whatsappPhone: '771234567',
      };
      
      const result = CreateProspectSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('devrait échouer si le téléphone WhatsApp est manquant', () => {
      const input = {
        displayName: 'Jean Dupont',
        whatsappPhone: '',
      };
      
      const result = CreateProspectSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('devrait valider une date de premier contact correcte', () => {
      const input = {
        displayName: 'Jean',
        whatsappPhone: '77',
        firstContactDate: '2026-07-17',
      };
      const result = CreateProspectSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('devrait rejeter une date de premier contact incorrecte', () => {
      const input = {
        displayName: 'Jean',
        whatsappPhone: '77',
        firstContactDate: '17/07/2026', // Format attendu YYYY-MM-DD
      };
      const result = CreateProspectSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe('UpdateProspectSchema', () => {
    it('devrait valider avec status et interestLevel explicites', () => {
      const input = {
        displayName: 'Jean',
        whatsappPhone: '77',
        status: 'INTERESSE',
        interestLevel: 'CHAUD',
      };
      const result = UpdateProspectSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('devrait échouer sans status ni interestLevel', () => {
      const input = {
        displayName: 'Jean',
        whatsappPhone: '77',
      };
      const result = UpdateProspectSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });
});
