import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import path from 'path';
import { db } from '@/lib/drizzle';
import { folders } from '@/lib/drizzle/schema/index';
import { emitProgress } from '@/lib/server/events.server';
import { FileEntityMapperService } from '@/services/file-entity-mapper/file-entity-mapper.service';
import type { EntityCreationStats } from '@/types/file-entity-mapper';
import type { DirectoryInfo } from './folder-scanner';
import { scanFolder } from './folder-scanner';
import { type FolderSyncResult, syncFoldersWithFileSystem } from './folder-sync';

/**
 * 🔧 ENHANCED: Actualiza estadísticas, crea entidades automáticamente y procesa subcarpetas
 * Ahora usa scanFolder() para obtener totalFiles y totalSize reales del sistema de archivos,
 * crea entidades correspondientes para cada archivo encontrado y agrega subcarpetas a la BD
 * 🆕 NUEVA FUNCIONALIDAD: Sincronización automática de carpetas con el sistema de archivos
 */
export async function updateFolderStats(
	folderId: string,
	processedPaths: Set<string> = new Set(),
	maxDepth = 10,
	currentDepth = 0,
	enableSync = true,
	emitProgressEvents = true
): Promise<EntityCreationStats & { syncResult?: FolderSyncResult }> {
	// 🆕 SINCRONIZACIÓN AUTOMÁTICA: Ejecutar antes del indexado si está habilitada
	let syncResult: FolderSyncResult | undefined;
	if (enableSync && currentDepth === 0) {
		try {
			console.log('🔄 Ejecutando sincronización automática de carpetas...');
			syncResult = await syncFoldersWithFileSystem({
				maxDepth,
				includeHidden: false,
				forceSync: true,
			});
			console.log('✅ Sincronización completada:', {
				added: syncResult.added.length,
				removed: syncResult.removed.length,
				errors: syncResult.errors.length,
			});
		} catch (error) {
			console.warn('⚠️ Error en sincronización automática:', error);
			// Continuar con el indexado aunque falle la sincronización
		}
	}

	// Obtener la carpeta para acceder a su path
	const folder = await db.query.folders.findFirst({
		where: eq(folders.id, folderId),
		columns: { path: true },
	});

	if (!folder) {
		throw new Error(`Carpeta con ID ${folderId} no encontrada`);
	}

	// 📊 USAR EL MISMO CRITERIO QUE EL REINDEXADO: scanFolder()
	// Esto asegura consistencia entre reindexado y actualización de estadísticas
	const scanResult = await scanFolder(folder.path, {
		recursive: true,
		includeHidden: false,
	});

	// Evitar procesamiento duplicado y bucles infinitos
	if (processedPaths.has(folder.path) || currentDepth >= maxDepth) {
		return { totalFiles: 0, processed: 0, successful: 0, failed: 0, errors: [] };
	}
	processedPaths.add(folder.path);

	// 🎯 NUEVA FUNCIONALIDAD: Crear entidades automáticamente con progreso
	const fileEntityMapper = FileEntityMapperService.getInstance();
	const filePaths = scanResult.files.map((file) => file.path);

	// Emitir progreso inicial
	if (emitProgressEvents && currentDepth === 0) {
		await emitProgress('folder:progress', {
			folderId,
			status: 'processing',
			isProcessing: true,
			progress: 0,
			totalFiles: filePaths.length,
			filesProcessed: 0,
			message: 'Iniciando indexación de archivos...',
			phase: 'starting',
			timestamp: Date.now(),
		});
	}

	// Procesar archivos con progreso
	const entityStats = await processFilesWithProgress(
		filePaths,
		folderId,
		fileEntityMapper,
		emitProgressEvents && currentDepth === 0
	);

	// 🆕 PROCESAR SUBCARPETAS: Crear carpetas para directorios encontrados
	const subfolderStats = await processSubfolders(
		scanResult.directories,
		folderId,
		processedPaths,
		maxDepth,
		currentDepth + 1
	);

	// Actualizar con los mismos valores que usa el reindexado
	await db
		.update(folders)
		.set({
			totalFiles: scanResult.totalFiles, // 🎯 Ahora usa el mismo criterio
			totalSize: scanResult.totalSize, // 🎯 Ahora usa el mismo criterio
			lastIndexed: new Date(),
		})
		.where(eq(folders.id, folderId));

	// Combinar estadísticas de archivos y subcarpetas
	const result = {
		totalFiles: entityStats.totalFiles + subfolderStats.totalFiles,
		processed: entityStats.processed + subfolderStats.processed,
		successful: entityStats.successful + subfolderStats.successful,
		failed: entityStats.failed + subfolderStats.failed,
		errors: [...entityStats.errors, ...subfolderStats.errors],
		...(syncResult && { syncResult }),
	};

	return result;
}

