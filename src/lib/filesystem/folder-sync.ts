/**
 * @file Sincronización automática de carpetas con el sistema de archivos
 * @module lib/filesystem/folder-sync
 * @description Sincroniza las carpetas de la base de datos con las carpetas reales del sistema de archivos
 */

import { and, eq, inArray, isNull, like } from 'drizzle-orm';
import path from 'path';
import type { DrizzleDatabase } from '@/lib/drizzle';
import { db } from '@/lib/drizzle';
import {
	audios,
	documents,
	favorites,
	file3Ds,
	fileStats,
	folders,
	groupImages,
	groupVideos,
	// Relaciones m2m
	imageAlbums,
	imageCharacters,
	imageCollections,
	imageConcepts,
	imageNotes,
	imagePlaces,
	imagePrompts,
	imageProperties,
	images,
	imageTags,
	imageWildcards,
	imageWorldItems,
	jsonFiles,
	metadatas,
	thumbnails,
	uploadedImages,
	videoAlbums,
	videoCharacters,
	videoCollections,
	videoConcepts,
	videoNotes,
	videoPlaces,
	videoPrompts,
	videoProperties,
	videos,
	videoTags,
	videoWildcards,
	videoWorldItems,
} from '@/lib/drizzle/schema/index';
import { serverLogger } from '@/lib/logger/server-logger';
import { generateFolderIdFromName } from '@/lib/utils/folder-id-generator';
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
		const rootFolders = dbFolders.filter((f: any) => !f.parentId);
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
				syncLogger.debug(`🚫 Carpeta ignorada: ${directory.name}`);
				continue;
			}

			fileSystemPaths.add(normalizedPath);
			syncLogger.debug(`📁 Subcarpeta detectada: ${directory.name} → ${normalizedPath}`);
		}

		syncLogger.info(`✅ Escaneo completado desde ${normalizedRootPath}:`, {
			totalCarpetas: scanResult.directories.length,
			carpetasAgregadas: scanResult.directories.filter((d) => !shouldIgnoreFolder(d.name, options.ignorePatterns))
				.length,
			archivos: scanResult.files.length,
			profundidad: options.maxDepth,
		});
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

		// Si ya está presente en el escaneo del FS, continuar
		if (fileSystemPaths.has(normalizedPath)) {
			continue;
		}

		// Verificar una vez más que realmente no existe en disco
		const existsOnDisk = await folderExists(normalizedPath);
		if (!existsOnDisk) {
			foldersToRemove.push({
				id: dbFolder.id,
				path: dbFolder.path,
				name: dbFolder.name,
			});
			syncLogger.info(`🗑️ Carpeta marcada para eliminación: ${dbFolder.name} (${dbFolder.path})`);
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

	syncLogger.info(`🔍 Comparando rutas - FS: ${fileSystemPaths.size}, BD: ${dbPaths.size}`);

	// Debug: mostrar algunas rutas para comparación
	const fsPathsArray = Array.from(fileSystemPaths);
	const dbPathsArray = Array.from(dbPaths);

	syncLogger.debug('📂 Primeras 5 rutas en FS:', fsPathsArray.slice(0, 5));
	syncLogger.debug('📂 Primeras 5 rutas en BD:', dbPathsArray.slice(0, 5));

	for (const fsPath of fileSystemPaths) {
		// Si la carpeta ya existe en la BD, continuar
		if (dbPaths.has(fsPath)) {
			syncLogger.debug(`✅ Carpeta ya existe en BD: ${path.basename(fsPath)} (${fsPath})`);
			continue;
		}

		// Carpeta nueva para agregar
		const folderName = path.basename(fsPath);
		const newId = await generateFolderIdFromName(folderName);

		foldersToAdd.push({
			id: newId,
			path: fsPath,
			name: folderName,
		});

		syncLogger.info(`➕ Carpeta marcada para agregar: ${folderName} (ID: ${newId}) (${fsPath})`);
	}

	syncLogger.info(`📊 Resultado: ${foldersToAdd.length} nuevas carpetas para agregar`);
	return foldersToAdd;
}

/**
 * Ejecuta los cambios de sincronización en la base de datos
 */
