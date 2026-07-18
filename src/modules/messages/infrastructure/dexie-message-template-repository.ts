import { db } from '@/infrastructure/database/db';
import { MessageTemplateRecord } from '../domain/message-template';

export class DexieMessageTemplateRepository {
  getById(id: string) { return db.messageTemplates.get(id); }
  getAll() { return db.messageTemplates.toArray(); }
  getActive() { return db.messageTemplates.filter((item) => item.isActive && !item.archivedAt).toArray(); }
  async save(item: MessageTemplateRecord): Promise<void> { await db.messageTemplates.put(item); }
}