export async function getFolderStats(folderId: string) {
	const folder = await db.query.folders.findFirst({
		where: eq(folders.id, folderId),
		with: {
			images: { columns: { id: true } },
		},
		columns: {
			totalFiles: true,
			totalSize: true,
			lastIndexed: true,
		},
	});

	return {
		totalFiles: folder?.totalFiles || 0,
		totalSize: folder?.totalSize || 0,
		lastIndexed: folder?.lastIndexed,
		imageCount: folder?.images.length || 0,
	};
}

/**
 * 🆕 Procesa archivos con progreso detallado en 3 etapas
 */
async function processFilesWithProgress(
	filePaths: string[],
	folderId: string,
	fileEntityMapper: FileEntityMapperService,
	emitEvents: boolean
): Promise<EntityCreationStats> {
	const totalFiles = filePaths.length;
	const stats: EntityCreationStats = {
		totalFiles: filePaths.length,
		processed: 0,
		successful: 0,
		failed: 0,
		errors: [],
	};

	if (totalFiles === 0) {
		return stats;
	}

	const batchSize = 10;
	const progressUpdateInterval = Math.max(1, Math.floor(totalFiles / 20)); // Actualizar progreso cada 5%
	const startTime = Date.now();

	// Emitir progreso inicial
	if (emitEvents) {
		await emitProgress('folder:progress', {
			folderId,
			status: 'processing',
			isProcessing: true,
			progress: 0,
			totalFiles,
			filesProcessed: 0,
			message: 'Iniciando reindexado en 3 etapas...',
			phase: 'starting',
			timestamp: Date.now(),
		});
	}

	// ETAPA 1: Indexación de archivos y creación de entidades básicas (0-33%)
	console.log('🔧 [ETAPA 1/3] Iniciando indexación de archivos...');
	const entityIds: string[] = [];
	let stage1ProcessedFiles = 0;

	for (let i = 0; i < filePaths.length; i += batchSize) {
		const batch = filePaths.slice(i, i + batchSize);

		for (const filePath of batch) {
			try {
				const result = await fileEntityMapper.createBasicEntityFromFile(filePath, folderId);
				stats.processed++;

				if (result.success) {
					stats.successful++;
					if (result.entityId) {
						entityIds.push(result.entityId);
					}
				} else if (result.error !== 'Entity already exists') {
					stats.failed++;
					stats.errors.push({ file: filePath, error: result.error || 'Unknown error' });
				} else {
					stats.successful++;
				}
			} catch (error) {
				stats.failed++;
				stats.errors.push({ file: filePath, error: (error as Error).message || 'Unknown error' });
				stats.processed++;
			}

			stage1ProcessedFiles++;

			// Emitir progreso de etapa 1 (0-33%)
			if (emitEvents && (stage1ProcessedFiles % progressUpdateInterval === 0 || stage1ProcessedFiles === totalFiles)) {
				const stageProgress = Math.round((stage1ProcessedFiles / totalFiles) * 100);
				const overallProgress = Math.round(stageProgress / 3);

				await emitProgress('folder:progress', {
					folderId,
					status: 'processing',
					isProcessing: true,
					progress: overallProgress,
					totalFiles,
					filesProcessed: stage1ProcessedFiles,
					message: `Etapa 1/3: Indexando archivos... ${stage1ProcessedFiles}/${totalFiles}`,
					phase: 'scanning',
					timestamp: Date.now(),
				});
			}
		}

		// Pequeña pausa entre lotes
		if (i + batchSize < filePaths.length) {
			await new Promise((resolve) => setTimeout(resolve, 10));
		}
	}

	// ETAPA 2: Extracción de metadata (33-66%)
	console.log('🔍 [ETAPA 2/3] Iniciando extracción de metadata...');
	let stage2ProcessedFiles = 0;

	for (let i = 0; i < filePaths.length; i += batchSize) {
		const batch = filePaths.slice(i, i + batchSize);

		for (let j = 0; j < batch.length; j++) {
			const filePath = batch[j];
			const entityId = entityIds[i + j];

			if (entityId) {
				try {
					const entityType = fileEntityMapper.getEntityTypeFromExtension(path.extname(filePath));
					await fileEntityMapper.extractMetadataForEntity(filePath, entityId, entityType);
				} catch (error) {
					console.warn(`⚠️ [ETAPA 2] Error extrayendo metadata de ${filePath}:`, error);
				}
			}

			stage2ProcessedFiles++;

			// Emitir progreso de etapa 2 (33-66%)
			if (emitEvents && (stage2ProcessedFiles % progressUpdateInterval === 0 || stage2ProcessedFiles === totalFiles)) {
				const stageProgress = Math.round((stage2ProcessedFiles / totalFiles) * 100);
				const overallProgress = Math.round(33 + stageProgress / 3);

				await emitProgress('folder:progress', {
					folderId,
					status: 'processing',
					isProcessing: true,
					progress: overallProgress,
					totalFiles,
					filesProcessed: stage2ProcessedFiles,
					message: `Etapa 2/3: Extrayendo metadata... ${stage2ProcessedFiles}/${totalFiles}`,
					phase: 'metadata',
					timestamp: Date.now(),
				});
			}
		}

		// Pequeña pausa entre lotes
		if (i + batchSize < filePaths.length) {
			await new Promise((resolve) => setTimeout(resolve, 10));
		}
	}

	// ETAPA 3: Procesamiento de thumbnails (66-100%)
	console.log('🖼️ [ETAPA 3/3] Iniciando procesamiento de thumbnails...');
	let stage3ProcessedFiles = 0;

	for (let i = 0; i < filePaths.length; i += batchSize) {
		const batch = filePaths.slice(i, i + batchSize);

		for (let j = 0; j < batch.length; j++) {
			const filePath = batch[j];
			const entityId = entityIds[i + j];

			if (entityId) {
				try {
					const entityType = fileEntityMapper.getEntityTypeFromExtension(path.extname(filePath));
					await fileEntityMapper.processThumbnailForEntity(filePath, entityId, entityType);
				} catch (error) {
					console.warn(`⚠️ [ETAPA 3] Error procesando thumbnail de ${filePath}:`, error);
				}
			}

			stage3ProcessedFiles++;

			// Emitir progreso de etapa 3 (66-100%)
			if (emitEvents && (stage3ProcessedFiles % progressUpdateInterval === 0 || stage3ProcessedFiles === totalFiles)) {
				const stageProgress = Math.round((stage3ProcessedFiles / totalFiles) * 100);
				const overallProgress = Math.round(66 + stageProgress / 3);

				await emitProgress('folder:progress', {
					folderId,
					status: stage3ProcessedFiles === totalFiles ? 'completed' : 'processing',
					isProcessing: stage3ProcessedFiles < totalFiles,
					progress: overallProgress,
					totalFiles,
					filesProcessed: stage3ProcessedFiles,
					message:
						stage3ProcessedFiles === totalFiles
							? 'Reindexado completado en 3 etapas'
							: `Etapa 3/3: Procesando thumbnails... ${stage3ProcessedFiles}/${totalFiles}`,
					phase: stage3ProcessedFiles === totalFiles ? 'complete' : 'processing',
					timestamp: Date.now(),
				});
			}
		}

		// Pequeña pausa entre lotes
		if (i + batchSize < filePaths.length) {
			await new Promise((resolve) => setTimeout(resolve, 10));
		}
	}

	const endTime = Date.now();
	const duration = endTime - startTime;
	console.log(`✅ Reindexado completado en ${duration}ms. Estadísticas:`, {
		totalFiles: stats.totalFiles,
		successful: stats.successful,
		failed: stats.failed,
		processed: stats.processed,
	});

	return stats;
}

