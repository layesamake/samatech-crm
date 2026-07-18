import { db } from '../../../infrastructure/database/db';
import { LocationRecord } from '../domain/location';

export class DexieLocationRepository {
  async getAllActive(): Promise<LocationRecord[]> {
    return db.locations.filter(l => !l.archivedAt).toArray();
  }

  async getAll(): Promise<LocationRecord[]> {
    return db.locations.toArray();
  }

  async getById(id: string): Promise<LocationRecord | undefined> {
    return db.locations.get(id);
  }

  async findByNormalizedNameAndParent(normalizedName: string, level: string, parentId?: string): Promise<LocationRecord | undefined> {
    const locations = await db.locations
      .where('[parentId+level]')
      .equals([parentId || '', level])
      .toArray();
      
    return locations.find(l => l.normalizedName === normalizedName && !l.archivedAt);
  }

  async save(location: LocationRecord): Promise<void> {
    await db.locations.put(location);
  }
}
