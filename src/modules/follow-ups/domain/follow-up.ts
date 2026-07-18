import { z } from 'zod';

export const FOLLOW_UP_CHANNELS = ['WHATSAPP', 'PHONE', 'EMAIL', 'OTHER'] as const;
export const FOLLOW_UP_PRIORITIES = ['LOW', 'NORMAL', 'HIGH'] as const;
export const FOLLOW_UP_STATUSES = ['PLANIFIEE', 'REALISEE', 'REPORTEE', 'ANNULEE'] as const;
export type FollowUpStatus = typeof FOLLOW_UP_STATUSES[number];

export interface FollowUpRecord {
  id: string; contactId: string; channel: typeof FOLLOW_UP_CHANNELS[number]; dueAt: string; timezone: string;
  priority: typeof FOLLOW_UP_PRIORITIES[number]; status: FollowUpStatus; reason?: string; messageTemplateId?: string;
  messageSnapshot?: string; completedAt?: string; resultNote?: string; previousFollowUpId?: string;
  createdAt: string; updatedAt: string; archivedAt?: string;
}

export const TIMELINE_EVENT_TYPES = ['PROSPECT_CREATED', 'PROSPECT_STATUS_CHANGED', 'NOTE_ADDED', 'FOLLOW_UP_CREATED', 'FOLLOW_UP_COMPLETED', 'FOLLOW_UP_RESCHEDULED', 'FOLLOW_UP_CANCELLED', 'WHATSAPP_OPENED', 'PROSPECT_CONVERTED', 'INVOICE_ISSUED', 'INVOICE_CANCELLED', 'PAYMENT_RECORDED', 'PAYMENT_REVERSED', 'CAMPAIGN_PROCESSED'] as const;
export interface TimelineEventRecord {
  id: string; contactId: string; type: typeof TIMELINE_EVENT_TYPES[number]; occurredAt: string; createdAt: string;
  sourceEntityType?: string; sourceEntityId?: string; title: string; summary?: string; payloadVersion: number;
  payload?: Record<string, unknown>;
}

export const FollowUpInputSchema = z.object({
  contactId: z.string().uuid('Contact invalide'),
  channel: z.enum(FOLLOW_UP_CHANNELS),
  dueAt: z.string().datetime({ offset: true, message: 'Date et heure invalides' }),
  timezone: z.string().trim().min(1, 'Fuseau horaire obligatoire'),
  priority: z.enum(FOLLOW_UP_PRIORITIES),
  reason: z.string().trim().optional(),
  messageTemplateId: z.string().uuid().optional().or(z.literal('')),
  messageSnapshot: z.string().optional(),
});
export type FollowUpInput = z.infer<typeof FollowUpInputSchema>;

export interface Clock { now(): Date; }
export class SystemClock implements Clock { now(): Date { return new Date(); } }
export class FixedClock implements Clock { constructor(private readonly value: Date) {} now(): Date { return new Date(this.value); } }

export const FOLLOW_UP_DUPLICATE_WINDOW_MINUTES = 60;
export function isOverdue(followUp: FollowUpRecord, now: Date): boolean {
  return followUp.status === 'PLANIFIEE' && new Date(followUp.dueAt).getTime() < now.getTime();
}
export function localDateKey(date: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat('fr-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? '';
  return `${value('year')}-${value('month')}-${value('day')}`;
}
export function followUpView(followUp: FollowUpRecord, now: Date, timezone: string): 'TODAY' | 'OVERDUE' | 'UPCOMING' | 'COMPLETED' {
  if (followUp.status !== 'PLANIFIEE') return 'COMPLETED';
  if (isOverdue(followUp, now) && localDateKey(new Date(followUp.dueAt), timezone) !== localDateKey(now, timezone)) return 'OVERDUE';
  if (localDateKey(new Date(followUp.dueAt), timezone) === localDateKey(now, timezone)) return 'TODAY';
  return new Date(followUp.dueAt).getTime() < now.getTime() ? 'OVERDUE' : 'UPCOMING';
}
export function nextFollowUp(items: FollowUpRecord[], now: Date): FollowUpRecord | undefined {
  const planned = items.filter((item) => item.status === 'PLANIFIEE');
  const overdue = planned.filter((item) => new Date(item.dueAt) < now).sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  return overdue[0] ?? planned.filter((item) => new Date(item.dueAt) >= now).sort((a, b) => a.dueAt.localeCompare(b.dueAt))[0];
}
