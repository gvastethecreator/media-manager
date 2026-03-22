import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';

export interface AIGenerationMetadata {
	cfgScale?: number;
	model?: string;
	negativePrompt?: string;
	prompt?: string;
	sampler?: string;
	seed?: number;
	size?: {
		width: number;
		height: number;
	};
	software?: string;
	steps?: number;
	version?: string;
	[key: string]: unknown;
}

export interface MetadataExtractionResult {
	aiMetadata?: AIGenerationMetadata;
	errors?: string[];
	metadata: Record<string, unknown>;
	parser?: string;
	success: boolean;
}

export interface MetadataUpdateInput {
	category?: string | null;
	description?: string | null;
	entityId?: string | null;
	entityType?: string | null;
	id: string;
	imageId?: string; // Añadir esta propiedad
	isPublic?: boolean;
	key?: string | null;
	metadata?: Record<string, unknown>; // Añadir esta propiedad
	type?: string | null;
	value?: string | null;
}

export interface BulkMetadataUpdateInput {
	imageIds: string[];
	metadata: Record<string, unknown>;
}

// Query keys
export const metadataKeys = {
	all: ['metadata'] as const,
	image: (imageId: string) => [...metadataKeys.all, 'image', imageId] as const,
	extraction: (imageId: string) => [...metadataKeys.all, 'extraction', imageId] as const,
	parsers: () => [...metadataKeys.all, 'parsers'] as const,
};

// Hooks
export function useImageMetadata(imageId: string) {
	return useQuery<MetadataExtractionResult, Error>({
		queryKey: metadataKeys.image(imageId),
		queryFn: () => apiClient.get<MetadataExtractionResult>(`/metadata/image/${imageId}`),
		enabled: !!imageId,
		staleTime: 1000 * 60 * 5, // 5 minutos
	});
}

export function useExtractMetadata(imageId: string) {
	return useQuery<MetadataExtractionResult, Error>({
		queryKey: metadataKeys.extraction(imageId),
		queryFn: () => apiClient.post<MetadataExtractionResult>(`/metadata/extract/${imageId}`),
		enabled: !!imageId,
		staleTime: 1000 * 60 * 10, // 10 minutos - extracción es costosa
	});
}

export function useAvailableParsers() {
	return useQuery<string[], Error>({
		queryKey: metadataKeys.parsers(),
		queryFn: () => apiClient.get<string[]>('/metadata/parsers'),
		staleTime: 1000 * 60 * 60, // 1 hora - raramente cambia
	});
}

export function useUpdateImageMetadata() {
	const queryClient = useQueryClient();

	return useMutation<MetadataExtractionResult, Error, { imageId: string; metadata: Record<string, unknown> }>({
		mutationFn: ({ imageId, metadata }) =>
			apiClient.put<MetadataExtractionResult>(`/metadata/image/${imageId}`, { metadata }),
		onSuccess: (data, { imageId }) => {
			queryClient.setQueryData(metadataKeys.image(imageId), data);
		},
	});
}

export function useBulkUpdateMetadata() {
	const queryClient = useQueryClient();

	return useMutation<{ updated: number; errors: string[] }, Error, BulkMetadataUpdateInput>({
		mutationFn: (data) => apiClient.put<{ updated: number; errors: string[] }>('/metadata/bulk-update', data),
		onSuccess: (_, { imageIds }) => {
			// Invalidar cache de todas las imágenes actualizadas
			for (const imageId of imageIds) {
				queryClient.invalidateQueries({ queryKey: metadataKeys.image(imageId) });
			}
		},
	});
}

export function useReprocessMetadata() {
	const queryClient = useQueryClient();

	return useMutation<MetadataExtractionResult, Error, string>({
		mutationFn: (imageId) => apiClient.post<MetadataExtractionResult>(`/metadata/reprocess/${imageId}`),
		onSuccess: (data, imageId) => {
			queryClient.setQueryData(metadataKeys.image(imageId), data);
			queryClient.setQueryData(metadataKeys.extraction(imageId), data);
		},
	});
}
