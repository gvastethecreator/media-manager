import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ConceptWithStats } from '@/types/entities/concept';
import type { ImageWithStats } from '@/types/entities/image';
import { apiClient } from './client';

export interface ConceptFilters {
	search?: string;
	limit?: number;
	offset?: number;
	sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'imageCount';
	sortOrder?: 'asc' | 'desc';
}

export interface ConceptCreateInput {
	name: string;
	description?: string;
	color?: string;
	category?: string;
}

export interface ConceptUpdateInput {
	name?: string;
	description?: string;
	color?: string;
	category?: string;
}

export interface ConceptsResponse {
	data: ConceptWithStats[];
	pagination: {
		total: number;
		limit: number;
		offset: number;
		hasNext: boolean;
		hasPrev: boolean;
	};
}

// Query keys
export const conceptKeys = {
	all: ['concepts'] as const,
	lists: () => [...conceptKeys.all, 'list'] as const,
	list: (filters: ConceptFilters) => [...conceptKeys.lists(), filters] as const,
	details: () => [...conceptKeys.all, 'detail'] as const,
	detail: (id: string) => [...conceptKeys.details(), id] as const,
	images: (id: string) => [...conceptKeys.detail(id), 'images'] as const,
};

// Hooks
export function useConcepts(filters: ConceptFilters = {}) {
	return useQuery<ConceptsResponse, Error>({
		queryKey: conceptKeys.list(filters),
		queryFn: () => {
			const params = new URLSearchParams();
			for (const [key, value] of Object.entries(filters)) {
				if (value !== undefined && value !== null) {
					params.append(key, String(value));
				}
			}
			return apiClient.get<ConceptsResponse>(`/concepts?${params.toString()}`);
		},
		staleTime: 1000 * 60, // 1 minuto
	});
}

export function useConcept(id: string) {
	return useQuery<ConceptWithStats, Error>({
		queryKey: conceptKeys.detail(id),
		queryFn: () => apiClient.get<ConceptWithStats>(`/concepts/${id}`),
		enabled: !!id,
		staleTime: 1000 * 60, // 1 minuto
	});
}

export function useConceptImages(id: string) {
	return useQuery<ImageWithStats[], Error>({
		queryKey: conceptKeys.images(id),
		queryFn: () => apiClient.get<ImageWithStats[]>(`/concepts/${id}/images`),
		enabled: !!id,
		staleTime: 1000 * 30, // 30 segundos
	});
}

export function useCreateConcept() {
	const queryClient = useQueryClient();

	return useMutation<ConceptWithStats, Error, ConceptCreateInput>({
		mutationFn: (data) => apiClient.post<ConceptWithStats>('/concepts', data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: conceptKeys.lists() });
		},
	});
}

export function useUpdateConcept() {
	const queryClient = useQueryClient();

	return useMutation<ConceptWithStats, Error, { id: string; data: ConceptUpdateInput }>({
		mutationFn: ({ id, data }) => apiClient.put<ConceptWithStats>(`/concepts/${id}`, data),
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: conceptKeys.lists() });
			queryClient.setQueryData(conceptKeys.detail(data.id), data);
		},
	});
}

export function useDeleteConcept() {
	const queryClient = useQueryClient();

	return useMutation<void, Error, string>({
		mutationFn: (id) => apiClient.delete(`/concepts/${id}`),
		onSuccess: (_, id) => {
			queryClient.invalidateQueries({ queryKey: conceptKeys.lists() });
			queryClient.removeQueries({ queryKey: conceptKeys.detail(id) });
			queryClient.removeQueries({ queryKey: conceptKeys.images(id) });
		},
	});
}

export function useRecentConceptImages(conceptId: string, limit = 6) {
	return useQuery<Array<{ id: string; name?: string | null; thumbnailUrl: string; url?: string }>, Error>({
		queryKey: [...conceptKeys.detail(conceptId), 'recent-images', limit],
		queryFn: () =>
			apiClient.get<Array<{ id: string; name?: string | null; thumbnailUrl: string; url?: string }>>(
				`/concepts/${conceptId}/recent-images?limit=${limit}`
			),
		enabled: !!conceptId,
	});
}

export function useConceptCounts(conceptId: string) {
	return useQuery<
		{
			images: number;
			tags: number;
		},
		Error
	>({
		queryKey: [...conceptKeys.detail(conceptId), 'counts'],
		queryFn: () =>
			apiClient.get<{
				images: number;
				tags: number;
			}>(`/concepts/${conceptId}/counts`),
		enabled: !!conceptId,
	});
}