async function executeSyncChanges(result: FolderSyncResult): Promise<void> {
	try {
		// 1. Eliminar contenidos y relaciones de carpetas que ya no existen
		if (result.removed.length > 0) {
			const folderIds = result.removed.map((f) => f.id);

			syncLogger.info(`🗑️ Limpieza en cascada para ${folderIds.length} carpetas eliminadas`);

			// Utilidad para procesar lotes y evitar límites de SQLite
			const chunk = <T>(arr: T[], size: number) => {
				const out: T[][] = [];
				for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
				return out;
			};

			await db.transaction(async (tx: DrizzleDatabase) => {
				// Recopilar IDs por entidad dentro de las carpetas a eliminar
				const [imageRows, videoRows, audioRows, documentRows, file3DRows, jsonFileRows] = await Promise.all([
					tx.select({ id: images.id }).from(images).where(inArray(images.folderId, folderIds)),
					tx.select({ id: videos.id }).from(videos).where(inArray(videos.folderId, folderIds)),
					tx.select({ id: audios.id }).from(audios).where(inArray(audios.folderId, folderIds)),
					tx.select({ id: documents.id }).from(documents).where(inArray(documents.folderId, folderIds)),
					tx.select({ id: file3Ds.id }).from(file3Ds).where(inArray(file3Ds.folderId, folderIds)),
					tx.select({ id: jsonFiles.id }).from(jsonFiles).where(inArray(jsonFiles.folderId, folderIds)),
				]);

				const imageIds: string[] = imageRows.map((r: { id: string }) => r.id);
				const videoIds: string[] = videoRows.map((r: { id: string }) => r.id);
				const audioIds: string[] = audioRows.map((r: { id: string }) => r.id);
				const documentIds: string[] = documentRows.map((r: { id: string }) => r.id);
				const file3DIds: string[] = file3DRows.map((r: { id: string }) => r.id);
				const jsonIds: string[] = jsonFileRows.map((r: { id: string }) => r.id);

				// 1.1 Borrar relaciones m2m de imágenes
				if (imageIds.length > 0) {
					for (const ids of chunk(imageIds, 800)) {
						await Promise.all([
							tx.delete(imageAlbums).where(inArray(imageAlbums.A, ids)),
							tx.delete(imageCollections).where(inArray(imageCollections.A, ids)),
							tx.delete(imageTags).where(inArray(imageTags.A, ids)),
							tx.delete(imageProperties).where(inArray(imageProperties.A, ids)),
							tx.delete(imageWildcards).where(inArray(imageWildcards.A, ids)),
							tx.delete(imageCharacters).where(inArray(imageCharacters.A, ids)),
							tx.delete(imagePlaces).where(inArray(imagePlaces.A, ids)),
							tx.delete(imageWorldItems).where(inArray(imageWorldItems.A, ids)),
							tx.delete(imageConcepts).where(inArray(imageConcepts.A, ids)),
							tx.delete(imagePrompts).where(inArray(imagePrompts.A, ids)),
							tx.delete(imageNotes).where(inArray(imageNotes.A, ids)),
							tx
								.delete(groupImages)
								.where(inArray(groupImages.A, ids)), // Fixed: usando A en lugar de imageId
						]);
					}
				}

				// 1.2 Borrar relaciones m2m de videos
				if (videoIds.length > 0) {
					for (const ids of chunk(videoIds, 800)) {
						await Promise.all([
							tx.delete(videoAlbums).where(inArray(videoAlbums.A, ids)),
							tx.delete(videoCollections).where(inArray(videoCollections.A, ids)),
							tx.delete(videoTags).where(inArray(videoTags.A, ids)),
							tx.delete(videoProperties).where(inArray(videoProperties.A, ids)),
							tx.delete(videoWildcards).where(inArray(videoWildcards.A, ids)),
							tx.delete(videoCharacters).where(inArray(videoCharacters.A, ids)),
							tx.delete(videoPlaces).where(inArray(videoPlaces.A, ids)),
							tx.delete(videoWorldItems).where(inArray(videoWorldItems.A, ids)),
							tx.delete(videoConcepts).where(inArray(videoConcepts.A, ids)),
							tx.delete(videoPrompts).where(inArray(videoPrompts.A, ids)),
							tx.delete(videoNotes).where(inArray(videoNotes.A, ids)),
							tx
								.delete(groupVideos)
								.where(inArray(groupVideos.A, ids)), // Fixed: usando A en lugar de videoId
						]);
					}
				}

				// 1.3 Eliminar dependientes genéricos (metadatos, thumbnails, favoritos, stats, uploads)
				if (imageIds.length > 0) {
					for (const ids of chunk(imageIds, 800)) {
						await Promise.all([
							tx.delete(metadatas).where(and(inArray(metadatas.entityId, ids), eq(metadatas.entityType, 'image'))),
							tx.delete(thumbnails).where(and(inArray(thumbnails.entityId, ids), eq(thumbnails.entityType, 'image'))),
							tx.delete(favorites).where(and(inArray(favorites.entityId, ids), eq(favorites.entityType, 'image'))),
							tx.delete(uploadedImages).where(inArray(uploadedImages.imageId, ids)),
							tx.delete(fileStats).where(inArray(fileStats.fileId, ids)),
						]);
					}
				}

				if (videoIds.length > 0) {
					for (const ids of chunk(videoIds, 800)) {
						await Promise.all([
							tx.delete(metadatas).where(and(inArray(metadatas.entityId, ids), eq(metadatas.entityType, 'video'))),
							tx.delete(thumbnails).where(and(inArray(thumbnails.entityId, ids), eq(thumbnails.entityType, 'video'))),
							tx.delete(favorites).where(and(inArray(favorites.entityId, ids), eq(favorites.entityType, 'video'))),
						]);
					}
				}

				if (audioIds.length > 0) {
					for (const ids of chunk(audioIds, 800)) {
						await Promise.all([
							tx.delete(metadatas).where(and(inArray(metadatas.entityId, ids), eq(metadatas.entityType, 'audio'))),
							tx.delete(thumbnails).where(and(inArray(thumbnails.entityId, ids), eq(thumbnails.entityType, 'audio'))),
							tx.delete(favorites).where(and(inArray(favorites.entityId, ids), eq(favorites.entityType, 'audio'))),
						]);
					}
				}

				if (documentIds.length > 0) {
					for (const ids of chunk(documentIds, 800)) {
						await Promise.all([
							tx.delete(metadatas).where(and(inArray(metadatas.entityId, ids), eq(metadatas.entityType, 'document'))),
							tx
								.delete(thumbnails)
								.where(and(inArray(thumbnails.entityId, ids), eq(thumbnails.entityType, 'document'))),
							tx.delete(favorites).where(and(inArray(favorites.entityId, ids), eq(favorites.entityType, 'document'))),
						]);
					}
				}

				if (file3DIds.length > 0) {
					for (const ids of chunk(file3DIds, 800)) {
						await Promise.all([
							tx.delete(metadatas).where(and(inArray(metadatas.entityId, ids), eq(metadatas.entityType, 'file3d'))),
							tx.delete(thumbnails).where(and(inArray(thumbnails.entityId, ids), eq(thumbnails.entityType, 'file3d'))),
							tx.delete(favorites).where(and(inArray(favorites.entityId, ids), eq(favorites.entityType, 'file3d'))),
						]);
					}
				}

				if (jsonIds.length > 0) {
					for (const ids of chunk(jsonIds, 800)) {
						await Promise.all([
							tx.delete(metadatas).where(and(inArray(metadatas.entityId, ids), eq(metadatas.entityType, 'json'))),
							tx.delete(thumbnails).where(and(inArray(thumbnails.entityId, ids), eq(thumbnails.entityType, 'json'))),
							tx.delete(favorites).where(and(inArray(favorites.entityId, ids), eq(favorites.entityType, 'json'))),
						]);
					}
				}

				// 1.4 Eliminar entidades base
				if (imageIds.length > 0) {
					for (const ids of chunk(imageIds, 800)) {
						await tx.delete(images).where(inArray(images.id, ids));
					}
				}
				if (videoIds.length > 0) {
					for (const ids of chunk(videoIds, 800)) {
						await tx.delete(videos).where(inArray(videos.id, ids));
					}
				}
				if (audioIds.length > 0) {
					for (const ids of chunk(audioIds, 800)) {
						await tx.delete(audios).where(inArray(audios.id, ids));
					}
				}
				if (documentIds.length > 0) {
					for (const ids of chunk(documentIds, 800)) {
						await tx.delete(documents).where(inArray(documents.id, ids));
					}
				}
				if (file3DIds.length > 0) {
					for (const ids of chunk(file3DIds, 800)) {
						await tx.delete(file3Ds).where(inArray(file3Ds.id, ids));
					}
				}
				if (jsonIds.length > 0) {
					for (const ids of chunk(jsonIds, 800)) {
						await tx.delete(jsonFiles).where(inArray(jsonFiles.id, ids));
					}
				}

				// 1.5 Finalmente, eliminar las carpetas
				for (const ids of chunk(folderIds, 800)) {
					await tx.delete(folders).where(inArray(folders.id, ids));
				}
			});

			syncLogger.info(`✅ Limpieza en cascada completada y carpetas eliminadas: ${result.removed.length}`);
		}

		// 2. Agregar nuevas carpetas
		if (result.added.length > 0) {
			syncLogger.info(`➕ Agregando ${result.added.length} carpetas a la BD`);

			// Ordenar por profundidad para crear padres antes que hijos
			// Calcular profundidad de forma consistente en cualquier SO
			const getDepth = (p: string) => {
				const norm = normalizePath(p).replace(/\\/g, '/');
				return norm.split('/').filter(Boolean).length;
			};
			const sortedToAdd = result.added.sort((a, b) => getDepth(a.path) - getDepth(b.path));

			for (const folder of sortedToAdd) {
				try {
					// Determinar carpeta padre (normalizado)
					const parentPath = normalizePath(path.dirname(folder.path));
					// Buscar por variantes para tolerar diferentes estilos de almacenamiento de ruta
					const parentPathVariants = [parentPath, parentPath.replace(/\\/g, '/'), parentPath.replace(/\//g, '\\')];
					let parentFolder = await db
						.select({ id: folders.id })
						.from(folders)
						.where(inArray(folders.path, parentPathVariants))
						.limit(1);

					// Intento adicional: comparación insensible a mayúsculas
					if (parentFolder.length === 0) {
						const { sql } = await import('drizzle-orm');
						parentFolder = await db
							.select({ id: folders.id })
							.from(folders)
							.where(sql`LOWER(${folders.path}) = LOWER(${parentPath})`)
							.limit(1);
					}

					const parentId = parentFolder.length > 0 ? parentFolder[0].id : null;

					// Insertar nueva carpeta
					await db.insert(folders).values({
						id: folder.id,
						name: folder.name,
						path: folder.path,
						parentId,
						totalFiles: 0,
						totalSize: 0,
						lastIndexed: new Date(),
					});

					syncLogger.info(`✅ Carpeta agregada: ${folder.name}`);
				} catch (error) {
					const errorMsg = `Error agregando carpeta ${folder.name}: ${error instanceof Error ? error.message : String(error)}`;
					syncLogger.error(errorMsg);
					result.errors.push(errorMsg);
				}
			}

			// Reconciliación: asegurar parentId correcto para todas las agregadas (por si el orden no garantizó padres primero)
			for (const folder of result.added) {
				try {
					const expectedParentPath = normalizePath(path.dirname(folder.path));
					const parentPathVariants = [
						expectedParentPath,
						expectedParentPath.replace(/\\/g, '/'),
						expectedParentPath.replace(/\//g, '\\'),
					];
					let parent = await db
						.select({ id: folders.id })
						.from(folders)
						.where(inArray(folders.path, parentPathVariants))
						.limit(1);

					if (parent.length === 0) {
						const { sql } = await import('drizzle-orm');
						parent = await db
							.select({ id: folders.id })
							.from(folders)
							.where(sql`LOWER(${folders.path}) = LOWER(${expectedParentPath})`)
							.limit(1);
					}

					if (parent.length > 0) {
						await db
							.update(folders)
							.set({ parentId: parent[0].id })
							// Actualizar por id recién insertado para evitar discrepancias de formato de path
							.where(eq(folders.id, folder.id));

						// Unificación adicional: si ya existían hijos en BD cuyo parentPath coincide con la nueva carpeta,
						// reasignarlos al nuevo parentId para consolidar jerarquía cuando se agrega la carpeta padre después.
						const childExpectedPrefix = normalizePath(folder.path);
						// Buscar hijos cuyo parentId esté vacío pero su path pertenezca al prefijo
						const candidates = await db
							.select({ id: folders.id, path: folders.path, parentId: folders.parentId })
							.from(folders)
							.where(and(isNull(folders.parentId), like(folders.path, `${childExpectedPrefix}/%` as any)))
							.limit(1000);

						for (const c of candidates) {
							const cPath = normalizePath(c.path);
							if (cPath !== childExpectedPrefix && cPath.startsWith(`${childExpectedPrefix}/`)) {
								await db.update(folders).set({ parentId: folder.id }).where(eq(folders.id, c.id));
							}
						}
					}
				} catch (error) {
					const errorMsg = `Error reconciliando parentId para ${folder.name}: ${error instanceof Error ? error.message : String(error)}`;
					syncLogger.warn(errorMsg);
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
