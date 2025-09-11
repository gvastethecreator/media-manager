/**
 * @file Hook para streaming SSE de archivos de carpeta
 * @module hooks/use-folder-files-stream
 * @description Hook para recibir archivos via Server-Sent Events para carpetas masivas
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { MediaItem } from '@/components/features/file-browser/components/media-thumbnail';
import { clientLogger } from '@/lib/logger/client-logger';
import type { FolderFile } from '@/services/folder-files/folder-files.service';

const logger = clientLogger.withContext('FolderFilesStream');

export interface StreamChunk {
	type: 'data' | 'metadata' | 'complete' | 'error';
	data?: FolderFile[];
	metadata?: {
		totalEstimate: number;
		processedCount: number;
		currentBatch: number;
		totalBatches: number;
		queryTime: number;
	};
	error?: string;
}

export interface UseFolderFilesStreamOptions {
	folderId: string | null;
	includeSubfolders?: boolean;
	search?: string;
	fileTypes?: Array<'image' | 'video' | 'audio' | 'document' | 'json' | '3d'>;
	batchSize?: number;
	delayMs?: number;
	enabled?: boolean;
	autoStart?: boolean;
}

export interface UseFolderFilesStreamResult {
	// Datos
	files: MediaItem[];
	flatFiles: FolderFile[];

	// Estados
	isStreaming: boolean;
	isComplete: boolean;
	error: string | null;

	// Metadatos
	totalEstimate: number;
	processedCount: number;
	currentBatch: number;
	totalBatches: number;
	progress: number; // 0-100

	// Performance
	queryTime: number;
	throughput: number; // archivos/segundo

	// Controles
	startStream: () => void;
	stopStream: () => void;
	resetStream: () => void;
}

/**
 * Convierte FolderFile a MediaItem
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
 * Hook principal para streaming de archivos de carpeta
 */
