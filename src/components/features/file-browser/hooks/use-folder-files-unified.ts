/**
 * @file Hook unificado inteligente para archivos de carpeta
 * @module hooks/use-folder-files-unified
 * @description Decide automáticamente entre paginación y streaming según el tamaño de datos
 */

import { useQuery } from '@tanstack/react-query';
import type { MediaItem } from '@/components/features/file-browser/components/media-thumbnail';
import { getFolderFiles } from '@/services/folder-files/folder-files.service';
import { useFolderFilesPaginated } from './use-folder-files-paginated';
import { useFolderFilesStream } from './use-folder-files-stream';

export interface UseFolderFilesUnifiedOptions {
	folderId: string | null;
	includeSubfolders?: boolean;
	search?: string;
	fileTypes?: Array<'image' | 'video' | 'audio' | 'document' | 'json' | '3d'>;
	enabled?: boolean;

	// Configuraciones inteligentes
	streamingThreshold?: number; // Usar streaming si se estima más de X archivos
	initialPageSize?: number; // Tamaño de página para paginación
	streamBatchSize?: number; // Tamaño de lote para streaming

	// Modo manual
	forceMode?: 'pagination' | 'streaming';
}

export interface UseFolderFilesUnifiedResult {
	// Datos unificados
	files: MediaItem[];

	// Estados unificados
	isLoading: boolean;
	isError: boolean;
	error: string | null;
	isEmpty: boolean;

	// Metadatos
	totalCount: number;
	loadedCount: number;
	progress: number; // 0-100

	// Modo actual
	mode: 'pagination' | 'streaming' | 'determining';

	// Estadísticas de rendimiento
	queryTime: number;
	throughput: number;

	// Controles
	loadMore?: () => void;
	hasMore?: boolean;
	isLoadingMore?: boolean;

	// Controles de streaming
	startStream?: () => void;
	stopStream?: () => void;
	resetStream?: () => void;

	// Información de paginación
	currentPage?: number;
	totalPages?: number;
}

/**
 * Hook que decide inteligentemente entre paginación y streaming
 */
