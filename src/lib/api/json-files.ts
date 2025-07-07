import { useQuery } from '@tanstack/react-query';
import type { JsonFileWithStats } from '@/types/entities/json-file';
import { apiClient } from './client';

export interface JsonFileFilters {
	search?: string;
	limit?: number;
	offset?: number;
	sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'size';
	sortOrder?: 'asc' | 'desc';
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
