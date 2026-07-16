import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { WildcardCreateInput, WildcardUpdateInput, WildcardWithStats } from '@/types/entities/wildcard';
import { FavoriteEntityType } from '@/types/entities/favorite';
import { apiClient } from './client';
import { invalidateFavoriteQueries } from './favorite-cache';

export interface WildcardFilters {
	limit?: number;
	offset?: number;
	search?: string;
	sortBy?: 'name' | 'createdAt' | 'updatedAt';
	sortOrder?: 'asc' | 'desc';
}

export interface WildcardsResponse {
	data: WildcardWithStats[];
	pagination: {
		total: number;
		limit: number;
		offset: number;
		hasNext: boolean;
		hasPrev: boolean;
	};
}

// Query keys
export const wildcardKeys = {
	all: ['wildcards'] as const,
	lists: () => [...wildcardKeys.all, 'list'] as const,
	list: (filters: WildcardFilters) => [...wildcardKeys.lists(), filters] as const,
	details: () => [...wildcardKeys.all, 'detail'] as const,
	detail: (id: string) => [...wildcardKeys.details(), id] as const,
	roots: () => [...wildcardKeys.all, 'roots'] as const,
};

// Hooks
export function useWildcards(filters: WildcardFilters = {}) {
	return useQuery<WildcardsResponse, Error>({
		queryKey: wildcardKeys.list(filters),
		queryFn: () => {
			const params = new URLSearchParams();
			for (const [key, value] of Object.entries(filters)) {
				if (value !== undefined && value !== null) {
					params.append(key, String(value));
				}
			}
			return apiClient.get<WildcardsResponse>(`/wildcards?${params.toString()}`);
		},
		staleTime: 1000 * 60, // 1 minuto
	});
}

export function useWildcard(id: string) {
	return useQuery<WildcardWithStats, Error>({
		queryKey: wildcardKeys.detail(id),
		queryFn: () => apiClient.get<WildcardWithStats>(`/wildcards/${id}`),
		enabled: !!id,
		staleTime: 1000 * 60, // 1 minuto
	});
}

export function useCreateWildcard() {
	const queryClient = useQueryClient();

	return useMutation<WildcardWithStats, Error, WildcardCreateInput>({
		mutationFn: (data) => apiClient.post<WildcardWithStats>('/wildcards', data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: wildcardKeys.lists() });
			queryClient.invalidateQueries({ queryKey: wildcardKeys.roots() });
			void invalidateFavoriteQueries(queryClient);
		},
	});
}

export function useUpdateWildcard() {
	const queryClient = useQueryClient();

	return useMutation<WildcardWithStats, Error, { id: string; data: WildcardUpdateInput }>({
		mutationFn: ({ id, data }) => apiClient.put<WildcardWithStats>(`/wildcards/${id}`, data),
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: wildcardKeys.lists() });
			queryClient.invalidateQueries({ queryKey: wildcardKeys.roots() });
			void invalidateFavoriteQueries(queryClient);
			queryClient.setQueryData(wildcardKeys.detail(data.id), data);
		},
	});
}

export function useDeleteWildcard() {
	const queryClient = useQueryClient();

	return useMutation<void, Error, string>({
		mutationFn: (id) => apiClient.delete(`/wildcards/${id}`),
		onSuccess: (_, id) => {
			queryClient.invalidateQueries({ queryKey: wildcardKeys.lists() });
			queryClient.invalidateQueries({ queryKey: wildcardKeys.roots() });
			void invalidateFavoriteQueries(queryClient);
			queryClient.removeQueries({ queryKey: wildcardKeys.detail(id) });
		},
	});
}

export function useRootWildcards() {
	return useQuery<WildcardWithStats[], Error>({
		queryKey: wildcardKeys.roots(),
		queryFn: () => apiClient.get<WildcardWithStats[]>('/wildcards/roots'),
		staleTime: 1000 * 60, // 1 minuto
	});
}

export function useToggleWildcardFavorite() {
	const queryClient = useQueryClient();

	return useMutation<WildcardWithStats, Error, string>({
		mutationFn: async (id) => {
			await apiClient.post('/favorites/toggle', { entityId: id, entityType: FavoriteEntityType.WILDCARD });
			return apiClient.get<WildcardWithStats>(`/wildcards/${id}`);
		},
		onSuccess: (data) => {
			void invalidateFavoriteQueries(queryClient);
			queryClient.invalidateQueries({ queryKey: wildcardKeys.lists() });
			queryClient.invalidateQueries({ queryKey: wildcardKeys.roots() });
			queryClient.setQueryData(wildcardKeys.detail(data.id), data);
		},
	});
}

export function useMoveWildcard() {
	const queryClient = useQueryClient();

	return useMutation<WildcardWithStats, Error, { id: string; newParentId: string | null }>({
		mutationFn: ({ id, newParentId }) => apiClient.patch<WildcardWithStats>(`/wildcards/${id}/move`, { newParentId }),
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: wildcardKeys.lists() });
			queryClient.invalidateQueries({ queryKey: wildcardKeys.roots() });
			queryClient.setQueryData(wildcardKeys.detail(data.id), data);
		},
	});
}

export function useSearchWildcards(query: string) {
	return useQuery<WildcardWithStats[], Error>({
		queryKey: [...wildcardKeys.all, 'search', query],
		queryFn: () => apiClient.get<WildcardWithStats[]>(`/wildcards/search?q=${encodeURIComponent(query)}`),
		enabled: !!query && query.length > 0,
		staleTime: 1000 * 30, // 30 segundos
	});
}
