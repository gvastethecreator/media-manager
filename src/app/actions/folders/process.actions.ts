'use server';

/**
 * @file Process actions for folders
 * @module app/actions/folders/process.actions
 */

import { throttleEvent } from '@/lib/event-throttler';
import { invalidateFolderCache } from '@/lib/folder-cache';
import { scanFolder, type FolderScanResult } from '@/lib/folder-scanner';
import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import PQueue from 'p-queue';
import path from 'path';
import {
    FOLDER_ERROR_CODES,
    FolderResponse,
    IndexOptions,
    ProcessStatus,
    ReindexOptions,
    createFolderError,
} from './folder-types';
import type { Folder } from '@/types/entities/folder/types';

// Logger for process actions
const folderLogger = serverLogger.withContext('FolderProcessActions');

// Paths to revalidate when folder content changes
const REVALIDATE_PATHS = ['/folders', '/images', '/dashboard', '/api/folders', '/api/images'];

/**
 * Revalida todas las rutas relevantes - OPTIMIZADO ⚡
 */
const revalidateFolderPathsThrottled = throttleEvent(
	async (folderId?: string) => {
		folderLogger.info('🔄 Revalidando rutas de carpetas');
		for (const path of REVALIDATE_PATHS) {
			revalidatePath(path);
		}
		// 🚀 OPTIMIZACIÓN: Invalidar cache específico si se proporciona ID
		if (folderId) {
			invalidateFolderCache(folderId);
		}
		folderLogger.info('✅ Rutas revalidadas y cache invalidado');
	},
	'folder-revalidation',
	{ delay: 2000, merge: true } // 🚀 Throttle revalidación por 2 segundos
);

// Configuración predeterminada para procesamiento por lotes
const DEFAULT_BATCH_SIZE = 50;
const DEFAULT_MAX_CONCURRENT = 3;

/**
 * Revalidates all folder-related paths
 */
async function revalidateFolderPaths() {
	folderLogger.info('🔄 Revalidando rutas de carpetas');
	for (const path of REVALIDATE_PATHS) {
		revalidatePath(path);
	}
}

/**
 * Crear un error de procesamiento de carpetas (enfoque funcional)
 */
function createProcessError(message: string, code: string = FOLDER_ERROR_CODES.UNEXPECTED_ERROR, cause?: unknown) {
	return createFolderError(
		message,
		code as FOLDER_ERROR_CODES,
		cause instanceof Error ? cause.stack : undefined,
		undefined,
		cause
	);
}

/**
 * Procesa un lote de imágenes para una carpeta
 * @param folderId ID de la carpeta
 * @param imagePaths Rutas de las imágenes
 * @returns Número de imágenes procesadas y errores
 */
async function processImageBatch(
	folderId: string,
	imagePaths: string[]
): Promise<{ processed: number; errors: number }> {
	let processed = 0;
	let errors = 0;

	folderLogger.debug(`Procesando lote de ${imagePaths.length} imágenes`);

	const operations = imagePaths.map((imagePath) => {
		try {
			if (!imagePath.trim()) {
				folderLogger.warn('Ruta de imagen vacía detectada');
				errors++;
				return Promise.resolve(false);
			}

			// Extraer el nombre de la imagen del path
			const fileName = path.basename(imagePath);

			// Preparar datos para la imagen con todos los campos obligatorios
			const imageData = {
				path: imagePath,
				name: fileName,
				folderId,
				hash: `temp-${Date.now().toString().substring(7)}`, // Hash único temporal
				size: 0, // Se actualizará con el tamaño real posteriormente
				width: 1, // Valor temporal
				height: 1, // Valor temporal
				// Asegurarse de que se cumplan las restricciones del modelo
				isFavorite: false, // Valor por defecto para campo requerido
				metadata: '{}', // Metadata vacía como JSON válido
			};

			return prisma.image
				.upsert({
					where: { path: imagePath },
					create: imageData,
					update: {
						folderId,
						metadata: '{}', // Aseguramos que el metadata es JSON válido
					},
				})
				.then(() => {
					processed++;
					return true;
				})
				.catch((error) => {
					folderLogger.error(`Error procesando imagen ${imagePath}:`, error);

					// Log detallado del error para diagnóstico
					if (error.name === 'PrismaClientValidationError') {
						folderLogger.error(`Detalles de validación para ${imagePath}:`, {
							errorName: error.name,
							errorMessage: error.message,
							validationError: true,
							imageData,
						});
					}

					errors++;
					return false;
				});
		} catch (error) {
			folderLogger.error(`Error preparando operación para ${imagePath}:`, error);
			errors++;
			return Promise.resolve(false);
		}
	});

	// Ejecutar todas las operaciones concurrentemente
	await Promise.allSettled(operations);

	folderLogger.info(`Procesamiento de lote completado: ${processed} exitosas, ${errors} errores`);
	return { processed, errors };
}

