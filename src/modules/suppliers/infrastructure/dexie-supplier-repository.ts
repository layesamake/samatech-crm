import { db } from '@/infrastructure/database/db';
import type { SupplierRecord } from '../domain/supplier';

export class DexieSupplierRepository {
  async list(includeArchived = false): Promise<SupplierRecord[]> {
    const items = await db.suppliers.filter((supplier) => includeArchived || !supplier.archivedAt).toArray();
    return items.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  }
  async get(id: string): Promise<SupplierRecord | undefined> { return db.suppliers.get(id); }
  async findActiveByNormalizedName(normalizedName: string): Promise<SupplierRecord | undefined> {
    const supplier = await db.suppliers.where('normalizedName').equals(normalizedName).first();
    return supplier?.archivedAt ? undefined : supplier;
  }
  async save(supplier: SupplierRecord): Promise<void> { await db.suppliers.put(supplier); }
}
