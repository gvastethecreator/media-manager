'use server';

import { existsSync } from 'fs';
import { logger } from '@/lib/logger';
import { normalizePath } from '@/lib/path-utils';
import { prisma } from '@/lib/prisma';
import { emit, emitProgress } from '@/lib/server/events.server';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats.service';
import type { ReindexAllCompleteData, ReindexAllProgressData } from '@/types/process';
import { processDirectory, processDirectoryForReindex } from './folder-processing.actions';
import { FolderError, type FolderResponse } from './folder-types.actions';
import { revalidateAllPaths, verifyPathExists } from './folder-utils.actions';

const folderLogger = logger.withContext('FolderIndexing');

/**
 * Indexar una carpeta existente
 */
export async function indexFolder(id: string): Promise<FolderResponse> {
	try {
		folderLogger.info('📂 Indexando carpeta...', { id });

		const folder = await prisma.folder.findUnique({
			where: { id },
			include: {
				_count: {
					select: {
						images: true,
					},
				},
				images: {
					select: {
						id: true,
						path: true,
						hash: true,
						size: true,
						updatedAt: true,
					},
				},
			},
		});

		if (!folder) {
			folderLogger.error('❌ Carpeta no encontrada:', { id });
			throw new FolderError('FOLDER_NOT_FOUND', `No se encontró la carpeta con ID: ${id}`);
		}

		// Normalizar la ruta para verificación de existencia
		const normalizedPath = normalizePath(folder.path);

		// Verificar con diferentes variantes si la carpeta existe
		const pathExists = await verifyPathExists(normalizedPath, folder.path);

		if (!pathExists.exists) {
			folderLogger.error('❌ Carpeta no encontrada en el sistema:', {
				originalPath: folder.path,
				normalizedPath: pathExists.checkedPaths,
			});

			// Actualizar estado en la base de datos para marcarlo como no disponible
			await prisma.folder.update({
				where: { id: folder.id },
				data: {
					lastIndexed: new Date(),
				},
			});

			throw new FolderError(
				'PATH_NOT_FOUND',
				`La carpeta "${folder.name}" no está disponible en el sistema. Ruta: ${folder.path}`
			);
		}

		folderLogger.info('✓ Carpeta encontrada en el sistema:', {
			path: pathExists.foundPath || normalizedPath,
		});

		// Usar la ruta verificada para el procesamiento
		const verifiedPath = pathExists.foundPath || folder.path;

		let processResult: { processed: number; total: number; totalSize: number; deletedFiles?: Set<string> };

		// Verificar si la carpeta ya tiene imágenes indexadas
		if (folder._count.images > 0) {
			folderLogger.info('La carpeta ya tiene imágenes indexadas, realizando actualización incremental', {
				imageCount: folder._count.images,
				folderId: folder.id,
			});

			// Crear mapa de archivos existentes para reindexación
			const existingImages = new Map(
				folder.images.map((img) => [
					img.path,
					{
						id: img.id,
						path: img.path,
						size: img.size,
						hash: img.hash,
						updatedAt: img.updatedAt,
					},
				])
			);

			// Utilizamos processDirectoryForReindex para actualización incremental
			processResult = await processDirectoryForReindex(verifiedPath, id, existingImages);

			// Eliminar archivos que ya no existen en la carpeta
			const { deletedFiles } = processResult;
			if (deletedFiles && deletedFiles.size > 0) {
				folderLogger.info(`Eliminando ${deletedFiles.size} archivos que ya no existen en la carpeta:`, {
					folderId: folder.id,
					deletedCount: deletedFiles.size,
				});

				await prisma.image.deleteMany({
					where: {
						id: {
							in: Array.from(deletedFiles),
						},
					},
				});
			}
		} else {
			folderLogger.info('🔎 Iniciando indexación completa de carpeta:', { path: verifiedPath });

			// Este es el proceso intensivo: escanear la carpeta, extraer metadatos, etc.
			processResult = await processDirectory(verifiedPath, id, (status) => {
				emit({
					type: 'folder:progress',
					data: status,
				});
			});
		}

		const { processed, total, totalSize } = processResult;

		// Actualizar la carpeta con los resultados
		const updatedFolder = await prisma.folder.update({
			where: { id: folder.id },
			data: {
				totalFiles: total,
				totalSize: totalSize,
				lastIndexed: new Date(),
			},
		});

		// Emitir eventos
		emit({
			type: 'files:modified',
			data: { action: 'index', folderId: id },
		});
		emit({
			type: 'folders:modified',
			data: {
				action: 'index',
				folder: updatedFolder,
			},
		});
		statsEventEmitter.emit(STATS_EVENTS.FOLDER_CHANGE);
		statsEventEmitter.emit(STATS_EVENTS.FILES_CHANGE);

		await revalidateAllPaths();

		folderLogger.info('Indexación completada:', { processed, total });

		return {
			id: updatedFolder.id,
			name: updatedFolder.name,
			path: updatedFolder.path,
			totalFiles: updatedFolder.totalFiles,
			totalSize: updatedFolder.totalSize,
			success: true,
		};
	} catch (error) {
		folderLogger.error('❌ Error en la indexación:', error);

		return {
			id,
			name: 'Error',
			path: '',
			error: error instanceof FolderError ? error.message : 'Error desconocido durante la indexación',
		};
	}
}

