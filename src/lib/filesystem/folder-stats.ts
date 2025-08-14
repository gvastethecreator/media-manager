import { db } from '@/lib/drizzle';
import { folders } from '@/lib/drizzle/schema/index';
import { emitProgress } from '@/lib/server/events.server';
import { FileEntityMapperService } from '@/services/file-entity-mapper/file-entity-mapper.service';
import type { EntityCreationStats } from '@/types/file-entity-mapper';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import path from 'path';
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

	// 🆕 PROCESAR SUBCARPETAS: Crear carpetas para directorios encontrados (con progreso heartbeat)
	let subfolderCompleted = 0;
	const totalSubfolders = scanResult.directories.length;
	const subfolderStats = await processSubfolders(
		scanResult.directories,
		folderId,
		processedPaths,
		maxDepth,
		currentDepth + 1,
		async () => {
			subfolderCompleted++;
			if (emitProgressEvents && currentDepth === 0) {
				// Mantener progreso en 99 pero actualizar mensaje para evitar percepción de cuelgue
				await emitProgress('folder:progress', {
					folderId,
					status: 'processing',
					isProcessing: true,
					progress: 99,
					totalFiles: filePaths.length,
					filesProcessed: filePaths.length,
					message: `Procesando subcarpetas (${subfolderCompleted}/${totalSubfolders})...`,
					// phase adicional no existente en tipo; reutilizamos 'processing'
					phase: 'processing',
					timestamp: Date.now(),
				});
			}
		}
	);

	// Emitir evento final de completado SOLO después de procesar subcarpetas
	if (emitProgressEvents && currentDepth === 0) {
		await emitProgress('folder:progress', {
			folderId,
			status: 'completed',
			isProcessing: false,
			progress: 100,
			totalFiles: filePaths.length,
			filesProcessed: filePaths.length,
			message: 'Reindexado completado (archivos y subcarpetas)',
			phase: 'complete',
			timestamp: Date.now(),
		});
	}

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
 * Procesa archivos emitiendo progreso en 3 etapas con concurrencia limitada.
 *
 * Etapas:
 *  1. createBasicEntityFromFile ("scanning")
 *  2. extractMetadataForEntity ("metadata")
 *  3. processThumbnailForEntity ("processing")
 *
 * Mapeo de progreso global (reservando el 100% para subcarpetas externas):
 *  - Stage 1: 0   – 33
 *  - Stage 2: 33  – 66
 *  - Stage 3: 66  – 99 (el 99% se mantiene mientras se procesan subcarpetas)
 *  - 100% lo emite updateFolderStats sólo tras finalizar subcarpetas.
 *
 * Concurrencia:
 *  - runLimited() implementa un pequeño pool evitando await secuencial sobre cada ítem.
 *  - Default concurrency = 4 (ajustable via options.concurrency).
 *
 * Diseño / Razones del refactor:
 *  - Reducir complejidad ciclomática eliminando bucles anidados + lógica de batches.
 *  - Unificar cálculo de progreso y permitir inyección de un progressEmitter para tests.
 *  - Asegurar que nunca se emite 100 antes de subcarpetas -> UI no aparenta "cuelgue" al 99.
 *
 * Testabilidad:
 *  - options.progressEmitter permite capturar eventos sin mockear emitProgress global.
 *  - Casos edge (0 y 1 archivo) verificados en tests unitarios.
 *
 * Errores / resiliencia:
 *  - Errores de metadata / thumbnail no detienen el pipeline (se loguean y continúan).
 *  - Timeout defensivo de 5s por operación de metadata/thumbnail (withTimeout).
 *
 * @param filePaths Lista de paths absolutos o relativos a procesar
 * @param folderId ID de carpeta para asociar eventos
 * @param fileEntityMapper Servicio de mapeo ya singleton
 * @param emitEvents Habilita/deshabilita emisión (optimización para subcarpetas)
 * @param options.concurrency Concurrencia limitada (>=1)
 * @param options.progressEmitter Callback opcional para capturar eventos de progreso (tests)
 */