/**
 * 🆕 Procesa subcarpetas encontradas durante el escaneo
 * Crea nuevas carpetas en la BD para directorios que no existan y las indexa recursivamente
 */
async function processSubfolders(
	directories: DirectoryInfo[],
	parentFolderId: string,
	processedPaths: Set<string>,
	maxDepth: number,
	currentDepth: number
): Promise<EntityCreationStats> {
	const totalStats: EntityCreationStats = { totalFiles: 0, processed: 0, successful: 0, failed: 0, errors: [] };

	// Procesar directorios en paralelo para mejorar performance
	const results = await Promise.allSettled(
		directories.map(async (directory) => {
			try {
				// Verificar si ya existe una carpeta con esta ruta
				const existingFolder = await db.query.folders.findFirst({
					where: eq(folders.path, directory.path),
					columns: { id: true },
				});

				let subfolderId: string;

				if (existingFolder) {
					// La carpeta ya existe, usar su ID
					subfolderId = existingFolder.id;
				} else {
					// Crear nueva carpeta
					subfolderId = randomUUID();
					const folderName = path.basename(directory.path);

					await db.insert(folders).values({
						id: subfolderId,
						name: folderName,
						path: directory.path,
						parentId: parentFolderId,
						totalFiles: 0,
						totalSize: 0,
						lastIndexed: new Date(),
						autoReindex: false,
					});
				}

				// Indexar recursivamente la subcarpeta (sin emitir eventos de progreso)
				const subfolderStats = await updateFolderStats(
					subfolderId,
					processedPaths,
					maxDepth,
					currentDepth,
					false, // No sincronizar subcarpetas
					false // No emitir eventos de progreso en subcarpetas
				);

				return {
					success: true,
					stats: subfolderStats,
				};
			} catch (error) {
				console.error(`Error procesando subcarpeta ${directory.path}:`, error);
				return {
					success: false,
					error: { file: directory.path, error: (error as Error).message || 'Unknown error' },
				};
			}
		})
	);

	// Agregar estadísticas de los resultados
	for (const result of results) {
		if (result.status === 'fulfilled') {
			const resultValue = result.value;
			if (resultValue.success && resultValue.stats) {
				totalStats.totalFiles += resultValue.stats.totalFiles;
				totalStats.processed += resultValue.stats.processed;
				totalStats.successful += resultValue.stats.successful;
				totalStats.failed += resultValue.stats.failed;
				totalStats.errors.push(...resultValue.stats.errors);
			} else if (!resultValue.success && resultValue.error) {
				totalStats.failed++;
				totalStats.processed++;
				totalStats.errors.push(resultValue.error);
			}
		} else {
			totalStats.failed++;
			totalStats.processed++;
			totalStats.errors.push({ file: 'unknown', error: result.reason });
		}
	}

	return totalStats;
}

export async function updateAllFolderStats() {
	const foldersData = await db.query.folders.findMany({
		columns: { id: true },
	});

	// Procesar carpetas en paralelo para mejorar performance
	await Promise.allSettled(
		foldersData.map(async (folder: { id: string }) => {
			try {
				await updateFolderStats(folder.id);
			} catch (error) {
				console.error(`Error actualizando estadísticas de carpeta ${folder.id}:`, error);
			}
		})
	);
}
