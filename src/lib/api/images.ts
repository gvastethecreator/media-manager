import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ImageWithStats } from '@/types/entities/image';
import { apiClient } from './client';

// Tipos para filtros de imágenes
export interface ImageFilters {
	folderId?: string;
	isFavorite?: boolean;
	minWidth?: number;
	maxWidth?: number;
	minHeight?: number;
	maxHeight?: number;
	minSize?: number;
	maxSize?: number;
	search?: string;
	tags?: string[];
	albums?: string[];
	characters?: string[];
	limit?: number;
	offset?: number;
	sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'size' | 'width' | 'height';
	sortOrder?: 'asc' | 'desc';
}

export interface ImageCreateInput {
	name: string;
	path: string;
	hash: string;
	size: number;
	width: number;
	height: number;
	metadata?: Record<string, unknown>;
	isFavorite?: boolean;
	folderId: string;
}

export interface ImageUpdateInput {
	name?: string;
	description?: string;
	metadata?: Record<string, unknown>;
	isFavorite?: boolean;
}

export interface ImagesResponse {
	data: ImageWithStats[];
	pagination: {
		total: number;
		limit: number;
		offset: number;
		hasNext: boolean;
		hasPrev: boolean;
	};
}

// Query keys
export const imageKeys = {
	all: ['images'] as const,
	lists: () => [...imageKeys.all, 'list'] as const,
	list: (filters: ImageFilters) => [...imageKeys.lists(), filters] as const,
	details: () => [...imageKeys.all, 'detail'] as const,
	detail: (id: string) => [...imageKeys.details(), id] as const,
};

// Hooks
export function useImages(filters: ImageFilters = {}) {
	return useQuery<ImagesResponse, Error>({
		queryKey: imageKeys.list(filters),
		queryFn: () => {
			const params = new URLSearchParams();
			for (const [key, value] of Object.entries(filters)) {
				if (value !== undefined && value !== null) {
					if (Array.isArray(value)) {
						for (const v of value) {
							params.append(key, String(v));
						}
					} else {
						params.append(key, String(value));
					}
				}
			}
			return apiClient.get<ImagesResponse>(`/images?${params.toString()}`);
		},
		staleTime: 1000 * 30, // 30 segundos
	});
}

export function useImage(id: string) {
	return useQuery<ImageWithStats, Error>({
		queryKey: imageKeys.detail(id),
		queryFn: () => apiClient.get<ImageWithStats>(`/images/${id}`),
		enabled: !!id,
		staleTime: 1000 * 60, // 1 minuto
	});
}

export function useCreateImage() {
	const queryClient = useQueryClient();

	return useMutation<ImageWithStats, Error, ImageCreateInput>({
		mutationFn: (data) => apiClient.post<ImageWithStats>('/images', data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: imageKeys.lists() });
		},
	});
}

export function useUpdateImage() {
	const queryClient = useQueryClient();

	return useMutation<ImageWithStats, Error, { id: string; data: ImageUpdateInput }>({
		mutationFn: ({ id, data }) => apiClient.put<ImageWithStats>(`/images/${id}`, data),
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: imageKeys.lists() });
			queryClient.setQueryData(imageKeys.detail(data.id), data);
		},
	});
}

export function useDeleteImage() {
	const queryClient = useQueryClient();

	return useMutation<void, Error, string>({
		mutationFn: (id) => apiClient.delete(`/images/${id}`),
		onSuccess: (_, id) => {
			queryClient.invalidateQueries({ queryKey: imageKeys.lists() });
			queryClient.removeQueries({ queryKey: imageKeys.detail(id) });
		},
	});
}

export function useToggleFavorite() {
	const queryClient = useQueryClient();

	return useMutation<ImageWithStats, Error, { id: string; isFavorite: boolean }>({
		mutationFn: ({ id, isFavorite }) => apiClient.patch<ImageWithStats>(`/images/${id}`, { isFavorite }),
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: imageKeys.lists() });
			queryClient.setQueryData(imageKeys.detail(data.id), data);
		},
	});
}
