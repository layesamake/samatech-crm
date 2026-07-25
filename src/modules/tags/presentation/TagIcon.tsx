import { Briefcase, Crown, Flame, Heart, Star, Tag } from 'lucide-react';
import { TagIcon as TagIconName } from '@/modules/prospects/domain/prospect';

const icons = { TAG: Tag, STAR: Star, CROWN: Crown, HEART: Heart, FLAME: Flame, BRIEFCASE: Briefcase };

export function TagIcon({ icon = 'TAG', className }: { icon?: TagIconName; className?: string }) {
  const Icon = icons[icon];
  return <Icon className={className} aria-hidden="true" />;
}
