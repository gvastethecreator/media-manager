'use server';

import { existsSync } from 'fs';
import { statSync } from 'fs';
import { readdir, stat } from 'node:fs/promises';
import { extname, join } from 'node:path';
import * as path from 'node:path';
import { extractMetadata } from '@/app/actions/metadata';
import { computeHash } from '@/lib/hash';
import { logger } from '@/lib/logger/logger';
import { normalizePath } from '@/lib/path-utils';
import { prisma } from '@/lib/prisma';
import { emitProgress } from '@/lib/server/events.server';
import { generateThumbnail } from '@/lib/thumbnail';
import type { FileMetadata } from '@/types/metadata';
import { FolderError, type ProcessStatus, SUPPORTED_FORMATS } from './folder-types.actions';
import { verifyPathExists } from './folder-utils.actions';

const folderLogger = logger.withContext('FolderProcessing');

/**
 * Calcula un puntaje de salud basado en la cantidad de errores y el total de archivos
 * @param errorsByType Objeto con errores agrupados por tipo
 * @param total Total de archivos procesados
 * @returns Número entre 0 y 100 que representa la "salud" del proceso
 */
const calculateHealthScore = (errorsByType: Record<string, number>, total: number): number => {
	if (total === 0) {
		return 100; // No hay archivos, no hay problemas
	}

	// Contar el total de errores sumando todos los tipos
	const totalErrors = Object.values(errorsByType).reduce((sum, count) => sum + count, 0);

	// Calcular porcentaje de archivos sin errores
	const successRate = Math.max(0, ((total - totalErrors) / total) * 100);

	// Aplicar pesos diferentes según el tipo de error si es necesario
	// Por ejemplo, errores de thumbnail podrían ser menos graves que errores de procesamiento
	const weightedScore = successRate;

	// Redondear a 2 decimales
	return Math.round(weightedScore * 100) / 100;
};

/**
 * Procesa un directorio recursivamente para encontrar imágenes
 */
