import { describe, it, expect, beforeEach } from 'vitest';
import { ManageCatalogUseCase } from '../application/manage-catalog';
import { DexieCatalogRepository } from '../infrastructure/dexie-catalog-repository';
import "fake-indexeddb/auto";
import { db } from '../../../infrastructure/database/db';

describe('Catalog UseCases', () => {
  let repository: DexieCatalogRepository;
  let useCase: ManageCatalogUseCase;

  beforeEach(async () => {
    await db.categories.clear();
    await db.products.clear();
    repository = new DexieCatalogRepository();
    useCase = new ManageCatalogUseCase(repository);
  });

  describe('Categories', () => {
    it('crée une catégorie', async () => {
      const created = await useCase.createCategory({ name: 'Matériel' });
      const cat = await repository.getCategoryById(created.id);
      expect(cat).toBeDefined();
      expect(cat?.name).toBe('Matériel');
    });

    it('empêche les catégories en doublon', async () => {
      await useCase.createCategory({ name: 'Matériel' });
      await expect(
        useCase.createCategory({ name: 'matériel' })
      ).rejects.toThrow(/existe déjà/);
    });

    it('archive une catégorie', async () => {
      const id = (await useCase.createCategory({ name: 'Services' })).id;
      await useCase.archiveCategory(id);
      const active = await repository.getAllCategoriesActive();
      expect(active).toHaveLength(0);
      
      const cat = await repository.getCategoryById(id);
      expect(cat?.archivedAt).toBeDefined();
    });

    it('modifie et recherche une catégorie, archives incluses', async () => {
      const created = await useCase.createCategory({ name: 'Matériel' });
      await useCase.updateCategory(created.id, { name: 'Équipements', description: 'Professionnels' });
      expect((await repository.getAllCategories()).filter((c) => c.normalizedName.includes('equip'))[0]?.description).toBe('Professionnels');
      await useCase.archiveCategory(created.id);
      expect(await repository.getAllCategoriesActive()).toHaveLength(0);
      expect(await repository.getAllCategories()).toHaveLength(1);
    });
  });

  describe('Products', () => {
    it('crée un produit avec montant entier', async () => {
      const id = (await useCase.createProduct({
        name: 'Licence',
        type: 'SERVICE',
        unitPriceMinor: 150000,
        currency: 'XOF',
        currencyScale: 0
      })).id;
      const prod = await repository.getProductById(id);
      expect(prod?.name).toBe('Licence');
      expect(prod?.unitPriceMinor).toBe(150000);
      expect(prod?.currency).toBe('XOF');
    });

    it('archive un produit sans le supprimer physiquement', async () => {
      const id = (await useCase.createProduct({
        name: 'Clavier',
        type: 'PRODUCT',
        unitPriceMinor: 5000,
        currency: 'XOF',
        currencyScale: 0
      })).id;
      await useCase.archiveProduct(id);
      const active = await repository.getAllProductsActive();
      expect(active).toHaveLength(0);

      const prod = await repository.getProductById(id);
      expect(prod?.archivedAt).toBeDefined();
    });

    it('refuse un prix négatif et conserve exactement un entier monétaire', async () => {
      await expect(useCase.createProduct({ name: 'Invalide', type: 'PRODUCT', unitPriceMinor: -1, currency: 'XOF', currencyScale: 0 })).rejects.toThrow();
      const created = await useCase.createProduct({ name: 'Exact', type: 'SERVICE', unitPriceMinor: 9007199254740991, currency: 'XOF', currencyScale: 0 });
      expect((await repository.getProductById(created.id))?.unitPriceMinor).toBe(9007199254740991);
    });

    it('modifie, recherche et filtre par catégorie, type et statut', async () => {
      const category = await useCase.createCategory({ name: 'Services' });
      const product = await useCase.createProduct({ name: 'Audit', type: 'SERVICE', categoryId: category.id, unitPriceMinor: 25000, currency: 'XOF', currencyScale: 0 });
      await useCase.updateProduct(product.id, { name: 'Audit CRM', type: 'SERVICE', categoryId: category.id, unitPriceMinor: 30000, currency: 'XOF', currencyScale: 0, isActive: false });
      const all = await repository.getAllProducts();
      expect(all.filter((p) => p.normalizedName.includes('audit') && p.categoryId === category.id && p.type === 'SERVICE' && !p.isActive)).toHaveLength(1);
      expect(await repository.getAllProductsActive()).toHaveLength(0);
    });
  });
});
