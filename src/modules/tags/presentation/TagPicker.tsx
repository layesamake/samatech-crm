'use client';

import { TagRecord } from '@/modules/prospects/domain/prospect';
import { TagIcon } from './TagIcon';

export function TagPicker({ tags, selectedIds, onChange }: { tags: TagRecord[]; selectedIds: string[]; onChange: (ids: string[]) => void }) {
  if (!tags.length) return <p className="text-sm text-muted-foreground">Aucun tag configuré. Ajoutez-en depuis Paramètres.</p>;
  return <div className="flex flex-wrap gap-2">{tags.map((tag) => {
    const selected = selectedIds.includes(tag.id); const color = tag.color || '#0B6B2D';
    return <button key={tag.id} type="button" aria-pressed={selected} onClick={() => onChange(selected ? selectedIds.filter((id) => id !== tag.id) : [...selectedIds, tag.id])} className="inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-sm font-medium" style={{ color, borderColor: color, backgroundColor: selected ? `${color}20` : 'transparent' }}><TagIcon icon={tag.icon} className="size-4" />{tag.name}</button>;
  })}</div>;
}
