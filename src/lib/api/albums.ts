import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AlbumCreateInput, AlbumUpdateInput, AlbumWithStats } from '@/types/entities/album';
import type { ImageWithStats } from '@/types/entities/image';
import { createEntityHooks } from './hook-factory';
import type { EntityListResult } from './hook-factory';
import { apiClient } from './client';

export type { AlbumCreateInput, AlbumUpdateInput, AlbumWithStats } from '@/types/entities/album';

export interface AlbumFilters {
	[key: string]: unknown;
	limit?: number;
	offset?: number;
	search?: string;
	sortBy?: 'name' | 'createdAt' | 'updatedAt';
	sortOrder?: 'asc' | 'desc';
}

const hooks = createEntityHooks<AlbumWithStats, AlbumCreateInput, AlbumUpdateInput, AlbumFilters>({
	entityName: 'albums',
	baseEndpoint: '/albums',
	listStaleTime: 60_000,
	detailStaleTime: 60_000,
});

export const albumKeys = {
	...hooks.keys,
	images: (id: string) => [...hooks.keys.detail(id), 'images'] as const,
};

export const useAlbums = hooks.useList;
export const useAlbum = hooks.useDetail;
export const useCreateAlbum = hooks.useCreate;
export const useUpdateAlbum = hooks.useUpdate;
export const useDeleteAlbum = hooks.useDelete;

export type AlbumsResponse = EntityListResult<AlbumWithStats>;

export function useAlbumImages(id: string) {
	return useQuery<ImageWithStats[], Error>({
		queryKey: albumKeys.images(id),
		queryFn: () => apiClient.get<ImageWithStats[]>(`/albums/${id}/images`),
		enabled: !!id,
		staleTime: 1000 * 30,
	});
}

export function useAddImageToAlbum() {
	const queryClient = useQueryClient();

	return useMutation<void, Error, { albumId: string; imageId: string }>({
		mutationFn: ({ albumId, imageId }) => apiClient.post(`/albums/${albumId}/images/${imageId}`),
		onSuccess: (_, { albumId }) => {
			queryClient.invalidateQueries({ queryKey: albumKeys.images(albumId) });
			queryClient.invalidateQueries({ queryKey: albumKeys.detail(albumId) });
		},
	});
}

export function useRemoveImageFromAlbum() {
	const queryClient = useQueryClient();

	return useMutation<void, Error, { albumId: string; imageId: string }>({
		mutationFn: ({ albumId, imageId }) => apiClient.delete(`/albums/${albumId}/images/${imageId}`),
		onSuccess: (_, { albumId }) => {
			queryClient.invalidateQueries({ queryKey: albumKeys.images(albumId) });
			queryClient.invalidateQueries({ queryKey: albumKeys.detail(albumId) });
		},
	});
}

export function useAlbumRecentMedia(albumId: string, limit = 6) {
	return useQuery<
		Array<{ id: string; name?: string | null; thumbnailUrl: string; url?: string; isVideo?: boolean }>,
		Error
	>({
		queryKey: [...albumKeys.detail(albumId), 'recent-media', limit],
		queryFn: () =>
			apiClient.get<Array<{ id: string; name?: string | null; thumbnailUrl: string; url?: string; isVideo?: boolean }>>(
				`/albums/${albumId}/recent-media?limit=${limit}`
			),
		enabled: !!albumId,
	});
}
