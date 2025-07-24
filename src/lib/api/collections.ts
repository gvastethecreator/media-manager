import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CollectionWithStats } from '@/types/entities/collection';
import type { ImageWithStats } from '@/types/entities/image';
import { apiClient } from './client';

export interface CollectionFilters {
	search?: string;
	limit?: number;
	offset?: number;
	sortBy?: 'name' | 'createdAt' | 'updatedAt';
	sortOrder?: 'asc' | 'desc';
}

export interface CollectionCreateInput {
	name: string; // Requerido
	description?: string | null;
	emoji?: string | null;
	color?: string | null;
	featuredImage?: string | null;
	isPublic?: boolean;
	isFavorite?: boolean;
	totalImages?: number;
	totalVideos?: number;
	totalSize?: number;
	lastImageAddedAt?: Date | null;
	lastVideoAddedAt?: Date | null;
	parentId?: string | null;
}

export interface CollectionUpdateInput {
	name?: string;
	description?: string | null;
	emoji?: string | null;
	color?: string | null;
	featuredImage?: string | null;
	isPublic?: boolean;
	isFavorite?: boolean;
	totalImages?: number;
	totalVideos?: number;
	totalSize?: number;
	lastImageAddedAt?: Date | null;
	lastVideoAddedAt?: Date | null;
	parentId?: string | null;
}

export interface CollectionsResponse {
	data: CollectionWithStats[];
	pagination: {
		total: number;
		limit: number;
		offset: number;
		hasNext: boolean;
		hasPrev: boolean;
	};
}

// Query keys
export const collectionKeys = {
	all: ['collections'] as const,
	lists: () => [...collectionKeys.all, 'list'] as const,
	list: (filters: CollectionFilters) => [...collectionKeys.lists(), filters] as const,
	details: () => [...collectionKeys.all, 'detail'] as const,
	detail: (id: string) => [...collectionKeys.details(), id] as const,
	images: (id: string) => [...collectionKeys.detail(id), 'images'] as const,
};

// Hooks
export function useCollections(filters: CollectionFilters = {}) {
	return useQuery<CollectionsResponse, Error>({
		queryKey: collectionKeys.list(filters),
		queryFn: () => {
			const params = new URLSearchParams();
			for (const [key, value] of Object.entries(filters)) {
				if (value !== undefined && value !== null) {
					params.append(key, String(value));
				}
			}
			return apiClient.get<CollectionsResponse>(`/collections?${params.toString()}`);
		},
		staleTime: 1000 * 60, // 1 minuto
	});
}

export function useCollection(id: string) {
	return useQuery<CollectionWithStats, Error>({
		queryKey: collectionKeys.detail(id),
		queryFn: () => apiClient.get<CollectionWithStats>(`/collections/${id}`),
		enabled: !!id,
		staleTime: 1000 * 60, // 1 minuto
	});
}

export function useCollectionImages(id: string) {
	return useQuery<ImageWithStats[], Error>({
		queryKey: collectionKeys.images(id),
		queryFn: () => apiClient.get<ImageWithStats[]>(`/collections/${id}/images`),
		enabled: !!id,
		staleTime: 1000 * 30, // 30 segundos
	});
}

export function useCreateCollection() {
	const queryClient = useQueryClient();

	return useMutation<CollectionWithStats, Error, CollectionCreateInput>({
		mutationFn: (data) => apiClient.post<CollectionWithStats>('/collections', data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: collectionKeys.lists() });
		},
	});
}

export function useUpdateCollection() {
	const queryClient = useQueryClient();

	return useMutation<CollectionWithStats, Error, { id: string; data: CollectionUpdateInput }>({
		mutationFn: ({ id, data }) => apiClient.put<CollectionWithStats>(`/collections/${id}`, data),
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: collectionKeys.lists() });
			queryClient.setQueryData(collectionKeys.detail(data.id), data);
		},
	});
}

export function useDeleteCollection() {
	const queryClient = useQueryClient();

	return useMutation<void, Error, string>({
		mutationFn: (id) => apiClient.delete(`/collections/${id}`),
		onSuccess: (_, id) => {
			queryClient.invalidateQueries({ queryKey: collectionKeys.lists() });
			queryClient.removeQueries({ queryKey: collectionKeys.detail(id) });
			queryClient.removeQueries({ queryKey: collectionKeys.images(id) });
		},
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
