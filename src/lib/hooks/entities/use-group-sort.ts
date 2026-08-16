import { useState } from 'react';
import type { GroupSortKey, GroupWithStats } from '@/types/entities/group';

interface UseGroupSortProps {
	groups: GroupWithStats[];
	initialSortKey?: GroupSortKey;
}

export const SORT_OPTIONS = [
	{ label: 'Name', value: 'name' as const },
	{ label: 'Category', value: 'category' as const },
	{ label: 'Date', value: 'createdAt' as const },
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
