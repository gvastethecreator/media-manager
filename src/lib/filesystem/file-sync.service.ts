/**
 * @file Servicio para sincronización de archivos individuales con el sistema de archivos
 * @module lib/filesystem/file-sync.service
 * @description Maneja la sincronización de archivos individuales, detecta archivos eliminados y nuevos
 */

import { stat } from 'node:fs/promises';
import { eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { audios, documents, file3Ds, folders, images, videos } from '@/lib/drizzle/schema/index';
import { serverLogger } from '@/lib/logger/server-logger';
import { scanFolder } from './folder-scanner';
import { normalizePath } from './path-utils';

const syncLogger = serverLogger.withContext('FileSync');

/**
 * Resultado de la sincronización de archivos
 */
export interface FileSyncResult {
	/** Errores durante la sincronización */
	errors: string[];
	/** Archivos nuevos detectados en el sistema */
	newFiles: Array<{
		path: string;
		name: string;
		extension: string;
	}>;
	/** Archivos eliminados de la BD (ya no existen en el sistema) */
	removedFiles: Array<{
		id: string;
		path: string;
		name: string;
		type: 'image' | 'video' | 'audio' | 'document' | 'file3d';
	}>;
	/** Estadísticas del proceso */
	stats: {
		totalChecked: number;
		filesRemoved: number;
		newFilesFound: number;
		duration: number;
		startTime: Date;
		endTime: Date;
	};
}

/**
 * Opciones para la sincronización de archivos
 */
export interface FileSyncOptions {
	/** Solo simular, no hacer cambios reales */
	dryRun?: boolean;
	/** Tipos de entidades a sincronizar */
	entityTypes?: Array<'image' | 'video' | 'audio' | 'document' | 'file3d'>;
	/** Forzar sincronización incluso si hay errores */
	forceSync?: boolean;
	/** Incluir archivos ocultos */
	includeHidden?: boolean;
	/** Verificar solo archivos modificados desde esta fecha */
	modifiedSince?: Date;
	/** Callback para reportar progreso de archivos individuales */
	onProgress?: (processed: number, total: number, currentFile: string) => void | Promise<void>;
}

/**
 * Servicio principal de sincronización de archivos
 */
export class FileSyncService {
	private static instance: FileSyncService;

	private constructor() {}

	static getInstance(): FileSyncService {
		if (!FileSyncService.instance) {
			FileSyncService.instance = new FileSyncService();
		}
		return FileSyncService.instance;
	}

	/**
	 * Sincroniza archivos de una carpeta específica con el sistema de archivos
	 */
	async syncFolderFiles(folderId: string, options: FileSyncOptions = {}): Promise<FileSyncResult> {
		const startTime = new Date();
		syncLogger.info('🔄 Iniciando sincronización de archivos para carpeta:', { folderId, options });

		const {
			dryRun = false,
			includeHidden = false,
			entityTypes = ['image', 'video', 'audio', 'document', 'file3d'],
			forceSync = false,
		} = options;

		const result: FileSyncResult = {
			removedFiles: [],
			newFiles: [],
			errors: [],
			stats: {
				totalChecked: 0,
				filesRemoved: 0,
				newFilesFound: 0,
				duration: 0,
				startTime,
				endTime: new Date(),
			},
		};

		try {
			// Obtener la carpeta para acceder a su ruta
			const folder = await db.query.folders.findFirst({
				where: eq(folders.id, folderId),
				columns: { path: true, name: true },
			});

			if (!folder) {
				throw new Error(`Carpeta con ID ${folderId} no encontrada`);
			}

			syncLogger.info(`📂 Sincronizando carpeta: ${folder.name} (${folder.path})`);

			// 1. Obtener archivos actuales del sistema de archivos
			const scanResult = await scanFolder(folder.path, {
				recursive: true,
				includeHidden,
				limit: 0, // No folder item limit
				maxDepth: 99, // Allow deep recursive scanning
			});

			const filesystemPaths = new Set(scanResult.files.map((file) => normalizePath(file.path)));
			syncLogger.info(`💾 Archivos en sistema: ${filesystemPaths.size}`);

			// 2. Verificar archivos en la base de datos vs sistema de archivos
			const removedFiles = await this.identifyRemovedFiles(folderId, filesystemPaths, entityTypes);
			result.removedFiles = removedFiles;

			// 3. Identificar nuevos archivos
			const newFiles = await this.identifyNewFiles(folderId, scanResult.files, entityTypes);
			result.newFiles = newFiles;

			// 4. Ejecutar cambios si no es dry run
			if (!dryRun) {
				await this.executeFileSyncChanges(result, folderId, options.onProgress);
			}

			result.stats.totalChecked = filesystemPaths.size;
			result.stats.filesRemoved = result.removedFiles.length;
			result.stats.newFilesFound = result.newFiles.length;
			result.stats.endTime = new Date();
			result.stats.duration = result.stats.endTime.getTime() - startTime.getTime();

			syncLogger.info('✅ Sincronización de archivos completada:', {
				folderId,
				totalChecked: result.stats.totalChecked,
				removed: result.stats.filesRemoved,
				newFound: result.stats.newFilesFound,
				errors: result.errors.length,
				duration: `${result.stats.duration}ms`,
				dryRun,
			});

			return result;
		} catch (error) {
			const errorMsg = `Error durante sincronización de archivos: ${error instanceof Error ? error.message : String(error)}`;
			syncLogger.error(errorMsg);
			result.errors.push(errorMsg);
			result.stats.endTime = new Date();
			result.stats.duration = result.stats.endTime.getTime() - startTime.getTime();

			if (!forceSync) {
				throw new Error(errorMsg);
			}

			return result;
		}
	}

	/**
	 * Identifica archivos que deben ser eliminados de la BD (ya no existen en el sistema)
	 */
	private async identifyRemovedFiles(
		folderId: string,
		filesystemPaths: Set<string>,
		entityTypes: Array<'image' | 'video' | 'audio' | 'document' | 'file3d'>
	): Promise<FileSyncResult['removedFiles']> {
		const removedFiles: FileSyncResult['removedFiles'] = [];

		// Procesar todos los tipos de entidad en paralelo
		const typePromises = entityTypes.map(async (entityType) => {
			try {
				const dbFiles = await this.getEntityFiles(folderId, entityType);

				// Verificar cada archivo en paralelo
				const filePromises = dbFiles.map(async (dbFile) => {
					const normalizedPath = normalizePath(dbFile.path);

					// Si el archivo no existe en el sistema de archivos, verificar físicamente
					if (!filesystemPaths.has(normalizedPath)) {
						const physicallyExists = await this.checkFileExists(dbFile.path);

						if (!physicallyExists) {
							return {
								id: dbFile.id,
								path: dbFile.path,
								name: dbFile.name,
								type: entityType as FileSyncResult['removedFiles'][0]['type'],
							};
						}
					}
					return null;
				});

				const results = await Promise.all(filePromises);
				return results.filter((result): result is NonNullable<typeof result> => result !== null);
			} catch (error) {
				const errorMsg = `Error verificando archivos ${entityType}: ${error instanceof Error ? error.message : String(error)}`;
				syncLogger.error(errorMsg);
				return [];
			}
		});

		const allResults = await Promise.all(typePromises);

		for (const typeResults of allResults) {
			for (const result of typeResults) {
				removedFiles.push(result);
				syncLogger.info(`🗑️ Archivo marcado para eliminación: ${result.name} (${result.path})`);
			}
		}

		return removedFiles;
	}

	/**
	 * Identifica archivos nuevos en el sistema de archivos que no están en la BD
	 */
	private async identifyNewFiles(
		folderId: string,
		filesystemFiles: Array<{ path: string; name: string; extension: string }>,
		entityTypes: Array<'image' | 'video' | 'audio' | 'document' | 'file3d'>
	): Promise<FileSyncResult['newFiles']> {
		const newFiles: FileSyncResult['newFiles'] = [];

		// Obtener todas las rutas de archivos en la BD para esta carpeta en paralelo
		const allDbPaths = new Set<string>();

		const typePromises = entityTypes.map(async (entityType) => {
			try {
				const dbFiles = await this.getEntityFiles(folderId, entityType);
				return dbFiles.map((file) => normalizePath(file.path));
			} catch (error) {
				syncLogger.warn(`Error obteniendo archivos ${entityType}:`, error);
				return [];
			}
		});

		const allTypePaths = await Promise.all(typePromises);

		for (const typePaths of allTypePaths) {
			for (const path of typePaths) {
				allDbPaths.add(path);
			}
		}

		// Identificar archivos que están en el sistema pero no en la BD
		for (const fsFile of filesystemFiles) {
			const normalizedPath = normalizePath(fsFile.path);

			if (!allDbPaths.has(normalizedPath)) {
				newFiles.push({
					path: fsFile.path,
					name: fsFile.name,
					extension: fsFile.extension,
				});
				syncLogger.info(`➕ Archivo nuevo detectado: ${fsFile.name} (${fsFile.path})`);
			}
		}

		return newFiles;
	}

	/**
	 * Obtiene archivos de la BD para un tipo de entidad específico
	 */
	private async getEntityFiles(
		folderId: string,
		entityType: 'image' | 'video' | 'audio' | 'document' | 'file3d'
	): Promise<Array<{ id: string; path: string; name: string }>> {
		switch (entityType) {
			case 'image':
				return await db
					.select({ id: images.id, path: images.path, name: images.name })
					.from(images)
					.where(eq(images.folderId, folderId));

			case 'video':
				return await db
					.select({ id: videos.id, path: videos.path, name: videos.name })
					.from(videos)
					.where(eq(videos.folderId, folderId));

			case 'audio':
				return await db
					.select({ id: audios.id, path: audios.path, name: audios.name })
					.from(audios)
					.where(eq(audios.folderId, folderId));

			case 'document':
				return await db
					.select({ id: documents.id, path: documents.path, name: documents.name })
					.from(documents)
					.where(eq(documents.folderId, folderId));

			case 'file3d':
				return await db
					.select({ id: file3Ds.id, path: file3Ds.path, name: file3Ds.name })
					.from(file3Ds)
					.where(eq(file3Ds.folderId, folderId));

			default:
				return [];
		}
	}

	/**
	 * Verifica si un archivo existe físicamente en el sistema
	 */
	private async checkFileExists(filePath: string): Promise<boolean> {
		try {
			const stats = await stat(filePath);
			return stats.isFile();
		} catch {
			return false;
		}
	}

	/**
	 * Ejecuta los cambios de sincronización (eliminar archivos que ya no existen)
	 */
	private async executeFileSyncChanges(
		result: FileSyncResult,
		folderId: string,
		onProgress?: (processed: number, total: number, currentFile: string) => void | Promise<void>
	): Promise<void> {
		// 1. Procesar archivos nuevos (crear entidades con metadata)
		if (result.newFiles.length > 0) {
			await this.processNewFiles(result, folderId, onProgress);
		}

		// 2. Eliminar archivos que ya no existen
		if (result.removedFiles.length > 0) {
			await this.removeDeletedFiles(result);
		}
	}

	private async processNewFiles(
		result: FileSyncResult,
		folderId: string,
		onProgress?: (processed: number, total: number, currentFile: string) => void | Promise<void>
	): Promise<void> {
		if (result.newFiles.length === 0) {
			return;
		}

		syncLogger.info(`➕ Procesando ${result.newFiles.length} archivos nuevos con extracción de metadata`);

		try {
			const { FileEntityMapperService } = await import('@/services/file-entity-mapper/file-entity-mapper.service');
			const mapper = FileEntityMapperService.getInstance();

			// Procesar archivos nuevos con extracción de metadata completa
			const filePaths = result.newFiles.map((f) => f.path);
			const processingStats = await mapper.processFiles(filePaths, folderId, {
				onProgress,
			});

			syncLogger.info('✅ Procesamiento de archivos nuevos completado:', {
				total: processingStats.totalFiles,
				exitosos: processingStats.successful,
				fallidos: processingStats.failed,
				errores: processingStats.errors.length,
			});

			// Log primeros 5 errores para depuración
			if (processingStats.errors.length > 0) {
				syncLogger.error('❌ ERRORES DETALLADOS EN PROCESAMIENTO:');
				processingStats.errors.slice(0, 5).forEach((err, idx) => {
					syncLogger.error(`  [${idx + 1}] ${err.file}`);
					syncLogger.error(`      Error: ${err.error}`);
				});
				if (processingStats.errors.length > 5) {
					syncLogger.error(`  ... y ${processingStats.errors.length - 5} errores más`);
				}
			}

			// Agregar errores al resultado de sincronización
			if (processingStats.errors.length > 0) {
				result.errors.push(...processingStats.errors.map((e) => `${e.file}: ${e.error}`));
			}
		} catch (error) {
			const errorMsg = `Error procesando archivos nuevos: ${error instanceof Error ? error.message : String(error)}`;
			syncLogger.error(errorMsg);
			result.errors.push(errorMsg);
		}
	}

	private async removeDeletedFiles(result: FileSyncResult): Promise<void> {
		syncLogger.info(`🗑️ Eliminando ${result.removedFiles.length} archivos de la BD`);

		// Agrupar por tipo de entidad para eliminar en lotes
		const filesByType = result.removedFiles.reduce(
			(acc, file) => {
				if (!acc[file.type]) {
					acc[file.type] = [];
				}
				acc[file.type].push(file.id);
				return acc;
			},
			{} as Record<string, string[]>
		);

		// Eliminar archivos por tipo en paralelo
		const deletePromises = Object.entries(filesByType).map(async ([entityType, fileIds]) => {
			try {
				await this.deleteEntityFiles(entityType as any, fileIds);
				syncLogger.info(`✅ Eliminados ${fileIds.length} archivos de tipo ${entityType}`);
			} catch (error) {
				const errorMsg = `Error eliminando archivos ${entityType}: ${error instanceof Error ? error.message : String(error)}`;
				syncLogger.error(errorMsg);
				result.errors.push(errorMsg);
			}
		});

		await Promise.all(deletePromises);
	}

	/**
	 * Elimina archivos de la BD por tipo de entidad
	 */
	private async deleteEntityFiles(
		entityType: 'image' | 'video' | 'audio' | 'document' | 'file3d',
		fileIds: string[]
	): Promise<void> {
		if (fileIds.length === 0) {
			return;
		}

		switch (entityType) {
			case 'image':
				await db.delete(images).where(inArray(images.id, fileIds));
				break;
			case 'video':
				await db.delete(videos).where(inArray(videos.id, fileIds));
				break;
			case 'audio':
				await db.delete(audios).where(inArray(audios.id, fileIds));
				break;
			case 'document':
				await db.delete(documents).where(inArray(documents.id, fileIds));
				break;
			case 'file3d':
				await db.delete(file3Ds).where(inArray(file3Ds.id, fileIds));
				break;
			default:
				throw new Error(`Tipo de entidad no soportado: ${entityType}`);
		}
	}

	/**
	 * Verifica el estado de sincronización sin hacer cambios
	 */
	async checkSyncStatus(folderId: string, options: Omit<FileSyncOptions, 'dryRun'> = {}): Promise<FileSyncResult> {
		return await this.syncFolderFiles(folderId, { ...options, dryRun: true });
	}

	/**
	 * Sincroniza archivos de múltiples carpetas
	 */
	async syncMultipleFolders(
		folderIds: string[],
		options: FileSyncOptions = {}
	): Promise<Record<string, FileSyncResult>> {
		const results: Record<string, FileSyncResult> = {};

		// Procesar carpetas en paralelo para mejor rendimiento
		const folderPromises = folderIds.map(async (folderId) => {
			try {
				const result = await this.syncFolderFiles(folderId, options);
				return { folderId, result };
			} catch (error) {
				syncLogger.error(`Error sincronizando carpeta ${folderId}:`, error);
				return {
					folderId,
					result: {
						removedFiles: [],
						newFiles: [],
						errors: [error instanceof Error ? error.message : String(error)],
						stats: {
							totalChecked: 0,
							filesRemoved: 0,
							newFilesFound: 0,
							duration: 0,
							startTime: new Date(),
							endTime: new Date(),
						},
					} as FileSyncResult,
				};
			}
		});

		const allResults = await Promise.all(folderPromises);

		for (const { folderId, result } of allResults) {
			results[folderId] = result;
		}

		return results;
	}
}

/**
 * Instancia singleton del servicio
 */
export const fileSyncService = FileSyncService.getInstance();

/**
 * Funciones de conveniencia para uso directo
 */
export const syncFolderFiles = (folderId: string, options?: FileSyncOptions) =>
	fileSyncService.syncFolderFiles(folderId, options);

export const checkFileSyncStatus = (folderId: string, options?: Omit<FileSyncOptions, 'dryRun'>) =>
	fileSyncService.checkSyncStatus(folderId, options);

export const syncMultipleFolders = (folderIds: string[], options?: FileSyncOptions) =>
	fileSyncService.syncMultipleFolders(folderIds, options);
