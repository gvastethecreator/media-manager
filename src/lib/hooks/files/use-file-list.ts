import { useCallback, useMemo, useState } from 'react';
import { useFiles } from '@/lib/contexts/file-context';

export function useFileList() {
	const { files, sortBy, sortOrder, setSortBy, setSortOrder } = useFiles();
	const [searchTerm, setSearchTerm] = useState('');
	const [filterTags, setFilterTags] = useState<string[]>([]);
	const [filterCollections, setFilterCollections] = useState<string[]>([]);

	const filteredFiles = useMemo(() => {
		return files.filter((file) => {
			// Search term filter
			if (searchTerm && !file.name.toLowerCase().includes(searchTerm.toLowerCase())) {
				return false;
			}

			// Tags filter (safely check if tags property exists)
			if (filterTags.length > 0 && !filterTags.every((tag) => (file as any).tags?.includes(tag))) {
				return false;
			}

			// Collections filter (safely check if collections property exists)
			if (
				filterCollections.length > 0 &&
				!filterCollections.every((collection) => (file as any).collections?.includes(collection))
			) {
				return false;
			}

			return true;
		});
	}, [files, searchTerm, filterTags, filterCollections]);

	const sortedFiles = useMemo(() => {
		return [...filteredFiles].sort((a, b) => {
			let comparison = 0;
			switch (sortBy) {
				case 'name':
					comparison = a.name.localeCompare(b.name);
					break;
				case 'date':
					comparison = (a.updatedAt || a.createdAt).getTime() - (b.updatedAt || b.createdAt).getTime();
					break;
				case 'size':
					comparison = ((a as any).size || 0) - ((b as any).size || 0);
					break;
			}
			return sortOrder === 'asc' ? comparison : -comparison;
		});
	}, [filteredFiles, sortBy, sortOrder]);

	const handleSearch = useCallback((term: string) => {
		setSearchTerm(term);
	}, []);

	const handleSort = useCallback(
		(newSortBy: 'name' | 'date' | 'size') => {
			if (sortBy === newSortBy) {
				setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
			} else {
				setSortBy(newSortBy);
				setSortOrder('asc');
			}
		},
		[sortBy, sortOrder, setSortBy, setSortOrder]
	);

	const handleFilterTags = useCallback((tags: string[]) => {
		setFilterTags(tags);
	}, []);

	const handleFilterCollections = useCallback((collections: string[]) => {
		setFilterCollections(collections);
	}, []);

	const clearFilters = useCallback(() => {
		setSearchTerm('');
		setFilterTags([]);
		setFilterCollections([]);
	}, []);

	return {
		files: sortedFiles,
		totalFiles: files.length,
		filteredCount: sortedFiles.length,
		searchTerm,
		filterTags,
		filterCollections,
		sortBy,
		sortOrder,
		handleSearch,
		handleSort,
		handleFilterTags,
		handleFilterCollections,
		clearFilters,
	};
}
