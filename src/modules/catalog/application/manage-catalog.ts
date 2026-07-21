import { CategoryRecord, CreateCategoryInput, CreateCategorySchema, CreateProductInput, CreateProductSchema, normalizeCatalogName, ProductRecord, UpdateCategoryInput, UpdateCategorySchema, UpdateProductInput, UpdateProductSchema } from '../domain/catalog';
import { DexieCatalogRepository } from '../infrastructure/dexie-catalog-repository';

export class ManageCatalogUseCase {
  constructor(private readonly repository: DexieCatalogRepository) {}

  async createCategory(input: CreateCategoryInput): Promise<CategoryRecord> {
    const validated = CreateCategorySchema.parse(input);
    const normalizedName = normalizeCatalogName(validated.name);

    const existing = await this.repository.findCategoryByNormalizedName(normalizedName);
    if (existing) {
      throw new Error(`Une catégorie nommée "${validated.name}" existe déjà.`);
    }

    const now = new Date().toISOString();
    const category: CategoryRecord = {
      id: crypto.randomUUID(),
      name: validated.name,
      normalizedName,
      description: validated.description,
      createdAt: now,
      updatedAt: now,
    };

    await this.repository.saveCategory(category);
    return category;
  }

  async updateCategory(id: string, input: UpdateCategoryInput): Promise<CategoryRecord> {
    const validated = UpdateCategorySchema.parse(input);
    const category = await this.repository.getCategoryById(id);
    
    if (!category) {
      throw new Error("Catégorie introuvable.");
    }

    const normalizedName = normalizeCatalogName(validated.name);

    if (category.normalizedName !== normalizedName) {
      const existing = await this.repository.findCategoryByNormalizedName(normalizedName);
      if (existing && existing.id !== id) {
        throw new Error(`Une catégorie nommée "${validated.name}" existe déjà.`);
      }
    }

    category.name = validated.name;
    category.normalizedName = normalizedName;
    category.description = validated.description;
    category.updatedAt = new Date().toISOString();

    await this.repository.saveCategory(category);
    return category;
  }

  async archiveCategory(id: string): Promise<void> {
    const category = await this.repository.getCategoryById(id);
    if (!category) {
      throw new Error("Catégorie introuvable.");
    }

    category.archivedAt = new Date().toISOString();
    category.updatedAt = new Date().toISOString();

    await this.repository.saveCategory(category);
  }

  async createProduct(input: CreateProductInput): Promise<ProductRecord> {
    const validated = CreateProductSchema.parse(input);
    const normalizedName = normalizeCatalogName(validated.name);

    const existing = await this.repository.findProductByNormalizedName(normalizedName);
    if (existing) {
      throw new Error(`Un produit ou service nommé "${validated.name}" existe déjà.`);
    }

    if (validated.categoryId) {
      const category = await this.repository.getCategoryById(validated.categoryId);
      if (!category || category.archivedAt) {
        throw new Error("Catégorie introuvable ou archivée.");
      }
    }

    const now = new Date().toISOString();
    const product: ProductRecord = {
      id: crypto.randomUUID(),
      name: validated.name,
      normalizedName,
      type: validated.type,
      categoryId: validated.categoryId,
      sku: validated.sku,
      barcode: validated.barcode,
      description: validated.description,
      unitLabel: validated.unitLabel,
      unitPriceMinor: validated.unitPriceMinor,
      currency: validated.currency,
      currencyScale: validated.currencyScale,
      defaultTaxRateBasisPoints: validated.defaultTaxRateBasisPoints,
      isActive: true,
      imageBase64: validated.imageBase64,
      createdAt: now,
      updatedAt: now,
    };

    await this.repository.saveProduct(product);
    return product;
  }

  async updateProduct(id: string, input: UpdateProductInput): Promise<ProductRecord> {
    const validated = UpdateProductSchema.parse(input);
    const product = await this.repository.getProductById(id);
    
    if (!product) {
      throw new Error("Produit introuvable.");
    }

    const normalizedName = normalizeCatalogName(validated.name);

    if (product.normalizedName !== normalizedName) {
      const existing = await this.repository.findProductByNormalizedName(normalizedName);
      if (existing && existing.id !== id) {
        throw new Error(`Un produit ou service nommé "${validated.name}" existe déjà.`);
      }
    }

    if (validated.categoryId && validated.categoryId !== product.categoryId) {
      const category = await this.repository.getCategoryById(validated.categoryId);
      if (!category || category.archivedAt) {
        throw new Error("Catégorie introuvable ou archivée.");
      }
    }

    product.name = validated.name;
    product.normalizedName = normalizedName;
    product.type = validated.type;
    product.categoryId = validated.categoryId;
    product.sku = validated.sku;
    product.barcode = validated.barcode;
    product.description = validated.description;
    product.unitLabel = validated.unitLabel;
    product.unitPriceMinor = validated.unitPriceMinor;
    product.currency = validated.currency;
    product.currencyScale = validated.currencyScale;
    product.defaultTaxRateBasisPoints = validated.defaultTaxRateBasisPoints;
    product.isActive = validated.isActive;
    if (validated.imageBase64 !== undefined) {
      product.imageBase64 = validated.imageBase64;
    }
    product.updatedAt = new Date().toISOString();

    await this.repository.saveProduct(product);
    return product;
  }

  async archiveProduct(id: string): Promise<void> {
    const product = await this.repository.getProductById(id);
    if (!product) {
      throw new Error("Produit introuvable.");
    }

    product.archivedAt = new Date().toISOString();
    product.updatedAt = new Date().toISOString();

    await this.repository.saveProduct(product);
  }
}
