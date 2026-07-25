import { db } from '@/infrastructure/database/db';
import { ContactTagRecord, TagRecord } from '@/modules/prospects/domain/prospect';
import { TagInput, normalizeTagName } from '../domain/tag';

export class DexieTagRepository {
  async listActive(): Promise<TagRecord[]> {
    return (await db.tags.filter((tag) => !tag.archivedAt).toArray()).sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  }

  async create(input: TagInput): Promise<TagRecord> {
    const normalizedName = normalizeTagName(input.name);
    const existing = await db.tags.where('normalizedName').equals(normalizedName).first();
    if (existing && !existing.archivedAt) throw new Error('Un tag porte déjà ce nom.');
    const now = new Date().toISOString();
    const tag: TagRecord = { id: crypto.randomUUID(), name: input.name.trim(), normalizedName, color: input.color, icon: input.icon, createdAt: now, updatedAt: now };
    await db.tags.put(existing ? { ...existing, ...tag, archivedAt: undefined } : tag);
    return tag;
  }

  async update(id: string, input: TagInput): Promise<TagRecord> {
    const tag = await db.tags.get(id);
    if (!tag || tag.archivedAt) throw new Error('Tag introuvable.');
    const normalizedName = normalizeTagName(input.name);
    const duplicate = await db.tags.where('normalizedName').equals(normalizedName).first();
    if (duplicate && duplicate.id !== id && !duplicate.archivedAt) throw new Error('Un tag porte déjà ce nom.');
    const updated = { ...tag, name: input.name.trim(), normalizedName, color: input.color, icon: input.icon, updatedAt: new Date().toISOString() };
    await db.tags.put(updated);
    return updated;
  }

  async archive(id: string): Promise<void> {
    await db.transaction('rw', db.tags, db.contactTags, async () => {
      const tag = await db.tags.get(id);
      if (!tag || tag.archivedAt) throw new Error('Tag introuvable.');
      await db.tags.put({ ...tag, archivedAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
      await db.contactTags.where('tagId').equals(id).delete();
    });
  }

  async replaceContactTags(contactId: string, tagIds: string[]): Promise<void> {
    const uniqueTagIds = [...new Set(tagIds)];
    await db.transaction('rw', db.tags, db.contactTags, async () => {
      const activeTags = uniqueTagIds.length ? await db.tags.where('id').anyOf(uniqueTagIds).toArray() : [];
      if (activeTags.length !== uniqueTagIds.length || activeTags.some((tag) => tag.archivedAt)) throw new Error('Un des tags sélectionnés est indisponible.');
      await db.contactTags.where('contactId').equals(contactId).delete();
      const now = new Date().toISOString();
      const relations: ContactTagRecord[] = uniqueTagIds.map((tagId) => ({ id: crypto.randomUUID(), contactId, tagId, createdAt: now }));
      if (relations.length) await db.contactTags.bulkAdd(relations);
    });
  }
}
