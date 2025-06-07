'use server';

/**
 * @file Query actions for folders
 * @module app/actions/folders/query.actions
 * @description Contiene acciones de servidor para consultas avanzadas y búsqueda de carpetas,
 *              así como la obtención de la estructura de árbol de carpetas y estadísticas.
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { mapFolderFiltersToPrisma, transformFolderToExtended } from '@/transformers/folder';
import { type FolderFilters } from '@/types/entities/folder';
import { revalidatePath } from 'next/cache';

// Logger para acciones de consulta
const queryLogger = serverLogger.withContext('FolderQueryActions');

/**
 * Busca carpetas según filtros
 * @param filters Filtros para la búsqueda
 * @param options Opciones adicionales
 * @returns Lista de carpetas que coinciden con los filtros
 */
export async function searchFolders(
	filters: FolderFilters,
	options: {
		page?: number;
		limit?: number;
		sort?: string;
		includeStats?: boolean;
		includeImages?: boolean;
		includeVideos?: boolean;
		includeParent?: boolean;
		includeChildren?: boolean;
	} = {}
) {
	try {
		const {
			page = 1,
			limit = 50,
			sort = 'updatedAt:desc',
			includeStats = false,
			includeImages = false,
			includeVideos = false,
			includeParent = true,
			includeChildren = false,
		} = options;

		queryLogger.info('🔍 Buscando carpetas con filtros:', { filters, options });

		// Convertir filtros a prisma con el transformador
		const prismaFilters = mapFolderFiltersToPrisma(filters);

		// Determinar orden
		const [sortField, sortDirection] = sort.split(':');
		const orderBy: Record<string, 'asc' | 'desc'> = {};
		orderBy[sortField || 'updatedAt'] = sortDirection === 'asc' ? 'asc' : 'desc';

		// Calcular paginación
		const skip = (page - 1) * limit;

		// Construir includes dinámicamente
		const include: any = {
			_count: {
				select: {
					images: true,
					videos: true,
					children: true,
				},
			},
		};

		if (includeParent) include.parent = true;
		if (includeChildren) include.children = true;
		if (includeImages) include.images = { take: 5 }; // Limitar para evitar queries pesadas
		if (includeVideos) include.videos = { take: 5 }; // Limitar para evitar queries pesadas

		// Realizar búsqueda
		const [folders, totalCount] = await Promise.all([
			prisma.folder.findMany({
				where: prismaFilters,
				include,
				orderBy,
				skip,
				take: limit,
			}),
			prisma.folder.count({
				where: prismaFilters,
			}),
		]);

		// Transformar resultados
		const transformedFolders = folders.map((folder) => transformFolderToExtended(folder));

		queryLogger.info(`✅ Búsqueda completada: ${transformedFolders.length} de ${totalCount} carpetas`);

		return {
			data: transformedFolders,
			pagination: {
				page,
				limit,
				total: totalCount,
				pages: Math.ceil(totalCount / limit),
			},
		};
	} catch (error) {
		queryLogger.error('❌ Error buscando carpetas:', error);
		throw new Error(`Error al buscar carpetas: ${error instanceof Error ? error.message : String(error)}`);
	}
}

/**
 * Obtiene carpetas para la vista de árbol
 * Optimizado para navegación jerárquica
 */
export async function getFolderTree() {
	try {
		queryLogger.info('🌳 Obteniendo árbol de carpetas');

		// Optimizar query para árbol
		const folders = await prisma.folder.findMany({
			select: {
				id: true,
				name: true,
				path: true,
				parentId: true,
				emoji: true,
				color: true,
				totalFiles: true,
				_count: {
					select: {
						children: true,
						images: true,
						videos: true,
					},
				},
			},
			orderBy: {
				name: 'asc',
			},
		});

		// Construir estructura de árbol
		const folderMap = new Map();

		// Poblar el mapa usando for...of
		for (const folder of folders) {
			folderMap.set(folder.id, {
				...folder,
				children: [],
				level: 0,
				isOpen: false,
				isSelected: false,
				hasChildren: folder._count.children > 0,
				totalItems: (folder._count.images || 0) + (folder._count.videos || 0),
			});
		}

		// Construir jerarquía de carpetas
		const rootFolders: any[] = [];

		// Construir relaciones padre-hijo usando for...of
		for (const folder of folders) {
			const folderWithMeta = folderMap.get(folder.id);

			if (folder.parentId && folderMap.has(folder.parentId)) {
				// Es una carpeta hija
				const parent = folderMap.get(folder.parentId);
				folderWithMeta.level = parent.level + 1;
				parent.children.push(folderWithMeta);
			} else {
				// Es una carpeta raíz
				rootFolders.push(folderWithMeta);
			}
		}

		queryLogger.info(`✅ Árbol de carpetas obtenido con ${rootFolders.length} carpetas raíz`);
		return rootFolders;
	} catch (error) {
		queryLogger.error('❌ Error obteniendo árbol de carpetas:', error);
		throw new Error(`Error al obtener árbol de carpetas: ${error instanceof Error ? error.message : String(error)}`);
	}
}

/**
 * Revalida las rutas relacionadas con las carpetas en el caché de Next.js.
 * @returns Promesa resuelta cuando la revalidación se completa.
 */
export async function revalidateFolderRoutes() {
	try {
		queryLogger.info('🔄 Revalidando rutas de carpetas...');
		// Revalidar rutas estáticas y dinámicas relacionadas con carpetas
		revalidatePath('/folders');
		revalidatePath('/folders/[id]', 'page'); // Revalidar rutas dinámicas
		revalidatePath('/api/folders', 'page'); // Revalidar cualquier ruta de API relacionada con carpetas (si aún existe)

		queryLogger.info('✅ Rutas de carpetas revalidadas');
	} catch (error) {
		queryLogger.error('❌ Error revalidando rutas de carpetas:', error);
		throw new Error(`Error al revalidar rutas de carpetas: ${error instanceof Error ? error.message : String(error)}`);
	}
}

/**
 * Obtiene estadísticas generales de carpetas.
 * @returns Objeto con las estadísticas generales.
 */
export async function getFoldersStats() {
	try {
		queryLogger.info('📊 Obteniendo estadísticas generales de carpetas');

		const totalFolders = await prisma.folder.count();
		const totalImages = await prisma.image.count();
		const totalVideos = await prisma.video.count();

		const totalSizeResult = await prisma.folder.aggregate({
			_sum: {
				totalSize: true,
			},
		});

		const totalSize = totalSizeResult._sum.totalSize || 0;

		queryLogger.info('✅ Estadísticas generales obtenidas', { totalFolders, totalImages, totalVideos, totalSize });

		return {
			totalFolders,
			totalImages,
			totalVideos,
			totalSize,
		};
	} catch (error) {
		queryLogger.error('❌ Error obteniendo estadísticas generales de carpetas:', error);
		throw new Error(
			`Error al obtener estadísticas generales de carpetas: ${error instanceof Error ? error.message : String(error)}`
		);
	}
}
