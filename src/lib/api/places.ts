import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ImageWithStats } from '@/types/entities/image';
import type { PlaceWithStats } from '@/types/entities/place';
import { api } from './client';

export interface PlaceFilters {
	search?: string;
	limit?: number;
	offset?: number;
	sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'imageCount';
	sortOrder?: 'asc' | 'desc';
}

export interface PlaceCreateInput {
	name: string;
	description?: string;
	color?: string;
	location?: string;
	coordinates?: {
		lat: number;
		lng: number;
	};
}

export interface PlaceUpdateInput {
	name?: string;
	description?: string;
	color?: string;
	location?: string;
	coordinates?: {
		lat: number;
		lng: number;
	};
}

export interface PlacesResponse {
	data: PlaceWithStats[];
	pagination: {
		total: number;
		limit: number;
		offset: number;
		hasNext: boolean;
		hasPrev: boolean;
	};
}

// Query keys
export const placeKeys = {
	all: ['places'] as const,
	lists: () => [...placeKeys.all, 'list'] as const,
	list: (filters: PlaceFilters) => [...placeKeys.lists(), filters] as const,
	details: () => [...placeKeys.all, 'detail'] as const,
	detail: (id: string) => [...placeKeys.details(), id] as const,
	images: (id: string) => [...placeKeys.detail(id), 'images'] as const,
};

// Hooks
export function usePlaces(filters: PlaceFilters = {}) {
	return useQuery<PlacesResponse, Error>({
		queryKey: placeKeys.list(filters),
		queryFn: () => {
			const params = new URLSearchParams();
			for (const [key, value] of Object.entries(filters)) {
				if (value !== undefined && value !== null) {
					params.append(key, String(value));
				}
			}
			return api.get<PlacesResponse>(`/places?${params.toString()}`);
		},
		staleTime: 1000 * 60, // 1 minuto
	});
}

export function usePlace(id: string) {
	return useQuery<PlaceWithStats, Error>({
		queryKey: placeKeys.detail(id),
		queryFn: () => api.get<PlaceWithStats>(`/places/${id}`),
		enabled: !!id,
		staleTime: 1000 * 60, // 1 minuto
	});
}

export function usePlaceImages(id: string) {
	return useQuery<ImageWithStats[], Error>({
		queryKey: placeKeys.images(id),
		queryFn: () => api.get<ImageWithStats[]>(`/places/${id}/images`),
		enabled: !!id,
		staleTime: 1000 * 30, // 30 segundos
	});
}

export function useCreatePlace() {
	const queryClient = useQueryClient();

	return useMutation<PlaceWithStats, Error, PlaceCreateInput>({
		mutationFn: (data) => api.post<PlaceWithStats>('/places', data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: placeKeys.lists() });
		},
	});
}

export function useUpdatePlace() {
	const queryClient = useQueryClient();

	return useMutation<PlaceWithStats, Error, { id: string; data: PlaceUpdateInput }>({
		mutationFn: ({ id, data }) => api.put<PlaceWithStats>(`/places/${id}`, data),
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: placeKeys.lists() });
			queryClient.setQueryData(placeKeys.detail(data.id), data);
		},
	});
}

export function useDeletePlace() {
	const queryClient = useQueryClient();

	return useMutation<void, Error, string>({
		mutationFn: (id) => api.delete(`/places/${id}`),
		onSuccess: (_, id) => {
			queryClient.invalidateQueries({ queryKey: placeKeys.lists() });
			queryClient.removeQueries({ queryKey: placeKeys.detail(id) });
			queryClient.removeQueries({ queryKey: placeKeys.images(id) });
		},
	});
}
