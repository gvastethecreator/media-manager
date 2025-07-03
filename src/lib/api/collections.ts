import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CollectionWithStats } from '@/types/entities/collection';
import type { ImageWithStats } from '@/types/entities/image';
import { api } from './client';

export interface CollectionFilters {
	search?: string;
	limit?: number;
	offset?: number;
	sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'imageCount';
	sortOrder?: 'asc' | 'desc';
}

export interface CollectionCreateInput {
	name: string;
	description?: string;
	color?: string;
	isPrivate?: boolean;
}

export interface CollectionUpdateInput {
	name?: string;
	description?: string;
	color?: string;
	isPrivate?: boolean;
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
			return api.get<CollectionsResponse>(`/collections?${params.toString()}`);
		},
		staleTime: 1000 * 60, // 1 minuto
	});
}

export function useCollection(id: string) {
	return useQuery<CollectionWithStats, Error>({
		queryKey: collectionKeys.detail(id),
		queryFn: () => api.get<CollectionWithStats>(`/collections/${id}`),
		enabled: !!id,
		staleTime: 1000 * 60, // 1 minuto
	});
}

export function useCollectionImages(id: string) {
	return useQuery<ImageWithStats[], Error>({
		queryKey: collectionKeys.images(id),
		queryFn: () => api.get<ImageWithStats[]>(`/collections/${id}/images`),
		enabled: !!id,
		staleTime: 1000 * 30, // 30 segundos
	});
}

export function useCreateCollection() {
	const queryClient = useQueryClient();

	return useMutation<CollectionWithStats, Error, CollectionCreateInput>({
		mutationFn: (data) => api.post<CollectionWithStats>('/collections', data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: collectionKeys.lists() });
		},
	});
}

export function useUpdateCollection() {
	const queryClient = useQueryClient();

	return useMutation<CollectionWithStats, Error, { id: string; data: CollectionUpdateInput }>({
		mutationFn: ({ id, data }) => api.put<CollectionWithStats>(`/collections/${id}`, data),
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: collectionKeys.lists() });
			queryClient.setQueryData(collectionKeys.detail(data.id), data);
		},
	});
}

export function useDeleteCollection() {
	const queryClient = useQueryClient();

	return useMutation<void, Error, string>({
		mutationFn: (id) => api.delete(`/collections/${id}`),
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
		mutationFn: ({ collectionId, imageId }) => api.post(`/collections/${collectionId}/images/${imageId}`),
		onSuccess: (_, { collectionId }) => {
			queryClient.invalidateQueries({ queryKey: collectionKeys.images(collectionId) });
			queryClient.invalidateQueries({ queryKey: collectionKeys.detail(collectionId) });
		},
	});
}

export function useRemoveImageFromCollection() {
	const queryClient = useQueryClient();

	return useMutation<void, Error, { collectionId: string; imageId: string }>({
		mutationFn: ({ collectionId, imageId }) => api.delete(`/collections/${collectionId}/images/${imageId}`),
		onSuccess: (_, { collectionId }) => {
			queryClient.invalidateQueries({ queryKey: collectionKeys.images(collectionId) });
			queryClient.invalidateQueries({ queryKey: collectionKeys.detail(collectionId) });
		},
	});
}
