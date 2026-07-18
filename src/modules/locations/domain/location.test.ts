import { describe, it, expect } from 'vitest';
import { CreateLocationSchema, normalizeLocationName } from './location';

describe('Location Domain', () => {
  describe('normalizeLocationName', () => {
    it('met en minuscules, supprime les accents et les espaces superflus', () => {
      expect(normalizeLocationName('Dakar Plateau')).toBe('dakar plateau');
      expect(normalizeLocationName('   Thiès   ')).toBe('thies');
      expect(normalizeLocationName(' Saint-Louis ')).toBe('saint-louis');
      expect(normalizeLocationName('N\'Djaména')).toBe('n\'djamena');
    });
  });

  describe('CreateLocationSchema', () => {
    it('valide une localité correcte', () => {
      const result = CreateLocationSchema.safeParse({
        name: 'Dakar',
        level: 'CITY'
      });
      expect(result.success).toBe(true);
    });

    it('refuse un nom vide', () => {
      const result = CreateLocationSchema.safeParse({
        name: '   ',
        level: 'CITY'
      });
      expect(result.success).toBe(false);
    });

    it('accepte un parent optionnel (valide uuid)', () => {
      const result = CreateLocationSchema.safeParse({
        name: 'Plateau',
        level: 'DISTRICT',
        parentId: '123e4567-e89b-12d3-a456-426614174000'
      });
      expect(result.success).toBe(true);
    });

    it('accepte un parentId chaîne vide', () => {
      const result = CreateLocationSchema.safeParse({
        name: 'Sénégal',
        level: 'COUNTRY',
        parentId: ''
      });
      expect(result.success).toBe(true);
    });
  });
});
