import { db } from '../../../infrastructure/database/db';
import { CategoryRecord, ProductRecord } from '../domain/catalog';

export class DexieCatalogRepository {
  async getAllCategoriesActive(): Promise<CategoryRecord[]> {
    return db.categories.filter(c => !c.archivedAt).toArray();
  }

  async getAllCategories(): Promise<CategoryRecord[]> {
    return db.categories.toArray();
  }

  async getCategoryById(id: string): Promise<CategoryRecord | undefined> {
    return db.categories.get(id);
  }

  async findCategoryByNormalizedName(normalizedName: string): Promise<CategoryRecord | undefined> {
    const cats = await db.categories.toArray();
    return cats.find(c => c.normalizedName === normalizedName && !c.archivedAt);
  }

  async saveCategory(category: CategoryRecord): Promise<void> {
    await db.categories.put(category);
  }

  async getAllProductsActive(): Promise<ProductRecord[]> {
    return db.products.filter(p => !p.archivedAt && p.isActive).toArray();
  }

  async getAllProducts(): Promise<ProductRecord[]> {
    return db.products.toArray();
  }

  async getProductById(id: string): Promise<ProductRecord | undefined> {
    return db.products.get(id);
  }

  async findProductByNormalizedName(normalizedName: string): Promise<ProductRecord | undefined> {
    const prods = await db.products.toArray();
    return prods.find(p => p.normalizedName === normalizedName && !p.archivedAt);
  }

  async saveProduct(product: ProductRecord): Promise<void> {
    await db.products.put(product);
  }
}
