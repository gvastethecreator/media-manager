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
 * 🆕 Procesa archivos con emisión de eventos de progreso
 */
async function processFilesWithProgress(
	filePaths: string[],
	folderId: string,
	fileEntityMapper: FileEntityMapperService,
	emitEvents: boolean
): Promise<EntityCreationStats> {
	const totalFiles = filePaths.length;
	let processedFiles = 0;
	const stats: EntityCreationStats = {
		totalFiles: filePaths.length,
		processed: 0,
		successful: 0,
		failed: 0,
		errors: [],
	};

	// Procesar archivos en lotes para evitar sobrecarga
	const batchSize = 10;
	const progressUpdateInterval = Math.max(1, Math.floor(totalFiles / 20)); // Actualizar progreso cada 5%

	for (let i = 0; i < filePaths.length; i += batchSize) {
		const batch = filePaths.slice(i, i + batchSize);

		// Procesar lote
		for (const filePath of batch) {
			try {
				const result = await fileEntityMapper.createEntityFromFile(filePath, folderId);
				if (result) {
					stats.successful++;
				} else {
					stats.successful++;
				}
				stats.processed++;
			} catch (error) {
				console.error(`Error procesando archivo ${filePath}:`, error);
				stats.failed++;
				stats.errors.push({ file: filePath, error: (error as Error).message || 'Unknown error' });
				stats.processed++;
			}

			processedFiles++;

			// Emitir progreso cada cierto intervalo
			if (emitEvents && (processedFiles % progressUpdateInterval === 0 || processedFiles === totalFiles)) {
				const progress = Math.round((processedFiles / totalFiles) * 100);
				await emitProgress('folder:progress', {
					folderId,
					status: processedFiles < totalFiles ? 'processing' : 'completed',
					isProcessing: processedFiles < totalFiles,
					progress,
					totalFiles,
					filesProcessed: processedFiles,
					message:
						processedFiles === totalFiles
							? 'Indexación completada'
							: `Procesando archivos... ${processedFiles}/${totalFiles}`,
					phase: processedFiles === totalFiles ? 'complete' : 'processing',
					timestamp: Date.now(),
				});
			}
		}

		// Pequeña pausa entre lotes para evitar bloqueo
		if (i + batchSize < filePaths.length) {
			await new Promise((resolve) => setTimeout(resolve, 10));
		}
	}

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

	for (const directory of directories) {
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
				totalStats.successful++;
				totalStats.processed++;
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

				totalStats.successful++;
				totalStats.processed++;
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
			totalStats.totalFiles += subfolderStats.totalFiles;
			totalStats.processed += subfolderStats.processed;
			totalStats.successful += subfolderStats.successful;
			totalStats.failed += subfolderStats.failed;
			totalStats.errors.push(...subfolderStats.errors);
		} catch (error) {
			console.error(`Error procesando subcarpeta ${directory.path}:`, error);
			totalStats.failed++;
			totalStats.processed++;
			totalStats.errors.push({ file: directory.path, error: (error as Error).message || 'Unknown error' });
		}
	}

	return totalStats;
}

export async function updateAllFolderStats() {
	const foldersData = await db.query.folders.findMany({
		columns: { id: true },
	});

	for (const folder of foldersData) {
		await updateFolderStats(folder.id);
	}
}
