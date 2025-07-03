import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ImageWithStats } from '@/types/entities/image';
import type { WorldItemWithStats } from '@/types/entities/world-item';
import { api } from './client';

export interface WorldItemFilters {
	search?: string;
	limit?: number;
	offset?: number;
	sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'imageCount';
	sortOrder?: 'asc' | 'desc';
}

export interface WorldItemCreateInput {
	name: string;
	description?: string;
	color?: string;
	category?: string;
	rarity?: string;
}

export interface WorldItemUpdateInput {
	name?: string;
	description?: string;
	color?: string;
	category?: string;
	rarity?: string;
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
			return api.get<WorldItemsResponse>(`/world-items?${params.toString()}`);
		},
		staleTime: 1000 * 60, // 1 minuto
	});
}

export function useWorldItem(id: string) {
	return useQuery<WorldItemWithStats, Error>({
		queryKey: worldItemKeys.detail(id),
		queryFn: () => api.get<WorldItemWithStats>(`/world-items/${id}`),
		enabled: !!id,
		staleTime: 1000 * 60, // 1 minuto
	});
}

export function useWorldItemImages(id: string) {
	return useQuery<ImageWithStats[], Error>({
		queryKey: worldItemKeys.images(id),
		queryFn: () => api.get<ImageWithStats[]>(`/world-items/${id}/images`),
		enabled: !!id,
		staleTime: 1000 * 30, // 30 segundos
	});
}

export function useCreateWorldItem() {
	const queryClient = useQueryClient();

	return useMutation<WorldItemWithStats, Error, WorldItemCreateInput>({
		mutationFn: (data) => api.post<WorldItemWithStats>('/world-items', data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: worldItemKeys.lists() });
		},
	});
}

export function useUpdateWorldItem() {
	const queryClient = useQueryClient();

	return useMutation<WorldItemWithStats, Error, { id: string; data: WorldItemUpdateInput }>({
		mutationFn: ({ id, data }) => api.put<WorldItemWithStats>(`/world-items/${id}`, data),
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: worldItemKeys.lists() });
			queryClient.setQueryData(worldItemKeys.detail(data.id), data);
		},
	});
}

export function useDeleteWorldItem() {
	const queryClient = useQueryClient();

	return useMutation<void, Error, string>({
		mutationFn: (id) => api.delete(`/world-items/${id}`),
		onSuccess: (_, id) => {
			queryClient.invalidateQueries({ queryKey: worldItemKeys.lists() });
			queryClient.removeQueries({ queryKey: worldItemKeys.detail(id) });
			queryClient.removeQueries({ queryKey: worldItemKeys.images(id) });
		},
	});
}
