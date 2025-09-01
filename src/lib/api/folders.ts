import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { navigationKeys } from '@/lib/api/navigation';
import type { FolderWithStats } from '@/types/entities/folder';
import type { FolderStatsResponse } from '@/types/folders';
import {
	createFolder,
	deleteFolder,
	findFolders,
	getAllFolders,
	getFolder,
	getFolderIdByPath,
	getFolderName,
	getFolderPath,
	getFolderStats,
	getParentFolderId,
	getRecentFolderImages,
	getRootFolderId,
	moveFolder,
	reindexAllFolders,
	reindexFolder,
	toggleFolderFavorite,
	updateFolder,
} from './services/folders';

export interface FolderFilters {
	parentId?: string | null;
	search?: string;
	limit?: number;
	offset?: number;
	sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'size';
	sortOrder?: 'asc' | 'desc';
}

export interface FolderCreateInput {
	name: string;
	path: string;
	description?: string | null;
	emoji?: string | null;
	color?: string | null;
	featuredImage?: string | null;
	isFavorite?: boolean;
	parentId?: string | null;
	presetId?: string | null;
}

export interface FolderUpdateInput {
	name?: string;
	description?: string | null;
	path?: string;
	emoji?: string | null;
	color?: string | null;
	featuredImage?: string | null;
	isFavorite?: boolean;
	parentId?: string | null;
	presetId?: string | null;
}

export interface FoldersResponse {
	data: FolderWithStats[];
	pagination: {
		total: number;
		limit: number;
		offset: number;
		hasNext: boolean;
		hasPrev: boolean;
	};
}

// Query keys
export const folderKeys = {
	all: ['folders'] as const,
	lists: () => [...folderKeys.all, 'list'] as const,
	list: (filters: FolderFilters) => [...folderKeys.lists(), filters] as const,
	details: () => [...folderKeys.all, 'detail'] as const,
	detail: (id: string) => [...folderKeys.details(), id] as const,
	tree: () => [...folderKeys.all, 'tree'] as const,
};

// Hooks
export function useFolders(filters: FolderFilters = {}) {
	return useQuery<FoldersResponse, Error>({
		queryKey: folderKeys.list(filters),
		queryFn: async () => {
			const result = await findFolders(filters);
			// Ajustado para coincidir con la nueva estructura de API
			return {
				data: result.data,
				pagination: {
					total: result.pagination.total,
					limit: filters.limit || 50,
					offset: filters.offset || 0,
					hasNext: (filters.offset || 0) + (filters.limit || 50) < result.pagination.total,
					hasPrev: (filters.offset || 0) > 0,
				},
			};
		},
		staleTime: 1000 * 60, // 1 minuto
	});
}

export function useFolder(id: string) {
	return useQuery<FolderWithStats | null, Error>({
		queryKey: folderKeys.detail(id),
		queryFn: () => getFolder(id),
		enabled: !!id,
		staleTime: 1000 * 60, // 1 minuto
	});
}

export function useFolderTree() {
	return useQuery<FolderWithStats[], Error>({
		queryKey: folderKeys.tree(),
		queryFn: () => getAllFolders(),
		staleTime: 1000 * 120, // 2 minutos
	});
}

export function useCreateFolder() {
	const queryClient = useQueryClient();

	return useMutation<FolderWithStats, Error, FolderCreateInput>({
		mutationFn: (data) => createFolder(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: folderKeys.lists() });
			queryClient.invalidateQueries({ queryKey: folderKeys.tree() });
		},
	});
}

export function useUpdateFolder() {
	const queryClient = useQueryClient();

	return useMutation<FolderWithStats, Error, { id: string; data: FolderUpdateInput }>({
		mutationFn: ({ id, data }) => updateFolder(id, data),
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: folderKeys.lists() });
			queryClient.invalidateQueries({ queryKey: folderKeys.tree() });
			queryClient.setQueryData(folderKeys.detail(data.id), data);
		},
	});
}

export function useDeleteFolder() {
	const queryClient = useQueryClient();

	return useMutation<void, Error, string>({
		mutationFn: (id) => deleteFolder(id),
		onSuccess: (_, id) => {
			queryClient.invalidateQueries({ queryKey: folderKeys.lists() });
			queryClient.invalidateQueries({ queryKey: folderKeys.tree() });
			queryClient.removeQueries({ queryKey: folderKeys.detail(id) });
		},
	});
}

export function useMoveFolder() {
	const queryClient = useQueryClient();

	return useMutation<FolderWithStats, Error, { folderId: string; newParentId: string | null }>({
		mutationFn: ({ folderId, newParentId }) => moveFolder(folderId, newParentId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: folderKeys.lists() });
			queryClient.invalidateQueries({ queryKey: folderKeys.tree() });
		},
	});
}

