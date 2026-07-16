import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PropertyWithStats } from '@/types/entities/property';
import { apiClient } from './client';
import { invalidateFavoriteQueries } from './favorite-cache';

export interface PropertyFilters {
	limit?: number;
	offset?: number;
	search?: string;
	sortBy?: 'name' | 'createdAt' | 'updatedAt';
	sortOrder?: 'asc' | 'desc';
	type?: string;
}

export interface PropertyCreateInput {
	category?: string | null;
	color?: string | null;
	description?: string | null;
	emoji?: string | null;
	featuredImage?: string | null;
	isFavorite?: boolean;
	name: string;
	shortcut?: string | null;
}

export interface PropertyUpdateInput {
	category?: string | null;
	color?: string | null;
	description?: string | null;
	emoji?: string | null;
	featuredImage?: string | null;
	isFavorite?: boolean;
	name?: string;
	shortcut?: string | null;
}

export interface PropertiesResponse {
	data: PropertyWithStats[];
	pagination: {
		total: number;
		limit: number;
		offset: number;
		hasNext: boolean;
		hasPrev: boolean;
	};
}

// Query keys
export const propertyKeys = {
	all: ['properties'] as const,
	lists: () => [...propertyKeys.all, 'list'] as const,
	list: (filters: PropertyFilters) => [...propertyKeys.lists(), filters] as const,
	details: () => [...propertyKeys.all, 'detail'] as const,
	detail: (id: string) => [...propertyKeys.details(), id] as const,
};

// Hooks
export function useProperties(filters: PropertyFilters = {}) {
	return useQuery<PropertiesResponse, Error>({
		queryKey: propertyKeys.list(filters),
		queryFn: () => {
			const params = new URLSearchParams();
			for (const [key, value] of Object.entries(filters)) {
				if (value !== undefined && value !== null) {
					params.append(key, String(value));
				}
			}
			return apiClient.get<PropertiesResponse>(`/properties?${params.toString()}`);
		},
		staleTime: 1000 * 60, // 1 minuto
	});
}

export function useProperty(id: string) {
	return useQuery<PropertyWithStats, Error>({
		queryKey: propertyKeys.detail(id),
		queryFn: () => apiClient.get<PropertyWithStats>(`/properties/${id}`),
		enabled: !!id,
		staleTime: 1000 * 60, // 1 minuto
	});
}

export function useCreateProperty() {
	const queryClient = useQueryClient();

	return useMutation<PropertyWithStats, Error, PropertyCreateInput>({
		mutationFn: (data) => apiClient.post<PropertyWithStats>('/properties', data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: propertyKeys.lists() });
			void invalidateFavoriteQueries(queryClient);
		},
	});
}

export function useUpdateProperty() {
	const queryClient = useQueryClient();

	return useMutation<PropertyWithStats, Error, { id: string; data: PropertyUpdateInput }>({
		mutationFn: ({ id, data }) => apiClient.put<PropertyWithStats>(`/properties/${id}`, data),
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: propertyKeys.lists() });
			void invalidateFavoriteQueries(queryClient);
			queryClient.setQueryData(propertyKeys.detail(data.id), data);
		},
	});
}

export function useDeleteProperty() {
	const queryClient = useQueryClient();

	return useMutation<void, Error, string>({
		mutationFn: (id) => apiClient.delete(`/properties/${id}`),
		onSuccess: (_, id) => {
			queryClient.invalidateQueries({ queryKey: propertyKeys.lists() });
			void invalidateFavoriteQueries(queryClient);
			queryClient.removeQueries({ queryKey: propertyKeys.detail(id) });
		},
	});
}
