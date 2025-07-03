import { useQuery } from '@tanstack/react-query';
import type { FileItem } from '@/types/files';
import { apiClient } from './client';

export interface SearchFilters {
	query: string;
	limit?: number;
	type?: 'images' | 'videos' | 'audio' | 'all';
	sortBy?: 'relevance' | 'date' | 'name';
	sortOrder?: 'asc' | 'desc';
}

export interface SearchResult {
	items: FileItem[];
	total: number;
	query: string;
	took: number; // tiempo en ms
}

// Query keys
export const searchKeys = {
	all: ['search'] as const,
	searches: () => [...searchKeys.all, 'searches'] as const,
	search: (filters: SearchFilters) => [...searchKeys.searches(), filters] as const,
};

// Hooks
export function useSearch(filters: SearchFilters) {
	return useQuery<SearchResult, Error>({
		queryKey: searchKeys.search(filters),
		queryFn: () => {
			const params = new URLSearchParams();
			for (const [key, value] of Object.entries(filters)) {
				if (value !== undefined && value !== null) {
					params.append(key, String(value));
				}
			}
			return apiClient.get<SearchResult>(`/search?${params.toString()}`);
		},
		enabled: !!filters.query && filters.query.length > 0,
		staleTime: 1000 * 30, // 30 segundos
	});
}

export function useSearchImages(query: string, limit = 100) {
	return useSearch({
		query,
		limit,
		type: 'images',
	});
}
