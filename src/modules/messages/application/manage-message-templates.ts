import { MessageTemplateInput, MessageTemplateInputSchema, MessageTemplateRecord, extractVariables } from '../domain/message-template';
import { DexieMessageTemplateRepository } from '../infrastructure/dexie-message-template-repository';

export class ManageMessageTemplatesUseCase {
  constructor(private readonly repository = new DexieMessageTemplateRepository()) {}
  async create(input: MessageTemplateInput): Promise<MessageTemplateRecord> {
    const value = MessageTemplateInputSchema.parse(input); const now = new Date().toISOString();
    const item: MessageTemplateRecord = { ...value, id: crypto.randomUUID(), variables: extractVariables(value.content), isActive: true, createdAt: now, updatedAt: now };
    await this.repository.save(item); return item;
  }
  async update(id: string, input: MessageTemplateInput): Promise<MessageTemplateRecord> {
    const item = await this.repository.getById(id); if (!item) throw new Error('Modèle introuvable');
    const value = MessageTemplateInputSchema.parse(input); const updated = { ...item, ...value, variables: extractVariables(value.content), updatedAt: new Date().toISOString() };
    await this.repository.save(updated); return updated;
  }
  async duplicate(id: string): Promise<MessageTemplateRecord> {
    const item = await this.repository.getById(id); if (!item) throw new Error('Modèle introuvable');
    return this.create({ name: `${item.name} — copie`, category: item.category, content: item.content });
  }
  async archive(id: string): Promise<void> {
    const item = await this.repository.getById(id); if (!item) throw new Error('Modèle introuvable');
    const now = new Date().toISOString(); await this.repository.save({ ...item, isActive: false, archivedAt: now, updatedAt: now });
  }
  getAll() { return this.repository.getAll(); }
  getActive() { return this.repository.getActive(); }
  get(id: string) { return this.repository.getById(id); }
}
