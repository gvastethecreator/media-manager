/**
 * @file Sincronización automática de carpetas con el sistema de archivos
 * @module lib/filesystem/folder-sync
 * @description Sincroniza las carpetas de la base de datos con las carpetas reales del sistema de archivos
 */

import { randomUUID } from 'crypto';
import { eq, inArray } from 'drizzle-orm';
import path from 'path';
import { db } from '@/lib/drizzle';
import { folders } from '@/lib/drizzle/schema/index';
import { serverLogger } from '@/lib/logger/server-logger';
import { folderExists, scanFolder } from './folder-scanner';
import { normalizePath } from './path-utils';

// Logger específico para sincronización de carpetas
const syncLogger = serverLogger.withContext('FolderSync');

/**
 * Resultado de la sincronización de carpetas
 */
export interface FolderSyncResult {
	added: Array<{ id: string; path: string; name: string }>; // Carpetas agregadas
	removed: Array<{ id: string; path: string; name: string }>; // Carpetas eliminadas
	updated: Array<{ id: string; oldPath: string; newPath: string }>; // Carpetas actualizadas
	errors: string[]; // Errores durante la sincronización
	stats: {
		totalProcessed: number;
		duration: number;
		startTime: Date;
		endTime: Date;
	};
}

/**
 * Opciones para la sincronización de carpetas
 */
export interface FolderSyncOptions {
	dryRun?: boolean; // Solo simular, no hacer cambios reales
	maxDepth?: number; // Profundidad máxima de escaneo
	includeHidden?: boolean; // Incluir carpetas ocultas
	ignorePatterns?: string[]; // Patrones de carpetas a ignorar
	forceSync?: boolean; // Forzar sincronización incluso si hay errores
}

/**
 * Patrones de carpetas a ignorar por defecto
 */
const DEFAULT_IGNORE_PATTERNS = [
	'.git',
	'.svn',
	'.hg',
	'node_modules',
	'.next',
	'.nuxt',
	'dist',
	'build',
	'.cache',
	'tmp',
	'temp',
	'.DS_Store',
	'Thumbs.db',
	'$RECYCLE.BIN',
	'.Trash-*',
];

/**
 * Sincroniza las carpetas de la base de datos con el sistema de archivos
 * @param options Opciones de sincronización
 * @returns Resultado de la sincronización
 */
export async function syncFoldersWithFileSystem(options: FolderSyncOptions = {}): Promise<FolderSyncResult> {
	const startTime = new Date();
	syncLogger.info('🔄 Iniciando sincronización de carpetas con sistema de archivos', { options });

	const {
		dryRun = false,
		maxDepth = 10,
		includeHidden = false,
		ignorePatterns = DEFAULT_IGNORE_PATTERNS,
		forceSync = false,
	} = options;

	const result: FolderSyncResult = {
		added: [],
		removed: [],
		updated: [],
		errors: [],
		stats: {
			totalProcessed: 0,
			duration: 0,
			startTime,
			endTime: new Date(),
		},
	};

	try {
		// 1. Obtener todas las carpetas de la base de datos
		const dbFolders = await db
			.select({
				id: folders.id,
				name: folders.name,
				path: folders.path,
				parentId: folders.parentId,
			})
			.from(folders);

		syncLogger.info(`📊 Carpetas en BD: ${dbFolders.length}`);

		// 2. Obtener carpetas raíz (sin parentId) para escanear desde ahí
		const rootFolders = dbFolders.filter((f) => !f.parentId);
		syncLogger.info(`🌳 Carpetas raíz encontradas: ${rootFolders.length}`);

		// 3. Escanear sistema de archivos desde cada carpeta raíz
		const fileSystemPaths = new Set<string>();
		for (const rootFolder of rootFolders) {
			try {
				await scanFileSystemFromRoot(rootFolder.path, fileSystemPaths, {
					maxDepth,
					includeHidden,
					ignorePatterns,
				});
			} catch (error) {
				const errorMsg = `Error escaneando desde raíz ${rootFolder.path}: ${error instanceof Error ? error.message : String(error)}`;
				syncLogger.error(errorMsg);
				result.errors.push(errorMsg);
				if (!forceSync) {
					throw new Error(errorMsg);
				}
			}
		}

		syncLogger.info(`💾 Carpetas en sistema de archivos: ${fileSystemPaths.size}`);

		// 4. Identificar carpetas a eliminar (en BD pero no en sistema de archivos)
		const foldersToRemove = await identifyFoldersToRemove(dbFolders, fileSystemPaths);
		result.removed = foldersToRemove;

		// 5. Identificar carpetas a agregar (en sistema de archivos pero no en BD)
		const foldersToAdd = await identifyFoldersToAdd(dbFolders, fileSystemPaths);
		result.added = foldersToAdd;

		// 6. Ejecutar cambios si no es dry run
		if (!dryRun) {
			await executeSyncChanges(result);
		}

		result.stats.totalProcessed = result.added.length + result.removed.length + result.updated.length;
		result.stats.endTime = new Date();
		result.stats.duration = result.stats.endTime.getTime() - startTime.getTime();

		syncLogger.info('✅ Sincronización completada', {
			added: result.added.length,
			removed: result.removed.length,
			updated: result.updated.length,
			errors: result.errors.length,
			duration: `${result.stats.duration}ms`,
			dryRun,
		});

		return result;
	} catch (error) {
		const errorMsg = `Error durante sincronización: ${error instanceof Error ? error.message : String(error)}`;
		syncLogger.error(errorMsg);
		result.errors.push(errorMsg);
		result.stats.endTime = new Date();
		result.stats.duration = result.stats.endTime.getTime() - startTime.getTime();
		return result;
	}
}

