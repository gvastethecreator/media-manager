import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ImageWithStats } from '@/types/entities/image';
import type { NoteWithStats } from '@/types/entities/note';
import { apiClient } from './client';
import { invalidateFavoriteQueries } from './favorite-cache';
import { invalidateNavigationData } from './navigation';
import {
	deleteTaxonomyArtifact,
	getTaxonomyArtifactOrNull,
	saveTaxonomyArtifact,
	type TaxonomyArtifactDocument,
	type TaxonomyArtifactMetadata,
} from './taxonomy-artifacts';

export interface NoteFilters {
	category?: string;
	isFavorite?: boolean;
	limit?: number;
	offset?: number;
	priority?: number;
	search?: string;
	sortBy?: 'title' | 'createdAt' | 'updatedAt' | 'priority' | 'status' | 'category';
	sortOrder?: 'asc' | 'desc';
	status?: string;
}

export interface NoteCreateInput {
	category?: string | null;
	color?: string | null;
	content?: string | null;
	emoji?: string | null;
	featuredImage?: string | null;
	isFavorite?: boolean;
	presetId?: string | null;
	priority?: number;
	status?: string | null;
	summary?: string | null;
	tags?: string[];
	title: string;
}

export interface NoteUpdateInput {
	category?: string | null;
	color?: string | null;
	content?: string | null;
	emoji?: string | null;
	featuredImage?: string | null;
	isFavorite?: boolean;
	presetId?: string | null;
	priority?: number;
	status?: string | null;
	summary?: string | null;
	tags?: string[];
	title?: string;
}

export type NoteUpdateMutationInput = NoteUpdateInput & {
	fileBacking?: { expectedHash: string; restoreMissing?: boolean };
};

export interface NoteDeleteMutationInput {
	/** Hash observed by the UI before it begins a destructive action. */
	contentHash?: string;
	deleteMissingConfirmed?: boolean;
	id: string;
	syncStatus?: TaxonomyArtifactDocument['syncStatus'];
}

export function mergeNoteArtifactMetadata(
	input: NoteUpdateInput,
	existing: TaxonomyArtifactMetadata
): Omit<TaxonomyArtifactMetadata, 'id' | 'kind' | 'schemaVersion'> {
	return {
		category: input.category ?? existing.category,
		color: input.color ?? existing.color,
		emoji: input.emoji ?? existing.emoji,
		summary: input.summary ?? existing.summary,
		title: input.title ?? existing.title,
	};
}

export interface NotesResponse {
	data: NoteWithStats[];
	pagination: {
		total: number;
		limit: number;
		offset: number;
		hasNext: boolean;
		hasPrev: boolean;
	};
}

// Query keys
export const noteKeys = {
	all: ['notes'] as const,
	lists: () => [...noteKeys.all, 'list'] as const,
	list: (filters: NoteFilters) => [...noteKeys.lists(), filters] as const,
	details: () => [...noteKeys.all, 'detail'] as const,
	detail: (id: string) => [...noteKeys.details(), id] as const,
	images: (id: string) => [...noteKeys.detail(id), 'images'] as const,
};

// Hooks
export function useNotes(filters: NoteFilters = {}) {
	return useQuery<NotesResponse, Error>({
		queryKey: noteKeys.list(filters),
		queryFn: () => {
			const params = new URLSearchParams();
			for (const [key, value] of Object.entries(filters)) {
				if (value !== undefined && value !== null) {
					params.append(key, String(value));
				}
			}
			return apiClient.get<NotesResponse>(`/notes?${params.toString()}`);
		},
		staleTime: 1000 * 60, // 1 minuto
	});
}

export function useNote(id: string) {
	return useQuery<NoteWithStats, Error>({
		queryKey: noteKeys.detail(id),
		queryFn: () => apiClient.get<NoteWithStats>(`/notes/${id}`),
		enabled: !!id,
		staleTime: 1000 * 60, // 1 minuto
	});
}

export function useNoteImages(id: string) {
	return useQuery<ImageWithStats[], Error>({
		queryKey: noteKeys.images(id),
		queryFn: () => apiClient.get<ImageWithStats[]>(`/notes/${id}/images`),
		enabled: !!id,
		staleTime: 1000 * 30, // 30 segundos
	});
}