// Exportado solo para tests internos (prefijo _internal) – no usar directamente fuera de casos de prueba
export async function processFilesWithProgress(
	filePaths: string[],
	folderId: string,
	fileEntityMapper: FileEntityMapperService,
	emitEvents: boolean,
	options: { concurrency?: number; progressEmitter?: (payload: any) => Promise<void> | void } = {}
): Promise<EntityCreationStats> {
	const totalFiles = filePaths.length;
	const stats: EntityCreationStats = { totalFiles, processed: 0, successful: 0, failed: 0, errors: [] };
	if (totalFiles === 0) {
		return stats;
	}

	const concurrency = Math.max(1, options.concurrency ?? 4);
	const progressUpdateInterval = Math.max(1, Math.floor(totalFiles / 20)); // ~5%
	const startTime = Date.now();

	const progressEmitter = options.progressEmitter;
	const emitStageProgress = async (progress: number, processedCount: number, message: string, phase: string) => {
		if (!emitEvents) {
			return;
		}
		const payload = {
			folderId,
			status: 'processing',
			isProcessing: true,
			progress,
			totalFiles,
			filesProcessed: processedCount,
			message,
			phase: phase as any,
			timestamp: Date.now(),
		} as const;
		if (progressEmitter) {
			await progressEmitter(payload);
		} else {
			await emitProgress('folder:progress', payload);
		}
	};

	await emitStageProgress(0, 0, 'Iniciando reindexado en 3 etapas...', 'starting');

	interface IndexedItem {
		path: string;
		entityId: string;
		entityType: string;
	}
	const indexedItems: IndexedItem[] = [];

	// Generic limited concurrency runner
	async function runLimited<T>(items: T[], worker: (item: T, index: number) => Promise<void>) {
		let idx = 0;
		const workers: Promise<void>[] = [];
		const launch = (): Promise<void> => {
			if (idx >= items.length) {
				return Promise.resolve();
			}
			const currentIndex = idx++;
			const p = worker(items[currentIndex], currentIndex)
				.catch(() => {
					/* errores ya registrados */
				})
				.then(launch);
			return p;
		};
		for (let i = 0; i < Math.min(concurrency, items.length); i++) {
			workers.push(launch());
		}
		await Promise.all(workers);
	}

	// Stage helper progress mapping
	const mapStageProgress = (stage: 1 | 2 | 3, processed: number): number => {
		const pct = processed / totalFiles;
		if (stage === 1) {
			return Math.max(0, Math.min(33, Math.round(pct * 33)));
		}
		if (stage === 2) {
			return Math.max(33, Math.min(66, Math.round(33 + pct * 33)));
		}
		// stage 3
		return Math.max(66, Math.min(99, Math.round(66 + pct * 33))); // 99 reserva subcarpetas
	};

	// =============== STAGE 1 ===============
	console.log('🔧 [ETAPA 1/3] (concurrency=%d) Indexando archivos...', concurrency);
	let stage1Processed = 0;
	await runLimited(filePaths, async (filePath) => {
		try {
			const result = await fileEntityMapper.createBasicEntityFromFile(filePath, folderId);
			stats.processed++;
			if (result.success) {
				stats.successful++;
				if (result.entityId) {
					indexedItems.push({ path: filePath, entityId: result.entityId, entityType: result.entityType });
				}
			} else if (result.error !== 'Entity already exists') {
				stats.failed++;
				stats.errors.push({ file: filePath, error: result.error || 'Unknown error' });
			} else {
				stats.successful++;
			}
		} catch (err) {
			stats.failed++;
			stats.errors.push({ file: filePath, error: (err as Error).message || 'Unknown error' });
			stats.processed++;
		} finally {
			stage1Processed++;
			if (stage1Processed % progressUpdateInterval === 0 || stage1Processed === totalFiles) {
				await emitStageProgress(
					mapStageProgress(1, stage1Processed),
					stage1Processed,
					`Etapa 1/3: Indexando archivos... ${stage1Processed}/${totalFiles}`,
					'scanning'
				);
			}
		}
	});

	const stage2Start = Date.now();
	console.log('🔍 [ETAPA 2/3] Iniciando extracción de metadata...');
	let stage2Processed = 0;
	await runLimited(indexedItems, async (item) => {
		try {
			const entityType = fileEntityMapper.getEntityTypeFromExtension(path.extname(item.path));
			await withTimeout(
				fileEntityMapper.extractMetadataForEntity(item.path, item.entityId, entityType),
				5000,
				`Metadata timeout (${item.path})`
			);
		} catch (err) {
			console.warn(`⚠️ [ETAPA 2] Error extrayendo metadata de ${item.path}:`, err);
		} finally {
			stage2Processed++;
			if (stage2Processed % progressUpdateInterval === 0 || stage2Processed === totalFiles) {
				await emitStageProgress(
					mapStageProgress(2, stage2Processed),
					stage2Processed,
					`Etapa 2/3: Extrayendo metadata... ${stage2Processed}/${totalFiles}`,
					'metadata'
				);
			}
		}
	});

	const stage3Start = Date.now();
	console.log('🖼️ [ETAPA 3/3] Iniciando procesamiento de thumbnails...');
	let stage3Processed = 0;
	await runLimited(indexedItems, async (item) => {
		try {
			const entityType = fileEntityMapper.getEntityTypeFromExtension(path.extname(item.path));
			await withTimeout(
				fileEntityMapper.processThumbnailForEntity(item.path, item.entityId, entityType),
				5000,
				`Thumbnail timeout (${item.path})`
			);
		} catch (err) {
			console.warn(`⚠️ [ETAPA 3] Error procesando thumbnail de ${item.path}:`, err);
		} finally {
			stage3Processed++;
			if (stage3Processed % progressUpdateInterval === 0 || stage3Processed === totalFiles) {
				const mapped = mapStageProgress(3, stage3Processed);
				const message =
					stage3Processed === totalFiles
						? 'Archivos procesados. Procesando subcarpetas...'
						: `Etapa 3/3: Procesando thumbnails... ${stage3Processed}/${totalFiles}`;
				await emitStageProgress(mapped, stage3Processed, message, 'processing');
			}
		}
	});

	const endTime = Date.now();
	console.log('⏱️ Duraciones por etapa (ms):', {
		stage1: stage2Start - startTime,
		stage2: stage3Start - stage2Start,
		stage3: endTime - stage3Start,
		full: endTime - startTime,
	});
	console.log('✅ Reindexado completado (stages) Stats:', {
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
	currentDepth: number,
	onSubfolderComplete?: () => Promise<void> | void
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

				// Notificar avance al root
				if (onSubfolderComplete) {
					await onSubfolderComplete();
				}

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

// Helper timeout
async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
	let timeoutId: NodeJS.Timeout | undefined;
	const timeoutPromise = new Promise<never>((_, reject) => {
		timeoutId = setTimeout(() => {
			reject(new Error(label));
		}, ms);
	});
	try {
		return await Promise.race([promise, timeoutPromise]);
	} finally {
		if (timeoutId) {
			clearTimeout(timeoutId);
		}
	}
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
