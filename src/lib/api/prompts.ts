import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ImageWithStats } from '@/types/entities/image';
import type { PromptWithStats } from '@/types/entities/prompt';
import { apiClient } from './client';

export interface PromptFilters {
	search?: string;
	limit?: number;
	offset?: number;
	sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'totalImages' | 'totalVideos' | 'type' | 'content' | 'parameters' | 'style' | 'mood' | 'lighting' | 'composition' | 'technique' | 'inspiration' | 'notes' | 'featuredImage' | 'parentId';
	sortOrder?: 'asc' | 'desc';
	category?: string;
	isPublic?: boolean;
	isFavorite?: boolean;
	type?: string;
	content?: string;
	parameters?: string;
	style?: string;
	mood?: string;
	lighting?: string;
	composition?: string;
	technique?: string;
	inspiration?: string;
	notes?: string;
	featuredImage?: string;
	parentId?: string;
}

export interface PromptCreateInput {
	name: string;
	description?: string | null;
	emoji?: string | null;
	color?: string | null;
	category?: string | null;
	isPublic?: boolean;
	isFavorite?: boolean;
	totalImages?: number;
	totalVideos?: number;
	type?: string | null;
	content?: string | null;
	parameters?: string | null;
	style?: string | null;
	mood?: string | null;
	lighting?: string | null;
	composition?: string | null;
	technique?: string | null;
	inspiration?: string | null;
	notes?: string | null;
	featuredImage?: string | null;
	parentId?: string | null;
}

export interface PromptUpdateInput {
	name?: string;
	description?: string | null;
	emoji?: string | null;
	color?: string | null;
	category?: string | null;
	isPublic?: boolean;
	isFavorite?: boolean;
	totalImages?: number;
	totalVideos?: number;
	type?: string | null;
	content?: string | null;
	parameters?: string | null;
	style?: string | null;
	mood?: string | null;
	lighting?: string | null;
	composition?: string | null;
	technique?: string | null;
	inspiration?: string | null;
	notes?: string | null;
	featuredImage?: string | null;
	parentId?: string | null;
}

export interface PromptsResponse {
	data: PromptWithStats[];
	pagination: {
		total: number;
		limit: number;
		offset: number;
		hasNext: boolean;
		hasPrev: boolean;
	};
}

// Query keys
export const promptKeys = {
	all: ['prompts'] as const,
	lists: () => [...promptKeys.all, 'list'] as const,
	list: (filters: PromptFilters) => [...promptKeys.lists(), filters] as const,
	details: () => [...promptKeys.all, 'detail'] as const,
	detail: (id: string) => [...promptKeys.details(), id] as const,
	images: (id: string) => [...promptKeys.detail(id), 'images'] as const,
};

// Hooks
export function usePrompts(filters: PromptFilters = {}) {
	return useQuery<PromptsResponse, Error>({
		queryKey: promptKeys.list(filters),
		queryFn: () => {
			const params = new URLSearchParams();
			for (const [key, value] of Object.entries(filters)) {
				if (value !== undefined && value !== null) {
					params.append(key, String(value));
				}
			}
			return apiClient.get<PromptsResponse>(`/prompts?${params.toString()}`);
		},
		staleTime: 1000 * 60, // 1 minuto
	});
}

export function usePrompt(id: string) {
	return useQuery<PromptWithStats, Error>({
		queryKey: promptKeys.detail(id),
		queryFn: () => apiClient.get<PromptWithStats>(`/prompts/${id}`),
		enabled: !!id,
		staleTime: 1000 * 60, // 1 minuto
	});
}

export function usePromptImages(id: string) {
	return useQuery<ImageWithStats[], Error>({
		queryKey: promptKeys.images(id),
		queryFn: () => apiClient.get<ImageWithStats[]>(`/prompts/${id}/images`),
		enabled: !!id,
		staleTime: 1000 * 30, // 30 segundos
	});
}

export function useCreatePrompt() {
	const queryClient = useQueryClient();

	return useMutation<PromptWithStats, Error, PromptCreateInput>({
		mutationFn: (data) => apiClient.post<PromptWithStats>('/prompts', data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: promptKeys.lists() });
		},
	});
}

export function useUpdatePrompt() {
	const queryClient = useQueryClient();

	return useMutation<PromptWithStats, Error, { id: string; data: PromptUpdateInput }>({
		mutationFn: ({ id, data }) => apiClient.put<PromptWithStats>(`/prompts/${id}`, data),
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: promptKeys.lists() });
			queryClient.setQueryData(promptKeys.detail(data.id), data);
		},
	});
}

export function useDeletePrompt() {
	const queryClient = useQueryClient();

	return useMutation<void, Error, string>({
		mutationFn: (id) => apiClient.delete(`/prompts/${id}`),
		onSuccess: (_, id) => {
			queryClient.invalidateQueries({ queryKey: promptKeys.lists() });
			queryClient.removeQueries({ queryKey: promptKeys.detail(id) });
			queryClient.removeQueries({ queryKey: promptKeys.images(id) });
		},
	});
}

export function useRecentPromptImages(promptId: string, limit = 6) {
	return useQuery<Array<{ id: string; name?: string | null; thumbnailUrl: string; url?: string }>, Error>({
		queryKey: [...promptKeys.detail(promptId), 'recent-images', limit],
		queryFn: () =>
			apiClient.get<Array<{ id: string; name?: string | null; thumbnailUrl: string; url?: string }>>(
				`/prompts/${promptId}/recent-images?limit=${limit}`
			),
		enabled: !!promptId,
	});
}