/**
 * Reindexar una carpeta existente
 */
export async function reindexFolder(id: string): Promise<FolderResponse> {
	// Capturar el tiempo de inicio del proceso
	const processStartTime = Date.now();

	try {
		folderLogger.info('🔄 Reindexando carpeta:', { id });

		// Emitir un evento de progreso inicial para informar inmediatamente al cliente
		emitProgress({
			status: 'Iniciando reindexación...',
			progress: 0,
			folderId: id,
			phase: 'starting',
			startTime: processStartTime,
			currentFile: '',
			filesProcessed: 0,
			totalFiles: 0,
			timestamp: processStartTime,
		});

		const folder = await prisma.folder.findUnique({
			where: { id },
			select: {
				id: true,
				path: true,
				name: true,
				images: {
					select: {
						id: true,
						path: true,
						hash: true,
						size: true,
						updatedAt: true,
					},
				},
			},
		});

		if (!folder) {
			folderLogger.error('❌ Carpeta no encontrada en base de datos:', { id });
			throw new FolderError('FOLDER_NOT_FOUND', `No se encontró la carpeta con ID: ${id}`);
		}

		// Normalizar la ruta para verificación de existencia
		const normalizedPath = normalizePath(folder.path);

		// Verificar con diferentes variantes si la carpeta existe
		const pathExists = await verifyPathExists(normalizedPath, folder.path);

		if (!pathExists.exists) {
			folderLogger.error('❌ Carpeta no encontrada en el sistema:', {
				originalPath: folder.path,
				normalizedPath: pathExists.checkedPaths,
			});

			// Actualizar estado en la base de datos para marcarlo como no disponible
			await prisma.folder.update({
				where: { id: folder.id },
				data: {
					lastIndexed: new Date(),
					// Añadir algún campo si es necesario para indicar que la carpeta no está disponible
				},
			});

			throw new FolderError(
				'PATH_NOT_FOUND',
				`La carpeta "${folder.name}" no está disponible en el sistema. Ruta: ${folder.path}`
			);
		}

		folderLogger.info('✓ Carpeta encontrada en el sistema:', {
			path: pathExists.foundPath || normalizedPath,
		});

		// Usar la ruta verificada para el procesamiento
		const verifiedPath = pathExists.foundPath || folder.path;

		// Crear mapa de archivos existentes
		const existingImages = new Map(
			folder.images.map((img) => [
				img.path,
				{
					id: img.id,
					path: img.path,
					size: img.size,
					hash: img.hash,
					updatedAt: img.updatedAt,
				},
			])
		);

		// Procesar la carpeta
		folderLogger.info('Iniciando procesamiento de directorio:', verifiedPath);
		const { processed, total, totalSize, deletedFiles } = await processDirectoryForReindex(
			verifiedPath,
			folder.id,
			existingImages
		);

		// Eliminar archivos que ya no existen
		if (deletedFiles.size > 0) {
			folderLogger.info(`Eliminando ${deletedFiles.size} archivos que ya no existen en la carpeta:`, {
				folderId: folder.id,
				deletedFiles: Array.from(deletedFiles),
			});

			// Eliminar imágenes que ya no existen en el sistema de archivos
			await prisma.image.deleteMany({
				where: {
					id: {
						in: Array.from(deletedFiles),
					},
				},
			});
		}

		// Actualizar estadísticas de la carpeta
		const updatedFolder = await prisma.folder.update({
			where: { id: folder.id },
			data: {
				totalFiles: total,
				totalSize: totalSize,
				lastIndexed: new Date(),
			},
		});

		// Emitir eventos
		emit({
			type: 'files:modified',
			data: { action: 'reindex', folderId: id },
		});
		emit({
			type: 'folders:modified',
			data: {
				action: 'reindex',
				folder: updatedFolder,
			},
		});
		statsEventEmitter.emit(STATS_EVENTS.FOLDER_CHANGE);
		statsEventEmitter.emit(STATS_EVENTS.FILES_CHANGE);

		await revalidateAllPaths();

		folderLogger.info('Procesamiento completado:', {
			processed,
			total,
			deletedFiles: deletedFiles.size,
		});

		// Obtener tiempo actual para usarlo consistentemente en todos los eventos
		const endTime = Date.now();
		const processDuration = endTime - processStartTime;

		// Emitir un evento de progreso final
		emitProgress({
			status: 'Reindexación completada',
			progress: 100,
			folderId: id,
			phase: 'complete', // Para que se detecte correctamente como finalizado
			filesProcessed: total,
			totalFiles: total,
			currentFile: folder.path,
			endTime: endTime,
			startTime: processStartTime,
			timestamp: endTime,
		});

		// Emitir también un evento de tipo 'folder:complete'
		emit({
			type: 'folder:complete',
			data: {
				id: updatedFolder.id,
				name: updatedFolder.name,
				path: updatedFolder.path,
				totalFiles: updatedFolder.totalFiles,
				totalSize: updatedFolder.totalSize,
				stats: {
					total: total,
					totalSize: totalSize,
				},
				success: true,
				timestamp: endTime, // Añadir el timestamp para consistencia
				endTime: endTime,
				startTime: processStartTime,
			},
		});

		folderLogger.info(`✅ Carpeta reindexada en ${Math.round(processDuration / 1000)}s`, {
			id: updatedFolder.id,
			totalFiles: updatedFolder.totalFiles,
		});

		return {
			id: updatedFolder.id,
			name: updatedFolder.name,
			path: updatedFolder.path,
			totalFiles: updatedFolder.totalFiles,
			totalSize: updatedFolder.totalSize,
			success: true,
		};
	} catch (error) {
		folderLogger.error('Error reindexando carpeta:', { error });

		// Emitir un evento de error
		emitProgress({
			status: `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`,
			progress: 100,
			folderId: id,
			phase: 'error',
			currentFile: '',
			timestamp: Date.now(),
		});

		throw error;
	}
}

/**
 * Reindexar todas las carpetas
 */
export async function reindexAllFolders(): Promise<void> {
	try {
		folderLogger.info('🔄 Reindexando todas las carpetas');

		const folders = await prisma.folder.findMany({
			orderBy: {
				totalFiles: 'desc',
			},
		});

		if (folders.length === 0) {
			folderLogger.info('❌ No hay carpetas para reindexar');
			return;
		}

		// Emitir evento de inicio
		await emit({
			type: 'folder:progress',
			data: {
				totalFolders: folders.length,
			},
		});

		// ... existing code ...
	} catch (error) {
		folderLogger.error('Error en reindexación:', error);
		if (error instanceof FolderError) {
			throw error;
		}
		throw new FolderError('Error en la reindexación', error);
	}
}
