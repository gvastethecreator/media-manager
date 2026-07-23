import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { invalidateFavoriteQueries } from '@/lib/api/favorite-cache';
import { navigationKeys } from '@/lib/api/navigation';
import type { AuthorizedPathReference } from '@/lib/api/authorized-roots';
import type { FolderWithStats } from '@/types/entities/folder';
import type { FolderStatsResponse } from '@/types/folders';
import {
	createFolder,
	deleteFolder,
	findFolders,
	getAllFolders,
	getFolder,
	getFolderStats,
	getRecentFolderImages,
	moveFolder,
	reindexFolder,
	type ReindexFolderResponse,
	toggleFolderFavorite,
	updateFolder,
} from './services/folders';

export interface FolderFilters {
	limit?: number;
	offset?: number;
	parentId?: string | null;
	search?: string;
	sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'size';
	sortOrder?: 'asc' | 'desc';
}

export interface FolderCreateInput {
	color?: string | null;
	description?: string | null;
	emoji?: string | null;
	featuredImage?: string | null;
	isFavorite?: boolean;
	name: string;
	parentId?: string | null;
	presetId?: string | null;
	source: AuthorizedPathReference;
}

export interface FolderUpdateInput {
	color?: string | null;
	description?: string | null;
	emoji?: string | null;
	featuredImage?: string | null;
	isFavorite?: boolean;
	name?: string;
	parentId?: string | null;
	presetId?: string | null;
	source?: AuthorizedPathReference;
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
export function useFolders(filters: FolderFilters = {}, options?: { enabled?: boolean }) {
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
		enabled: options?.enabled ?? true,
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
		refetchOnMount: 'always',
		refetchOnWindowFocus: true,
		staleTime: 1000 * 15, // 15 segundos: el árbol puede cambiar tras reindex/refresh de estructura
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
			void invalidateFavoriteQueries(queryClient);
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

	return useMutation<ReindexFolderResponse, Error, { id: string }>({
		mutationFn: ({ id }) => reindexFolder(id),
		retry: false, // ✅ Deshabilitar retry automático para evitar loops infinitos
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: folderKeys.lists() });
			queryClient.invalidateQueries({ queryKey: folderKeys.tree() });
			// Actualizar la caché del detalle afectado directamente (evita invalidación global de details)
			if (data?.folderId) {
				queryClient.invalidateQueries({ queryKey: folderKeys.detail(data.folderId) });
			}
			// Refrescar estadísticas asociadas
			queryClient.invalidateQueries({ queryKey: ['folder-stats'] });
			// ✅ También refrescar panel de navegación (contadores)
			queryClient.invalidateQueries({ queryKey: navigationKeys.data() });
			queryClient.invalidateQueries({ queryKey: navigationKeys.stats() });

			// Nota: Hemos eliminado el force fetch a los 6 stores de Zustand aquí.
			// Reindexar podía bajar cientos de miles de registros de golpe y bloquear el navegador.
			// Los componentes y hooks locales de la vista actual son los que deben enterarse
			// de la recarga vía react-query o listeners SSE locales.
		},
		// onError silenciado para evitar console.*; la UI ya refleja estado/progreso
	});
}

// Hook para obtener imágenes recientes de una carpeta
export function useRecentFolderImages(folderId: string, limit = 4) {
	return useQuery<
		Array<{
			id: string;
			name: string;
			thumbnailUrl: string;
		}>,
		Error
	>({
		queryKey: [...folderKeys.detail(folderId), 'recent-images', limit],
		queryFn: () => getRecentFolderImages(folderId, limit),
		enabled: !!folderId,
	});
}

// Hook para obtener estadísticas de una carpeta
export function useFolderStats(folderId: string, options?: { staleTime?: number; gcTime?: number; enabled?: boolean }) {
	return useQuery<FolderStatsResponse, Error>({
		queryKey: [...folderKeys.detail(folderId), 'stats'],
		queryFn: () => getFolderStats(folderId),
		enabled: !!folderId && (options?.enabled ?? true),
		staleTime: options?.staleTime,
		gcTime: options?.gcTime,
	});
}
