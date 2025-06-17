'use server';

/**
 * @file Acciones específicas para obtener carpetas
 * @module app/actions/folders/folder-get.actions
 */

import { folderListCache, folderResponseCache, getFolderCacheKey, getFolderListCacheKey } from '@/lib/folder-cache'; // 🚀 NUEVA IMPORTACIÓN
import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { transformFolderToExtended } from '@/transformers/folder';

// Logger específico para el archivo
const folderLogger = serverLogger.withContext('FolderGetActions');

/**
 * Obtiene todas las carpetas - OPTIMIZADO ⚡
 * @returns Lista de carpetas extendidas
 */
export async function getFolders() {
	try {
		folderLogger.info('📂 Obteniendo todas las carpetas');

		// 🚀 OPTIMIZACIÓN: Verificar cache primero
		const cacheKey = getFolderListCacheKey();
		const cachedResult = folderListCache.get(cacheKey);

		if (cachedResult) {
			folderLogger.info('💨 Carpetas obtenidas desde cache', { count: cachedResult.length });
			return cachedResult;
		}

		const folders = await prisma.folder.findMany({
			include: {
				_count: {
					select: {
						images: true,
						videos: true,
						children: true,
					},
				},
				parent: true,
			},
			orderBy: {
				createdAt: 'desc',
			},
		});

		// Transformar a modelo extendido con transformador
		const transformedFolders = folders.map((folder) => transformFolderToExtended(folder));

		// 🚀 OPTIMIZACIÓN: Guardar en cache
		folderListCache.set(cacheKey, transformedFolders);

		folderLogger.info(`✅ Obtenidas ${transformedFolders.length} carpetas (desde DB)`);

		return transformedFolders;
	} catch (error) {
		folderLogger.error('❌ Error obteniendo carpetas:', error);
		throw new Error(`Error al obtener carpetas: ${error instanceof Error ? error.message : String(error)}`);
	}
}

/**
 * 🚀 OPTIMIZACIÓN: Obtiene una carpeta específica con cache
 * @param id ID de la carpeta
 * @returns Carpeta extendida o null si no existe
 */
export async function getFolderById(id: string) {
	try {
		folderLogger.info('📂 Obteniendo carpeta por ID:', id);

		// 🚀 OPTIMIZACIÓN: Verificar cache primero
		const cacheKey = getFolderCacheKey(id, 'get');
		const cachedResult = folderResponseCache.get(cacheKey);

		if (cachedResult) {
			folderLogger.info('💨 Carpeta obtenida desde cache:', id);
			return cachedResult;
		}

		const folder = await prisma.folder.findUnique({
			where: { id },
			include: {
				_count: {
					select: {
						images: true,
						videos: true,
						children: true,
					},
				},
				parent: true,
				children: {
					include: {
						_count: {
							select: {
								images: true,
								videos: true,
								children: true,
							},
						},
					},
				},
			},
		});

		if (!folder) {
			folderLogger.warn('⚠️ Carpeta no encontrada:', id);
			return null;
		}

		// Transformar a modelo extendido
		const transformedFolder = transformFolderToExtended(folder);

		// 🚀 OPTIMIZACIÓN: Guardar en cache
		folderResponseCache.set(cacheKey, transformedFolder);

		folderLogger.info('✅ Carpeta obtenida correctamente:', id);

		return transformedFolder;
	} catch (error) {
		folderLogger.error('❌ Error obteniendo carpeta por ID:', error);
		throw new Error(`Error al obtener carpeta: ${error instanceof Error ? error.message : String(error)}`);
	}
}

/**
 * 🚀 OPTIMIZACIÓN: Obtiene carpetas con filtros y paginación
 */
export async function getFoldersWithFilter(
	filters: { parentId?: string | null; status?: string; limit?: number; offset?: number } = {}
) {
	try {
		folderLogger.info('📂 Obteniendo carpetas con filtros:', filters);

		// 🚀 OPTIMIZACIÓN: Verificar cache
		const cacheKey = getFolderListCacheKey(filters);
		const cachedResult = folderListCache.get(cacheKey);

		if (cachedResult) {
			folderLogger.info('💨 Carpetas filtradas obtenidas desde cache');
			return cachedResult;
		}

		const where: any = {};

		if (filters.parentId !== undefined) {
			where.parentId = filters.parentId;
		}

		if (filters.status) {
			where.status = filters.status;
		}

		const folders = await prisma.folder.findMany({
			where,
			include: {
				_count: {
					select: {
						images: true,
						videos: true,
						children: true,
					},
				},
				parent: true,
			},
			orderBy: {
				createdAt: 'desc',
			},
			take: filters.limit || 50,
			skip: filters.offset || 0,
		});

		// Transformar resultados
		const transformedFolders = folders.map((folder) => transformFolderToExtended(folder));

		// 🚀 OPTIMIZACIÓN: Guardar en cache (TTL más corto para filtros)
		folderListCache.set(cacheKey, transformedFolders, 2 * 60 * 1000); // 2 min

		folderLogger.info(`✅ Obtenidas ${transformedFolders.length} carpetas filtradas (desde DB)`);

		return transformedFolders;
	} catch (error) {
		folderLogger.error('❌ Error obteniendo carpetas filtradas:', error);
		throw new Error(`Error al obtener carpetas filtradas: ${error instanceof Error ? error.message : String(error)}`);
	}
}
