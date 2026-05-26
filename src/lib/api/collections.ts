import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CollectionCreateInput, CollectionUpdateInput, CollectionWithStats } from '@/types/entities/collection';
import type { ImageWithStats } from '@/types/entities/image';
import { createEntityHooks } from './hook-factory';
import type { EntityListResult } from './hook-factory';
import { apiClient } from './client';

export interface CollectionFilters {
	[key: string]: unknown;
	limit?: number;
	onlyFavorites?: boolean;
	offset?: number;
	parentId?: string | null;
	search?: string;
	sortBy?: 'name' | 'createdAt' | 'updatedAt';
	sortOrder?: 'asc' | 'desc';
}

const hooks = createEntityHooks<CollectionWithStats, CollectionCreateInput, CollectionUpdateInput, CollectionFilters>({
	entityName: 'collections',
	baseEndpoint: '/collections',
	listStaleTime: 60_000,
	detailStaleTime: 60_000,
});

export const collectionKeys = {
	...hooks.keys,
	images: (id: string) => [...hooks.keys.detail(id), 'images'] as const,
};

export const useCollections = hooks.useList;
export const useCollection = hooks.useDetail;
export const useCreateCollection = hooks.useCreate;
export const useUpdateCollection = hooks.useUpdate;
export const useDeleteCollection = hooks.useDelete;

export type CollectionsResponse = EntityListResult<CollectionWithStats>;

export function useCollectionImages(id: string) {
	return useQuery<ImageWithStats[], Error>({
		queryKey: collectionKeys.images(id),
		queryFn: () => apiClient.get<ImageWithStats[]>(`/collections/${id}/images`),
		enabled: !!id,
		staleTime: 1000 * 30,
	});
}

export function useAddImageToCollection() {
	const queryClient = useQueryClient();

	return useMutation<void, Error, { collectionId: string; imageId: string }>({
		mutationFn: ({ collectionId, imageId }) => apiClient.post(`/collections/${collectionId}/images/${imageId}`),
		onSuccess: (_, { collectionId }) => {
			queryClient.invalidateQueries({ queryKey: collectionKeys.images(collectionId) });
			queryClient.invalidateQueries({ queryKey: collectionKeys.detail(collectionId) });
		},
	});
}

export function useRemoveImageFromCollection() {
	const queryClient = useQueryClient();

	return useMutation<void, Error, { collectionId: string; imageId: string }>({
		mutationFn: ({ collectionId, imageId }) => apiClient.delete(`/collections/${collectionId}/images/${imageId}`),
		onSuccess: (_, { collectionId }) => {
			queryClient.invalidateQueries({ queryKey: collectionKeys.images(collectionId) });
			queryClient.invalidateQueries({ queryKey: collectionKeys.detail(collectionId) });
		},
	});
}

export function useToggleCollectionFavorite() {
	const queryClient = useQueryClient();

	return useMutation<CollectionWithStats, Error, string>({
		mutationFn: async (id: string) => {
			const response = await apiClient.post<CollectionWithStats>(`/collections/${id}/favorite`, {});
			return response;
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: collectionKeys.lists() });
			queryClient.setQueryData(collectionKeys.detail(data.id), data);
		},
	});
}

export function useRecentCollectionMedia(collectionId: string, limit = 6) {
	return useQuery<
		Array<{ id: string; name?: string | null; thumbnailUrl: string; url?: string; isVideo?: boolean }>,
		Error
	>({
		queryKey: [...collectionKeys.detail(collectionId), 'media', limit],
		queryFn: () =>
			apiClient.get<Array<{ id: string; name?: string | null; thumbnailUrl: string; url?: string; isVideo?: boolean }>>(
				`/collections/${collectionId}/media?limit=${limit}`
			),
		enabled: !!collectionId,
	});
}