export function useToggleFolderFavorite() {
	const queryClient = useQueryClient();

	return useMutation<FolderWithStats, Error, string>({
		mutationFn: (id) => toggleFolderFavorite(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: folderKeys.lists() });
			queryClient.invalidateQueries({ queryKey: folderKeys.tree() });
		},
	});
}

export function useReindexFolder() {
	const queryClient = useQueryClient();

	return useMutation<
		FolderWithStats,
		Error,
		{
			id: string;
			options?: {
				useStructuredFlow?: boolean;
				skipThumbnails?: boolean;
				skipMetadata?: boolean;
			};
		}
	>({
		mutationFn: ({ id, options }) => reindexFolder(id, options),
		retry: false, // ✅ Deshabilitar retry automático para evitar loops infinitos
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: folderKeys.lists() });
			queryClient.invalidateQueries({ queryKey: folderKeys.tree() });
			// Actualizar la caché del detalle afectado directamente (evita invalidación global de details)
			if (data?.id) {
				queryClient.setQueryData(folderKeys.detail(data.id), data);
			}
			// Refrescar estadísticas asociadas
			queryClient.invalidateQueries({ queryKey: ['folder-stats'] });
			// ✅ También refrescar panel de navegación (contadores)
			queryClient.invalidateQueries({ queryKey: navigationKeys.data() });
			queryClient.invalidateQueries({ queryKey: navigationKeys.stats() });
		},
		// onError silenciado para evitar console.*; la UI ya refleja estado/progreso
	});
}

export function useReindexAllFolders() {
	const queryClient = useQueryClient();

	return useMutation<
		{ processed: number; errors: string[] },
		Error,
		| {
				useStructuredFlow?: boolean;
				skipThumbnails?: boolean;
				skipMetadata?: boolean;
		  }
		| undefined
	>({
		mutationFn: (options) => reindexAllFolders(options),
		retry: false, // ✅ Deshabilitar retry automático para evitar loops infinitos en ERR_EMPTY_RESPONSE
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: folderKeys.lists() });
			queryClient.invalidateQueries({ queryKey: folderKeys.tree() });
			// Refrescar métricas globales
			queryClient.invalidateQueries({ queryKey: ['folder-stats'] });
			// ✅ Refrescar datos y estadísticas del panel de navegación
			queryClient.invalidateQueries({ queryKey: navigationKeys.data() });
			queryClient.invalidateQueries({ queryKey: navigationKeys.stats() });
		},
		// onError silenciado para evitar console.*; la UI ya refleja estado/progreso
	});
}

// Hook para obtener imágenes recientes de una carpeta
export function useRecentFolderImages(folderId: string, limit = 4) {
	return useQuery<string[], Error>({
		queryKey: [...folderKeys.detail(folderId), 'recent-images', limit],
		queryFn: () => getRecentFolderImages(folderId, limit),
		enabled: !!folderId,
	});
}

// Hook para obtener estadísticas de una carpeta
export function useFolderStats(folderId: string) {
	return useQuery<FolderStatsResponse, Error>({
		queryKey: [...folderKeys.detail(folderId), 'stats'],
		queryFn: () => getFolderStats(folderId),
		enabled: !!folderId,
	});
}

// Hook para obtener el ID de la carpeta raíz
export function useRootFolderId() {
	return useQuery<string, Error>({
		queryKey: [...folderKeys.all, 'root-id'],
		queryFn: () => getRootFolderId(),
	});
}

// Hook para obtener la ruta de una carpeta por su ID
export function useFolderPath(folderId: string) {
	return useQuery<string, Error>({
		queryKey: [...folderKeys.detail(folderId), 'path'],
		queryFn: () => getFolderPath(folderId),
		enabled: !!folderId,
	});
}

// Hook para obtener el nombre de una carpeta por su ID
export function useFolderName(folderId: string) {
	return useQuery<string, Error>({
		queryKey: [...folderKeys.detail(folderId), 'name'],
		queryFn: () => getFolderName(folderId),
		enabled: !!folderId,
	});
}

// Hook para obtener el ID de una carpeta por su ruta
export function useFolderIdByPath(folderPath: string) {
	return useQuery<string, Error>({
		queryKey: [...folderKeys.all, 'by-path', folderPath],
		queryFn: () => getFolderIdByPath(folderPath),
		enabled: !!folderPath,
	});
}

// Hook para obtener el ID de la carpeta padre
export function useParentFolderId(folderId: string) {
	return useQuery<string | null, Error>({
		queryKey: [...folderKeys.detail(folderId), 'parent-id'],
		queryFn: () => getParentFolderId(folderId),
		enabled: !!folderId,
	});
}