/**
 * Escanea el sistema de archivos desde una carpeta raíz
 */
async function scanFileSystemFromRoot(
	rootPath: string,
	fileSystemPaths: Set<string>,
	options: {
		maxDepth: number;
		includeHidden: boolean;
		ignorePatterns: string[];
	}
): Promise<void> {
	const normalizedRootPath = normalizePath(rootPath);

	// Verificar que la carpeta raíz existe
	if (!(await folderExists(normalizedRootPath))) {
		syncLogger.warn(`⚠️ Carpeta raíz no existe: ${normalizedRootPath}`);
		return;
	}

	// Agregar la carpeta raíz
	fileSystemPaths.add(normalizedRootPath);

	// Escanear recursivamente
	try {
		const scanResult = await scanFolder(normalizedRootPath, {
			recursive: true,
			maxDepth: options.maxDepth,
			includeHidden: options.includeHidden,
		});

		// Agregar todas las subcarpetas encontradas
		for (const directory of scanResult.directories) {
			const normalizedPath = normalizePath(directory.path);

			// Verificar si la carpeta debe ser ignorada
			if (shouldIgnoreFolder(directory.name, options.ignorePatterns)) {
				continue;
			}

			fileSystemPaths.add(normalizedPath);
		}
	} catch (error) {
		syncLogger.error(`Error escaneando ${normalizedRootPath}:`, error);
		throw error;
	}
}

/**
 * Verifica si una carpeta debe ser ignorada según los patrones
 */
function shouldIgnoreFolder(folderName: string, ignorePatterns: string[]): boolean {
	return ignorePatterns.some((pattern) => {
		// Soporte para patrones simples (wildcards básicos)
		if (pattern.includes('*')) {
			const regex = new RegExp(pattern.replace(/\*/g, '.*'));
			return regex.test(folderName);
		}
		return folderName === pattern || folderName.startsWith(pattern);
	});
}

/**
 * Identifica carpetas que deben ser eliminadas de la BD
 */
async function identifyFoldersToRemove(
	dbFolders: Array<{ id: string; name: string; path: string; parentId: string | null }>,
	fileSystemPaths: Set<string>
): Promise<Array<{ id: string; path: string; name: string }>> {
	const foldersToRemove: Array<{ id: string; path: string; name: string }> = [];

	for (const dbFolder of dbFolders) {
		const normalizedPath = normalizePath(dbFolder.path);

		// Si la carpeta no existe en el sistema de archivos, marcarla para eliminación
		if (!fileSystemPaths.has(normalizedPath)) {
			// Verificar una vez más que realmente no existe
			if (!(await folderExists(normalizedPath))) {
				foldersToRemove.push({
					id: dbFolder.id,
					path: dbFolder.path,
					name: dbFolder.name,
				});
				syncLogger.info(`🗑️ Carpeta marcada para eliminación: ${dbFolder.name} (${dbFolder.path})`);
			}
		}
	}

	return foldersToRemove;
}

/**
 * Identifica carpetas que deben ser agregadas a la BD
 */
