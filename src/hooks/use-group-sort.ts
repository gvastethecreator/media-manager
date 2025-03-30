import type { GroupSortKey, GroupWithStats } from '@/types/group.types';
import { useState } from 'react';

interface UseGroupSortProps {
  groups: GroupWithStats[];
  initialSortKey?: GroupSortKey;
}

export const SORT_OPTIONS = [
  { label: 'Nombre', value: 'name' as const },
  { label: 'Categoría', value: 'category' as const },
  { label: 'Fecha', value: 'createdAt' as const },
] as const;

export function useGroupSort({ groups, initialSortKey = 'name' }: UseGroupSortProps) {
  const [sortBy, setSortBy] = useState<GroupSortKey>(initialSortKey);

  const sortedGroups = [...groups].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'category':
        return (a.category || '').localeCompare(b.category || '');
      case 'createdAt':
        return b.createdAt.getTime() - a.createdAt.getTime();
      default:
        return 0;
    }
  });

  return {
    sortBy,
    setSortBy,
    sortedGroups,
    sortOptions: SORT_OPTIONS,
  };
}