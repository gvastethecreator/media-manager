'use server';

/**
 * @file Query actions for folders
 * @module app/actions/folders/query.actions
 * @description Contiene acciones de servidor para consultas avanzadas y búsqueda de carpetas,
 *              así como la obtención de la estructura de árbol de carpetas y estadísticas.
 */

import { prisma } from '@/lib/database/prisma';
import { serverLogger } from '@/lib/logger/server-logger';
import { fromPrismaFolders, mapFolderSearchOptionsToPrisma } from '@/transformers/folder';
import type { FolderComplete, FolderSearchOptions } from '@/types/entities/folder';
import { revalidatePath } from '@/lib/server/revalidate';

// Logger para acciones de consulta
const queryLogger = serverLogger.withContext('FolderQueryActions');

/**
 * Busca carpetas en la base de datos según los criterios proporcionados.
 */
export async function searchFolders(options: FolderSearchOptions): Promise<{
	data: FolderComplete[];
	total: number;
}> {
	queryLogger.info('🔍 Searching folders with options:', options);

	const prismaOptions = mapFolderSearchOptionsToPrisma(options);

	const [folders, total] = await prisma.$transaction([
		prisma.folder.findMany({
			...prismaOptions,
			include: {
				parent: true,
				children: true,
				images: true,
				_count: {
					select: {
						images: true,
						videos: true,
						children: true,
					},
				},
			},
		}),
		prisma.folder.count({ where: prismaOptions.where }),
	]);

	queryLogger.info(`✅ Found ${folders.length} of ${total} folders.`);

	return {
		data: fromPrismaFolders(folders),
		total,
	};
}

/**
 * Representa un nodo en el árbol de carpetas.
 */
interface FolderTreeNode {
	id: string;
	name: string;
	parentId: string | null;
	emoji: string | null;
	children: FolderTreeNode[];
	_count: {
		children: number;
		images: number;
	};
}

/**
 * Obtiene la estructura de árbol de carpetas, optimizada para UI.
 */
export async function getFolderTree(): Promise<FolderTreeNode[]> {
	queryLogger.info('🌳 Getting folder tree');

	const folders = await prisma.folder.findMany({
		select: {
			id: true,
			name: true,
			parentId: true,
			emoji: true,
			_count: {
				select: { children: true, images: true },
			},
		},
		orderBy: { name: 'asc' },
	});

	const folderMap = new Map<string, FolderTreeNode>();
	folders.forEach((folder) => {
		folderMap.set(folder.id, {
			...folder,
			children: [],
		});
	});

	const tree: FolderTreeNode[] = [];
	folders.forEach((folder) => {
		if (folder.parentId && folderMap.has(folder.parentId)) {
			folderMap.get(folder.parentId)?.children.push(folderMap.get(folder.id)!);
		} else {
			tree.push(folderMap.get(folder.id)!);
		}
	});

	queryLogger.info(`✅ Folder tree constructed with ${tree.length} root folders.`);
	return tree;
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
