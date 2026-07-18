import { db } from '@/infrastructure/database/db';
import { FollowUpRecord, TimelineEventRecord } from '../domain/follow-up';

export class DexieFollowUpRepository {
  getById(id: string): Promise<FollowUpRecord | undefined> { return db.followUps.get(id); }
  getAll(): Promise<FollowUpRecord[]> { return db.followUps.toArray(); }
  getForContact(contactId: string): Promise<FollowUpRecord[]> { return db.followUps.where('contactId').equals(contactId).toArray(); }
  async save(item: FollowUpRecord): Promise<void> { await db.followUps.put(item); }
  async saveWithEvent(item: FollowUpRecord, event: TimelineEventRecord): Promise<void> {
    await db.transaction('rw', db.followUps, db.timelineEvents, async () => { await db.followUps.put(item); await db.timelineEvents.add(event); });
  }

  async createWithEvent(item: FollowUpRecord, event: TimelineEventRecord): Promise<void> {
    await db.transaction('rw', db.followUps, db.timelineEvents, async () => {
      await db.followUps.add(item); await db.timelineEvents.add(event);
    });
  }
  async complete(item: FollowUpRecord, event: TimelineEventRecord): Promise<void> {
    await db.transaction('rw', db.followUps, db.timelineEvents, async () => {
      await db.followUps.put(item); await db.timelineEvents.add(event);
    });
  }
  async reschedule(previous: FollowUpRecord, next: FollowUpRecord, event: TimelineEventRecord): Promise<void> {
    await db.transaction('rw', db.followUps, db.timelineEvents, async () => {
      await db.followUps.put(previous); await db.followUps.add(next); await db.timelineEvents.add(event);
    });
  }
  async recordWhatsAppOpen(item: FollowUpRecord, event: TimelineEventRecord): Promise<void> {
    await db.transaction('rw', db.followUps, db.timelineEvents, async () => {
      await db.followUps.put(item); await db.timelineEvents.add(event);
    });
  }
  async getEvents(contactId: string): Promise<TimelineEventRecord[]> {
    const events = await db.timelineEvents.where('contactId').equals(contactId).toArray();
    return events.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt) || b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id));
  }
}