async function identifyFoldersToAdd(
	dbFolders: Array<{ id: string; name: string; path: string; parentId: string | null }>,
	fileSystemPaths: Set<string>
): Promise<Array<{ id: string; path: string; name: string }>> {
	const foldersToAdd: Array<{ id: string; path: string; name: string }> = [];
	const dbPaths = new Set(dbFolders.map((f) => normalizePath(f.path)));

	for (const fsPath of fileSystemPaths) {
		// Si la carpeta existe en el sistema de archivos pero no en la BD
		if (!dbPaths.has(fsPath)) {
			const folderName = path.basename(fsPath);
			const newId = randomUUID();

			foldersToAdd.push({
				id: newId,
				path: fsPath,
				name: folderName,
			});

			syncLogger.info(`➕ Carpeta marcada para agregar: ${folderName} (${fsPath})`);
		}
	}

	return foldersToAdd;
}

/**
 * Ejecuta los cambios de sincronización en la base de datos
 */
async function executeSyncChanges(result: FolderSyncResult): Promise<void> {
	try {
		// 1. Eliminar carpetas que ya no existen
		if (result.removed.length > 0) {
			const idsToRemove = result.removed.map((f) => f.id);

			syncLogger.info(`🗑️ Eliminando ${result.removed.length} carpetas de la BD`);

			// Eliminar en orden inverso para manejar dependencias padre-hijo
			await db.delete(folders).where(inArray(folders.id, idsToRemove));

			syncLogger.info(`✅ Eliminadas ${result.removed.length} carpetas`);
		}

		// 2. Agregar nuevas carpetas
		if (result.added.length > 0) {
			syncLogger.info(`➕ Agregando ${result.added.length} carpetas a la BD`);

			// Ordenar por profundidad para crear padres antes que hijos
			const sortedToAdd = result.added.sort((a, b) => {
				const depthA = a.path.split(path.sep).length;
				const depthB = b.path.split(path.sep).length;
				return depthA - depthB;
			});

			for (const folder of sortedToAdd) {
				try {
					// Determinar carpeta padre
					const parentPath = path.dirname(folder.path);
					const parentFolder = await db
						.select({ id: folders.id })
						.from(folders)
						.where(eq(folders.path, parentPath))
						.limit(1);

					const parentId = parentFolder.length > 0 ? parentFolder[0].id : null;

					// Insertar nueva carpeta
					await db.insert(folders).values({
						id: folder.id,
						name: folder.name,
						path: folder.path,
						parentId: parentId,
						totalFiles: 0,
						totalSize: 0,
						lastIndexed: new Date(),
						autoReindex: false,
					});

					syncLogger.info(`✅ Carpeta agregada: ${folder.name}`);
				} catch (error) {
					const errorMsg = `Error agregando carpeta ${folder.name}: ${error instanceof Error ? error.message : String(error)}`;
					syncLogger.error(errorMsg);
					result.errors.push(errorMsg);
				}
			}
		}
	} catch (error) {
		const errorMsg = `Error ejecutando cambios de sincronización: ${error instanceof Error ? error.message : String(error)}`;
		syncLogger.error(errorMsg);
		result.errors.push(errorMsg);
		throw error;
	}
}

/**
 * Sincroniza una carpeta específica y sus subcarpetas
 * @param folderId ID de la carpeta a sincronizar
 * @param options Opciones de sincronización
 * @returns Resultado de la sincronización
 */
export async function syncSpecificFolder(folderId: string, options: FolderSyncOptions = {}): Promise<FolderSyncResult> {
	syncLogger.info(`🔄 Sincronizando carpeta específica: ${folderId}`);

	// Obtener la carpeta específica
	const folder = await db
		.select({
			id: folders.id,
			name: folders.name,
			path: folders.path,
		})
		.from(folders)
		.where(eq(folders.id, folderId))
		.limit(1);

	if (folder.length === 0) {
		throw new Error(`Carpeta con ID ${folderId} no encontrada`);
	}

	// Verificar si la carpeta aún existe en el sistema de archivos
	const folderPath = folder[0].path;
	if (!(await folderExists(folderPath))) {
		// La carpeta no existe, marcarla para eliminación
		return {
			added: [],
			removed: [{ id: folder[0].id, path: folder[0].path, name: folder[0].name }],
			updated: [],
			errors: [],
			stats: {
				totalProcessed: 1,
				duration: 0,
				startTime: new Date(),
				endTime: new Date(),
			},
		};
	}

	// Si existe, realizar sincronización completa desde esta carpeta
	return await syncFoldersWithFileSystem(options);
}

/**
 * Verifica el estado de sincronización sin hacer cambios
 * @param options Opciones de verificación
 * @returns Resultado de la verificación (dry run)
 */
export async function checkSyncStatus(options: Omit<FolderSyncOptions, 'dryRun'> = {}): Promise<FolderSyncResult> {
	return await syncFoldersWithFileSystem({ ...options, dryRun: true });
}