/**
 * Divide un array en lotes del tamaño especificado
 * @param array Array a dividir
 * @param batchSize Tamaño de cada lote
 * @returns Array de lotes
 */
function chunkArray<T>(array: T[], batchSize: number): T[][] {
	const chunks: T[][] = [];
	for (let i = 0; i < array.length; i += batchSize) {
		chunks.push(array.slice(i, i + batchSize));
	}
	return chunks;
}

/**
 * Indexes a folder and updates its content in the database
 * @param id ID de la carpeta
 * @param options Opciones de indexación
 */
export async function indexFolder(id: string, options?: IndexOptions): Promise<ProcessStatus> {
	// Configuración por defecto
	const batchSize = options?.batchSize || DEFAULT_BATCH_SIZE;
	const maxConcurrent = options?.maxConcurrent || DEFAULT_MAX_CONCURRENT;
	const onProgress = options?.onProgress;
	const startTime = Date.now(); // Start timer for the whole operation

	try {
		folderLogger.info('📂 Iniciando indexación de carpeta:', id);

<<<<<<< HEAD
		let folder: any;
		let scanResult: any;
=======
                let folder: Folder | null;
                let scanResult: FolderScanResult;
>>>>>>> 073d42e736549c076ab943c2b4179974562a9519

		// Use a transaction for initial folder updates and scanning result update
		await prisma.$transaction(async (tx) => {
			// 1. Get folder
			folder = await tx.folder.findUnique({ where: { id } });
			if (!folder) {
				throw createProcessError('Carpeta no encontrada', FOLDER_ERROR_CODES.NOT_FOUND);
			}

			// 2. Mark initial indexing timestamp
			await tx.folder.update({
				where: { id },
				data: { lastIndexed: new Date() },
			});

			// 3. Scan folder content (file system operation, not part of Prisma transaction)
			folderLogger.info('🔍 Escaneando carpeta:', folder.path);
			const scanStart = Date.now();
			scanResult = await scanFolder(folder.path, {
				recursive: options?.recursive ?? true,
				includeHidden: options?.includeHidden ?? false,
			});
			const scanDuration = Date.now() - scanStart;

			folderLogger.info(`✅ Carpeta escaneada en ${scanDuration}ms:`, {
				totalFiles: scanResult.totalFiles,
				totalImages: scanResult.images.length,
			});

			// 4. Update folder with scan results (inside transaction)
			await tx.folder.update({
				where: { id },
				data: {
					totalFiles: scanResult.totalFiles,
					totalSize: scanResult.totalSize,
					lastIndexed: new Date(), // Update again for final timestamp
				},
			});

			// Notify progress after scan
			if (onProgress) {
				onProgress({
					status: 'Carpeta escaneada, procesando imágenes...',
					progress: 10,
					phase: 'scan',
					filesProcessed: 0,
					totalFiles: scanResult.images.length,
					processingSpeed: scanResult.totalFiles / (scanDuration / 1000),
					folderId: id,
					startTime: startTime,
				});
			}
		}); // End of Prisma transaction for folder metadata updates

		// Proceed with image processing (outside the initial transaction, as it's a longer process)
		const imagePaths = scanResult.images
			.map((fileInfo) => {
				if (fileInfo && typeof fileInfo === 'object' && 'path' in fileInfo) return fileInfo.path;
				if (typeof fileInfo === 'string') return fileInfo;
				folderLogger.warn('⚠️ Formato de imagen no válido en scanResult:', fileInfo);
				return null;
			})
			.filter(Boolean) as string[];

		const batches = chunkArray(imagePaths, batchSize);
		let totalProcessed = 0;
		let totalErrors = 0;

		folderLogger.info(`🖼️ Procesando ${scanResult.images.length} imágenes en ${batches.length} lotes`);

		const queue = new PQueue({ concurrency: maxConcurrent });

		for (let i = 0; i < batches.length; i++) {
			const chunk = batches[i];
			queue.add(async () => {
				try {
					const result = await processImageBatch(id, chunk); // Use folderId directly
					totalProcessed += result.processed;
					totalErrors += result.errors;
					if (onProgress) {
						const elapsed = Date.now() - startTime;
						const speed = elapsed > 0 ? totalProcessed / (elapsed / 1000) : 0;
						const remaining = scanResult.images.length - totalProcessed;
						const estimatedTimeRemaining = speed > 0 ? remaining / speed : 0;

						onProgress({
							status: `Procesando lote ${i + 1}/${batches.length}...`,
							progress: Math.round((totalProcessed / scanResult.images.length) * 90) + 10, // 10-100%
							phase: 'index',
							filesProcessed: totalProcessed,
							totalFiles: scanResult.images.length,
							processingSpeed: speed,
							estimatedTimeRemaining: estimatedTimeRemaining,
							folderId: id,
							startTime: startTime,
						});
					}
				} catch (error) {
					folderLogger.error(`Error procesando lote ${i + 1}:`, error);
					totalErrors += chunk.length; // Assume all in chunk failed for error count
				}
			});
		}

		await queue.onIdle(); // Wait for all batches to complete

		// Final revalidation and logging
		const totalDuration = Date.now() - startTime;
		const processingSpeed = totalProcessed / (totalDuration / 1000);

		await revalidateFolderPathsThrottled(id);

		folderLogger.info('✅ Indexación de carpeta completada con éxito:', {
			id,
			totalFiles: scanResult.totalFiles,
			totalImages: scanResult.images.length,
			imagesProcessed: totalProcessed,
			errors: totalErrors,
			duration: `${(totalDuration / 1000).toFixed(2)}s`,
			speed: `${processingSpeed.toFixed(2)} img/s`,
		});

		const finalStatus: ProcessStatus = {
			success: totalErrors === 0,
			message: `Carpeta indexada con éxito. Encontrados ${scanResult.totalFiles} archivos y procesadas ${totalProcessed} imágenes.`,
			filesProcessed: totalProcessed,
			totalFiles: scanResult.images.length,
			totalErrors: totalErrors,
			processingSpeed,
			status: 'Indexación completada',
			progress: 100,
			phase: 'complete',
			folderId: id,
			startTime: startTime,
			endTime: Date.now(),
		};

		if (onProgress) {
			onProgress(finalStatus);
		}

		return finalStatus;

	} catch (error) {
		folderLogger.error('❌ Error indexando carpeta:', error);
		throw createProcessError(
			'Error al indexar carpeta',
			FOLDER_ERROR_CODES.INDEXING_ERROR,
			error instanceof Error ? error.stack : undefined,
			undefined,
			error
		);
	}
}

