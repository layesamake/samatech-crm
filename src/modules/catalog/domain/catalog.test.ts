import { describe, it, expect } from 'vitest';
import { CreateCategorySchema, CreateProductSchema, normalizeCatalogName } from './catalog';

describe('Catalog Domain', () => {
  describe('normalizeCatalogName', () => {
    it('normalise correctement', () => {
      expect(normalizeCatalogName('  Logiciels de Gestion ')).toBe('logiciels de gestion');
      expect(normalizeCatalogName('Écrans & Claviers')).toBe('ecrans & claviers');
    });
  });

  describe('CreateCategorySchema', () => {
    it('accepte une catégorie valide', () => {
      const result = CreateCategorySchema.safeParse({ name: 'Matériel' });
      expect(result.success).toBe(true);
    });

    it('refuse une catégorie sans nom', () => {
      const result = CreateCategorySchema.safeParse({ name: '   ' });
      expect(result.success).toBe(false);
    });
  });

  describe('CreateProductSchema', () => {
    it('accepte un produit valide', () => {
      const result = CreateProductSchema.safeParse({
        name: 'Licence 1 an',
        type: 'SERVICE',
        unitPriceMinor: 150000,
        currency: 'XOF',
        currencyScale: 0
      });
      expect(result.success).toBe(true);
    });

    it('refuse un prix négatif', () => {
      const result = CreateProductSchema.safeParse({
        name: 'Produit défectueux',
        type: 'PRODUCT',
        unitPriceMinor: -500,
        currency: 'XOF',
        currencyScale: 0
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toMatch(/négatif/i);
      }
    });

    it('accepte categoryId vide (traduit en non défini dans l\'interface, ou chaîne vide admise par le schéma)', () => {
      const result = CreateProductSchema.safeParse({
        name: 'Clé USB',
        type: 'PRODUCT',
        categoryId: '',
        unitPriceMinor: 5000,
        currency: 'XOF',
        currencyScale: 0
      });
      expect(result.success).toBe(true);
    });
  });
});
