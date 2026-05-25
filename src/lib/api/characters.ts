import { useQuery } from '@tanstack/react-query';
import type { CharacterWithStats } from '@/types/entities/character';
import type { ImageWithStats } from '@/types/entities/image';
import { createEntityHooks } from './hook-factory';
import type { EntityListResult } from './hook-factory';
import { apiClient } from './client';

export interface CharacterFilters {
	[key: string]: unknown;
	limit?: number;
	offset?: number;
	search?: string;
	sortBy?: 'name' | 'createdAt' | 'updatedAt';
	sortOrder?: 'asc' | 'desc';
}

export interface CharacterCreateInput {
	age?: string | null;
	background?: string | null;
	category?: string | null;
	color?: string | null;
	description?: string | null;
	emoji?: string | null;
	equipment?: string | null;
	featuredImage?: string | null;
	gender?: string | null;
	isFavorite?: boolean;
	isPublic?: boolean;
	name: string;
	notes?: string | null;
	occupation?: string | null;
	parentId?: string | null;
	personality?: string | null;
	relationships?: string | null;
	skills?: string | null;
	species?: string | null;
	totalImages?: number;
	totalVideos?: number;
}

export interface CharacterUpdateInput {
	age?: string | null;
	background?: string | null;
	category?: string | null;
	color?: string | null;
	description?: string | null;
	emoji?: string | null;
	equipment?: string | null;
	featuredImage?: string | null;
	gender?: string | null;
	isFavorite?: boolean;
	isPublic?: boolean;
	name?: string;
	notes?: string | null;
	occupation?: string | null;
	parentId?: string | null;
	personality?: string | null;
	relationships?: string | null;
	skills?: string | null;
	species?: string | null;
	totalImages?: number;
	totalVideos?: number;
}

const hooks = createEntityHooks<CharacterWithStats, CharacterCreateInput, CharacterUpdateInput, CharacterFilters>({
	entityName: 'characters',
	baseEndpoint: '/characters',
	listStaleTime: 60_000,
	detailStaleTime: 60_000,
});

export const characterKeys = {
	...hooks.keys,
	images: (id: string) => [...hooks.keys.detail(id), 'images'] as const,
	search: (query: string) => [...hooks.keys.all, 'search', query] as const,
};

export const useCharacters = hooks.useList;
export const useCharacter = hooks.useDetail;
export const useCreateCharacter = hooks.useCreate;
export const useUpdateCharacter = hooks.useUpdate;
export const useDeleteCharacter = hooks.useDelete;

export type CharactersResponse = EntityListResult<CharacterWithStats>;

export function useCharacterImages(id: string) {
	return useQuery<ImageWithStats[], Error>({
		queryKey: characterKeys.images(id),
		queryFn: () => apiClient.get<ImageWithStats[]>(`/characters/${id}/images`),
		enabled: !!id,
		staleTime: 1000 * 30,
	});
}

export function useSearchCharacters(query: string) {
	return useQuery<CharacterWithStats[], Error>({
		queryKey: characterKeys.search(query),
		queryFn: () => apiClient.get<CharacterWithStats[]>(`/characters/search?q=${encodeURIComponent(query)}`),
		enabled: !!query && query.length >= 2,
		staleTime: 1000 * 30,
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
