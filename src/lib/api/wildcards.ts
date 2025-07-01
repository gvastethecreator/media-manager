import type { WildcardWithStats } from '@/types/entities/wildcard';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

export interface WildcardFilters {
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface WildcardCreateInput {
  name: string;
  content: string;
  description?: string;
  category?: string;
  tags?: string[];
}

export interface WildcardUpdateInput {
  name?: string;
  content?: string;
  description?: string;
  category?: string;
  tags?: string[];
}

export interface WildcardsResponse {
  data: WildcardWithStats[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Query keys
export const wildcardKeys = {
  all: ['wildcards'] as const,
  lists: () => [...wildcardKeys.all, 'list'] as const,
  list: (filters: WildcardFilters) => [...wildcardKeys.lists(), filters] as const,
  details: () => [...wildcardKeys.all, 'detail'] as const,
  detail: (id: string) => [...wildcardKeys.details(), id] as const,
};

// Hooks
export function useWildcards(filters: WildcardFilters = {}) {
  return useQuery<WildcardsResponse, Error>({
    queryKey: wildcardKeys.list(filters),
    queryFn: () => {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      }
      return api.get<WildcardsResponse>(`/wildcards?${params.toString()}`);
    },
    staleTime: 1000 * 60, // 1 minuto
  });
}

export function useWildcard(id: string) {
  return useQuery<WildcardWithStats, Error>({
    queryKey: wildcardKeys.detail(id),
    queryFn: () => api.get<WildcardWithStats>(`/wildcards/${id}`),
    enabled: !!id,
    staleTime: 1000 * 60, // 1 minuto
  });
}

export function useCreateWildcard() {
  const queryClient = useQueryClient();

  return useMutation<WildcardWithStats, Error, WildcardCreateInput>({
    mutationFn: (data) => api.post<WildcardWithStats>('/wildcards', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wildcardKeys.lists() });
    },
  });
}

export function useUpdateWildcard() {
  const queryClient = useQueryClient();

  return useMutation<WildcardWithStats, Error, { id: string; data: WildcardUpdateInput }>({
    mutationFn: ({ id, data }) => api.put<WildcardWithStats>(`/wildcards/${id}`, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: wildcardKeys.lists() });
      queryClient.setQueryData(wildcardKeys.detail(data.id), data);
    },
  });
}

export function useDeleteWildcard() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => api.delete(`/wildcards/${id}`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: wildcardKeys.lists() });
      queryClient.removeQueries({ queryKey: wildcardKeys.detail(id) });
    },
  });
}