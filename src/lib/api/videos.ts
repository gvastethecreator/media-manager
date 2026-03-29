import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { VideoWithStats } from '@/types/entities/video';
import { deleteVideoFromApi, updateVideoInApi } from './client/video.client';
import { apiClient } from './client';

export interface VideoFilters {
	limit?: number;
	offset?: number;
	search?: string;
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
			return apiClient.get<VideosResponse>(`/videos?${params.toString()}`);
		},
		staleTime: 1000 * 60, // 1 minuto
	});
}

export function useVideo(id: string) {
	return useQuery<VideoWithStats, Error>({
		queryKey: videoKeys.detail(id),
		queryFn: () => apiClient.get<VideoWithStats>(`/videos/${id}`),
		enabled: !!id,
		staleTime: 1000 * 60, // 1 minuto
	});
}

export function useUpdateVideo() {
	const queryClient = useQueryClient();

	return useMutation<VideoWithStats, Error, { id: string; data: Partial<VideoWithStats> }>({
		mutationFn: ({ id, data }) => updateVideoInApi(id, data),
		onSuccess: (video) => {
			queryClient.invalidateQueries({ queryKey: videoKeys.lists() });
			queryClient.setQueryData(videoKeys.detail(video.id), video);
		},
	});
}

export function useDeleteVideo() {
	const queryClient = useQueryClient();

	return useMutation<void, Error, string>({
		mutationFn: (id) => deleteVideoFromApi(id),
		onSuccess: (_, id) => {
			queryClient.invalidateQueries({ queryKey: videoKeys.lists() });
			queryClient.removeQueries({ queryKey: videoKeys.detail(id) });
		},
	});
}
