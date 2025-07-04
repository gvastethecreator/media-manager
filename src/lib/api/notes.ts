import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ImageWithStats } from '@/types/entities/image';
import type { NoteWithStats } from '@/types/entities/note';
import { apiClient } from './client';

export interface NoteFilters {
	search?: string;
	limit?: number;
	offset?: number;
	sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'imageCount';
	sortOrder?: 'asc' | 'desc';
}

export interface NoteCreateInput {
	name: string;
	content?: string;
	color?: string;
	category?: string;
}

export interface NoteUpdateInput {
	name?: string;
	content?: string;
	color?: string;
	category?: string;
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
		},
	});
}

export function useUpdateNote() {
	const queryClient = useQueryClient();

	return useMutation<NoteWithStats, Error, { id: string; data: NoteUpdateInput }>({
		mutationFn: ({ id, data }) => apiClient.put<NoteWithStats>(`/notes/${id}`, data),
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: noteKeys.lists() });
			queryClient.setQueryData(noteKeys.detail(data.id), data);
		},
	});
}

export function useDeleteNote() {
	const queryClient = useQueryClient();

	return useMutation<void, Error, string>({
		mutationFn: (id) => apiClient.delete(`/notes/${id}`),
		onSuccess: (_, id) => {
			queryClient.invalidateQueries({ queryKey: noteKeys.lists() });
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
