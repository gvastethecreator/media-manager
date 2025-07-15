import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CharacterWithStats } from '@/types/entities/character';
import type { ImageWithStats } from '@/types/entities/image';
import { apiClient } from './client';

export interface CharacterFilters {
	search?: string;
	limit?: number;
	offset?: number;
	sortBy?: 'name' | 'createdAt' | 'updatedAt';
	sortOrder?: 'asc' | 'desc';
}

export interface CharacterCreateInput {
	name: string;
	description?: string | null;
	emoji?: string | null;
	color?: string | null;
	category?: string | null;
	isPublic?: boolean;
	isFavorite?: boolean;
	totalImages?: number;
	totalVideos?: number;
	age?: string | null;
	gender?: string | null;
	species?: string | null;
	occupation?: string | null;
	personality?: string | null;
	background?: string | null;
	relationships?: string | null;
	skills?: string | null;
	equipment?: string | null;
	notes?: string | null;
	featuredImage?: string | null;
	parentId?: string | null;
}

export interface CharacterUpdateInput {
	name?: string;
	description?: string | null;
	emoji?: string | null;
	color?: string | null;
	category?: string | null;
	isPublic?: boolean;
	isFavorite?: boolean;
	totalImages?: number;
	totalVideos?: number;
	age?: string | null;
	gender?: string | null;
	species?: string | null;
	occupation?: string | null;
	personality?: string | null;
	background?: string | null;
	relationships?: string | null;
	skills?: string | null;
	equipment?: string | null;
	notes?: string | null;
	featuredImage?: string | null;
	parentId?: string | null;
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
			return apiClient.get<CharactersResponse>(`/characters?${params.toString()}`);
		},
		staleTime: 1000 * 60, // 1 minuto
	});
}

export function useCharacter(id: string) {
	return useQuery<CharacterWithStats, Error>({
		queryKey: characterKeys.detail(id),
		queryFn: () => apiClient.get<CharacterWithStats>(`/characters/${id}`),
		enabled: !!id,
		staleTime: 1000 * 60, // 1 minuto
	});
}

export function useCharacterImages(id: string) {
	return useQuery<ImageWithStats[], Error>({
		queryKey: characterKeys.images(id),
		queryFn: () => apiClient.get<ImageWithStats[]>(`/characters/${id}/images`),
		enabled: !!id,
		staleTime: 1000 * 30, // 30 segundos
	});
}

export function useSearchCharacters(query: string) {
	return useQuery<CharacterWithStats[], Error>({
		queryKey: characterKeys.search(query),
		queryFn: () => apiClient.get<CharacterWithStats[]>(`/characters/search?q=${encodeURIComponent(query)}`),
		enabled: !!query && query.length >= 2,
		staleTime: 1000 * 30, // 30 segundos
	});
}

export function useCreateCharacter() {
	const queryClient = useQueryClient();

	return useMutation<CharacterWithStats, Error, CharacterCreateInput>({
		mutationFn: (data) => apiClient.post<CharacterWithStats>('/characters', data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: characterKeys.lists() });
		},
	});
}

export function useUpdateCharacter() {
	const queryClient = useQueryClient();

	return useMutation<CharacterWithStats, Error, { id: string; data: CharacterUpdateInput }>({
		mutationFn: ({ id, data }) => apiClient.put<CharacterWithStats>(`/characters/${id}`, data),
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: characterKeys.lists() });
			queryClient.setQueryData(characterKeys.detail(data.id), data);
		},
	});
}

export function useDeleteCharacter() {
	const queryClient = useQueryClient();

	return useMutation<void, Error, string>({
		mutationFn: (id) => apiClient.delete(`/characters/${id}`),
		onSuccess: (_, id) => {
			queryClient.invalidateQueries({ queryKey: characterKeys.lists() });
			queryClient.removeQueries({ queryKey: characterKeys.detail(id) });
			queryClient.removeQueries({ queryKey: characterKeys.images(id) });
		},
	});
}

export function useRecentCharacterMedia(characterId: string, limit = 6) {
	return useQuery<
		Array<{ id: string; name?: string | null; thumbnailUrl: string; url?: string; isVideo?: boolean }>,
		Error
	>({
		queryKey: [...characterKeys.detail(characterId), 'media', limit],
		queryFn: () =>
			apiClient.get<Array<{ id: string; name?: string | null; thumbnailUrl: string; url?: string; isVideo?: boolean }>>(
				`/characters/${characterId}/media?limit=${limit}`
			),
		enabled: !!characterId,
	});
}

export function useRelatedCharacters(characterId: string, limit = 5) {
	return useQuery<CharacterWithStats[], Error>({
		queryKey: [...characterKeys.detail(characterId), 'related', limit],
		queryFn: () => apiClient.get<CharacterWithStats[]>(`/characters/${characterId}/related?limit=${limit}`),
		enabled: !!characterId,
	});
}
