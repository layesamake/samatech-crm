import { TagRecord } from '@/modules/prospects/domain/prospect';
import { TagInput, TagInputSchema } from '../domain/tag';
import { DexieTagRepository } from '../infrastructure/dexie-tag-repository';

export class ManageTagsUseCase {
  constructor(private readonly repository = new DexieTagRepository()) {}
  listActive(): Promise<TagRecord[]> { return this.repository.listActive(); }
  async create(input: TagInput): Promise<TagRecord> { return this.repository.create(TagInputSchema.parse(input)); }
  async update(id: string, input: TagInput): Promise<TagRecord> { return this.repository.update(id, TagInputSchema.parse(input)); }
  replaceContactTags(contactId: string, tagIds: string[]): Promise<void> { return this.repository.replaceContactTags(contactId, tagIds); }
  archive(id: string): Promise<void> { return this.repository.archive(id); }
}