export const processDirectory = async (
	dirPath: string,
	folderId: string,
	emitProgress: (status: ProcessStatus) => void
): Promise<{ processed: number; total: number; totalSize: number }> => {
	try {
		// Asegurar que la ruta esté normalizada
		const normalizedPath = normalizePath(dirPath);

		// Verificar existencia con múltiples variantes
		const pathExists = await verifyPathExists(normalizedPath, dirPath);

		if (!pathExists.exists) {
			folderLogger.error('❌ Error: Directorio no encontrado:', dirPath);
			throw new FolderError('PATH_NOT_FOUND', `Directorio no encontrado: ${dirPath}`);
		}

		// Usar la ruta verificada que existe
		const verifiedPath = pathExists.foundPath || normalizedPath;

		// Continuar con el procesamiento usando la ruta verificada
		const files = await readdir(verifiedPath);
		let processed = 0;
		let total = 0;
		let totalSize = 0;
		const fileTypes: { [key: string]: number } = {};
		const errorsByType: { [key: string]: number } = {};
		let processedFiles = 0;
		const startTime = Date.now();

		// Contar archivos primero
		for (const file of files) {
			const filePath = join(verifiedPath, file);
			const stats = await stat(filePath);

			if (stats.isDirectory()) {
				const subDirStats = await processDirectory(filePath, folderId, emitProgress);
				total += subDirStats.total;
				totalSize += subDirStats.totalSize;
				continue;
			}

			const ext = extname(file).toLowerCase();
			if (SUPPORTED_FORMATS.includes(ext)) {
				total++;
				totalSize += stats.size;
				fileTypes[ext] = (fileTypes[ext] || 0) + 1;
			}
		}

		// Emitir progreso inicial
		emitProgress({
			status: 'Escaneando archivos...',
			phase: 'scanning',
			current: 0,
			total,
			progress: 0,
			timestamp: Date.now(),
			startTime: Date.now(),
		});

		// Procesar archivos
		for (const file of files) {
			try {
				const filePath = join(verifiedPath, file);
				const stats = await stat(filePath);

				if (stats.isDirectory()) {
					const subDirStats = await processDirectory(filePath, folderId, emitProgress);
					processed += subDirStats.processed;
					continue;
				}

				const ext = extname(file).toLowerCase();
				if (!SUPPORTED_FORMATS.includes(ext)) {
					continue;
				}

				// Emitir progreso del archivo actual
				const elapsedTime = (Date.now() - startTime) / 1000;
				const filesPerSecond = elapsedTime > 0 ? processedFiles / elapsedTime : 0;
				const estimatedTimeRemaining = Math.round((total - processed) / (filesPerSecond || 0.001));

				emitProgress({
					status: `Procesando ${file}...`,
					phase: 'indexing',
					current: processed,
					total,
					progress: (processed / total) * 100,
					processingSpeed: filesPerSecond,
					estimatedTimeRemaining,
					fileDetails: {
						name: file,
						size: stats.size,
						type: ext,
						dimensions: undefined, // Se llenará después si está disponible
					},
					extendedStats: {
						fileTypes: fileTypes,
						errorsByType: errorsByType,
						averageSize: totalSize / (total || 1),
						processingSpeed: filesPerSecond,
						healthScore: calculateHealthScore(errorsByType, total),
					},
					timestamp: Date.now(),
				});

				// Obtener metadata y hash
				let metadata: FileMetadata;
				let hash: string;
				let thumbnailData: { data: Buffer; size: number; width: number; height: number } | null = null;
				try {
					metadata = await extractMetadata(filePath);
					hash = await computeHash(filePath);

					// Verificación mejorada de dimensiones
					if (!metadata?.dimensions || !metadata.dimensions.width || !metadata.dimensions.height) {
						folderLogger.warn('Dimensiones no disponibles, utilizando valores predeterminados para:', file);

						// Asegurar que siempre tenemos dimensiones válidas
						metadata = metadata || {};
						const dimensions = metadata.dimensions || { width: 800, height: 600 };
						metadata.dimensions = {
							width: dimensions.width || 800,
							height: dimensions.height || 600,
						};

						// Registrar la corrección para diagnóstico
						if (typeof errorsByType !== 'undefined') {
							errorsByType.dimensions = (errorsByType.dimensions || 0) + 1;
						}
					}

					// Si tenemos dimensiones ahora, proceder con éxito
					if (metadata?.dimensions?.width && metadata?.dimensions?.height) {
						// Generar thumbnail
						try {
							const result = await generateThumbnail(filePath);
							if (result?.buffer) {
								thumbnailData = {
									data: result.buffer,
									size: result.buffer.length,
									width: result.width,
									height: result.height,
								};
							}
						} catch (thumbnailError) {
							errorsByType.thumbnail = (errorsByType.thumbnail || 0) + 1;
							folderLogger.error('Error generando thumbnail:', {
								file: filePath,
								error: thumbnailError,
							});
						}
					} else {
						// Si todavía no tenemos dimensiones, lanzar un error
						throw new Error('No se pudieron establecer dimensiones válidas');
					}
				} catch (metadataError) {
					errorsByType.processing = (errorsByType.processing || 0) + 1;
					folderLogger.error('Error procesando archivo:', {
						file,
						path: verifiedPath,
						error: metadataError instanceof Error ? metadataError.message : 'Error desconocido',
					});
					continue;
				}

				// Emitir progreso de generación de thumbnail
				emitProgress({
					status: `Generando miniatura para ${file}...`,
					phase: 'thumbnails' as const,
					current: processed,
					total,
					progress: (processed / total) * 100,
					currentFile: file,
					folderId,
					filesProcessed: processed,
					totalFiles: total,
					timestamp: Date.now(),
					fileDetails: {
						name: file,
						size: metadata.fileSystem?.size || 0,
						type: ext,
						dimensions: metadata.dimensions,
					},
				});

				// Emitir progreso de metadata
				emitProgress({
					status: `Extrayendo metadata de ${file}...`,
					phase: 'metadata' as const,
					current: processed,
					total,
					progress: (processed / total) * 100,
					currentFile: file,
					folderId,
					filesProcessed: processed,
					totalFiles: total,
					timestamp: Date.now(),
					fileDetails: {
						name: file,
						size: metadata.fileSystem?.size || 0,
						type: ext,
						dimensions: metadata.dimensions,
					},
				});

				// Crear entrada en la base de datos
				await prisma.image.create({
					data: {
						path: filePath,
						name: file,
						size: metadata.fileSystem?.size || 0,
						hash,
						width: metadata.dimensions.width,
						height: metadata.dimensions.height,
						metadata: JSON.stringify(metadata),
						thumbnail: thumbnailData?.data,
						thumbnailSize: thumbnailData?.size,
						thumbnailWidth: thumbnailData?.width,
						thumbnailHeight: thumbnailData?.height,
						folderId,
						createdAt: metadata.fileSystem?.created ? new Date(metadata.fileSystem.created) : new Date(),
						updatedAt: metadata.fileSystem?.modified ? new Date(metadata.fileSystem.modified) : new Date(),
					},
				});

				processed++;
				processedFiles++;

				// Emitir progreso después de cada archivo
				const currentElapsedTime = (Date.now() - startTime) / 1000;
				const currentFilesPerSecond = currentElapsedTime > 0 ? processedFiles / currentElapsedTime : 0;
				const currentEstimatedTimeRemaining = Math.round((total - processed) / (currentFilesPerSecond || 0.001));

				emitProgress({
					status: `Procesados ${processed} de ${total} archivos...`,
					phase: 'indexing',
					current: processed,
					total,
					progress: (processed / total) * 100,
					processingSpeed: currentFilesPerSecond,
					estimatedTimeRemaining: currentEstimatedTimeRemaining,
					timestamp: Date.now(),
					extendedStats: {
						fileTypes: fileTypes,
						errorsByType: errorsByType,
						averageSize: totalSize / (total || 1),
						processingSpeed: currentFilesPerSecond,
						healthScore: calculateHealthScore(errorsByType, total),
					},
				});
			} catch (fileError) {
				folderLogger.error('Error procesando archivo:', {
					file,
					path: verifiedPath,
					error: fileError instanceof Error ? fileError.message : 'Error desconocido',
				});
			}
		}

		// Emitir evento final con resumen
		emitProgress({
			status: `Procesamiento completado: ${processed} archivos procesados`,
			phase: 'indexing',
			current: processed,
			total,
			progress: 100,
			processingSpeed: Date.now() - startTime > 0 ? processed / ((Date.now() - startTime) / 1000) : 0,
			endTime: Date.now(),
			startTime,
			timestamp: Date.now(),
			extendedStats: {
				fileTypes,
				errorsByType,
				averageSize: totalSize / (total || 1),
				processingSpeed: Date.now() - startTime > 0 ? processed / ((Date.now() - startTime) / 1000) : 0,
				healthScore: calculateHealthScore(errorsByType, total),
			},
		});

		return { processed, total, totalSize };
	} catch (dirError) {
		folderLogger.error('Error procesando directorio:', {
			path: dirPath,
			error: dirError instanceof Error ? dirError.message : 'Error desconocido',
		});
		return { processed: 0, total: 0, totalSize: 0 };
	}
};

