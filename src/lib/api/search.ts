import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { FileItem } from '@/types/files';
import { apiClient } from './client';

export interface SearchFilters {
	query: string;
	limit?: number;
	type?: 'images' | 'videos' | 'audio' | 'all' | 'image' | 'video' | 'audio' | 'document';
	sortBy?: 'relevance' | 'date' | 'name';
	sortOrder?: 'asc' | 'desc';
}

export interface SearchResult {
	items: FileItem[];
	total: number;
	query: string;
	took: number;
}

// Nuevo tipo para búsqueda unificada
export interface SearchParams {
	query: string;
	type?: 'all' | 'image' | 'video' | 'audio' | 'document';
	limit?: number;
	offset?: number;
}

// Tipos FTS
export interface FtsItem {
	id: string;
	name: string;
	path: string;
	tags?: string;
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
	// Nuevos keys para búsqueda unificada
	unified: (params: SearchParams) => [...searchKeys.all, 'unified', params] as const,
};

// Hooks existentes
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
		staleTime: 1000 * 30,
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

// === NUEVO: Hook para búsqueda unificada ===
export function useSearchUnified(params: SearchParams) {
	const enabled = !!params.query && params.query.length > 0;

	return useQuery({
		queryKey: searchKeys.unified(params),
		queryFn: () => apiClient.get<any>('/api/search', { 
			params: {
				q: params.query,
				type: params.type,
				limit: params.limit,
				offset: params.offset,
			}
		}),
		enabled,
		staleTime: 30_000,
	});
}

export function useInvalidateSearch() {
	const queryClient = useQueryClient();
	return () => queryClient.invalidateQueries({ queryKey: searchKeys.all });
}
