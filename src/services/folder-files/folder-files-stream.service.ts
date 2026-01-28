/**
 * @file Streaming SSE para carpetas masivas
 * @module services/folder-files-stream
 * @description Sistema de streaming para carpetas con miles de archivos usando Server-Sent Events
 */

import { and, eq, inArray, like } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { audios, documents, file3Ds, folders, images, jsonFiles, videos } from '@/lib/drizzle/schema/index';
import { serverLogger } from '@/lib/logger/server-logger';
import type { FolderFile } from './folder-files.service';

const logger = serverLogger.withContext('FolderFilesStream');

export interface StreamOptions {
	folderId: string;
	includeSubfolders?: boolean;
	search?: string;
	fileTypes?: Array<'image' | 'video' | 'audio' | 'document' | 'jsonFile' | 'file3d'>;
	batchSize?: number;
	delayMs?: number;
}

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

/**
 * Generador asíncrono para streaming de archivos
 */
export async function* streamFolderFiles(options: StreamOptions): AsyncGenerator<StreamChunk, void, unknown> {
	const {
		folderId,
		includeSubfolders = false,
		search,
		fileTypes = ['image', 'video', 'audio', 'document', 'jsonFile', 'file3d'],
		batchSize = 200,
		delayMs = 10,
	} = options;

	const startTime = Date.now();
	let processedCount = 0;
	let currentBatch = 0;

	try {
		// 1. Obtener carpetas a incluir
		const folderIds = includeSubfolders ? await getSubfolderIds(folderId) : [folderId];

		// 2. Estimar total (consulta rápida)
		const totalEstimate = await estimateTotalFiles(folderIds, search, fileTypes);
		const totalBatches = Math.ceil(totalEstimate / batchSize);

		// Enviar metadatos iniciales
		yield {
			type: 'metadata',
			metadata: {
				totalEstimate,
				processedCount: 0,
				currentBatch: 0,
				totalBatches,
				queryTime: Date.now() - startTime,
			},
		};

		// 3. Streaming por tipo de archivo
		for (const fileType of fileTypes) {
			let offset = 0;
			let hasMoreOfType = true;

			while (hasMoreOfType) {
				const batch = await fetchFilesBatch(folderIds, fileType, offset, batchSize, search);

				if (batch.length === 0) {
					hasMoreOfType = false;
					continue;
				}

				processedCount += batch.length;
				currentBatch++;

				// Enviar chunk de datos
				yield {
					type: 'data',
					data: batch,
					metadata: {
						totalEstimate,
						processedCount,
						currentBatch,
						totalBatches,
						queryTime: Date.now() - startTime,
					},
				};

				// Control de flujo: pausa pequeña para no saturar
				if (delayMs > 0) {
					await new Promise((resolve) => setTimeout(resolve, delayMs));
				}

				offset += batchSize;
				hasMoreOfType = batch.length === batchSize; // Si el batch está completo, puede haber más
			}
		}

		// Enviar señal de completado
		yield {
			type: 'complete',
			metadata: {
				totalEstimate,
				processedCount,
				currentBatch,
				totalBatches,
				queryTime: Date.now() - startTime,
			},
		};

		logger.info('Streaming completed', {
			folderId,
			processedCount,
			totalBatches: currentBatch,
			queryTime: Date.now() - startTime,
		});
	} catch (error) {
		logger.error('Streaming error:', error);
		yield {
			type: 'error',
			error: error instanceof Error ? error.message : 'Unknown streaming error',
		};
	}
}

/**
 * Obtiene las subcarpetas de una carpeta (optimizado para streaming)
 */
async function getSubfolderIds(folderId: string): Promise<string[]> {
	try {
		const [folder] = await db.select({ path: folders.path }).from(folders).where(eq(folders.id, folderId)).limit(1);

		if (!folder) {
			return [];
		}

		const subfolders = await db
			.select({ id: folders.id })
			.from(folders)
			.where(like(folders.path, `${folder.path}/%`));

		return [folderId, ...subfolders.map((sf: any) => sf.id)];
	} catch (error) {
		logger.error('Error getting subfolders for streaming:', error);
		return [folderId];
	}
}

/**
 * Estima el total de archivos (consulta rápida)
 */
