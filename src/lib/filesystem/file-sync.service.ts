/**
 * @file Servicio para sincronización de archivos individuales con el sistema de archivos
 * @module lib/filesystem/file-sync.service
 * @description Maneja la sincronización de archivos individuales, detecta archivos eliminados y nuevos
 */

import { stat } from 'node:fs/promises';
import { isAbsolute, relative } from 'node:path';
import { eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import {
	assets,
	audios,
	documents,
	file3Ds,
	folders,
	images,
	jsonFiles,
	sourceFiles,
	videos,
} from '@/lib/drizzle/schema/index';
import { serverLogger } from '@/lib/logger/server-logger';
import type { AuthorizedRootRegistry, ResolvedAuthorizedPath } from '@/server/security/authorized-roots';
import { isPathInsideDirectory } from './path-containment';
import { scanFolder } from './folder-scanner';
import { normalizePath } from './path-utils';

const syncLogger = serverLogger.withContext('FileSync');

type SyncEntityType = 'image' | 'video' | 'audio' | 'document' | 'json' | 'file3d';

interface ResolvedEntityFile {
	assetId: string | null;
	id: string;
	name: string;
	path: string;
}

interface CanonicalSyncSource {
	assetId: string;
	assetType: string;
	folderId: string | null;
	relativePath: string;
	rootId: string;
	sourceAssetId: string;
}

type ResolvedEntityFiles = Map<SyncEntityType, ResolvedEntityFile[]>;

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
		type: 'image' | 'video' | 'audio' | 'document' | 'json' | 'file3d';
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
	/** Registro de raíces que autoriza toda lectura y resolución física. */
	authorizedRootRegistry?: AuthorizedRootRegistry;
	/** Solo simular, no hacer cambios reales */
	dryRun?: boolean;
	/** Tipos de entidades a sincronizar */
	entityTypes?: SyncEntityType[];
	/** Forzar sincronización incluso si hay errores */
	forceSync?: boolean;
	/** Incluir archivos ocultos */
	includeHidden?: boolean;
	/** Incluir archivos de subcarpetas. Los reindexados estructurados sincronizan cada Folder por separado. */
	recursive?: boolean;
	/** Profundidad máxima cuando recursive está habilitado. */
	maxDepth?: number;
	/** Verificar solo archivos modificados desde esta fecha */
	modifiedSince?: Date;
	/** Callback para reportar progreso de archivos individuales */
	onProgress?: (processed: number, total: number, currentFile: string) => void | Promise<void>;
}