/**
 * Reindexes all folders marked for auto-reindexing
 */
export async function reindexAutoFolders(options?: IndexOptions): Promise<ProcessStatus> {
	try {
		folderLogger.info('🔄 Iniciando reindexación automática de carpetas');

		const folders = await prisma.folder.findMany({
			where: {
				autoReindex: true,
			},
		});

		let totalProcessed = 0;
		let totalSuccess = 0;
		let totalErrors = 0;

		for (const folder of folders) {
			try {
				await indexFolder(folder.id, options);
				totalSuccess++;
			} catch (error) {
				totalErrors++;
				folderLogger.error('❌ Error reindexando carpeta:', {
					folderId: folder.id,
					error,
				});
			}
			totalProcessed++;

			// Notificar progreso si hay callback
			if (options?.onProgress) {
				options.onProgress({
					status: `Reindexando carpetas (${totalProcessed}/${folders.length})`,
					progress: Math.round((totalProcessed / folders.length) * 100),
					phase: 'index',
					filesProcessed: totalProcessed,
					totalFiles: folders.length,
				});
			}
		}

		await revalidateFolderPaths();

		folderLogger.info('✅ Reindexación automática completada:', {
			totalProcessed,
			totalSuccess,
			totalErrors,
		});

		return {
			success: true,
			message: `Reindexación completada. Procesadas ${totalProcessed} carpetas: ${totalSuccess} exitosas, ${totalErrors} con errores.`,
		};
	} catch (error) {
		folderLogger.error('❌ Error durante la reindexación automática:', error);
		throw createProcessError('Error en reindexación automática', FOLDER_ERROR_CODES.INDEXING_FAILED, error);
	}
}

/**
 * 🆕 Reindexes ALL folders in the system (regardless of auto-reindex setting)
 * This is the function that should be used for global reindexing operations
 */
