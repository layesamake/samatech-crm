import { DexieProspectRepository } from '@/modules/prospects/infrastructure/dexie-prospect-repository';
import { buildWhatsAppUrl } from '@/modules/messages/domain/message-template';
import { Clock, FOLLOW_UP_DUPLICATE_WINDOW_MINUTES, FollowUpInput, FollowUpInputSchema, FollowUpRecord, SystemClock, TimelineEventRecord, followUpView, nextFollowUp } from '../domain/follow-up';
import { DexieFollowUpRepository } from '../infrastructure/dexie-follow-up-repository';

export interface CreateFollowUpOptions { confirmPast?: boolean; confirmDuplicate?: boolean; }
export interface CreateFollowUpResult { followUp?: FollowUpRecord; warning?: 'PAST_DUE' | 'CLOSE_DUPLICATE'; similar?: FollowUpRecord; }

export class ManageFollowUpsUseCase {
  constructor(private readonly repository = new DexieFollowUpRepository(), private readonly prospects = new DexieProspectRepository(), private readonly clock: Clock = new SystemClock()) {}

  private event(item: FollowUpRecord, type: TimelineEventRecord['type'], title: string, summary?: string): TimelineEventRecord {
    const now = this.clock.now().toISOString();
    return { id: crypto.randomUUID(), contactId: item.contactId, type, occurredAt: now, createdAt: now, sourceEntityType: 'FOLLOW_UP', sourceEntityId: item.id, title, summary, payloadVersion: 1 };
  }
  async create(input: FollowUpInput, options: CreateFollowUpOptions = {}): Promise<CreateFollowUpResult> {
    const value = FollowUpInputSchema.parse(input);
    const prospect = await this.prospects.getById(value.contactId);
    if (!prospect) throw new Error('Contact introuvable');
    if (prospect.contact.archivedAt) throw new Error('Impossible de planifier une relance pour un contact archivé');
    const now = this.clock.now();
    if (new Date(value.dueAt) < now && !options.confirmPast) return { warning: 'PAST_DUE' };
    const closeWindow = FOLLOW_UP_DUPLICATE_WINDOW_MINUTES * 60_000;
    const similar = (await this.repository.getForContact(value.contactId)).find((item) => item.status === 'PLANIFIEE' && Math.abs(new Date(item.dueAt).getTime() - new Date(value.dueAt).getTime()) <= closeWindow);
    if (similar && !options.confirmDuplicate) return { warning: 'CLOSE_DUPLICATE', similar };
    const timestamp = now.toISOString();
    const item: FollowUpRecord = { ...value, messageTemplateId: value.messageTemplateId || undefined, id: crypto.randomUUID(), status: 'PLANIFIEE', createdAt: timestamp, updatedAt: timestamp };
    await this.repository.createWithEvent(item, this.event(item, 'FOLLOW_UP_CREATED', 'Relance planifiée', item.reason));
    return { followUp: item };
  }
  async update(id: string, input: FollowUpInput): Promise<FollowUpRecord> {
    const item = await this.repository.getById(id); if (!item) throw new Error('Relance introuvable');
    if (item.status !== 'PLANIFIEE') throw new Error('Seule une relance planifiée peut être modifiée');
    const value = FollowUpInputSchema.parse(input);
    const updated = { ...item, ...value, messageTemplateId: value.messageTemplateId || undefined, updatedAt: this.clock.now().toISOString() };
    await this.repository.save(updated); return updated;
  }
  async complete(id: string, resultNote?: string): Promise<FollowUpRecord> {
    const item = await this.repository.getById(id); if (!item) throw new Error('Relance introuvable');
    if (item.status !== 'PLANIFIEE') throw new Error('Cette relance est déjà clôturée');
    const now = this.clock.now().toISOString(); const completed = { ...item, status: 'REALISEE' as const, completedAt: now, resultNote: resultNote?.trim() || undefined, updatedAt: now };
    await this.repository.complete(completed, this.event(completed, 'FOLLOW_UP_COMPLETED', 'Relance réalisée', completed.resultNote)); return completed;
  }
  async cancel(id: string): Promise<FollowUpRecord> {
    const item = await this.repository.getById(id); if (!item) throw new Error('Relance introuvable');
    if (item.status !== 'PLANIFIEE') throw new Error('Cette relance est déjà clôturée');
    const cancelled = { ...item, status: 'ANNULEE' as const, updatedAt: this.clock.now().toISOString() }; await this.repository.saveWithEvent(cancelled, this.event(cancelled, 'FOLLOW_UP_CANCELLED', 'Relance annulée')); return cancelled;
  }
  async reschedule(id: string, dueAt: string, timezone: string): Promise<FollowUpRecord> {
    const item = await this.repository.getById(id); if (!item) throw new Error('Relance introuvable');
    if (item.status !== 'PLANIFIEE') throw new Error('Cette relance est déjà clôturée');
    FollowUpInputSchema.pick({ dueAt: true, timezone: true }).parse({ dueAt, timezone });
    const now = this.clock.now().toISOString();
    const previous = { ...item, status: 'REPORTEE' as const, updatedAt: now };
    const next: FollowUpRecord = { ...item, id: crypto.randomUUID(), dueAt, timezone, status: 'PLANIFIEE', previousFollowUpId: item.id, completedAt: undefined, resultNote: undefined, createdAt: now, updatedAt: now };
    await this.repository.reschedule(previous, next, this.event(next, 'FOLLOW_UP_RESCHEDULED', 'Relance reportée', dueAt)); return next;
  }
  async prepareWhatsApp(id: string, finalMessage: string): Promise<{ url: string; followUp: FollowUpRecord }> {
    const item = await this.repository.getById(id); if (!item) throw new Error('Relance introuvable');
    if (item.channel !== 'WHATSAPP') throw new Error('Cette relance n’utilise pas WhatsApp');
    const prospect = await this.prospects.getById(item.contactId); if (!prospect) throw new Error('Contact introuvable');
    const updated = { ...item, messageSnapshot: finalMessage, updatedAt: this.clock.now().toISOString() };
    await this.repository.recordWhatsAppOpen(updated, this.event(updated, 'WHATSAPP_OPENED', 'WhatsApp ouvert'));
    return { url: buildWhatsAppUrl(prospect.contact.normalizedWhatsappPhone, finalMessage), followUp: updated };
  }
  async list(view?: 'TODAY' | 'OVERDUE' | 'UPCOMING' | 'COMPLETED'): Promise<FollowUpRecord[]> {
    const now = this.clock.now(); const items = await this.repository.getAll();
    return items.filter((item) => !item.archivedAt && (!view || followUpView(item, now, item.timezone) === view)).sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  }
  get(id: string) { return this.repository.getById(id); }
  async nextForContact(contactId: string) { return nextFollowUp(await this.repository.getForContact(contactId), this.clock.now()); }
}
