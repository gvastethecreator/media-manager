import { useCallback, useState } from 'react';

export type SortField = 'name' | 'lastIndexed' | 'images' | 'videos';
export type SortDirection = 'asc' | 'desc';
export type FilterStatus = 'all' | 'indexed' | 'never' | 'favorite';

/**
 * Hook para manejar filtrado y ordenación de carpetas en tabla
 */
export function useTableFilters() {
	const [sortBy, setSortBy] = useState<SortField>('name');
	const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
	const [filterText, setFilterText] = useState('');
	const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

	const handleSort = useCallback(
		(field: SortField) => {
			if (sortBy === field) {
				setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
			} else {
				setSortBy(field);
				setSortDirection('asc');
			}
		},
		[sortBy]
	);

	const clearFilters = useCallback(() => {
		setFilterText('');
		setFilterStatus('all');
	}, []);

	return {
		sortBy,
		sortDirection,
		filterText,
		filterStatus,
		setSortBy,
		setSortDirection,
		setFilterText,
		setFilterStatus,
		handleSort,
		clearFilters,
	};
}
