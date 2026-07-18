import { CreateLocationInput, CreateLocationSchema, LocationRecord, normalizeLocationName, UpdateLocationInput, UpdateLocationSchema } from '../domain/location';
import { DexieLocationRepository } from '../infrastructure/dexie-location-repository';

export class ManageLocationsUseCase {
  constructor(private readonly repository: DexieLocationRepository) {}

  private async validateParent(level: LocationRecord['level'], parentId?: string, currentId?: string): Promise<void> {
    const normalizedParentId = parentId || '';
    if (level === 'COUNTRY') {
      if (normalizedParentId) throw new Error('Un pays ne peut pas avoir de parent.');
      return;
    }
    if (!normalizedParentId) throw new Error('Cette localité doit avoir un parent.');
    if (normalizedParentId === currentId) throw new Error('Une localité ne peut pas être son propre parent.');
    const parent = await this.repository.getById(normalizedParentId);
    if (!parent || parent.archivedAt) throw new Error('Localité parente introuvable ou archivée.');
    const expectedParent = { REGION: 'COUNTRY', CITY: 'REGION', DISTRICT: 'CITY' }[level];
    if (parent.level !== expectedParent) throw new Error(`Parent invalide : le niveau attendu est ${expectedParent}.`);
  }

  async createLocation(input: CreateLocationInput): Promise<LocationRecord> {
    const validated = CreateLocationSchema.parse(input);
    const normalizedName = normalizeLocationName(validated.name);

    await this.validateParent(validated.level, validated.parentId);

    // Prevent duplicates
    const existing = await this.repository.findByNormalizedNameAndParent(normalizedName, validated.level, validated.parentId);
    if (existing) {
      throw new Error(`Une localité nommée "${validated.name}" existe déjà à ce niveau.`);
    }

    const now = new Date().toISOString();
    const location: LocationRecord = {
      id: crypto.randomUUID(),
      name: validated.name,
      normalizedName,
      level: validated.level,
      parentId: validated.parentId || '', // Dexie doesn't index undefined well in compound keys, so use empty string
      createdAt: now,
      updatedAt: now,
    };

    await this.repository.save(location);
    return location;
  }

  async updateLocation(id: string, input: UpdateLocationInput): Promise<LocationRecord> {
    const validated = UpdateLocationSchema.parse(input);
    const location = await this.repository.getById(id);
    
    if (!location) {
      throw new Error("Localité introuvable.");
    }

    const normalizedName = normalizeLocationName(validated.name);

    await this.validateParent(validated.level, validated.parentId, id);

    // Check duplicate if name or parent changed
    if (location.normalizedName !== normalizedName || location.parentId !== (validated.parentId || '')) {
      const existing = await this.repository.findByNormalizedNameAndParent(normalizedName, validated.level, validated.parentId);
      if (existing && existing.id !== id) {
        throw new Error(`Une localité nommée "${validated.name}" existe déjà à ce niveau.`);
      }
    }

    location.name = validated.name;
    location.normalizedName = normalizedName;
    location.level = validated.level;
    location.parentId = validated.parentId || '';
    location.updatedAt = new Date().toISOString();

    await this.repository.save(location);
    return location;
  }

  async archiveLocation(id: string): Promise<void> {
    const location = await this.repository.getById(id);
    if (!location) {
      throw new Error("Localité introuvable.");
    }

    location.archivedAt = new Date().toISOString();
    location.updatedAt = new Date().toISOString();

    await this.repository.save(location);
  }
}
