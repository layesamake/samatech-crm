import { z } from 'zod';
import { TAG_COLORS, TAG_ICONS } from '@/modules/prospects/domain/prospect';

export const TagInputSchema = z.object({
  name: z.string().trim().min(1, 'Le nom du tag est obligatoire').max(40, 'Le nom du tag est trop long'),
  color: z.enum(TAG_COLORS),
  icon: z.enum(TAG_ICONS),
});

export type TagInput = z.infer<typeof TagInputSchema>;

export function normalizeTagName(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLocaleLowerCase('fr').replace(/\s+/g, ' ');
}
