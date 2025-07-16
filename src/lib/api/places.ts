import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ImageWithStats } from '@/types/entities/image';
import type { PlaceWithStats } from '@/types/entities/place';
import { apiClient } from './client';

export interface PlaceFilters {
	search?: string;
	limit?: number;
	offset?: number;
	sortBy?:
		| 'name'
		| 'createdAt'
		| 'updatedAt'
		| 'totalImages'
		| 'totalVideos'
		| 'type'
		| 'location'
		| 'climate'
		| 'population'
		| 'government'
		| 'economy'
		| 'culture'
		| 'history'
		| 'geography'
		| 'landmarks'
		| 'dangers'
		| 'resources'
		| 'notes'
		| 'featuredImage'
		| 'parentId';
	sortOrder?: 'asc' | 'desc';
	category?: string;
	isPublic?: boolean;
	isFavorite?: boolean;
	type?: string;
	location?: string;
	climate?: string;
	population?: string;
	government?: string;
	economy?: string;
	culture?: string;
	history?: string;
	geography?: string;
	landmarks?: string;
	dangers?: string;
	resources?: string;
	notes?: string;
	featuredImage?: string;
	parentId?: string;
}

export interface PlaceCreateInput {
	name: string;
	description?: string | null;
	emoji?: string | null;
	color?: string | null;
	category?: string | null;
	isPublic?: boolean;
	isFavorite?: boolean;
	totalImages?: number;
	totalVideos?: number;
	type?: string | null;
	location?: string | null;
	climate?: string | null;
	population?: string | null;
	government?: string | null;
	economy?: string | null;
	culture?: string | null;
	history?: string | null;
	geography?: string | null;
	landmarks?: string | null;
	dangers?: string | null;
	resources?: string | null;
	notes?: string | null;
	featuredImage?: string | null;
	parentId?: string | null;
}

export interface PlaceUpdateInput {
	name?: string;
	description?: string | null;
	emoji?: string | null;
	color?: string | null;
	category?: string | null;
	isPublic?: boolean;
	isFavorite?: boolean;
	totalImages?: number;
	totalVideos?: number;
	type?: string | null;
	location?: string | null;
	climate?: string | null;
	population?: string | null;
	government?: string | null;
	economy?: string | null;
	culture?: string | null;
	history?: string | null;
	geography?: string | null;
	landmarks?: string | null;
	dangers?: string | null;
	resources?: string | null;
	notes?: string | null;
	featuredImage?: string | null;
	parentId?: string | null;
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
			return apiClient.get<PlacesResponse>(`/places?${params.toString()}`);
		},
		staleTime: 1000 * 60, // 1 minuto
	});
}

export function usePlace(id: string) {
	return useQuery<PlaceWithStats, Error>({
		queryKey: placeKeys.detail(id),
		queryFn: () => apiClient.get<PlaceWithStats>(`/places/${id}`),
		enabled: !!id,
		staleTime: 1000 * 60, // 1 minuto
	});
}

export function usePlaceImages(id: string) {
	return useQuery<ImageWithStats[], Error>({
		queryKey: placeKeys.images(id),
		queryFn: () => apiClient.get<ImageWithStats[]>(`/places/${id}/images`),
		enabled: !!id,
		staleTime: 1000 * 30, // 30 segundos
	});
}

export function useCreatePlace() {
	const queryClient = useQueryClient();

	return useMutation<PlaceWithStats, Error, PlaceCreateInput>({
		mutationFn: (data) => apiClient.post<PlaceWithStats>('/places', data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: placeKeys.lists() });
		},
	});
}

export function useUpdatePlace() {
	const queryClient = useQueryClient();

	return useMutation<PlaceWithStats, Error, { id: string; data: PlaceUpdateInput }>({
		mutationFn: ({ id, data }) => apiClient.put<PlaceWithStats>(`/places/${id}`, data),
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: placeKeys.lists() });
			queryClient.setQueryData(placeKeys.detail(data.id), data);
		},
	});
}

export function useDeletePlace() {
	const queryClient = useQueryClient();

	return useMutation<void, Error, string>({
		mutationFn: (id) => apiClient.delete(`/places/${id}`),
		onSuccess: (_, id) => {
			queryClient.invalidateQueries({ queryKey: placeKeys.lists() });
			queryClient.removeQueries({ queryKey: placeKeys.detail(id) });
			queryClient.removeQueries({ queryKey: placeKeys.images(id) });
		},
	});
}

export function useRecentPlaceMedia(placeId: string, limit = 6) {
	return useQuery<
		Array<{ id: string; name?: string | null; thumbnailUrl: string; url?: string; type?: string; isVideo?: boolean }>,
		Error
	>({
		queryKey: [...placeKeys.detail(placeId), 'media', limit],
		queryFn: () =>
			apiClient.get<Array<{ id: string; name?: string | null; thumbnailUrl: string; url?: string; isVideo?: boolean }>>(
				`/places/${placeId}/media?limit=${limit}`
			),
		enabled: !!placeId,
	});
}