/**
 * Procesa un directorio recursivamente en modo de reindexación
 */
export const processDirectoryForReindex = async (
	dirPath: string,
	folderId: string,
	existingImages: Map<string, { id: string; path: string; size: number; updatedAt: Date | string; hash?: string }>
): Promise<{ processed: number; total: number; totalSize: number; deletedFiles: Set<string> }> => {
	try {
		// Asegurar que la ruta esté normalizada
		const normalizedPath = normalizePath(dirPath);

		// Verificar existencia con múltiples variantes
		const pathExists = await verifyPathExists(normalizedPath, dirPath);

		if (!pathExists.exists) {
			folderLogger.error('❌ Error: Directorio no encontrado:', dirPath);
			throw new FolderError('PATH_NOT_FOUND', `Directorio no encontrado: ${dirPath}`);
		}

		// Usar la ruta verificada que existe
		const verifiedPath = pathExists.foundPath || normalizedPath;

		// Continuar con el procesamiento usando la ruta verificada
		const files = await readdir(verifiedPath);
		let processed = 0;
		let total = 0;
		let totalSize = 0;
		const fileTypes: { [key: string]: number } = {};
		const errorsByType: { [key: string]: number } = {};
		let processedFiles = 0;
		const startTime = Date.now();

		// Set para rastrear archivos procesados y detectar eliminados
		const processedPaths = new Set<string>();
		const deletedFiles = new Set<string>();

		// Mapa de archivos en este directorio y subdirectorios
		const filesInThisDirectory = new Set<string>();

		// Contar archivos primero
		for (const file of files) {
			const filePath = join(verifiedPath, file);
			try {
				const stats = await stat(filePath);

				if (stats.isDirectory()) {
					const subDirStats = await processDirectoryForReindex(filePath, folderId, existingImages);
					total += subDirStats.total;
					totalSize += subDirStats.totalSize;

					// Agregar archivos eliminados de subdirectorios
					for (const deletedFile of subDirStats.deletedFiles) {
						deletedFiles.add(deletedFile);
					}

					continue;
				}

				const ext = extname(file).toLowerCase();
				if (SUPPORTED_FORMATS.includes(ext)) {
					total++;
					totalSize += stats.size;
					fileTypes[ext] = (fileTypes[ext] || 0) + 1;
					filesInThisDirectory.add(filePath);
				}
			} catch (err) {
				folderLogger.error(`Error accediendo al archivo ${filePath}:`, err);
				// Continuar con el siguiente archivo
			}
		}

		// Emitir progreso inicial
		emitProgress({
			status: 'Escaneando archivos...',
			phase: 'scanning',
			progress: 0,
			folderId,
			filesProcessed: 0,
			totalFiles: total,
			currentFile: dirPath,
			timestamp: Date.now(),
		});

		// Procesar archivos
		for (const file of files) {
			try {
				const filePath = join(verifiedPath, file);
				const stats = await stat(filePath);

				if (stats.isDirectory()) {
					const subDirStats = await processDirectoryForReindex(filePath, folderId, existingImages);
					processed += subDirStats.processed;

					// Después de procesar un subdirectorio
					const progress = Math.min(Math.round((processed / total) * 100), 100);
					const elapsedTime = (Date.now() - startTime) / 1000;
					const filesPerSecond = elapsedTime > 0 ? processedFiles / elapsedTime : 0;
					const estimatedTimeRemaining = Math.round((total - processed) / (filesPerSecond || 0.001));

					emitProgress({
						status: `Procesando archivos (${processed}/${total})...`,
						phase: 'indexing',
						progress,
						folderId,
						filesProcessed: processed,
						totalFiles: total,
						currentFile: filePath,
						fileDetails: {
							name: path.basename(filePath),
							type: 'directory',
							size: 0,
						},
						extendedStats: {
							fileTypes,
							errorsByType,
							processingSpeed: filesPerSecond,
							healthScore: calculateHealthScore(errorsByType, processed),
							averageSize: processed > 0 ? totalSize / processed : 0,
						},
						estimatedTimeRemaining,
						timestamp: Date.now(),
					});

					continue;
				}

				const ext = extname(file).toLowerCase();
				if (!SUPPORTED_FORMATS.includes(ext)) {
					continue;
				}

				const existingFile = existingImages.get(filePath);

				// Marcar este archivo como procesado
				processedPaths.add(filePath);

				// Emitir progreso para mostrar el archivo que se está procesando
				emitProgress({
					status: `Procesando ${file}...`,
					phase: 'indexing',
					progress: Math.min(Math.round((processed / total) * 100), 100),
					folderId,
					filesProcessed: processed,
					totalFiles: total,
					currentFile: filePath,
					timestamp: Date.now(),
				});

				// Si el archivo existe, verificar si necesita actualización
				if (existingFile) {
					const fileStats = await stat(filePath);
					const fileModTime = fileStats.mtime.getTime();
					const dbUpdateTime = new Date(existingFile.updatedAt).getTime();

					// Verificar si el archivo ha sido modificado
					const needsUpdate = existingFile.size !== fileStats.size || dbUpdateTime < fileModTime || !existingFile.hash; // Si no tiene hash, necesita actualización

					if (!needsUpdate) {
						// El archivo existe y no ha cambiado, lo contamos como procesado
						// pero no hacemos nada con él
						processed++;
						processedFiles++;

						// Para archivos no modificados
						const progress = Math.min(Math.round((processed / total) * 100), 100);
						emitProgress({
							status: `Verificando archivos (${processed}/${total})...`,
							phase: 'scanning',
							progress,
							folderId,
							filesProcessed: processed,
							totalFiles: total,
							currentFile: filePath,
							timestamp: Date.now(),
						});

						continue;
					}
				}

				// Emitir progreso del archivo actual
				const elapsedTime = (Date.now() - startTime) / 1000;
				const filesPerSecond = elapsedTime > 0 ? processedFiles / elapsedTime : 0;
				const estimatedTimeRemaining = Math.round((total - processed) / (filesPerSecond || 0.001));

				emitProgress({
					status: `Procesando ${file}...`,
					phase: 'indexing',
					progress: Math.min(Math.round((processed / total) * 100), 100),
					folderId,
					filesProcessed: processed,
					totalFiles: total,
					currentFile: filePath,
					fileDetails: {
						name: file,
						type: ext,
						size: existingFile?.size || 0,
					},
					extendedStats: {
						fileTypes,
						errorsByType,
						processingSpeed: filesPerSecond,
						healthScore: calculateHealthScore(errorsByType, processed),
						averageSize: processed > 0 ? totalSize / processed : 0,
					},
					estimatedTimeRemaining,
					timestamp: Date.now(),
				});

				// Obtener metadata y hash
				let metadata: FileMetadata;
				let hash: string;
				let thumbnailData: { data: Buffer; size: number; width: number; height: number } | null = null;
				try {
					metadata = await extractMetadata(filePath);
					hash = await computeHash(filePath);

					// Verificación mejorada de dimensiones
					if (!metadata?.dimensions || !metadata.dimensions.width || !metadata.dimensions.height) {
						folderLogger.warn('Dimensiones no disponibles, utilizando valores predeterminados para:', file);

						// Asegurar que siempre tenemos dimensiones válidas
						metadata = metadata || {};
						const dimensions = metadata.dimensions || { width: 800, height: 600 };
						metadata.dimensions = {
							width: dimensions.width || 800,
							height: dimensions.height || 600,
						};

						// Registrar la corrección para diagnóstico
						if (typeof errorsByType !== 'undefined') {
							errorsByType.dimensions = (errorsByType.dimensions || 0) + 1;
						}
					}

					// Si tenemos dimensiones ahora, proceder con éxito
					if (metadata?.dimensions?.width && metadata?.dimensions?.height) {
						// Generar thumbnail
						try {
							const result = await generateThumbnail(filePath);
							if (result?.buffer) {
								thumbnailData = {
									data: result.buffer,
									size: result.buffer.length,
									width: result.width,
									height: result.height,
								};
							}
						} catch (thumbnailError) {
							errorsByType.thumbnail = (errorsByType.thumbnail || 0) + 1;
							folderLogger.error('Error generando thumbnail:', {
								file: filePath,
								error: thumbnailError,
							});
						}
					} else {
						// Si todavía no tenemos dimensiones, lanzar un error
						throw new Error('No se pudieron establecer dimensiones válidas');
					}
				} catch (metadataError) {
					errorsByType.processing = (errorsByType.processing || 0) + 1;
					folderLogger.error('Error procesando archivo:', {
						file,
						path: dirPath,
						error: metadataError instanceof Error ? metadataError.message : 'Error desconocido',
					});
					continue;
				}

				// Solo llegamos aquí si tenemos tanto metadatos como hash
				try {
					// Actualizar o crear imagen
					if (existingFile) {
						await prisma.image.update({
							where: { id: existingFile.id },
							data: {
								size: stats.size,
								hash,
								width: metadata.dimensions.width,
								height: metadata.dimensions.height,
								metadata: JSON.stringify(metadata),
								thumbnail: thumbnailData?.data,
								thumbnailSize: thumbnailData?.size,
								thumbnailWidth: thumbnailData?.width,
								thumbnailHeight: thumbnailData?.height,
								updatedAt: new Date(),
							},
						});
					} else {
						await prisma.image.create({
							data: {
								path: filePath,
								name: file,
								size: stats.size,
								hash,
								width: metadata.dimensions.width,
								height: metadata.dimensions.height,
								metadata: JSON.stringify(metadata),
								thumbnail: thumbnailData?.data,
								thumbnailSize: thumbnailData?.size,
								thumbnailWidth: thumbnailData?.width,
								thumbnailHeight: thumbnailData?.height,
								folderId,
								createdAt: metadata.fileSystem?.created ? new Date(metadata.fileSystem.created) : new Date(),
								updatedAt: metadata.fileSystem?.modified ? new Date(metadata.fileSystem.modified) : new Date(),
							},
						});
					}

					processed++;
					processedFiles++;
				} catch (dbError) {
					errorsByType.database = (errorsByType.database || 0) + 1;
					folderLogger.error('Error guardando en base de datos:', {
						file,
						path: dirPath,
						error: dbError instanceof Error ? dbError.message : 'Error desconocido',
					});
				}

				// Emitir progreso después de procesar un archivo
				emitProgress({
					status: `Procesados ${processed} de ${total} archivos...`,
					phase: 'indexing',
					progress: Math.min(Math.round((processed / total) * 100), 100),
					folderId,
					filesProcessed: processed,
					totalFiles: total,
					currentFile: filePath,
					timestamp: Date.now(),
				});
			} catch (err) {
				// Manejar el error, pero continuar con el siguiente archivo
				folderLogger.error(`Error procesando archivo ${file}:`, err);
				errorsByType[extname(file).toLowerCase()] = (errorsByType[extname(file).toLowerCase()] || 0) + 1;

				// En caso de error
				emitProgress({
					status: `Error con ${file}, continuando...`,
					phase: 'error',
					progress: Math.min(Math.round((processed / total) * 100), 100),
					folderId,
					filesProcessed: processed,
					totalFiles: total,
					currentFile: join(verifiedPath, file),
					errors: [
						{
							file: join(verifiedPath, file),
							error: err instanceof Error ? err.message : String(err),
							timestamp: Date.now(),
						},
					],
					timestamp: Date.now(),
				});
			}
		}

		// Emitir progreso final para este directorio
		emitProgress({
			status: `Completado directorio ${dirPath}`,
			phase: 'indexing',
			progress: 100,
			folderId,
			filesProcessed: processed,
			totalFiles: total,
			currentFile: dirPath,
			extendedStats: {
				fileTypes,
				errorsByType,
				processingSpeed: Date.now() - startTime > 0 ? processed / ((Date.now() - startTime) / 1000) : 0,
				healthScore: calculateHealthScore(errorsByType, processed),
				averageSize: processed > 0 ? totalSize / processed : 0,
			},
			timestamp: Date.now(),
		});

		// Detectar archivos eliminados
		// Encontrar archivos que existían en la base de datos pero ya no existen en el directorio
		// Recorrer todos los archivos que existen en la base de datos para esta carpeta
		for (const [imagePath, imageInfo] of existingImages.entries()) {
			// Si la ruta comienza con el mismo directorio pero no está en los archivos procesados
			if (
				imagePath.startsWith(verifiedPath) &&
				!processedPaths.has(imagePath) &&
				!filesInThisDirectory.has(imagePath)
			) {
				// Archivo no encontrado, marcarlo como eliminado
				deletedFiles.add(imageInfo.id);
			}
		}

		return { processed, total, totalSize, deletedFiles };
	} catch (error) {
		folderLogger.error('Error procesando directorio:', error);
		throw error;
	}
};