export interface FileSyncDependencies {
	afterFolderAuthorization?: (folderId: string) => Promise<void>;
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
	async syncFolderFiles(
		folderId: string,
		options: FileSyncOptions = {},
		dependencies: FileSyncDependencies = {}
	): Promise<FileSyncResult> {
		const startTime = new Date();
		syncLogger.info('🔄 Iniciando sincronización de archivos para carpeta:', { folderId });

		const {
			dryRun = false,
			includeHidden = false,
			entityTypes = ['image', 'video', 'audio', 'document', 'json', 'file3d'],
			forceSync = false,
			authorizedRootRegistry,
			recursive = true,
			maxDepth = 99,
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
			if (!authorizedRootRegistry) {
				throw new Error('La sincronización requiere un registro explícito de media roots autorizados.');
			}

			// Obtener la carpeta para acceder a su ruta
			const folder = await db.query.folders.findFirst({
				where: eq(folders.id, folderId),
				columns: { path: true, name: true },
			});

			if (!folder) {
				throw new Error(`Carpeta con ID ${folderId} no encontrada`);
			}

			let authorizedFolder = await authorizedRootRegistry.authorizeAbsolutePath(folder.path, 'read');
			authorizedFolder = await authorizedRootRegistry.authorizeAbsolutePath(folder.path, 'index');
			syncLogger.info('📂 Sincronizando carpeta autorizada', {
				folderId,
				rootId: authorizedFolder.rootId,
				relativePath: authorizedFolder.relativePath,
			});
			await dependencies.afterFolderAuthorization?.(folderId);
			authorizedFolder = await authorizedRootRegistry.authorizeAbsolutePath(folder.path, 'read');
			authorizedFolder = await authorizedRootRegistry.authorizeAbsolutePath(folder.path, 'index');

			// 1. Obtener archivos actuales del sistema de archivos
			const scanResult = await scanFolder(authorizedFolder.absolutePath, {
				recursive,
				includeHidden,
				limit: 0, // No folder item limit
				maxDepth,
			});
			if (scanResult.error) {
				throw new Error(`No se pudo escanear el Folder autorizado ${folderId}.`);
			}

			const filesystemPaths = new Set(scanResult.files.map((file) => normalizePath(file.path)));
			syncLogger.info(`💾 Archivos en sistema: ${filesystemPaths.size}`);
			const entityFiles = new Map(
				await Promise.all(
					entityTypes.map(
						async (entityType) =>
							[
								entityType,
								await this.getEntityFiles(folderId, entityType, authorizedRootRegistry, authorizedFolder),
							] as const
					)
				)
			) as ResolvedEntityFiles;

			// 2. Verificar archivos en la base de datos vs sistema de archivos
			const removedFiles = await this.identifyRemovedFiles(filesystemPaths, entityTypes, entityFiles);
			result.removedFiles = removedFiles;

			// 3. Identificar nuevos archivos
			const newFiles = await this.identifyNewFiles(scanResult.files, entityTypes, entityFiles);
			result.newFiles = newFiles;

			// 4. Ejecutar cambios si no es dry run
			if (!dryRun) {
				await this.restoreObservedCanonicalMedia(folderId, filesystemPaths, entityTypes, entityFiles);
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
		filesystemPaths: Set<string>,
		entityTypes: SyncEntityType[],
		entityFiles: ResolvedEntityFiles
	): Promise<FileSyncResult['removedFiles']> {
		const removedFiles: FileSyncResult['removedFiles'] = [];

		const typePromises = entityTypes.map(async (entityType) => {
			const dbFiles = entityFiles.get(entityType) ?? [];
			const filePromises = dbFiles.map(async (dbFile) => {
				const normalizedPath = normalizePath(dbFile.path);
				if (!filesystemPaths.has(normalizedPath)) {
					const physicallyExists = await this.checkFileExists(dbFile.path);
					if (!physicallyExists) {
						return {
							id: dbFile.id,
							path: dbFile.path,
							name: dbFile.name,
							type: entityType,
						};
					}
				}
				return null;
			});

			const results = await Promise.all(filePromises);
			return results.filter((result): result is NonNullable<typeof result> => result !== null);
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
		filesystemFiles: Array<{ path: string; name: string; extension: string }>,
		entityTypes: SyncEntityType[],
		entityFiles: ResolvedEntityFiles
	): Promise<FileSyncResult['newFiles']> {
		const newFiles: FileSyncResult['newFiles'] = [];

		// Obtener todas las rutas de archivos en la BD para esta carpeta en paralelo
		const allDbPaths = new Set<string>();

		const allTypePaths = entityTypes.map((entityType) =>
			(entityFiles.get(entityType) ?? []).map((file) => normalizePath(file.path))
		);

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
		entityType: SyncEntityType,
		registry: AuthorizedRootRegistry,
		authorizedFolder: ResolvedAuthorizedPath
	): Promise<ResolvedEntityFile[]> {
		let legacyRows: Array<{ assetId: string | null; id: string; path: string; name: string }>;
		switch (entityType) {
			case 'image':
				legacyRows = await db
					.select({ assetId: images.assetId, id: images.id, path: images.path, name: images.name })
					.from(images)
					.where(eq(images.folderId, folderId));
				break;

			case 'video':
				legacyRows = await db
					.select({ assetId: videos.assetId, id: videos.id, path: videos.path, name: videos.name })
					.from(videos)
					.where(eq(videos.folderId, folderId));
				break;

			case 'audio':
				legacyRows = await db
					.select({ assetId: audios.assetId, id: audios.id, path: audios.path, name: audios.name })
					.from(audios)
					.where(eq(audios.folderId, folderId));
				break;

			case 'document':
				legacyRows = await db
					.select({ assetId: documents.assetId, id: documents.id, path: documents.path, name: documents.name })
					.from(documents)
					.where(eq(documents.folderId, folderId));
				break;

			case 'json':
				legacyRows = await db
					.select({ assetId: jsonFiles.assetId, id: jsonFiles.id, path: jsonFiles.path, name: jsonFiles.name })
					.from(jsonFiles)
					.where(eq(jsonFiles.folderId, folderId));
				break;

			case 'file3d':
				legacyRows = await db
					.select({ assetId: file3Ds.assetId, id: file3Ds.id, path: file3Ds.path, name: file3Ds.name })
					.from(file3Ds)
					.where(eq(file3Ds.folderId, folderId));
				break;
		}

		const canonicalAssetIds = legacyRows.flatMap((row) => (row.assetId ? [row.assetId] : []));
		const canonicalSources: CanonicalSyncSource[] =
			canonicalAssetIds.length === 0
				? []
				: await db
						.select({
							assetId: assets.id,
							assetType: assets.assetType,
							folderId: sourceFiles.folderId,
							relativePath: sourceFiles.relativePath,
							rootId: sourceFiles.rootId,
							sourceAssetId: sourceFiles.assetId,
						})
						.from(assets)
						.innerJoin(sourceFiles, eq(sourceFiles.id, assets.primarySourceFileId))
						.where(inArray(assets.id, canonicalAssetIds));
		const sourceByAssetId = new Map(canonicalSources.map((source) => [source.assetId, source]));

		return Promise.all(
			legacyRows.map(async (row) => {
				if (!row.assetId) {
					const legacyRelativePath = relative(authorizedFolder.absolutePath, row.path);
					if (
						legacyRelativePath === '..' ||
						legacyRelativePath.startsWith(`..\\`) ||
						legacyRelativePath.startsWith('../') ||
						isAbsolute(legacyRelativePath)
					) {
						throw new Error(`La proyección legacy ${entityType}:${row.id} queda fuera del Folder autorizado.`);
					}
					const relativePath = [authorizedFolder.relativePath, legacyRelativePath.replaceAll('\\', '/')]
						.filter(Boolean)
						.join('/');
					const resolved = await this.resolveSyncReference(registry, {
						relativePath,
						rootId: authorizedFolder.rootId,
					});
					return { ...row, path: resolved.absolutePath };
				}

				if (row.assetId !== row.id) {
					throw new Error(`Identidad canónica inválida para ${entityType}:${row.id}.`);
				}
				const source = sourceByAssetId.get(row.assetId);
				if (
					!source ||
					source.assetType !== entityType ||
					source.sourceAssetId !== row.assetId ||
					source.folderId !== folderId
				) {
					throw new Error(`SourceFile primario inconsistente para ${entityType}:${row.id}.`);
				}
				const resolved = await this.resolveSyncReference(registry, {
					relativePath: source.relativePath,
					rootId: source.rootId,
				});
				if (!isPathInsideDirectory(authorizedFolder.absolutePath, resolved.absolutePath)) {
					throw new Error(`SourceFile primario fuera del Folder autorizado para ${entityType}:${row.id}.`);
				}
				return { ...row, path: resolved.absolutePath };
			})
		);
	}

	private async resolveSyncReference(
		registry: AuthorizedRootRegistry,
		reference: { relativePath: string; rootId: string }
	): Promise<ResolvedAuthorizedPath> {
		await registry.resolve(reference, 'read', 'create');
		return registry.resolve(reference, 'index', 'create');
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

	private async restoreObservedCanonicalMedia(
		folderId: string,
		filesystemPaths: Set<string>,
		entityTypes: SyncEntityType[],
		entityFiles: ResolvedEntityFiles
	): Promise<void> {
		const rows = entityTypes.flatMap((entityType) => entityFiles.get(entityType) ?? []);
		const assetIds = rows.flatMap((row) =>
			row.assetId && filesystemPaths.has(normalizePath(row.path)) ? [row.assetId] : []
		);
		if (assetIds.length === 0) return;

		const observedPrimarySources: Array<{ assetId: string; folderId: string | null; id: string }> = await db
			.select({ assetId: sourceFiles.assetId, folderId: sourceFiles.folderId, id: sourceFiles.id })
			.from(assets)
			.innerJoin(sourceFiles, eq(sourceFiles.id, assets.primarySourceFileId))
			.where(inArray(assets.id, assetIds));
		const sourceIds = observedPrimarySources.flatMap((source) =>
			source.folderId === folderId && assetIds.includes(source.assetId) ? [source.id] : []
		);
		if (sourceIds.length === 0) return;

		const now = new Date();
		await db
			.update(sourceFiles)
			.set({ availability: 'available', observedAt: now, updatedAt: now })
			.where(inArray(sourceFiles.id, sourceIds));
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
		syncLogger.info(`🔄 Reconciliando ${result.removedFiles.length} archivos ausentes con la BD`);

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
				syncLogger.info(`✅ Reconciliados ${fileIds.length} archivos ausentes de tipo ${entityType}`);
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
		entityType: 'image' | 'video' | 'audio' | 'document' | 'json' | 'file3d',
		fileIds: string[]
	): Promise<void> {
		if (fileIds.length === 0) {
			return;
		}

		let rows: Array<{ assetId: string | null; id: string }>;
		switch (entityType) {
			case 'image':
				rows = await db
					.select({ assetId: images.assetId, id: images.id })
					.from(images)
					.where(inArray(images.id, fileIds));
				break;
			case 'video':
				rows = await db
					.select({ assetId: videos.assetId, id: videos.id })
					.from(videos)
					.where(inArray(videos.id, fileIds));
				break;
			case 'audio':
				rows = await db
					.select({ assetId: audios.assetId, id: audios.id })
					.from(audios)
					.where(inArray(audios.id, fileIds));
				break;
			case 'document':
				rows = await db
					.select({ assetId: documents.assetId, id: documents.id })
					.from(documents)
					.where(inArray(documents.id, fileIds));
				break;
			case 'json':
				rows = await db
					.select({ assetId: jsonFiles.assetId, id: jsonFiles.id })
					.from(jsonFiles)
					.where(inArray(jsonFiles.id, fileIds));
				break;
			case 'file3d':
				rows = await db
					.select({ assetId: file3Ds.assetId, id: file3Ds.id })
					.from(file3Ds)
					.where(inArray(file3Ds.id, fileIds));
				break;
		}

		const canonicalAssetIds = rows.flatMap((row) => (row.assetId ? [row.assetId] : []));
		if (canonicalAssetIds.length > 0) {
			const primarySources: Array<{ id: string }> = await db
				.select({ id: assets.primarySourceFileId })
				.from(assets)
				.where(inArray(assets.id, canonicalAssetIds));
			await db
				.update(sourceFiles)
				.set({ availability: 'missing', observedAt: new Date(), updatedAt: new Date() })
				.where(
					inArray(
						sourceFiles.id,
						primarySources.map((source) => source.id)
					)
				);
		}
		const legacyIds = rows.flatMap((row) => (row.assetId ? [] : [row.id]));
		if (legacyIds.length === 0) return;

		switch (entityType) {
			case 'image': {
				await db.delete(images).where(inArray(images.id, legacyIds));
				break;
			}
			case 'video':
				await db.delete(videos).where(inArray(videos.id, legacyIds));
				break;
			case 'audio':
				await db.delete(audios).where(inArray(audios.id, legacyIds));
				break;
			case 'document':
				await db.delete(documents).where(inArray(documents.id, legacyIds));
				break;
			case 'json':
				await db.delete(jsonFiles).where(inArray(jsonFiles.id, legacyIds));
				break;
			case 'file3d':
				await db.delete(file3Ds).where(inArray(file3Ds.id, legacyIds));
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
