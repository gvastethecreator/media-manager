import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { VideoWithStats } from '@/types/entities/video';
import { api } from './client';

export interface VideoFilters {
	search?: string;
	limit?: number;
	offset?: number;
	sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'size' | 'duration' | 'width' | 'height';
	sortOrder?: 'asc' | 'desc';
}

export interface VideosResponse {
	data: VideoWithStats[];
	pagination: {
		total: number;
		limit: number;
		offset: number;
		hasNext: boolean;
		hasPrev: boolean;
	};
}

// Query keys
export const videoKeys = {
	all: ['videos'] as const,
	lists: () => [...videoKeys.all, 'list'] as const,
	list: (filters: VideoFilters) => [...videoKeys.lists(), filters] as const,
	details: () => [...videoKeys.all, 'detail'] as const,
	detail: (id: string) => [...videoKeys.details(), id] as const,
};

// Hooks
export function useVideos(filters: VideoFilters = {}) {
	return useQuery<VideosResponse, Error>({
		queryKey: videoKeys.list(filters),
		queryFn: () => {
			const params = new URLSearchParams();
			for (const [key, value] of Object.entries(filters)) {
				if (value !== undefined && value !== null) {
					params.append(key, String(value));
				}
			}
			return api.get<VideosResponse>(`/videos?${params.toString()}`);
		},
		staleTime: 1000 * 60, // 1 minuto
	});
}

export function useVideo(id: string) {
	return useQuery<VideoWithStats, Error>({
		queryKey: videoKeys.detail(id),
		queryFn: () => api.get<VideoWithStats>(`/videos/${id}`),
		enabled: !!id,
		staleTime: 1000 * 60, // 1 minuto
	});
}
