import { describe, expect, it } from 'vitest';
import { FixedClock, FollowUpRecord, followUpView, isOverdue, localDateKey, nextFollowUp } from './follow-up';

const base = (dueAt: string, status: FollowUpRecord['status'] = 'PLANIFIEE'): FollowUpRecord => ({ id: crypto.randomUUID(), contactId: crypto.randomUUID(), channel: 'WHATSAPP', dueAt, timezone: 'Africa/Dakar', priority: 'NORMAL', status, createdAt: dueAt, updatedAt: dueAt });
describe('Domaine des relances BR-071 à BR-078', () => {
  const now = new FixedClock(new Date('2026-07-17T12:00:00Z')).now();
  it('calcule avant, exactement et après l’échéance sans persister EN_RETARD', () => {
    expect(isOverdue(base('2026-07-17T12:00:01Z'), now)).toBe(false);
    expect(isOverdue(base('2026-07-17T12:00:00Z'), now)).toBe(false);
    expect(isOverdue(base('2026-07-17T11:59:59Z'), now)).toBe(true);
    expect(isOverdue(base('2026-07-17T11:00:00Z', 'REALISEE'), now)).toBe(false);
  });
  it('calcule Aujourd’hui, En retard, À venir et Terminées dans Africa/Dakar', () => {
    expect(localDateKey(now, 'Africa/Dakar')).toBe('2026-07-17');
    expect(followUpView(base('2026-07-17T15:00:00Z'), now, 'Africa/Dakar')).toBe('TODAY');
    expect(followUpView(base('2026-07-16T15:00:00Z'), now, 'Africa/Dakar')).toBe('OVERDUE');
    expect(followUpView(base('2026-07-18T15:00:00Z'), now, 'Africa/Dakar')).toBe('UPCOMING');
    expect(followUpView(base('2026-07-18T15:00:00Z', 'ANNULEE'), now, 'Africa/Dakar')).toBe('COMPLETED');
  });
  it('choisit la plus ancienne en retard puis la future la plus proche', () => {
    expect(nextFollowUp([base('2026-07-16T10:00:00Z'), base('2026-07-15T10:00:00Z'), base('2026-07-18T10:00:00Z')], now)?.dueAt).toBe('2026-07-15T10:00:00Z');
    expect(nextFollowUp([base('2026-07-19T10:00:00Z'), base('2026-07-18T10:00:00Z')], now)?.dueAt).toBe('2026-07-18T10:00:00Z');
  });
});
