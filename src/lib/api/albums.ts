import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AlbumWithStats } from '@/types/entities/album';
import type { ImageWithStats } from '@/types/entities/image';
import { api } from './client';

export interface AlbumFilters {
	search?: string;
	limit?: number;
	offset?: number;
	sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'imageCount';
	sortOrder?: 'asc' | 'desc';
}

export interface AlbumCreateInput {
	name: string;
	description?: string;
	color?: string;
	isPrivate?: boolean;
}

export interface AlbumUpdateInput {
	name?: string;
	description?: string;
	color?: string;
	isPrivate?: boolean;
}

export interface AlbumsResponse {
	data: AlbumWithStats[];
	pagination: {
		total: number;
		limit: number;
		offset: number;
		hasNext: boolean;
		hasPrev: boolean;
	};
}

// Query keys
export const albumKeys = {
	all: ['albums'] as const,
	lists: () => [...albumKeys.all, 'list'] as const,
	list: (filters: AlbumFilters) => [...albumKeys.lists(), filters] as const,
	details: () => [...albumKeys.all, 'detail'] as const,
	detail: (id: string) => [...albumKeys.details(), id] as const,
	images: (id: string) => [...albumKeys.detail(id), 'images'] as const,
};

// Hooks
export function useAlbums(filters: AlbumFilters = {}) {
	return useQuery<AlbumsResponse, Error>({
		queryKey: albumKeys.list(filters),
		queryFn: () => {
			const params = new URLSearchParams();
			for (const [key, value] of Object.entries(filters)) {
				if (value !== undefined && value !== null) {
					params.append(key, String(value));
				}
			}
			return api.get<AlbumsResponse>(`/albums?${params.toString()}`);
		},
		staleTime: 1000 * 60, // 1 minuto
	});
}

export function useAlbum(id: string) {
	return useQuery<AlbumWithStats, Error>({
		queryKey: albumKeys.detail(id),
		queryFn: () => api.get<AlbumWithStats>(`/albums/${id}`),
		enabled: !!id,
		staleTime: 1000 * 60, // 1 minuto
	});
}

export function useAlbumImages(id: string) {
	return useQuery<ImageWithStats[], Error>({
		queryKey: albumKeys.images(id),
		queryFn: () => api.get<ImageWithStats[]>(`/albums/${id}/images`),
		enabled: !!id,
		staleTime: 1000 * 30, // 30 segundos
	});
}

export function useCreateAlbum() {
	const queryClient = useQueryClient();

	return useMutation<AlbumWithStats, Error, AlbumCreateInput>({
		mutationFn: (data) => api.post<AlbumWithStats>('/albums', data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: albumKeys.lists() });
		},
	});
}

export function useUpdateAlbum() {
	const queryClient = useQueryClient();

	return useMutation<AlbumWithStats, Error, { id: string; data: AlbumUpdateInput }>({
		mutationFn: ({ id, data }) => api.put<AlbumWithStats>(`/albums/${id}`, data),
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: albumKeys.lists() });
			queryClient.setQueryData(albumKeys.detail(data.id), data);
		},
	});
}

export function useDeleteAlbum() {
	const queryClient = useQueryClient();

	return useMutation<void, Error, string>({
		mutationFn: (id) => api.delete(`/albums/${id}`),
		onSuccess: (_, id) => {
			queryClient.invalidateQueries({ queryKey: albumKeys.lists() });
			queryClient.removeQueries({ queryKey: albumKeys.detail(id) });
			queryClient.removeQueries({ queryKey: albumKeys.images(id) });
		},
	});
}

export function useAddImageToAlbum() {
	const queryClient = useQueryClient();

	return useMutation<void, Error, { albumId: string; imageId: string }>({
		mutationFn: ({ albumId, imageId }) => api.post(`/albums/${albumId}/images/${imageId}`),
		onSuccess: (_, { albumId }) => {
			queryClient.invalidateQueries({ queryKey: albumKeys.images(albumId) });
			queryClient.invalidateQueries({ queryKey: albumKeys.detail(albumId) });
		},
	});
}

export function useRemoveImageFromAlbum() {
	const queryClient = useQueryClient();

	return useMutation<void, Error, { albumId: string; imageId: string }>({
		mutationFn: ({ albumId, imageId }) => api.delete(`/albums/${albumId}/images/${imageId}`),
		onSuccess: (_, { albumId }) => {
			queryClient.invalidateQueries({ queryKey: albumKeys.images(albumId) });
			queryClient.invalidateQueries({ queryKey: albumKeys.detail(albumId) });
		},
	});
}