export async function reindexAllFoldersInSystem(options?: IndexOptions): Promise<ProcessStatus> {
	try {
		folderLogger.info('🔄 Iniciando reindexación de TODAS las carpetas del sistema');

		// Obtener TODAS las carpetas, no solo las marcadas para auto-reindex
		const folders = await prisma.folder.findMany({
			select: {
				id: true,
				name: true,
				path: true,
				autoReindex: true,
			},
			orderBy: {
				name: 'asc',
			},
		});

		if (folders.length === 0) {
			folderLogger.info('⚠️ No hay carpetas para reindexar');
			return {
				success: true,
				message: 'No hay carpetas para reindexar',
			};
		}

		folderLogger.info(`📁 Procesando ${folders.length} carpetas del sistema`);

		let totalProcessed = 0;
		let totalSuccess = 0;
		let totalErrors = 0;
		const errors: Array<{ folderId: string; error: string }> = [];

		for (const folder of folders) {
			try {
				folderLogger.info(`🔄 Reindexando carpeta: ${folder.name} (${totalProcessed + 1}/${folders.length})`);

				await reindexFolder(folder.id, {
					...options,
					deleteOrphans: true, // Limpiar huérfanos por defecto en reindexación global
					onProgress: (status) => {
						// Re-emitir progreso si hay callback externo
						if (options?.onProgress) {
							options.onProgress({
								...status,
								status: `${folder.name}: ${status.status}`,
							});
						}
					},
				});

				totalSuccess++;
				folderLogger.info(`✅ Carpeta "${folder.name}" reindexada exitosamente`);
			} catch (error) {
				totalErrors++;
				const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
				errors.push({ folderId: folder.id, error: errorMessage });

				folderLogger.error('❌ Error reindexando carpeta:', {
					folderId: folder.id,
					folderName: folder.name,
					error: errorMessage,
				});
			}

			totalProcessed++;

			// Notificar progreso global si hay callback
			if (options?.onProgress) {
				options.onProgress({
					status: `Reindexando todas las carpetas (${totalProcessed}/${folders.length})`,
					progress: Math.round((totalProcessed / folders.length) * 100),
					phase: 'index',
					filesProcessed: totalProcessed,
					totalFiles: folders.length,
					folderId: folder.id,
				});
			}
		}

		await revalidateFolderPaths();

		const summaryMessage = `Reindexación global completada. Procesadas ${totalProcessed} carpetas: ${totalSuccess} exitosas, ${totalErrors} con errores.`;

		folderLogger.info('✅ Reindexación global completada:', {
			totalProcessed,
			totalSuccess,
			totalErrors,
			folders: folders.map((f) => ({ id: f.id, name: f.name })),
			errors,
		});

		return {
			success: totalErrors === 0,
			message: summaryMessage,
			processedFolders: totalProcessed,
			totalFolders: folders.length,
			errors: totalErrors > 0 ? errors : undefined,
		};
	} catch (error) {
		folderLogger.error('❌ Error durante la reindexación global:', error);
		throw createProcessError(
			'Error en reindexación global de todas las carpetas',
			FOLDER_ERROR_CODES.INDEXING_FAILED,
			error
		);
	}
}

/**
 * Validates a folder path exists and is accessible
 */
export async function validateFolderPath(path: string): Promise<ProcessStatus> {
	try {
		folderLogger.info('🔍 Validando ruta de carpeta:', path);

		const scanResult = await scanFolder(path);

		folderLogger.info('✅ Ruta de carpeta validada:', {
			path,
			accessible: true,
			totalFiles: scanResult.totalFiles,
		});

		return {
			success: true,
			message: `La carpeta es accesible y contiene ${scanResult.totalFiles} archivos.`,
		};
	} catch (error) {
		folderLogger.error('❌ Error validando ruta de carpeta:', error);
		throw createProcessError('Error al validar ruta de carpeta', FOLDER_ERROR_CODES.PATH_INVALID, error);
	}
}

/**
 * Repairs folder statistics and relationships
 */
