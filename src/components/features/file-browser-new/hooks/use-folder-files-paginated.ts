/**
 * @file Hook para carga paginada real de archivos de carpeta
 * @module file-browser-new/hooks/use-folder-files-paginated
 * @description Hook optimizado con paginación real desde backend
 */

import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import type { MediaItem } from '../components/media-thumbnail';
import { clientLogger } from '@/lib/logger/client-logger';

const logger = clientLogger.withContext('FolderFilesPaginated');

// Tipos para el hook
export interface FolderFile {
	id: string;
	name: string;
	path: string;
	size: number;
	createdAt: string;
	updatedAt: string;
	folderId: string;
	entityType: 'image' | 'video' | 'audio' | 'document' | 'json' | '3d';
	extension: string;
	metadata?: Record<string, any>;
	thumbnailPath?: string;
	stats?: {
		views?: number;
		downloads?: number;
		isFavorite?: boolean;
	};
}

export interface FolderFilesResponse {
	success: boolean;
	data: FolderFile[];
	pagination: {
		limit: number;
		offset: number;
		totalPages: number;
		currentPage: number;
	};
	total: number;
	hasMore: boolean;
	performance: {
		queryTime: number;
		processedRecords: number;
	};
	folder: {
		id: string;
		name: string;
		path: string;
	};
}

export interface FolderStatsResponse {
	success: boolean;
	data: {
		images: number;
		videos: number;
		audios: number;
		documents: number;
		jsonFiles: number;
		file3Ds: number;
		total: number;
	};
	folder: {
		id: string;
		name: string;
		path: string;
	};
}

export interface UseFolderFilesPaginatedOptions {
	folderId: string | null;
	includeSubfolders?: boolean;
	pageSize?: number;
	search?: string;
	sortBy?: 'name' | 'size' | 'createdAt' | 'updatedAt';
	sortOrder?: 'asc' | 'desc';
	fileTypes?: Array<'image' | 'video' | 'audio' | 'document' | 'json' | '3d'>;
	enabled?: boolean;
}

export interface UseFolderFilesPaginatedResult {
	files: MediaItem[];
	flatFiles: FolderFile[];
	isLoading: boolean;
	isLoadingMore: boolean;
	isFetching: boolean;
	error: Error | null;
	hasMore: boolean;
	loadMore: () => void;
	total: number;
	loadedCount: number;
	currentPage: number;
	totalPages: number;
	queryTime?: number;
	refetch: () => Promise<void>;
	invalidate: () => void;
}

/**
 * API client para obtener archivos de carpeta
 */
async function fetchFolderFiles({
	folderId,
	includeSubfolders = false,
	limit = 150,
	offset = 0,
	search,
	sortBy = 'name',
	sortOrder = 'asc',
	fileTypes = ['image', 'video', 'audio', 'document', 'json', '3d'],
}: {
	folderId: string;
	includeSubfolders?: boolean;
	limit?: number;
	offset?: number;
	search?: string;
	sortBy?: string;
	sortOrder?: string;
	fileTypes?: string[];
}): Promise<FolderFilesResponse> {
	const params = new URLSearchParams({
		includeSubfolders: includeSubfolders.toString(),
		limit: limit.toString(),
		offset: offset.toString(),
		sortBy,
		sortOrder,
		fileTypes: fileTypes.join(','),
	});

	if (search?.trim()) {
		params.append('search', search.trim());
	}

	const response = await fetch(`/api/folders/${folderId}/files?${params}`);

	if (!response.ok) {
		throw new Error(`Failed to fetch folder files: ${response.status} ${response.statusText}`);
	}

	return response.json();
}

/**
 * API client para obtener estadísticas de carpeta
 */
async function fetchFolderStats({
	folderId,
	includeSubfolders = false,
}: {
	folderId: string;
	includeSubfolders?: boolean;
}): Promise<FolderStatsResponse> {
	const params = new URLSearchParams({
		includeSubfolders: includeSubfolders.toString(),
	});

	const response = await fetch(`/api/folders/${folderId}/files/stats?${params}`);

	if (!response.ok) {
		throw new Error(`Failed to fetch folder stats: ${response.status} ${response.statusText}`);
	}

	return response.json();
}

/**
 * Convierte FolderFile a MediaItem para compatibilidad
 */
function folderFileToMediaItem(file: FolderFile): MediaItem {
	const entityType =
		file.entityType === 'json'
			? 'jsonFile'
			: file.entityType === '3d'
				? 'file3d'
				: (file.entityType as MediaItem['entityType']);

	return {
		id: file.id,
		name: file.name,
		path: file.path,
		size: file.size,
		entityType,
		createdAt: new Date(file.createdAt),
		thumbnailUrl: file.thumbnailPath,
		...(file.entityType === 'image' &&
			file.metadata && {
				width: file.metadata.width,
				height: file.metadata.height,
			}),
		...(file.entityType === 'video' &&
			file.metadata && {
				width: file.metadata.width,
				height: file.metadata.height,
			}),
	};
}

