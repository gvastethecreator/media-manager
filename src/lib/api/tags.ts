import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ImageWithStats } from '@/types/entities/image';
import type { TagWithStats } from '@/types/entities/tag';
import { api } from './client';

export interface TagFilters {
	search?: string;
	limit?: number;
	offset?: number;
	sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'imageCount';
	sortOrder?: 'asc' | 'desc';
}

export interface TagCreateInput {
	name: string;
	description?: string;
	color?: string;
	emoji?: string;
}

export interface TagUpdateInput {
	name?: string;
	description?: string;
	color?: string;
	emoji?: string;
}

export interface TagsResponse {
	data: TagWithStats[];
	pagination: {
		total: number;
		limit: number;
		offset: number;
		hasNext: boolean;
		hasPrev: boolean;
	};
}

// Query keys
export const tagKeys = {
	all: ['tags'] as const,
	lists: () => [...tagKeys.all, 'list'] as const,
	list: (filters: TagFilters) => [...tagKeys.lists(), filters] as const,
	details: () => [...tagKeys.all, 'detail'] as const,
	detail: (id: string) => [...tagKeys.details(), id] as const,
	images: (id: string) => [...tagKeys.detail(id), 'images'] as const,
};

// Hooks
export function useTags(filters: TagFilters = {}) {
	return useQuery<TagsResponse, Error>({
		queryKey: tagKeys.list(filters),
		queryFn: () => {
			const params = new URLSearchParams();
			for (const [key, value] of Object.entries(filters)) {
				if (value !== undefined && value !== null) {
					params.append(key, String(value));
				}
			}
			return api.get<TagsResponse>(`/tags?${params.toString()}`);
		},
		staleTime: 1000 * 60, // 1 minuto
	});
}

export function useTag(id: string) {
	return useQuery<TagWithStats, Error>({
		queryKey: tagKeys.detail(id),
		queryFn: () => api.get<TagWithStats>(`/tags/${id}`),
		enabled: !!id,
		staleTime: 1000 * 60, // 1 minuto
	});
}

export function useTagImages(id: string) {
	return useQuery<ImageWithStats[], Error>({
		queryKey: tagKeys.images(id),
		queryFn: () => api.get<ImageWithStats[]>(`/tags/${id}/images`),
		enabled: !!id,
		staleTime: 1000 * 30, // 30 segundos
	});
}

export function useCreateTag() {
	const queryClient = useQueryClient();

	return useMutation<TagWithStats, Error, TagCreateInput>({
		mutationFn: (data) => api.post<TagWithStats>('/tags', data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: tagKeys.lists() });
		},
	});
}

export function useUpdateTag() {
	const queryClient = useQueryClient();

	return useMutation<TagWithStats, Error, { id: string; data: TagUpdateInput }>({
		mutationFn: ({ id, data }) => api.put<TagWithStats>(`/tags/${id}`, data),
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: tagKeys.lists() });
			queryClient.setQueryData(tagKeys.detail(data.id), data);
		},
	});
}

export function useDeleteTag() {
	const queryClient = useQueryClient();

	return useMutation<void, Error, string>({
		mutationFn: (id) => api.delete(`/tags/${id}`),
		onSuccess: (_, id) => {
			queryClient.invalidateQueries({ queryKey: tagKeys.lists() });
			queryClient.removeQueries({ queryKey: tagKeys.detail(id) });
			queryClient.removeQueries({ queryKey: tagKeys.images(id) });
		},
	});
}