export async function repairFolder(id: string): Promise<ProcessStatus> {
	try {
		folderLogger.info('🔧 Iniciando reparación de carpeta:', id);

		// Obtener carpeta
		const folder = await prisma.folder.findUnique({
			where: { id },
			include: {
				images: true,
			},
		});

		if (!folder) {
			throw createProcessError('Carpeta no encontrada', FOLDER_ERROR_CODES.NOT_FOUND);
		} // Escanear contenido de carpeta
		const scanResult = await scanFolder(folder.path);

		// Actualizar estadísticas de carpeta
		await prisma.folder.update({
			where: { id },
			data: {
				totalFiles: scanResult.totalFiles,
				totalSize: scanResult.totalSize,
				lastIndexed: new Date(),
			},
		});

		// Eliminar imágenes que ya no existen
		const existingPaths = new Set(scanResult.images);
		const removedImages = folder.images.filter((img) => !existingPaths.has(img.path));

		if (removedImages.length > 0) {
			// Dividir en lotes para mejor rendimiento en grandes colecciones
			const deleteChunks = chunkArray(
				removedImages.map((img) => img.id),
				DEFAULT_BATCH_SIZE
			);

			for (const chunk of deleteChunks) {
				await prisma.image.deleteMany({
					where: {
						id: {
							in: chunk,
						},
					},
				});
			}
		}

		await revalidateFolderPaths();

		folderLogger.info('✅ Reparación de carpeta completada:', {
			id,
			removedImages: removedImages.length,
			updatedStats: {
				totalFiles: scanResult.totalFiles,
				totalSize: scanResult.totalSize,
			},
		});

		return {
			success: true,
			message: `Reparación completada. Eliminadas ${removedImages.length} imágenes inválidas y actualizadas estadísticas.`,
		};
	} catch (error) {
		folderLogger.error('❌ Error reparando carpeta:', error);
		throw createProcessError('Error al reparar carpeta', FOLDER_ERROR_CODES.UNEXPECTED_ERROR, error);
	}
}

/**
 * Reindexes a folder, with additional options for thorough reindexing
 * @param id ID of the folder to reindex
 * @param options Additional options for reindexing
 */
export async function reindexFolder(id: string, options?: ReindexOptions): Promise<FolderResponse> {
	try {
		folderLogger.info('🔄 Iniciando reindexación de carpeta:', id);

		// Reutilizar lógica de indexación
		const result = await indexFolder(id, options);

		folderLogger.info('✅ Carpeta reindexada correctamente:', {
			id: result.folderId,
			totalFiles: result.totalFiles,
		});

		return {
			id: result.folderId,
			name: result.name || '',
			path: result.path || '',
			totalFiles: result.totalFiles,
			totalSize: result.totalSize,
			lastIndexed: result.endTime ? new Date(result.endTime) : new Date(),
			createdAt: new Date(), // Asumir creado ahora si no está en result
			updatedAt: new Date(), // Asumir actualizado ahora si no está en result
			autoReindex: false, // Asumir false si no está en result
			stats: { totalImages: result.filesProcessed, totalVideos: 0, totalOthers: 0, averageFileSize: 0 },
		};
	} catch (error) {
		folderLogger.error('❌ Error reindexando carpeta:', error);
		throw createProcessError(
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
		folderLogger.info('📁 Iniciando indexación por lotes:', {
			folderCount: folderIds.length,
		});

		// Procesar en chunks de 3 carpetas simultáneamente para evitar sobrecarga
		const chunks = [];
		for (let i = 0; i < folderIds.length; i += 3) {
			chunks.push(folderIds.slice(i, i + 3));
		}

		const results: FolderResponse[] = [];

		for (const chunk of chunks) {
			const chunkPromises = chunk.map(async (id) => {
				const processStatus = await indexFolder(id, options); // indexFolder now returns ProcessStatus
				// Convert ProcessStatus to FolderResponse for consistency with return type
				return {
					id: processStatus.folderId || id,
					name: '', // Placeholder, as name is not in ProcessStatus
					path: '', // Placeholder
					totalFiles: processStatus.totalFiles,
					totalSize: 0, // Placeholder
					lastIndexed: processStatus.endTime ? new Date(processStatus.endTime) : undefined,
					createdAt: undefined, // Placeholder
					updatedAt: undefined, // Placeholder
					autoReindex: false, // Placeholder
					stats: { totalImages: processStatus.filesProcessed, totalVideos: 0, totalOthers: 0, averageFileSize: 0 },
				};
			});
			const chunkResults = await Promise.allSettled(chunkPromises);
			for (const result of chunkResults) {
				if (result.status === 'fulfilled') {
					results.push(result.value);
				} else {
					folderLogger.warn('⚠️ Error en indexación de chunk:', result.reason);
				}
			}
		}

		folderLogger.info('✅ Indexación por lotes completada:', {
			processed: results.length,
			requested: folderIds.length,
		});

		return results;
	} catch (error) {
		folderLogger.error('❌ Error en indexación por lotes:', error);
		throw createProcessError(
			'Error en indexación por lotes',
			FOLDER_ERROR_CODES.INDEXING_ERROR,
			error instanceof Error ? error.stack : undefined,
			undefined,
			error
		);
	}
}