export function useFolderFilesUnified(options: UseFolderFilesUnifiedOptions): UseFolderFilesUnifiedResult {
	const {
		folderId,
		includeSubfolders = false,
		search,
		fileTypes = ['image', 'video', 'audio', 'document', 'json', '3d'],
		enabled = true,
		streamingThreshold = 2000,
		initialPageSize = 100,
		streamBatchSize = 200,
		forceMode,
	} = options;

	// 1. Determinar modo si no está forzado
	const estimateQuery = useQuery({
		queryKey: ['folder-files-estimate', folderId, includeSubfolders, search, fileTypes?.join(',')],
		queryFn: async () => {
			if (!folderId) return { totalEstimate: 0, shouldStream: false };

			// Consulta rápida para estimar tamaño
			const result = await getFolderFiles({
				folderId,
				includeSubfolders,
				search,
				fileTypes,
				limit: 1, // Solo necesitamos el conteo
			});

			const shouldStream = result.total > streamingThreshold;

			return {
				totalEstimate: result.total,
				shouldStream,
			};
		},
		enabled: enabled && !!folderId && !forceMode,
		staleTime: 30_000, // Cache por 30 segundos
	});

	// Determinar modo final
	const mode: 'pagination' | 'streaming' | 'determining' =
		forceMode || (estimateQuery.data?.shouldStream ? 'streaming' : estimateQuery.data ? 'pagination' : 'determining');

	// 2. Hook de paginación (condicional)
	const paginationResult = useFolderFilesPaginated({
		folderId,
		includeSubfolders,
		search,
		fileTypes,
		enabled: enabled && mode === 'pagination',
		pageSize: initialPageSize,
	});

	// 3. Hook de streaming (condicional)
	const streamingResult = useFolderFilesStream({
		folderId,
		includeSubfolders,
		search,
		fileTypes,
		enabled: enabled && mode === 'streaming',
		autoStart: mode === 'streaming',
		batchSize: streamBatchSize,
	});

	// 4. Resultado unificado
	if (mode === 'determining') {
		return {
			files: [],
			isLoading: estimateQuery.isLoading,
			isError: estimateQuery.isError,
			error: estimateQuery.error?.message || null,
			isEmpty: false,
			totalCount: 0,
			loadedCount: 0,
			progress: 0,
			mode: 'determining',
			queryTime: 0,
			throughput: 0,
		};
	}

	if (mode === 'pagination') {
		const progress = paginationResult.total > 0 ? (paginationResult.files.length / paginationResult.total) * 100 : 0;

		return {
			files: paginationResult.files,
			isLoading: paginationResult.isLoading,
			isError: !!paginationResult.error,
			error: paginationResult.error?.message || null,
			isEmpty: paginationResult.files.length === 0 && !paginationResult.isLoading,
			totalCount: paginationResult.total,
			loadedCount: paginationResult.files.length,
			progress,
			mode: 'pagination',
			queryTime: paginationResult.queryTime || 0,
			throughput: 0,

			// Controles de paginación
			loadMore: paginationResult.loadMore,
			hasMore: paginationResult.hasMore,
			isLoadingMore: paginationResult.isLoadingMore,
			currentPage: paginationResult.currentPage,
			totalPages: paginationResult.totalPages,
		};
	}

	if (mode === 'streaming') {
		return {
			files: streamingResult.files,
			isLoading: streamingResult.isStreaming && streamingResult.files.length === 0,
			isError: !!streamingResult.error,
			error: streamingResult.error,
			isEmpty: streamingResult.files.length === 0 && streamingResult.isComplete,
			totalCount: streamingResult.totalEstimate,
			loadedCount: streamingResult.processedCount,
			progress: streamingResult.progress,
			mode: 'streaming',
			queryTime: streamingResult.queryTime,
			throughput: streamingResult.throughput,

			// Controles de streaming
			startStream: streamingResult.startStream,
			stopStream: streamingResult.stopStream,
			resetStream: streamingResult.resetStream,
		};
	}

	// Fallback (no debería llegar aquí)
	return {
		files: [],
		isLoading: false,
		isError: true,
		error: 'Unknown mode',
		isEmpty: true,
		totalCount: 0,
		loadedCount: 0,
		progress: 0,
		mode: 'determining',
		queryTime: 0,
		throughput: 0,
	};
}

/**
 * Hook simplificado con configuración automática
 */
export function useFolderFiles(
	folderId: string | null,
	options?: {
		includeSubfolders?: boolean;
		search?: string;
		fileTypes?: Array<'image' | 'video' | 'audio' | 'document' | 'json' | '3d'>;
	}
) {
	return useFolderFilesUnified({
		folderId,
		...options,
	});
}

/**
 * Hook específico para carpetas grandes (fuerza streaming)
 */
export function useFolderFilesLarge(
	folderId: string | null,
	options?: {
		includeSubfolders?: boolean;
		search?: string;
		fileTypes?: Array<'image' | 'video' | 'audio' | 'document' | 'json' | '3d'>;
		batchSize?: number;
	}
) {
	return useFolderFilesUnified({
		folderId,
		forceMode: 'streaming',
		streamBatchSize: options?.batchSize || 500,
		...options,
	});
}

/**
 * Hook específico para navegación rápida (fuerza paginación)
 */
export function useFolderFilesFast(
	folderId: string | null,
	options?: {
		includeSubfolders?: boolean;
		search?: string;
		fileTypes?: Array<'image' | 'video' | 'audio' | 'document' | 'json' | '3d'>;
		pageSize?: number;
	}
) {
	return useFolderFilesUnified({
		folderId,
		forceMode: 'pagination',
		initialPageSize: options?.pageSize || 50,
		...options,
	});
}
