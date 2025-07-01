import type { ConceptWithStats } from '@/types/entities/concept';
import type { ImageWithStats } from '@/types/entities/image';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

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
      return api.get<ConceptsResponse>(`/concepts?${params.toString()}`);
    },
    staleTime: 1000 * 60, // 1 minuto
  });
}

export function useConcept(id: string) {
  return useQuery<ConceptWithStats, Error>({
    queryKey: conceptKeys.detail(id),
    queryFn: () => api.get<ConceptWithStats>(`/concepts/${id}`),
    enabled: !!id,
    staleTime: 1000 * 60, // 1 minuto
  });
}

export function useConceptImages(id: string) {
  return useQuery<ImageWithStats[], Error>({
    queryKey: conceptKeys.images(id),
    queryFn: () => api.get<ImageWithStats[]>(`/concepts/${id}/images`),
    enabled: !!id,
    staleTime: 1000 * 30, // 30 segundos
  });
}

export function useCreateConcept() {
  const queryClient = useQueryClient();

  return useMutation<ConceptWithStats, Error, ConceptCreateInput>({
    mutationFn: (data) => api.post<ConceptWithStats>('/concepts', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: conceptKeys.lists() });
    },
  });
}

export function useUpdateConcept() {
  const queryClient = useQueryClient();

  return useMutation<ConceptWithStats, Error, { id: string; data: ConceptUpdateInput }>({
    mutationFn: ({ id, data }) => api.put<ConceptWithStats>(`/concepts/${id}`, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: conceptKeys.lists() });
      queryClient.setQueryData(conceptKeys.detail(data.id), data);
    },
  });
}

export function useDeleteConcept() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => api.delete(`/concepts/${id}`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: conceptKeys.lists() });
      queryClient.removeQueries({ queryKey: conceptKeys.detail(id) });
      queryClient.removeQueries({ queryKey: conceptKeys.images(id) });
    },
  });
}