export function useFolderFilesStream(options: UseFolderFilesStreamOptions): UseFolderFilesStreamResult {
	const {
		folderId,
		includeSubfolders = false,
		search,
		fileTypes = ['image', 'video', 'audio', 'document', 'json', '3d'],
		batchSize = 200,
		delayMs = 10,
		enabled = true,
		autoStart = false,
	} = options;

	// Estados
	const [files, setFiles] = useState<FolderFile[]>([]);
	const [isStreaming, setIsStreaming] = useState(false);
	const [isComplete, setIsComplete] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [metadata, setMetadata] = useState({
		totalEstimate: 0,
		processedCount: 0,
		currentBatch: 0,
		totalBatches: 0,
		queryTime: 0,
	});

	// Referencias
	const eventSourceRef = useRef<EventSource | null>(null);
	const startTimeRef = useRef<number>(0);
	const lastCountRef = useRef<number>(0);

	// Métricas calculadas
	const progress =
		metadata.totalEstimate > 0 ? Math.min(100, (metadata.processedCount / metadata.totalEstimate) * 100) : 0;

	const throughput = metadata.queryTime > 0 ? metadata.processedCount / (metadata.queryTime / 1000) : 0;

	// Convertir a MediaItems
	const mediaItems = files.map(folderFileToMediaItem);

	// Iniciar streaming
	const startStream = useCallback(() => {
		if (!(folderId && enabled) || isStreaming) return;

		// Limpiar estado anterior
		setFiles([]);
		setError(null);
		setIsComplete(false);
		setMetadata({
			totalEstimate: 0,
			processedCount: 0,
			currentBatch: 0,
			totalBatches: 0,
			queryTime: 0,
		});

		// Construir URL
		const params = new URLSearchParams({
			includeSubfolders: includeSubfolders.toString(),
			batchSize: batchSize.toString(),
			delayMs: delayMs.toString(),
			fileTypes: fileTypes.join(','),
		});

		if (search?.trim()) {
			params.append('search', search.trim());
		}

		const url = `/api/folders/${folderId}/stream?${params}`;

		logger.info('Starting folder files stream', { folderId, url });

		// Crear EventSource
		const eventSource = new EventSource(url);
		eventSourceRef.current = eventSource;
		startTimeRef.current = Date.now();
		lastCountRef.current = 0;

		setIsStreaming(true);

		// Manejar mensajes
		eventSource.onmessage = (event) => {
			try {
				const chunk: StreamChunk = JSON.parse(event.data);

				switch (chunk.type) {
					case 'metadata':
						if (chunk.metadata) {
							setMetadata(chunk.metadata);
							logger.debug('Stream metadata', chunk.metadata);
						}
						break;

					case 'data':
						if (chunk.data && chunk.metadata) {
							setFiles((prev) => [...prev, ...(chunk.data || [])]);
							setMetadata(chunk.metadata);

							// Log de progreso
							const newCount = files.length + chunk.data.length;
							if (newCount - lastCountRef.current >= 100) {
								logger.debug('Stream progress', {
									processed: chunk.metadata.processedCount,
									total: chunk.metadata.totalEstimate,
									progress: `${Math.round((chunk.metadata.processedCount / chunk.metadata.totalEstimate) * 100)}%`,
								});
								lastCountRef.current = newCount;
							}
						}
						break;

					case 'complete':
						if (chunk.metadata) {
							setMetadata(chunk.metadata);
						}
						setIsComplete(true);
						setIsStreaming(false);
						logger.info('Stream completed', {
							folderId,
							totalFiles: files.length,
							queryTime: chunk.metadata?.queryTime,
						});
						break;

					case 'error':
						setError(chunk.error || 'Unknown streaming error');
						setIsStreaming(false);
						logger.error('Stream error', { error: chunk.error });
						break;

					default:
						// Chunk type no reconocido - silenciosamente ignorar
						break;
				}
			} catch (parseError) {
				logger.error('Error parsing stream chunk:', parseError);
				setError('Error parsing stream data');
				setIsStreaming(false);
			}
		};

		// Manejar errores de conexión
		eventSource.onerror = (event) => {
			logger.error('Stream connection error:', event);
			setError('Stream connection failed');
			setIsStreaming(false);
			eventSource.close();
		};

		// Cleanup al cerrar
		eventSource.addEventListener('close', () => {
			setIsStreaming(false);
			eventSource.close();
		});
	}, [folderId, enabled, isStreaming, includeSubfolders, search, fileTypes, batchSize, delayMs, files.length]);

	// Detener streaming
	const stopStream = useCallback(() => {
		if (eventSourceRef.current) {
			eventSourceRef.current.close();
			eventSourceRef.current = null;
		}
		setIsStreaming(false);
		logger.info('Stream stopped manually');
	}, []);

	// Reset completo
	const resetStream = useCallback(() => {
		stopStream();
		setFiles([]);
		setError(null);
		setIsComplete(false);
		setMetadata({
			totalEstimate: 0,
			processedCount: 0,
			currentBatch: 0,
			totalBatches: 0,
			queryTime: 0,
		});
	}, [stopStream]);

	// Auto-start si está habilitado
	useEffect(() => {
		if (autoStart && folderId && enabled && !isStreaming && !isComplete && files.length === 0) {
			startStream();
		}
	}, [autoStart, folderId, enabled, isStreaming, isComplete, files.length, startStream]);

	// Cleanup al desmontar
	useEffect(() => {
		return () => {
			if (eventSourceRef.current) {
				eventSourceRef.current.close();
			}
		};
	}, []);

	return {
		// Datos
		files: mediaItems,
		flatFiles: files,

		// Estados
		isStreaming,
		isComplete,
		error,

		// Metadatos
		totalEstimate: metadata.totalEstimate,
		processedCount: metadata.processedCount,
		currentBatch: metadata.currentBatch,
		totalBatches: metadata.totalBatches,
		progress,

		// Performance
		queryTime: metadata.queryTime,
		throughput,

		// Controles
		startStream,
		stopStream,
		resetStream,
	};
}

/**
 * Hook simplificado que decide automáticamente entre paginación y streaming
 */
export function useFolderFilesAuto(options: {
	folderId: string | null;
	includeSubfolders?: boolean;
	search?: string;
	fileTypes?: Array<'image' | 'video' | 'audio' | 'document' | 'json' | '3d'>;
	streamingThreshold?: number;
}) {
	const { folderId, streamingThreshold = 2000, ...restOptions } = options;

	// Aquí podrías hacer una pre-consulta para determinar el tamaño
	// Por ahora, usar paginación por defecto y permitir upgrade manual a streaming

	return {
		shouldUseStreaming: false, // Se podría calcular dinámicamente
		streamingThreshold,
	};
}