export function useCreateNote() {
	const queryClient = useQueryClient();

	return useMutation<NoteWithStats, Error, NoteCreateInput>({
		mutationFn: (data) => apiClient.post<NoteWithStats>('/notes', data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: noteKeys.lists() });
			void invalidateFavoriteQueries(queryClient);
			void invalidateNavigationData(queryClient);
		},
	});
}

export function useUpdateNote() {
	const queryClient = useQueryClient();

	return useMutation<NoteWithStats, Error, { id: string; data: NoteUpdateMutationInput }>({
		mutationFn: async ({ id, data }) => {
			const { fileBacking, ...inlineData } = data;
			const artifact = await getTaxonomyArtifactOrNull('note', id);
			if (!artifact) return apiClient.put<NoteWithStats>(`/notes/${id}`, inlineData);
			if (!fileBacking) throw new Error('The note is file-backed; reload the canonical editor before saving.');
			const saved = await saveTaxonomyArtifact<NoteWithStats>('note', id, {
				body: inlineData.content ?? artifact.body,
				expectedHash: fileBacking.expectedHash,
				metadata: mergeNoteArtifactMetadata(inlineData, artifact.metadata),
				restoreMissing: fileBacking.restoreMissing,
			});
			return saved.entity;
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: noteKeys.lists() });
			void invalidateFavoriteQueries(queryClient);
			void invalidateNavigationData(queryClient);
			queryClient.setQueryData(noteKeys.detail(data.id), data);
		},
	});
}

export function useDeleteNote() {
	const queryClient = useQueryClient();

	return useMutation<void, Error, NoteDeleteMutationInput>({
		mutationFn: async ({ contentHash, deleteMissingConfirmed = false, id, syncStatus }) => {
			if (contentHash) {
				if (syncStatus === 'missing' && !deleteMissingConfirmed) {
					throw new Error('Explicitly confirm deletion of the note whose canonical file is missing.');
				}
				return deleteTaxonomyArtifact('note', id, contentHash, syncStatus === 'missing');
			}
			return apiClient.delete(`/notes/${id}`);
		},
		onSuccess: (_, { id }) => {
			queryClient.invalidateQueries({ queryKey: noteKeys.lists() });
			void invalidateFavoriteQueries(queryClient);
			void invalidateNavigationData(queryClient);
			queryClient.removeQueries({ queryKey: noteKeys.detail(id) });
			queryClient.removeQueries({ queryKey: noteKeys.images(id) });
		},
	});
}

export function useRecentNoteImages(noteId: string, limit = 6) {
	return useQuery<Array<{ id: string; name?: string | null; thumbnailUrl: string; url?: string }>, Error>({
		queryKey: [...noteKeys.detail(noteId), 'recent-images', limit],
		queryFn: () =>
			apiClient.get<Array<{ id: string; name?: string | null; thumbnailUrl: string; url?: string }>>(
				`/notes/${noteId}/recent-images?limit=${limit}`
			),
		enabled: !!noteId,
	});
}

export function useNoteCounts(noteId: string) {
	return useQuery<
		{
			characters: number;
			places: number;
			worldItems: number;
			concepts: number;
			prompts: number;
			images: number;
			videos: number;
			albums: number;
			collections: number;
			tags: number;
			wildcards: number;
			properties: number;
			groups: number;
		},
		Error
	>({
		queryKey: [...noteKeys.detail(noteId), 'counts'],
		queryFn: () =>
			apiClient.get<{
				characters: number;
				places: number;
				worldItems: number;
				concepts: number;
				prompts: number;
				images: number;
				videos: number;
				albums: number;
				collections: number;
				tags: number;
				wildcards: number;
				properties: number;
				groups: number;
			}>(`/notes/${noteId}/counts`),
		enabled: !!noteId,
	});
}

export function useNoteStatuses() {
	return useQuery<string[], Error>({
		queryKey: [...noteKeys.all, 'statuses'],
		queryFn: () => apiClient.get<string[]>('/notes/statuses'),
	});
}
