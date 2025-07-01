import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

export interface ThumbnailInfo {
	imageId: string;
	thumbnailPath: string;
	size: 'small' | 'medium' | 'large';
	width: number;
	height: number;
	fileSize: number;
	createdAt: string;
	updatedAt: string;
}

export interface ThumbnailGenerationOptions {
	sizes?: ('small' | 'medium' | 'large')[];
	force?: boolean; // regenerar si ya existe
	quality?: number; // 1-100
}

export interface BulkThumbnailOptions extends ThumbnailGenerationOptions {
	imageIds: string[];
}

export interface ThumbnailStats {
	totalThumbnails: number;
	totalSize: number;
	averageSize: number;
	bySize: {
		small: { count: number; totalSize: number };
		medium: { count: number; totalSize: number };
		large: { count: number; totalSize: number };
	};
}

export interface ThumbnailResponse {
	thumbnailUrl?: string;
	width?: number;
	height?: number;
	size?: number;
	mimeType?: string;
	error?: string;
}

export interface LastProcessedThumbnail {
	id: string;
	path: string;
	processedAt: string;
}

export interface ProcessOptions {
	onProgress?: (status: any) => void;
	onError?: (error: unknown) => void;
	onComplete?: (data: any) => void;
}

// Query keys
export const thumbnailKeys = {
	all: ['thumbnails'] as const,
	image: (imageId: string) => [...thumbnailKeys.all, 'image', imageId] as const,
	stats: () => [...thumbnailKeys.all, 'stats'] as const,
	lastProcessed: () => [...thumbnailKeys.all, 'lastProcessed'] as const,
	single: (id: string, quality: string) => [...thumbnailKeys.all, 'single', id, quality] as const,
};

// Hooks
export function useImageThumbnails(imageId: string) {
	return useQuery<ThumbnailInfo[], Error>({
		queryKey: thumbnailKeys.image(imageId),
		queryFn: () => api.get<ThumbnailInfo[]>(`/thumbnails/image/${imageId}`),
		enabled: !!imageId,
		staleTime: 1000 * 60 * 5, // 5 minutos
	});
}

export function useThumbnailStats() {
	return useQuery<ThumbnailStats, Error>({
		queryKey: thumbnailKeys.stats(),
		queryFn: () => api.get<ThumbnailStats>('/thumbnails/stats'),
		staleTime: 1000 * 60, // 1 minuto
	});
}

export function useLastProcessedThumbnails(limit = 9) {
	return useQuery<LastProcessedThumbnail[], Error>({
		queryKey: [...thumbnailKeys.lastProcessed(), limit],
		queryFn: () => api.get<LastProcessedThumbnail[]>(`/thumbnails/last-processed?limit=${limit}`),
		staleTime: 1000 * 30, // 30 segundos
	});
}

export function useThumbnail(id: string, quality: string) {
	return useQuery<ThumbnailResponse, Error>({
		queryKey: thumbnailKeys.single(id, quality),
		queryFn: () => api.get<ThumbnailResponse>(`/thumbnails/${id}?quality=${quality}`),
		enabled: !!id,
		staleTime: 1000 * 60 * 10, // 10 minutos
	});
}

export function useGenerateThumbnails() {
	const queryClient = useQueryClient();

	return useMutation<ThumbnailInfo[], Error, { imageId: string; options?: ThumbnailGenerationOptions }>({
		mutationFn: ({ imageId, options = {} }) => api.post<ThumbnailInfo[]>(`/thumbnails/generate/${imageId}`, options),
		onSuccess: (data, { imageId }) => {
			queryClient.setQueryData(thumbnailKeys.image(imageId), data);
			queryClient.invalidateQueries({ queryKey: thumbnailKeys.stats() });
			queryClient.invalidateQueries({ queryKey: thumbnailKeys.lastProcessed() });
		},
	});
}

export function useBulkGenerateThumbnails() {
	const queryClient = useQueryClient();

	return useMutation<{ generated: number; errors: string[] }, Error, BulkThumbnailOptions>({
		mutationFn: (options) => api.post<{ generated: number; errors: string[] }>('/thumbnails/bulk-generate', options),
		onSuccess: (_, { imageIds }) => {
			// Invalidar cache de todas las imágenes procesadas
			for (const imageId of imageIds) {
				queryClient.invalidateQueries({ queryKey: thumbnailKeys.image(imageId) });
			}
			queryClient.invalidateQueries({ queryKey: thumbnailKeys.stats() });
			queryClient.invalidateQueries({ queryKey: thumbnailKeys.lastProcessed() });
		},
	});
}

export function useOptimizeThumbnails() {
	const queryClient = useQueryClient();

	return useMutation<{ optimized: number; totalSaved: number }, Error, ProcessOptions | undefined>({
		mutationFn: (options) => api.post<{ optimized: number; totalSaved: number }>('/thumbnails/optimize', options || {}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: thumbnailKeys.all });
		},
	});
}

export function useReprocessThumbnails() {
	const queryClient = useQueryClient();

	return useMutation<{ processed: number }, Error, ProcessOptions | undefined>({
		mutationFn: (options) => api.post<{ processed: number }>('/thumbnails/reprocess', options || {}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: thumbnailKeys.all });
		},
	});
}

export function useCleanThumbnails() {
	const queryClient = useQueryClient();

	return useMutation<{ cleaned: number; totalFreed: number }, Error, ProcessOptions | undefined>({
		mutationFn: (options) => api.post<{ cleaned: number; totalFreed: number }>('/thumbnails/clean', options || {}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: thumbnailKeys.all });
		},
	});
}

export function useDeleteThumbnails() {
	const queryClient = useQueryClient();

	return useMutation<{ deleted: number }, Error, string>({
		mutationFn: (imageId) => api.delete<{ deleted: number }>(`/thumbnails/image/${imageId}`),
		onSuccess: (_, imageId) => {
			queryClient.removeQueries({ queryKey: thumbnailKeys.image(imageId) });
			queryClient.invalidateQueries({ queryKey: thumbnailKeys.stats() });
			queryClient.invalidateQueries({ queryKey: thumbnailKeys.lastProcessed() });
		},
	});
}

export function useCleanupThumbnails() {
	const queryClient = useQueryClient();

	return useMutation<{ cleaned: number; freed: number }, Error, void>({
		mutationFn: () => api.post<{ cleaned: number; freed: number }>('/thumbnails/cleanup'),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: thumbnailKeys.all });
		},
	});
}
