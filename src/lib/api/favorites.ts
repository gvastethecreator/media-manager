import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useActiveProfile } from '@/lib/api/profiles';
import {
	FavoriteEntityType,
	isCanonicalFavoriteEntityType,
	type FavoriteCreateInput,
	type FavoriteWithStats,
} from '@/types/entities/favorite';
import { apiClient } from './client';
import { FAVORITE_QUERY_KEY, invalidateFavoriteQueries } from './favorite-cache';

export interface FavoriteToggleInput {
	entityId: string;
	entityType: FavoriteEntityType | string;
}

export interface FavoriteToggleResponse {
	id?: string;
	isFavorite: boolean;
}

export interface FavoriteFilters {
	entityType?: FavoriteEntityType;
	limit?: number;
	offset?: number;
	search?: string;
	sortBy?: 'addedAt' | 'entityType';
	sortOrder?: 'asc' | 'desc';
}

export interface FavoritesResponse {
	data: FavoriteWithStats[];
	pagination: {
		total: number;
		limit: number;
		offset: number;
		hasNext: boolean;
		hasPrev: boolean;
	};
}

function resolveFavoriteScope(profileId?: string | null) {
	return profileId ?? 'active-profile';
}

const favoriteEntityTypeAliasMap = {
	image: FavoriteEntityType.IMAGE,
	video: FavoriteEntityType.VIDEO,
	audio: FavoriteEntityType.AUDIO,
	document: FavoriteEntityType.DOCUMENT,
	jsonFile: FavoriteEntityType.JSON_FILE,
	file3d: FavoriteEntityType.FILE_3D,
	album: FavoriteEntityType.ALBUM,
	collection: FavoriteEntityType.COLLECTION,
	folder: FavoriteEntityType.FOLDER,
	group: FavoriteEntityType.GROUP,
	character: FavoriteEntityType.CHARACTER,
	place: FavoriteEntityType.PLACE,
	worldItem: FavoriteEntityType.WORLD_ITEM,
	'world-item': FavoriteEntityType.WORLD_ITEM,
	concept: FavoriteEntityType.CONCEPT,
	prompt: FavoriteEntityType.PROMPT,
	note: FavoriteEntityType.NOTE,
	wildcard: FavoriteEntityType.WILDCARD,
} as const satisfies Record<string, FavoriteEntityType>;

export function normalizeFavoriteEntityType(entityType: FavoriteEntityType | string): FavoriteEntityType | null {
	const normalizedEntityType = Object.values(FavoriteEntityType).includes(entityType as FavoriteEntityType)
		? (entityType as FavoriteEntityType)
		: (favoriteEntityTypeAliasMap[entityType as keyof typeof favoriteEntityTypeAliasMap] ?? null);

	return normalizedEntityType && isCanonicalFavoriteEntityType(normalizedEntityType) ? normalizedEntityType : null;
}

// Query keys
export const favoriteKeys = {
	all: FAVORITE_QUERY_KEY,
	scope: (profileId?: string | null) => [...favoriteKeys.all, 'profile', resolveFavoriteScope(profileId)] as const,
	lists: (profileId?: string | null) => [...favoriteKeys.scope(profileId), 'list'] as const,
	list: (profileId: string | null | undefined, filters: FavoriteFilters) =>
		[...favoriteKeys.lists(profileId), filters] as const,
	checks: (profileId?: string | null) => [...favoriteKeys.scope(profileId), 'check'] as const,
	check: (profileId: string | null | undefined, entityType: FavoriteEntityType, entityId: string) =>
		[...favoriteKeys.checks(profileId), entityType, entityId] as const,
	details: (profileId?: string | null) => [...favoriteKeys.scope(profileId), 'detail'] as const,
	detail: (profileId: string | null | undefined, id: string) => [...favoriteKeys.details(profileId), id] as const,
};

// Hooks
export function useFavorites(filters: FavoriteFilters = {}) {
	const { data: activeProfile } = useActiveProfile();
	const profileId = activeProfile?.id;

	return useQuery<FavoritesResponse, Error>({
		queryKey: favoriteKeys.list(profileId, filters),
		queryFn: () => {
			const params = new URLSearchParams();
			for (const [key, value] of Object.entries(filters)) {
				if (value !== undefined && value !== null) {
					params.append(key, String(value));
				}
			}

			const query = params.toString();
			return apiClient.get<FavoritesResponse>(query ? `/favorites?${query}` : '/favorites');
		},
		staleTime: 1000 * 60, // 1 minuto
	});
}

export function useFavorite(id: string) {
	const { data: activeProfile } = useActiveProfile();
	const profileId = activeProfile?.id;

	return useQuery<FavoriteWithStats, Error>({
		queryKey: favoriteKeys.detail(profileId, id),
		queryFn: () => apiClient.get<FavoriteWithStats>(`/favorites/${id}`),
		enabled: !!id,
		staleTime: 1000 * 60, // 1 minuto
	});
}

export function useCreateFavorite() {
	const queryClient = useQueryClient();

	return useMutation<FavoriteToggleResponse, Error, FavoriteCreateInput>({
		mutationFn: (data) =>
			apiClient.put<FavoriteToggleResponse>('/favorites/state', {
				entityId: data.entityId,
				entityType: data.entityType,
				isFavorite: true,
			}),
		onSuccess: () => {
			return invalidateFavoriteQueries(queryClient);
		},
	});
}

export function useToggleFavoriteMutation() {
	const queryClient = useQueryClient();
	const { data: activeProfile } = useActiveProfile();
	const profileId = activeProfile?.id;

	return useMutation<FavoriteToggleResponse, Error, FavoriteToggleInput>({
		mutationFn: ({ entityId, entityType }) => {
			const normalizedEntityType = normalizeFavoriteEntityType(entityType);

			if (!normalizedEntityType) {
				throw new Error(`Tipo de favorito no soportado: ${entityType}`);
			}

			return apiClient.post<FavoriteToggleResponse>('/favorites/toggle', {
				entityId,
				entityType: normalizedEntityType,
			});
		},
		onSuccess: (result, variables) => {
			const normalizedEntityType = normalizeFavoriteEntityType(variables.entityType);

			void invalidateFavoriteQueries(queryClient);

			if (normalizedEntityType) {
				queryClient.setQueryData(favoriteKeys.check(profileId, normalizedEntityType, variables.entityId), {
					isFavorite: result.isFavorite,
				});
			}
		},
	});
}

export function useDeleteFavorite() {
	const queryClient = useQueryClient();

	return useMutation<void, Error, string>({
		mutationFn: (id) => apiClient.delete(`/favorites/${id}`),
		onSuccess: () => {
			return invalidateFavoriteQueries(queryClient);
		},
	});
}
