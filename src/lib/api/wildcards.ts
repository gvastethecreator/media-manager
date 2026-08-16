import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { WildcardCreateInput, WildcardUpdateInput, WildcardWithStats } from '@/types/entities/wildcard';
import { FavoriteEntityType } from '@/types/entities/favorite';
import { ApiTransportError, apiClient } from './client';
import { invalidateFavoriteQueries } from './favorite-cache';
import { invalidateNavigationData } from './navigation';
import {
	createFileBackedWildcard,
	deleteTaxonomyArtifact,
	saveTaxonomyArtifact,
	type TaxonomyArtifactDocument,
} from './taxonomy-artifacts';

export interface WildcardFileBackingDraft {
	body: string;
	expectedHash?: string;
	restoreMissing?: boolean;
	rootId: string;
}

export type WildcardCreateMutationInput = WildcardCreateInput & { fileBacking?: WildcardFileBackingDraft };
export type WildcardUpdateMutationInput = WildcardUpdateInput & { fileBacking?: WildcardFileBackingDraft };

export interface WildcardDeleteMutationInput {
	/** Hash observed by the UI before it begins a destructive action. */
	contentHash?: string;
	deleteMissingConfirmed?: boolean;
	id: string;
	syncStatus?: TaxonomyArtifactDocument['syncStatus'];
}

function fileBackingPayload(data: WildcardCreateInput | WildcardUpdateInput, backing: WildcardFileBackingDraft) {
	if (!data.name) throw new Error('The wildcard name is required to save the canonical file.');
	return {
		body: backing.body,
		expectedHash: backing.expectedHash,
		metadata: {
			category: data.category ?? undefined,
			color: data.color ?? undefined,
			emoji: data.emoji ?? undefined,
			summary: data.description ?? undefined,
			title: data.name,
		},
		operational: {
			featuredImage: data.featuredImage,
			parentId: data.parentId,
			shortcut: data.shortcut,
		},
		rootId: backing.rootId,
		restoreMissing: backing.restoreMissing,
	};
}

export interface WildcardFilters {
	limit?: number;
	offset?: number;
	search?: string;
	sortBy?: 'name' | 'createdAt' | 'updatedAt';
	sortOrder?: 'asc' | 'desc';
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
	roots: () => [...wildcardKeys.all, 'roots'] as const,
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
			return apiClient.get<WildcardsResponse>(`/wildcards?${params.toString()}`);
		},
		staleTime: 1000 * 60, // 1 minuto
	});
}

export function useWildcard(id: string) {
	return useQuery<WildcardWithStats, Error>({
		queryKey: wildcardKeys.detail(id),
		queryFn: () => apiClient.get<WildcardWithStats>(`/wildcards/${id}`),
		enabled: !!id,
		staleTime: 1000 * 60, // 1 minuto
	});
}

export function useCreateWildcard() {
	const queryClient = useQueryClient();

	return useMutation<WildcardWithStats, Error, WildcardCreateMutationInput>({
		mutationFn: async (data) => {
			const { fileBacking, ...inlineData } = data;
			if (!fileBacking) return apiClient.post<WildcardWithStats>('/wildcards', inlineData);
			try {
				const result = await createFileBackedWildcard<WildcardWithStats>({
					...fileBackingPayload(inlineData, fileBacking),
					rootId: fileBacking.rootId,
				});
				return result.entity;
			} catch (error) {
				if (error instanceof ApiTransportError) {
					throw new Error(
						'Wildcard creation was not confirmed. Reload before creating another one to avoid a duplicate.',
						{ cause: error }
					);
				}
				throw error;
			}
		},
		retry: false,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: wildcardKeys.lists() });
			queryClient.invalidateQueries({ queryKey: wildcardKeys.roots() });
			void invalidateFavoriteQueries(queryClient);
			void invalidateNavigationData(queryClient);
		},
	});
}