/**
 * Hook principal para carga paginada de archivos de carpeta
 */
export function useFolderFilesPaginated(options: UseFolderFilesPaginatedOptions): UseFolderFilesPaginatedResult {
	const {
		folderId,
		includeSubfolders = false,
		pageSize = 150,
		search,
		sortBy = 'name',
		sortOrder = 'asc',
		fileTypes = ['image', 'video', 'audio', 'document', 'json', '3d'],
		enabled = true,
	} = options;

	const queryClient = useQueryClient();

	const queryKey = useMemo(
		() => [
			'folder-files-paginated',
			folderId,
			includeSubfolders,
			pageSize,
			search,
			sortBy,
			sortOrder,
			fileTypes.sort().join(','),
		],
		[folderId, includeSubfolders, pageSize, search, sortBy, sortOrder, fileTypes]
	);

	const {
		data,
		isLoading,
		isFetching,
		isError,
		error,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
		refetch: refetchQuery,
	} = useInfiniteQuery<FolderFilesResponse, Error>({
		queryKey,
		queryFn: ({ pageParam = 0 }) => {
			if (!folderId) {
				throw new Error('Folder ID is required');
			}

			return fetchFolderFiles({
				folderId,
				includeSubfolders,
				limit: pageSize,
				offset: (pageParam as number) * pageSize,
				search,
				sortBy,
				sortOrder,
				fileTypes,
			});
		},
		getNextPageParam: (lastPage: FolderFilesResponse) => {
			if (!lastPage.hasMore) return;
			return lastPage.pagination.currentPage;
		},
		initialPageParam: 0,
		enabled: enabled && !!folderId,
		staleTime: 5 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
		refetchOnWindowFocus: false,
	});

	const processedData = useMemo(() => {
		if (!data?.pages) {
			return {
				files: [],
				flatFiles: [],
				total: 0,
				loadedCount: 0,
				currentPage: 0,
				totalPages: 0,
				queryTime: 0,
			};
		}

		const flatFiles = data.pages.flatMap((page) => page.data);
		const files = flatFiles.map(folderFileToMediaItem);
		const lastPage = data.pages.at(-1);

		return {
			files,
			flatFiles,
			total: lastPage?.total || 0,
			loadedCount: flatFiles.length,
			currentPage: lastPage?.pagination.currentPage || 0,
			totalPages: lastPage?.pagination.totalPages || 0,
			queryTime: lastPage?.performance.queryTime,
		};
	}, [data]);

	const loadMore = useCallback(() => {
		if (hasNextPage && !isFetchingNextPage) {
			logger.debug('Loading more files', {
				folderId,
				currentCount: processedData.loadedCount,
				total: processedData.total,
			});
			fetchNextPage();
		}
	}, [hasNextPage, isFetchingNextPage, fetchNextPage, folderId, processedData.loadedCount, processedData.total]);

	const invalidate = useCallback(() => {
		queryClient.invalidateQueries({ queryKey: ['folder-files-paginated', folderId] });
	}, [queryClient, folderId]);

	if (processedData.queryTime && isLoading) {
		logger.info('Folder files loaded', {
			folderId,
			count: processedData.loadedCount,
			total: processedData.total,
			queryTime: processedData.queryTime,
		});
	}

	return {
		files: processedData.files,
		flatFiles: processedData.flatFiles,
		isLoading,
		isLoadingMore: isFetchingNextPage,
		isFetching,
		error: isError ? (error as Error) : null,
		hasMore: !!hasNextPage,
		loadMore,
		total: processedData.total,
		loadedCount: processedData.loadedCount,
		currentPage: processedData.currentPage,
		totalPages: processedData.totalPages,
		queryTime: processedData.queryTime,
		refetch: async () => {
			await refetchQuery();
		},
		invalidate,
	};
}

/**
 * Hook para estadísticas rápidas de carpeta
 */
export function useFolderStats(folderId: string | null, includeSubfolders = false) {
	return useQuery<FolderStatsResponse, Error>({
		queryKey: ['folder-stats', folderId, includeSubfolders],
		queryFn: () => {
			if (!folderId) {
				throw new Error('Folder ID is required');
			}
			return fetchFolderStats({ folderId, includeSubfolders });
		},
		enabled: !!folderId,
		staleTime: 10 * 60 * 1000,
		gcTime: 30 * 60 * 1000,
	});
}

/**
 * Hook para invalidar caches relacionados con una carpeta
 */
export function useFolderCacheInvalidation() {
	const queryClient = useQueryClient();

	return useCallback(
		(folderId: string) => {
			queryClient.invalidateQueries({ queryKey: ['folder-files-paginated', folderId] });
			queryClient.invalidateQueries({ queryKey: ['folder-stats', folderId] });
			queryClient.invalidateQueries({ queryKey: ['images', 'byFolder', folderId] });
			queryClient.invalidateQueries({ queryKey: ['videos', 'byFolder', folderId] });

			logger.info('Invalidated folder caches', { folderId });
		},
		[queryClient]
	);
}
