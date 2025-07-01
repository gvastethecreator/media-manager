import type { FavoriteWithStats } from '@/types/entities/favorite';
import type { ImageWithStats } from '@/types/entities/image';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

export interface FavoriteFilters {
	search?: string;
	limit?: number;
	offset?: number;
	sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'imageCount';
	sortOrder?: 'asc' | 'desc';
	type?: string;
}

export interface FavoriteCreateInput {
	name: string;
	description?: string;
	type?: string;
	color?: string;
	emoji?: string;
}

export interface FavoriteUpdateInput {
	name?: string;
	description?: string;
	type?: string;
	color?: string;
	emoji?: string;
}

export interface FavoritesResponse {
	data: FavoriteWithStats[];
	pagination: {
		total: number;
		limit: number;
		offset: number;
		hasNext: boolean;
		hasPrev: boolean;
	};
}

// Query keys
export const favoriteKeys = {
	all: ['favorites'] as const,
	lists: () => [...favoriteKeys.all, 'list'] as const,
	list: (filters: FavoriteFilters) => [...favoriteKeys.lists(), filters] as const,
	details: () => [...favoriteKeys.all, 'detail'] as const,
	detail: (id: string) => [...favoriteKeys.details(), id] as const,
	images: (id: string) => [...favoriteKeys.detail(id), 'images'] as const,
};

// Hooks
export function useFavorites(filters: FavoriteFilters = {}) {
	return useQuery<FavoritesResponse, Error>({
		queryKey: favoriteKeys.list(filters),
		queryFn: () => {
			const params = new URLSearchParams();
			for (const [key, value] of Object.entries(filters)) {
				if (value !== undefined && value !== null) {
					params.append(key, String(value));
				}
			}
			return api.get<FavoritesResponse>(`/favorites?${params.toString()}`);
		},
		staleTime: 1000 * 60, // 1 minuto
	});
}

export function useFavorite(id: string) {
	return useQuery<FavoriteWithStats, Error>({
		queryKey: favoriteKeys.detail(id),
		queryFn: () => api.get<FavoriteWithStats>(`/favorites/${id}`),
		enabled: !!id,
		staleTime: 1000 * 60, // 1 minuto
	});
}

export function useFavoriteImages(id: string) {
	return useQuery<ImageWithStats[], Error>({
		queryKey: favoriteKeys.images(id),
		queryFn: () => api.get<ImageWithStats[]>(`/favorites/${id}/images`),
		enabled: !!id,
		staleTime: 1000 * 30, // 30 segundos
	});
}

export function useCreateFavorite() {
	const queryClient = useQueryClient();

	return useMutation<FavoriteWithStats, Error, FavoriteCreateInput>({
		mutationFn: (data) => api.post<FavoriteWithStats>('/favorites', data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: favoriteKeys.lists() });
		},
	});
}

export function useUpdateFavorite() {
	const queryClient = useQueryClient();

	return useMutation<FavoriteWithStats, Error, { id: string; data: FavoriteUpdateInput }>({
		mutationFn: ({ id, data }) => api.put<FavoriteWithStats>(`/favorites/${id}`, data),
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: favoriteKeys.lists() });
			queryClient.setQueryData(favoriteKeys.detail(data.id), data);
		},
	});
}

export function useDeleteFavorite() {
	const queryClient = useQueryClient();

	return useMutation<void, Error, string>({
		mutationFn: (id) => api.delete(`/favorites/${id}`),
		onSuccess: (_, id) => {
			queryClient.invalidateQueries({ queryKey: favoriteKeys.lists() });
			queryClient.removeQueries({ queryKey: favoriteKeys.detail(id) });
			queryClient.removeQueries({ queryKey: favoriteKeys.images(id) });
		},
	});
}

export function useAddImageToFavorite() {
	const queryClient = useQueryClient();

	return useMutation<void, Error, { favoriteId: string; imageId: string }>({
		mutationFn: ({ favoriteId, imageId }) => api.post(`/favorites/${favoriteId}/images/${imageId}`),
		onSuccess: (_, { favoriteId }) => {
			queryClient.invalidateQueries({ queryKey: favoriteKeys.images(favoriteId) });
			queryClient.invalidateQueries({ queryKey: favoriteKeys.detail(favoriteId) });
		},
	});
}

export function useRemoveImageFromFavorite() {
	const queryClient = useQueryClient();

	return useMutation<void, Error, { favoriteId: string; imageId: string }>({
		mutationFn: ({ favoriteId, imageId }) => api.delete(`/favorites/${favoriteId}/images/${imageId}`),
		onSuccess: (_, { favoriteId }) => {
			queryClient.invalidateQueries({ queryKey: favoriteKeys.images(favoriteId) });
			queryClient.invalidateQueries({ queryKey: favoriteKeys.detail(favoriteId) });
		},
	});
}
