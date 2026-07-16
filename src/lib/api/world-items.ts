import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ImageWithStats } from '@/types/entities/image';
import type { WorldItemWithStats } from '@/types/entities/world-item';
import { apiClient } from './client';
import { invalidateFavoriteQueries } from './favorite-cache';

export interface WorldItemFilters {
	featuredImage?: string;
	history?: string;
	limit?: number;
	materials?: string;
	notes?: string;
	offset?: number;
	origin?: string;
	parentId?: string;
	properties?: string;
	rarity?: string;
	search?: string;
	sortBy?:
		| 'name'
		| 'createdAt'
		| 'updatedAt'
		| 'totalImages'
		| 'totalVideos'
		| 'type'
		| 'rarity'
		| 'value'
		| 'weight'
		| 'materials'
		| 'origin'
		| 'properties'
		| 'uses'
		| 'history'
		| 'notes'
		| 'featuredImage'
		| 'parentId';
	sortOrder?: 'asc' | 'desc';
	type?: string;
	uses?: string;
	value?: string;
	weight?: string;
}

export interface WorldItemCreateInput {
	category?: string | null;
	color?: string | null;
	description?: string | null;
	emoji?: string | null;
	featuredImage?: string | null;
	history?: string | null;
	isPublic?: boolean;
	isFavorite?: boolean;
	materials?: string | null;
	name: string;
	notes?: string | null;
	origin?: string | null;
	parentId?: string | null;
	properties?: string | null;
	rarity?: string | null;
	totalImages?: number;
	totalVideos?: number;
	type?: string | null;
	uses?: string | null;
	value?: string | null;
	weight?: string | null;
}

export interface WorldItemUpdateInput {
	category?: string | null;
	color?: string | null;
	description?: string | null;
	emoji?: string | null;
	featuredImage?: string | null;
	history?: string | null;
	isPublic?: boolean;
	isFavorite?: boolean;
	materials?: string | null;
	name?: string;
	notes?: string | null;
	origin?: string | null;
	parentId?: string | null;
	properties?: string | null;
	rarity?: string | null;
	totalImages?: number;
	totalVideos?: number;
	type?: string | null;
	uses?: string | null;
	value?: string | null;
	weight?: string | null;
}

export interface WorldItemsResponse {
	data: WorldItemWithStats[];
	pagination: {
		total: number;
		limit: number;
		offset: number;
		hasNext: boolean;
		hasPrev: boolean;
	};
}

// Query keys
export const worldItemKeys = {
	all: ['world-items'] as const,
	lists: () => [...worldItemKeys.all, 'list'] as const,
	list: (filters: WorldItemFilters) => [...worldItemKeys.lists(), filters] as const,
	details: () => [...worldItemKeys.all, 'detail'] as const,
	detail: (id: string) => [...worldItemKeys.details(), id] as const,
	images: (id: string) => [...worldItemKeys.detail(id), 'images'] as const,
};

// Hooks
export function useWorldItems(filters: WorldItemFilters = {}) {
	return useQuery<WorldItemsResponse, Error>({
		queryKey: worldItemKeys.list(filters),
		queryFn: () => {
			const params = new URLSearchParams();
			for (const [key, value] of Object.entries(filters)) {
				if (value !== undefined && value !== null) {
					params.append(key, String(value));
				}
			}
			return apiClient.get<WorldItemsResponse>(`/world-items?${params.toString()}`);
		},
		staleTime: 1000 * 60, // 1 minuto
	});
}

export function useWorldItem(id: string) {
	return useQuery<WorldItemWithStats, Error>({
		queryKey: worldItemKeys.detail(id),
		queryFn: () => apiClient.get<WorldItemWithStats>(`/world-items/${id}`),
		enabled: !!id,
		staleTime: 1000 * 60, // 1 minuto
	});
}

export function useWorldItemImages(id: string) {
	return useQuery<ImageWithStats[], Error>({
		queryKey: worldItemKeys.images(id),
		queryFn: () => apiClient.get<ImageWithStats[]>(`/world-items/${id}/images`),
		enabled: !!id,
		staleTime: 1000 * 30, // 30 segundos
	});
}

export function useCreateWorldItem() {
	const queryClient = useQueryClient();

	return useMutation<WorldItemWithStats, Error, WorldItemCreateInput>({
		mutationFn: (data) => apiClient.post<WorldItemWithStats>('/world-items', data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: worldItemKeys.lists() });
			void invalidateFavoriteQueries(queryClient);
		},
	});
}

export function useUpdateWorldItem() {
	const queryClient = useQueryClient();

	return useMutation<WorldItemWithStats, Error, { id: string; data: WorldItemUpdateInput }>({
		mutationFn: ({ id, data }) => apiClient.put<WorldItemWithStats>(`/world-items/${id}`, data),
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: worldItemKeys.lists() });
			void invalidateFavoriteQueries(queryClient);
			queryClient.setQueryData(worldItemKeys.detail(data.id), data);
		},
	});
}

export function useDeleteWorldItem() {
	const queryClient = useQueryClient();

	return useMutation<void, Error, string>({
		mutationFn: (id) => apiClient.delete(`/world-items/${id}`),
		onSuccess: (_, id) => {
			queryClient.invalidateQueries({ queryKey: worldItemKeys.lists() });
			void invalidateFavoriteQueries(queryClient);
			queryClient.removeQueries({ queryKey: worldItemKeys.detail(id) });
			queryClient.removeQueries({ queryKey: worldItemKeys.images(id) });
		},
	});
}

export function useRecentWorldItemImages(worldItemId: string, limit = 6) {
	return useQuery<Array<{ id: string; name?: string | null; thumbnailUrl: string; url?: string }>, Error>({
		queryKey: [...worldItemKeys.detail(worldItemId), 'recent-images', limit],
		queryFn: () =>
			apiClient.get<Array<{ id: string; name?: string | null; thumbnailUrl: string; url?: string }>>(
				`/world-items/${worldItemId}/recent-images?limit=${limit}`
			),
		enabled: !!worldItemId,
	});
}
