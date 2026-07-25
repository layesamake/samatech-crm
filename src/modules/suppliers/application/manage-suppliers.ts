import { DexieSupplierRepository } from '../infrastructure/dexie-supplier-repository';
import { normalizeSupplierName, SupplierInput, SupplierInputSchema, SupplierRecord } from '../domain/supplier';

export class ManageSuppliersUseCase {
  constructor(private readonly repository = new DexieSupplierRepository()) {}
  list(includeArchived = false) { return this.repository.list(includeArchived); }
  async create(input: SupplierInput): Promise<SupplierRecord> {
    const value = SupplierInputSchema.parse(input); const normalizedName = normalizeSupplierName(value.name);
    if (await this.repository.findActiveByNormalizedName(normalizedName)) throw new Error('Ce fournisseur ou bénéficiaire existe déjà.');
    const now = new Date().toISOString(); const supplier: SupplierRecord = { id: crypto.randomUUID(), name: value.name.trim(), normalizedName, kind: value.kind, phone: value.phone?.trim() || undefined, email: value.email?.trim() || undefined, note: value.note?.trim() || undefined, createdAt: now, updatedAt: now };
    await this.repository.save(supplier); return supplier;
  }
  async update(id: string, input: SupplierInput): Promise<SupplierRecord> {
    const current = await this.repository.get(id); if (!current || current.archivedAt) throw new Error('Fournisseur ou bénéficiaire introuvable.');
    const value = SupplierInputSchema.parse(input); const normalizedName = normalizeSupplierName(value.name); const duplicate = await this.repository.findActiveByNormalizedName(normalizedName);
    if (duplicate && duplicate.id !== id) throw new Error('Ce fournisseur ou bénéficiaire existe déjà.');
    const updated: SupplierRecord = { ...current, name: value.name.trim(), normalizedName, kind: value.kind, phone: value.phone?.trim() || undefined, email: value.email?.trim() || undefined, note: value.note?.trim() || undefined, updatedAt: new Date().toISOString() };
    await this.repository.save(updated); return updated;
  }
  async archive(id: string): Promise<void> { const current = await this.repository.get(id); if (!current || current.archivedAt) throw new Error('Fournisseur ou bénéficiaire introuvable.'); await this.repository.save({ ...current, archivedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }); }
}