export function useUpdateWildcard() {
	const queryClient = useQueryClient();

	return useMutation<WildcardWithStats, Error, { id: string; data: WildcardUpdateMutationInput }>({
		mutationFn: async ({ id, data }) => {
			const { fileBacking, ...inlineData } = data;
			if (!fileBacking) return apiClient.put<WildcardWithStats>(`/wildcards/${id}`, inlineData);
			const saved = await saveTaxonomyArtifact<WildcardWithStats>(
				'wildcard',
				id,
				fileBackingPayload(inlineData, fileBacking)
			);
			return saved.entity;
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: wildcardKeys.lists() });
			queryClient.invalidateQueries({ queryKey: wildcardKeys.roots() });
			void invalidateFavoriteQueries(queryClient);
			void invalidateNavigationData(queryClient);
			queryClient.setQueryData(wildcardKeys.detail(data.id), data);
		},
	});
}

export function useDeleteWildcard() {
	const queryClient = useQueryClient();

	return useMutation<void, Error, WildcardDeleteMutationInput>({
		mutationFn: async ({ contentHash, deleteMissingConfirmed = false, id, syncStatus }) => {
			if (contentHash) {
				if (syncStatus === 'missing' && !deleteMissingConfirmed) {
					throw new Error('Explicitly confirm deletion of the wildcard whose canonical file is missing.');
				}
				return deleteTaxonomyArtifact('wildcard', id, contentHash, syncStatus === 'missing');
			}
			return apiClient.delete(`/wildcards/${id}`);
		},
		onSuccess: (_, { id }) => {
			queryClient.invalidateQueries({ queryKey: wildcardKeys.lists() });
			queryClient.invalidateQueries({ queryKey: wildcardKeys.roots() });
			void invalidateFavoriteQueries(queryClient);
			void invalidateNavigationData(queryClient);
			queryClient.removeQueries({ queryKey: wildcardKeys.detail(id) });
		},
	});
}

export function useRootWildcards() {
	return useQuery<WildcardWithStats[], Error>({
		queryKey: wildcardKeys.roots(),
		queryFn: () => apiClient.get<WildcardWithStats[]>('/wildcards/roots'),
		staleTime: 1000 * 60, // 1 minuto
	});
}

export function useToggleWildcardFavorite() {
	const queryClient = useQueryClient();

	return useMutation<WildcardWithStats, Error, string>({
		mutationFn: async (id) => {
			await apiClient.post('/favorites/toggle', { entityId: id, entityType: FavoriteEntityType.WILDCARD });
			return apiClient.get<WildcardWithStats>(`/wildcards/${id}`);
		},
		onSuccess: (data) => {
			void invalidateFavoriteQueries(queryClient);
			queryClient.invalidateQueries({ queryKey: wildcardKeys.lists() });
			queryClient.invalidateQueries({ queryKey: wildcardKeys.roots() });
			queryClient.setQueryData(wildcardKeys.detail(data.id), data);
		},
	});
}

export function useMoveWildcard() {
	const queryClient = useQueryClient();

	return useMutation<WildcardWithStats, Error, { id: string; newParentId: string | null }>({
		mutationFn: ({ id, newParentId }) => apiClient.patch<WildcardWithStats>(`/wildcards/${id}/move`, { newParentId }),
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: wildcardKeys.lists() });
			queryClient.invalidateQueries({ queryKey: wildcardKeys.roots() });
			queryClient.setQueryData(wildcardKeys.detail(data.id), data);
		},
	});
}

export function useSearchWildcards(query: string) {
	return useQuery<WildcardWithStats[], Error>({
		queryKey: [...wildcardKeys.all, 'search', query],
		queryFn: () => apiClient.get<WildcardWithStats[]>(`/wildcards/search?q=${encodeURIComponent(query)}`),
		enabled: !!query && query.length > 0,
		staleTime: 1000 * 30, // 30 segundos
	});
}
