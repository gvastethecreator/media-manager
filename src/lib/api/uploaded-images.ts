import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UploadedImageFilters, UploadedImageResult, UploadedImageStats } from '@/types/uploaded-images';
import { apiClient } from './client';

export interface UploadedImageCreateInput {
	name: string;
	path: string;
	size: number;
	hash: string;
	metadata?: string | null;
	imageId: string;
}

export interface UploadedImageUpdateInput {
	name?: string;
	path?: string;
	size?: number;
	hash?: string;
	metadata?: string | null;
	imageId?: string;
}

export interface UploadedImagesResponse {
	data: UploadedImageResult[];
	pagination: {
		total: number;
		limit: number;
		offset: number;
		hasNext: boolean;
		hasPrev: boolean;
	};
}

// Query keys
export const uploadedImageKeys = {
	all: ['uploaded-images'] as const,
	lists: () => [...uploadedImageKeys.all, 'list'] as const,
	list: (filters: UploadedImageFilters) => [...uploadedImageKeys.lists(), filters] as const,
	details: () => [...uploadedImageKeys.all, 'detail'] as const,
	detail: (id: string) => [...uploadedImageKeys.details(), id] as const,
	stats: () => [...uploadedImageKeys.all, 'stats'] as const,
};

// Hooks
export function useUploadedImages(filters: UploadedImageFilters = {}) {
	return useQuery<UploadedImagesResponse, Error>({
		queryKey: uploadedImageKeys.list(filters),
		queryFn: () => {
			const params = new URLSearchParams();
			for (const [key, value] of Object.entries(filters)) {
				if (value !== undefined && value !== null) {
					params.append(key, String(value));
				}
			}
			return apiClient.get<UploadedImagesResponse>(`/uploaded-images?${params.toString()}`);
		},
		staleTime: 1000 * 60, // 1 minuto
	});
}

export function useUploadedImage(id: string) {
	return useQuery<UploadedImageResult, Error>({
		queryKey: uploadedImageKeys.detail(id),
		queryFn: () => apiClient.get<UploadedImageResult>(`/uploaded-images/${id}`),
		enabled: !!id,
		staleTime: 1000 * 60, // 1 minuto
	});
}

export function useUploadedImageStats() {
	return useQuery<UploadedImageStats, Error>({
		queryKey: uploadedImageKeys.stats(),
		queryFn: () => apiClient.get<UploadedImageStats>('/uploaded-images/stats'),
		staleTime: 1000 * 60 * 5, // 5 minutos
	});
}

export function useUploadImages() {
	const queryClient = useQueryClient();

	return useMutation<UploadedImageResult[], Error, FormData>({
		mutationFn: (formData) => apiClient.post<UploadedImageResult[]>('/uploaded-images/upload', formData),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: uploadedImageKeys.lists() });
			queryClient.invalidateQueries({ queryKey: uploadedImageKeys.stats() });
		},
	});
}

export function useUpdateUploadedImage() {
	const queryClient = useQueryClient();

	return useMutation<UploadedImageResult, Error, { id: string; data: UploadedImageUpdateInput }>({
		mutationFn: ({ id, data }) => apiClient.put<UploadedImageResult>(`/uploaded-images/${id}`, data),
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: uploadedImageKeys.lists() });
			queryClient.setQueryData(uploadedImageKeys.detail(data.id), data);
		},
	});
}

export function useDeleteUploadedImage() {
	const queryClient = useQueryClient();

	return useMutation<void, Error, string>({
		mutationFn: (id) => apiClient.delete(`/uploaded-images/${id}`),
		onSuccess: (_, id) => {
			queryClient.invalidateQueries({ queryKey: uploadedImageKeys.lists() });
			queryClient.removeQueries({ queryKey: uploadedImageKeys.detail(id) });
			queryClient.invalidateQueries({ queryKey: uploadedImageKeys.stats() });
		},
	});
}
