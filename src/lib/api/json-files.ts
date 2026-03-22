import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { JsonFileWithStats } from '@/types/entities/json-file';
import { apiClient } from './client';

export interface JsonFileFilters {
	limit?: number;
	offset?: number;
	search?: string;
	sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'size';
	sortOrder?: 'asc' | 'desc';
}

export interface JsonFileCreateInput {
	content?: string | null;
	depth?: number | null;
	extension: string;
	folderId: string;
	hash: string;
	isArchived?: boolean;
	isFavorite?: boolean;
	isValid?: boolean;
	keyCount?: number | null;
	mimeType: string;
	name: string;
	path: string;
	schema?: string | null;
	size: number;
	validationErrors?: string | null;
}

export interface JsonFileUpdateInput {
	content?: string | null;
	depth?: number | null;
	extension?: string;
	folderId?: string;
	hash?: string;
	isArchived?: boolean;
	isFavorite?: boolean;
	isValid?: boolean;
	keyCount?: number | null;
	mimeType?: string;
	name?: string;
	path?: string;
	schema?: string | null;
	size?: number;
	validationErrors?: string | null;
}

export interface JsonFilesResponse {
	data: JsonFileWithStats[];
	pagination: {
		total: number;
		limit: number;
		offset: number;
		hasNext: boolean;
		hasPrev: boolean;
	};
}

// Query keys
export const jsonFileKeys = {
	all: ['json-files'] as const,
	lists: () => [...jsonFileKeys.all, 'list'] as const,
	list: (filters: JsonFileFilters) => [...jsonFileKeys.lists(), filters] as const,
	details: () => [...jsonFileKeys.all, 'detail'] as const,
	detail: (id: string) => [...jsonFileKeys.details(), id] as const,
};

// Hooks
export function useJsonFiles(filters: JsonFileFilters = {}) {
	return useQuery<JsonFilesResponse, Error>({
		queryKey: jsonFileKeys.list(filters),
		queryFn: () => {
			const params = new URLSearchParams();
			for (const [key, value] of Object.entries(filters)) {
				if (value !== undefined && value !== null) {
					params.append(key, String(value));
				}
			}
			return apiClient.get<JsonFilesResponse>(`/json-files?${params.toString()}`);
		},
		staleTime: 1000 * 60, // 1 minuto
	});
}

export function useJsonFile(id: string) {
	return useQuery<JsonFileWithStats, Error>({
		queryKey: jsonFileKeys.detail(id),
		queryFn: () => apiClient.get<JsonFileWithStats>(`/json-files/${id}`),
		enabled: !!id,
		staleTime: 1000 * 60, // 1 minuto
	});
}

export function useCreateJsonFile() {
	const queryClient = useQueryClient();

	return useMutation<JsonFileWithStats, Error, JsonFileCreateInput>({
		mutationFn: (data) => apiClient.post<JsonFileWithStats>('/json-files', data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: jsonFileKeys.lists() });
		},
	});
}

export function useUpdateJsonFile() {
	const queryClient = useQueryClient();

	return useMutation<JsonFileWithStats, Error, { id: string; data: JsonFileUpdateInput }>({
		mutationFn: ({ id, data }) => apiClient.put<JsonFileWithStats>(`/json-files/${id}`, data),
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: jsonFileKeys.lists() });
			queryClient.setQueryData(jsonFileKeys.detail(data.id), data);
		},
	});
}

export function useDeleteJsonFile() {
	const queryClient = useQueryClient();

	return useMutation<void, Error, string>({
		mutationFn: (id) => apiClient.delete(`/json-files/${id}`),
		onSuccess: (_, id) => {
			queryClient.invalidateQueries({ queryKey: jsonFileKeys.lists() });
			queryClient.removeQueries({ queryKey: jsonFileKeys.detail(id) });
		},
	});
}
