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

// Tipos FTS
export interface FtsItem {
	id: string;
	name: string;
	path: string;
	tags?: string; // JSON string (servidor devuelve texto)
}
export interface FtsResult {
	items: FtsItem[];
	total: number;
	query: string;
	took: number;
	engine: 'fts5' | 'like';
}

// Query keys
export const searchKeys = {
	all: ['search'] as const,
	searches: () => [...searchKeys.all, 'searches'] as const,
	search: (filters: SearchFilters) => [...searchKeys.searches(), filters] as const,
	fts: (q: string, limit = 50, offset = 0) => [...searchKeys.all, 'fts', { q, limit, offset }] as const,
};

// Hooks
export function useSearch(filters: SearchFilters) {
	return useQuery<SearchResult, Error>({
		queryKey: searchKeys.search(filters),
		queryFn: () => {
			const params = new URLSearchParams();
			if (filters && typeof filters === 'object') {
				for (const [key, value] of Object.entries(filters)) {
					if (value !== undefined && value !== null) {
						params.append(key, String(value));
					}
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

export function useFtsSearch(q: string, limit = 50, offset = 0) {
	return useQuery<FtsResult, Error>({
		queryKey: searchKeys.fts(q, limit, offset),
		queryFn: () => apiClient.get<FtsResult>(`/search/fts?q=${encodeURIComponent(q)}&limit=${limit}&offset=${offset}`),
		enabled: !!q && q.length > 0,
		staleTime: 1000 * 10,
	});
}
