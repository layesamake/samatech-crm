import { describe, expect, it } from 'vitest';
import { TagInputSchema, normalizeTagName } from './tag';

describe('tags', () => {
  it('normalise un nom pour empêcher les doublons', () => expect(normalizeTagName('  Client Fidèle  ')).toBe('client fidele'));
  it('valide une couleur et une icône autorisées', () => expect(TagInputSchema.parse({ name: 'VIP', color: '#0B6B2D', icon: 'CROWN' })).toMatchObject({ name: 'VIP' }));
});