async function estimateTotalFiles(
	folderIds: string[],
	search?: string,
	fileTypes: string[] = ['image', 'video', 'audio', 'document', 'jsonFile', 'file3d']
): Promise<number> {
	try {
		const promises: Promise<number>[] = [];

		// Usar COUNT(*) para cada tipo
		if (fileTypes.includes('image')) {
			promises.push(countFiles(images, folderIds, search));
		}
		if (fileTypes.includes('video')) {
			promises.push(countFiles(videos, folderIds, search));
		}
		if (fileTypes.includes('audio')) {
			promises.push(countFiles(audios, folderIds, search));
		}
		if (fileTypes.includes('document')) {
			promises.push(countFiles(documents, folderIds, search));
		}
		if (fileTypes.includes('jsonFile')) {
			promises.push(countFiles(jsonFiles, folderIds, search));
		}
		if (fileTypes.includes('file3d')) {
			promises.push(countFiles(file3Ds, folderIds, search));
		}

		const counts = await Promise.all(promises);
		return counts.reduce((sum, count) => sum + count, 0);
	} catch (error) {
		logger.error('Error estimating total files:', error);
		return 0;
	}
}

/**
 * Cuenta archivos de una tabla específica
 */
async function countFiles(table: any, folderIds: string[], search?: string): Promise<number> {
	try {
		const conditions = [];

		if (folderIds.length === 1) {
			conditions.push(eq(table.folderId, folderIds[0]));
		} else {
			conditions.push(inArray(table.folderId, folderIds));
		}

		if (search?.trim()) {
			conditions.push(like(table.name, `%${search.trim()}%`));
		}

		const result = await db
			.select({ count: db.$count() })
			.from(table)
			.where(and(...conditions));

		return result[0]?.count || 0;
	} catch (error) {
		logger.error('Error counting files:', error);
		return 0;
	}
}

/**
 * Obtiene un batch de archivos de un tipo específico
 */
async function fetchFilesBatch(
	folderIds: string[],
	fileType: string,
	offset: number,
	limit: number,
	search?: string
): Promise<FolderFile[]> {
	try {
		let table: any;
		let entityType: FolderFile['entityType'];

		switch (fileType) {
			case 'image':
				table = images;
				entityType = 'image';
				break;
			case 'video':
				table = videos;
				entityType = 'video';
				break;
			case 'audio':
				table = audios;
				entityType = 'audio';
				break;
			case 'document':
				table = documents;
				entityType = 'document';
				break;
			case 'jsonFile':
				table = jsonFiles;
				entityType = 'jsonFile';
				break;
			case 'file3d':
				table = file3Ds;
				entityType = 'file3d';
				break;
			default:
				return [];
		}

		const conditions = [];

		if (folderIds.length === 1) {
			conditions.push(eq(table.folderId, folderIds[0]));
		} else {
			conditions.push(inArray(table.folderId, folderIds));
		}

		if (search?.trim()) {
			conditions.push(like(table.name, `%${search.trim()}%`));
		}

		const results = await db
			.select()
			.from(table)
			.where(and(...conditions))
			.limit(limit)
			.offset(offset);

		// Mapear a FolderFile
		// Generar URL de API para thumbnail (NO usar item.thumbnailPath que puede contener base64)
		return results.map((item: any) => ({
			id: item.id,
			name: item.name,
			path: item.path,
			size: item.size || 0,
			createdAt: item.createdAt.toISOString(),
			updatedAt: item.updatedAt.toISOString(),
			folderId: item.folderId,
			entityType,
			extension: item.extension || '',
			thumbnailPath:
				entityType === 'image'
					? `/api/images/${item.id}/thumbnail`
					: entityType === 'video'
						? `/api/videos/${item.id}/thumbnail`
						: undefined,
			metadata: extractMetadata(item, entityType),
			stats: {
				views: item.views || 0,
				isFavorite: item.isFavorite,
			},
		}));
	} catch (error) {
		logger.error(`Error fetching ${fileType} batch:`, error);
		return [];
	}
}

/**
 * Extrae metadatos específicos por tipo
 */
function extractMetadata(item: any, entityType: FolderFile['entityType']): Record<string, any> | undefined {
	switch (entityType) {
		case 'image':
			return {
				width: item.width,
				height: item.height,
				format: item.format,
			};
		case 'video':
			return {
				duration: item.duration,
				width: item.width,
				height: item.height,
				codec: item.codec,
			};
		case 'audio':
			return {
				duration: item.duration,
				bitrate: item.bitrate,
				artist: item.artist,
				album: item.album,
			};
		case 'document':
			return {
				pageCount: item.pageCount,
				title: item.title,
				author: item.author,
			};
		case 'jsonFile':
			return {
				isValid: item.isValid,
				keys: item.keys,
			};
		case 'file3d':
			return {
				vertices: item.vertices,
				faces: item.faces,
				format: item.format,
			};
		default:
			return;
	}
}
