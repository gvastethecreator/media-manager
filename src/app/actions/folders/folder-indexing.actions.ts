'use server';

/**
 * @file Acciones específicas para indexación de carpetas
 * @module app/actions/folders/folder-indexing.actions
 */

import { throttleEvent } from '@/lib/event-throttler';
import { invalidateFolderCache } from '@/lib/folder-cache'; // 🚀 NUEVA IMPORTACIÓN
import { scanFolder } from '@/lib/folder-scanner';
import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { FOLDER_ERROR_CODES, FolderResponse, IndexOptions, ReindexOptions, createFolderError } from './folder-types';

// Logger específico para el archivo
const indexingLogger = serverLogger.withContext('FolderIndexingActions');

// Rutas que deben ser revalidadas cuando cambian las carpetas
const REVALIDATE_PATHS = ['/folders', '/images', '/dashboard', '/api/folders', '/api/images'];

/**
 * Revalida todas las rutas relevantes - OPTIMIZADO ⚡
 */
const revalidatePaths = throttleEvent(
	async (folderId?: string) => {
		for (const path of REVALIDATE_PATHS) {
			revalidatePath(path);
		}
		// 🚀 OPTIMIZACIÓN: Invalidar cache específico si se proporciona ID
		if (folderId) {
			invalidateFolderCache(folderId);
		}
		indexingLogger.info('🔄 Rutas revalidadas y cache invalidado');
	},
	'folder-revalidation',
	{ delay: 2000, merge: true } // 🚀 Throttle revalidación por 2 segundos
);

/**
 * Indexa una carpeta y actualiza su contenido en la base de datos - OPTIMIZADO ⚡
 * @param id ID de la carpeta
 * @param options Opciones de indexación
 */
export async function indexFolder(id: string, options?: IndexOptions): Promise<FolderResponse> {
	try {
		indexingLogger.info('📂 Iniciando indexación de carpeta:', id);

		// 🚀 OPTIMIZACIÓN: Usar transacción para batch queries
		const result = await prisma.$transaction(async (tx) => {
			// Obtener la carpeta de la base de datos
			const folder = await tx.folder.findUnique({
				where: { id },
			});

			if (!folder) {
				throw createFolderError('Carpeta no encontrada', FOLDER_ERROR_CODES.NOT_FOUND);
			} // Marcar inicio de indexación actualizando lastIndexed
			await tx.folder.update({
				where: { id },
				data: {
					lastIndexed: new Date(),
				},
			});

			// Escanear la carpeta
			indexingLogger.info('🔍 Escaneando carpeta:', folder.path);
			const scanResult = await scanFolder(folder.path, {
				recursive: options?.recursive ?? true,
				includeHidden: options?.includeHidden ?? false,
			}); // 🚀 OPTIMIZACIÓN: Batch update con estadísticas calculadas
			const updatedFolder = await tx.folder.update({
				where: { id },
				data: {
					totalFiles: scanResult.totalFiles,
					totalSize: scanResult.totalSize,
					lastIndexed: new Date(),
					// Solo campos que existen en el esquema
				},
			});

			return { updatedFolder, scanResult };
		}); // Revalidar rutas fuera de la transacción
		await revalidatePaths(id); // Crear la respuesta optimizada
		const response: FolderResponse = {
			id: result.updatedFolder.id,
			name: result.updatedFolder.name,
			path: result.updatedFolder.path,
			totalFiles: result.updatedFolder.totalFiles,
			totalSize: result.updatedFolder.totalSize,
			lastIndexed: result.updatedFolder.lastIndexed,
			createdAt: result.updatedFolder.createdAt,
			updatedAt: result.updatedFolder.updatedAt,
			autoReindex: result.updatedFolder.autoReindex,
			parentId: result.updatedFolder.parentId,
			stats: {
				totalImages: result.scanResult.images.length,
				totalVideos: result.scanResult.videos.length,
				totalOthers: result.scanResult.others.length,
				averageFileSize:
					result.scanResult.totalFiles > 0 ? result.scanResult.totalSize / result.scanResult.totalFiles : 0,
			},
		};

		indexingLogger.info('✅ Carpeta indexada correctamente:', {
			id: response.id,
			totalFiles: response.totalFiles,
			images: response.stats.totalImages,
			videos: response.stats.totalVideos,
		});

		return response;
	} catch (error) {
		indexingLogger.error('❌ Error indexando carpeta:', error);
		throw createFolderError(
			'Error al indexar carpeta',
			FOLDER_ERROR_CODES.INDEXING_ERROR,
			error instanceof Error ? error.stack : undefined,
			undefined,
			error
		);
	}
}

/**
 * Reindexar una carpeta existente
 */
export async function reindexFolder(id: string, options?: ReindexOptions): Promise<FolderResponse> {
	try {
		indexingLogger.info('🔄 Iniciando reindexación de carpeta:', id);

		// Reutilizar lógica de indexación
		const result = await indexFolder(id, options);

		indexingLogger.info('✅ Carpeta reindexada correctamente:', {
			id: result.id,
			totalFiles: result.totalFiles,
		});

		return result;
	} catch (error) {
		indexingLogger.error('❌ Error reindexando carpeta:', error);
		throw createFolderError(
			'Error al reindexar carpeta',
			FOLDER_ERROR_CODES.INDEXING_ERROR,
			error instanceof Error ? error.stack : undefined,
			undefined,
			error
		);
	}
}

/**
 * 🚀 VERSIONES OPTIMIZADAS CON THROTTLING
 */

/**
 * Versión throttled de indexFolder - previene múltiples indexaciones simultáneas
 */
export const indexFolderThrottled = throttleEvent(indexFolder, 'index-folder', {
	delay: 3000,
	merge: false,
	useLatestArgs: true,
});

/**
 * Versión throttled de reindexFolder - previene reindexaciones en masa
 */
export const reindexFolderThrottled = throttleEvent(reindexFolder, 'reindex-folder', {
	delay: 5000,
	merge: true,
	useLatestArgs: true,
});

/**
 * 🚀 OPTIMIZACIÓN: Indexación por lotes para múltiples carpetas
 */
export async function indexMultipleFolders(folderIds: string[], options?: IndexOptions): Promise<FolderResponse[]> {
	try {
		indexingLogger.info('📁 Iniciando indexación por lotes:', {
			folderCount: folderIds.length,
		});

		// Procesar en chunks de 3 carpetas simultáneamente para evitar sobrecarga
		const chunks = [];
		for (let i = 0; i < folderIds.length; i += 3) {
			chunks.push(folderIds.slice(i, i + 3));
		}

		const results: FolderResponse[] = [];

		for (const chunk of chunks) {
			const chunkPromises = chunk.map((id) => indexFolder(id, options));
			const chunkResults = await Promise.allSettled(chunkPromises);
			for (const result of chunkResults) {
				if (result.status === 'fulfilled') {
					results.push(result.value);
				} else {
					indexingLogger.warn('⚠️ Error en indexación de chunk:', result.reason);
				}
			}
		}

		indexingLogger.info('✅ Indexación por lotes completada:', {
			processed: results.length,
			requested: folderIds.length,
		});

		return results;
	} catch (error) {
		indexingLogger.error('❌ Error en indexación por lotes:', error);
		throw createFolderError(
			'Error en indexación por lotes',
			FOLDER_ERROR_CODES.INDEXING_ERROR,
			error instanceof Error ? error.stack : undefined,
			undefined,
			error
		);
	}
}
