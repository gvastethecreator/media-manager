import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { FolderWithStats } from '@/types/entities/folder';
import { api } from './client';

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
	parentId?: string;
	isRoot?: boolean;
}

export interface FolderUpdateInput {
	name?: string;
	description?: string;
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
		queryFn: () => {
			const params = new URLSearchParams();
			for (const [key, value] of Object.entries(filters)) {
				if (value !== undefined && value !== null) {
					params.append(key, String(value));
				}
			}
			return api.get<FoldersResponse>(`/folders?${params.toString()}`);
		},
		staleTime: 1000 * 60, // 1 minuto
	});
}

export function useFolder(id: string) {
	return useQuery<FolderWithStats, Error>({
		queryKey: folderKeys.detail(id),
		queryFn: () => api.get<FolderWithStats>(`/folders/${id}`),
		enabled: !!id,
		staleTime: 1000 * 60, // 1 minuto
	});
}

export function useFolderTree() {
	return useQuery<FolderWithStats[], Error>({
		queryKey: folderKeys.tree(),
		queryFn: () => api.get<FolderWithStats[]>('/folders/tree'),
		staleTime: 1000 * 120, // 2 minutos
	});
}

export function useCreateFolder() {
	const queryClient = useQueryClient();

	return useMutation<FolderWithStats, Error, FolderCreateInput>({
		mutationFn: (data) => api.post<FolderWithStats>('/folders', data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: folderKeys.lists() });
			queryClient.invalidateQueries({ queryKey: folderKeys.tree() });
		},
	});
}

export function useUpdateFolder() {
	const queryClient = useQueryClient();

	return useMutation<FolderWithStats, Error, { id: string; data: FolderUpdateInput }>({
		mutationFn: ({ id, data }) => api.put<FolderWithStats>(`/folders/${id}`, data),
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
		mutationFn: (id) => api.delete(`/folders/${id}`),
		onSuccess: (_, id) => {
			queryClient.invalidateQueries({ queryKey: folderKeys.lists() });
			queryClient.invalidateQueries({ queryKey: folderKeys.tree() });
			queryClient.removeQueries({ queryKey: folderKeys.detail(id) });
		},
	});
}

// Hook para obtener imágenes recientes de una carpeta
export function useRecentFolderImages(folderId: string, limit: number = 4) {
  return useQuery<string[], Error>({
    queryKey: [...folderKeys.detail(folderId), 'recent-images', limit],
    queryFn: () => api.get<string[]>(`/folders/${folderId}/recent-images?limit=${limit}`),
    enabled: !!folderId,
  });
}

// Hook para obtener estadísticas de una carpeta
export function useFolderStats(folderId: string) {
  return useQuery<{
    totalImages: number;
    totalVideos: number;
    totalSize: number;
    lastActivity: Date | null;
  }, Error>({
    queryKey: [...folderKeys.detail(folderId), 'stats'],
    queryFn: () => api.get<{
      totalImages: number;
      totalVideos: number;
      totalSize: number;
      lastActivity: Date | null;
    }>(`/folders/${folderId}/stats`),
    enabled: !!folderId,
  });
}

// Hook para obtener el ID de la carpeta raíz
export function useRootFolderId() {
  return useQuery<string, Error>({
    queryKey: [...folderKeys.all, 'root-id'],
    queryFn: () => api.get<{ id: string }>('/folders/root').then(res => res.id),
  });
}

// Hook para obtener la ruta de una carpeta por su ID
export function useFolderPath(folderId: string) {
  return useQuery<string, Error>({
    queryKey: [...folderKeys.detail(folderId), 'path'],
    queryFn: () => api.get<{ path: string }>(`/folders/${folderId}/path`).then(res => res.path),
    enabled: !!folderId,
  });
}

// Hook para obtener el nombre de una carpeta por su ID
export function useFolderName(folderId: string) {
  return useQuery<string, Error>({
    queryKey: [...folderKeys.detail(folderId), 'name'],
    queryFn: () => api.get<{ name: string }>(`/folders/${folderId}/name`).then(res => res.name),
    enabled: !!folderId,
  });
}

// Hook para obtener el ID de una carpeta por su ruta
export function useFolderIdByPath(folderPath: string) {
  return useQuery<string, Error>({
    queryKey: [...folderKeys.all, 'by-path', folderPath],
    queryFn: () => api.get<{ id: string }>(`/folders/by-path?path=${encodeURIComponent(folderPath)}`).then(res => res.id),
    enabled: !!folderPath,
  });
}

// Hook para obtener el ID de la carpeta padre
export function useParentFolderId(folderId: string) {
  return useQuery<string | null, Error>({
    queryKey: [...folderKeys.detail(folderId), 'parent-id'],
    queryFn: () => api.get<{ parentFolderId: string | null }>(`/folders/${folderId}/parent-id`).then(res => res.parentFolderId),
    enabled: !!folderId,
  });
}