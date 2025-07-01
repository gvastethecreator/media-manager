import type { CharacterWithStats } from '@/types/entities/character';
import type { ImageWithStats } from '@/types/entities/image';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

export interface CharacterFilters {
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'imageCount';
  sortOrder?: 'asc' | 'desc';
}

export interface CharacterCreateInput {
  name: string;
  description?: string;
  color?: string;
  avatarUrl?: string;
}

export interface CharacterUpdateInput {
  name?: string;
  description?: string;
  color?: string;
  avatarUrl?: string;
}

export interface CharactersResponse {
  data: CharacterWithStats[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Query keys
export const characterKeys = {
  all: ['characters'] as const,
  lists: () => [...characterKeys.all, 'list'] as const,
  list: (filters: CharacterFilters) => [...characterKeys.lists(), filters] as const,
  details: () => [...characterKeys.all, 'detail'] as const,
  detail: (id: string) => [...characterKeys.details(), id] as const,
  images: (id: string) => [...characterKeys.detail(id), 'images'] as const,
  search: (query: string) => [...characterKeys.all, 'search', query] as const,
};

// Hooks
export function useCharacters(filters: CharacterFilters = {}) {
  return useQuery<CharactersResponse, Error>({
    queryKey: characterKeys.list(filters),
    queryFn: () => {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      }
      return api.get<CharactersResponse>(`/characters?${params.toString()}`);
    },
    staleTime: 1000 * 60, // 1 minuto
  });
}

export function useCharacter(id: string) {
  return useQuery<CharacterWithStats, Error>({
    queryKey: characterKeys.detail(id),
    queryFn: () => api.get<CharacterWithStats>(`/characters/${id}`),
    enabled: !!id,
    staleTime: 1000 * 60, // 1 minuto
  });
}

export function useCharacterImages(id: string) {
  return useQuery<ImageWithStats[], Error>({
    queryKey: characterKeys.images(id),
    queryFn: () => api.get<ImageWithStats[]>(`/characters/${id}/images`),
    enabled: !!id,
    staleTime: 1000 * 30, // 30 segundos
  });
}

export function useSearchCharacters(query: string) {
  return useQuery<CharacterWithStats[], Error>({
    queryKey: characterKeys.search(query),
    queryFn: () => api.get<CharacterWithStats[]>(`/characters/search?q=${encodeURIComponent(query)}`),
    enabled: !!query && query.length >= 2,
    staleTime: 1000 * 30, // 30 segundos
  });
}

export function useCreateCharacter() {
  const queryClient = useQueryClient();

  return useMutation<CharacterWithStats, Error, CharacterCreateInput>({
    mutationFn: (data) => api.post<CharacterWithStats>('/characters', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: characterKeys.lists() });
    },
  });
}

export function useUpdateCharacter() {
  const queryClient = useQueryClient();

  return useMutation<CharacterWithStats, Error, { id: string; data: CharacterUpdateInput }>({
    mutationFn: ({ id, data }) => api.put<CharacterWithStats>(`/characters/${id}`, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: characterKeys.lists() });
      queryClient.setQueryData(characterKeys.detail(data.id), data);
    },
  });
}

export function useDeleteCharacter() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => api.delete(`/characters/${id}`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: characterKeys.lists() });
      queryClient.removeQueries({ queryKey: characterKeys.detail(id) });
      queryClient.removeQueries({ queryKey: characterKeys.images(id) });
    },
  });
}