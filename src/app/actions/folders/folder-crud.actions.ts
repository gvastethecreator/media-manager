''use server'';

/**
 * @file Funciones CRUD para la entidad Folder, expuestas como Server Actions.
 * @module app/actions/folders/folder-crud.actions
 */

import { Logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import type {
    Folder,
    FolderComplete,
    FolderCreateInput,
    FolderSearchOptions,
    FolderUpdateInput,
    FolderWithStats,
} from '@/types/entities/folder/types';
import { transformFolder } from '@/transformers/folder';
import { mapCreateFolderDataToPrisma, mapFolderSearchOptionsToPrisma, mapUpdateFolderDataToPrisma } from '@/transformers/folder/mappers';
import { revalidatePath } from 'next/cache';

const logger = new Logger('FolderCRUDActions');

const REVALIDATE_PATHS = ['/settings', '/folders', '/folders/[id]'] as const;

const revalidateAllPaths = async () => {
	for (const path of REVALIDATE_PATHS) {
		revalidatePath(path);
	}
	logger.info('🔄 Rutas revalidadas');
};

/**
 * 🔍 Obtiene una carpeta por su ID
 *
 * @param id ID de la carpeta
 * @returns La carpeta encontrada o null
 */
export async function getFolderById(id: string): Promise<FolderComplete | null> {
	try {
		logger.info(`🔍 Buscando carpeta con ID: ${id}`);

		const folder = await prisma.folder.findUnique({
			where: { id },
			include: {
				parent: true,
				_count: {
					select: {
						children: true,
						images: true,
						videos: true,
					},
				},
			},
		});

		if (!folder) {
			logger.warn(`⚠️ No se encontró carpeta con ID: ${id}`);
			return null;
		}

		return transformFolder(folder);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
		logger.error(`❌ Error al obtener carpeta por ID: ${id}`, {
			message: errorMessage,
			stack: error instanceof Error ? error.stack : undefined,
		});
		throw new Error(`Error al obtener carpeta por ID: ${id}. Causa: ${errorMessage}`);
	}
}

/**
 * 📂 Obtiene una carpeta con estadísticas
 *
 * @param id ID de la carpeta
 * @returns La carpeta con estadísticas o null
 */
export async function getFolderWithStats(id: string): Promise<FolderWithStats | null> {
	try {
		logger.info(`📊 Obteniendo carpeta con estadísticas, ID: ${id}`);

		const folder = await prisma.folder.findUnique({
			where: { id },
			include: {
				_count: {
					select: {
						children: true,
						images: true,
						videos: true,
					},
				},
			},
		});

		if (!folder) {
			logger.warn(`⚠️ No se encontró carpeta con ID: ${id}`);
			return null;
		}

		// transformFolder ya incluye las estadísticas
		return transformFolder(folder) as FolderWithStats;
	} catch (error) {
		logger.error(`❌ Error al obtener carpeta con estadísticas, ID: ${id}`, error);
		throw error;
	}
}

/**
 * 🔍 Busca carpetas con filtros y opciones
 *
 * @param options Opciones de búsqueda
 * @returns Resultado con carpetas y conteo
 */
export async function searchFolders(options: FolderSearchOptions = {}): Promise<FolderComplete[]> {
	try {
		logger.info('🔍 Buscando carpetas con opciones:', options);

		// Convertir opciones a formato Prisma
		const prismaOptions = mapFolderSearchOptionsToPrisma(options);

		// Ejecutar consulta con conteo
		const [folders, total] = await Promise.all([
			prisma.folder.findMany({
				...prismaOptions,
				include: {
					...(prismaOptions.include || {}),
					_count: {
						select: {
							children: true,
							images: true,
							videos: true,
						},
					},
				},
			}),
			prisma.folder.count({ where: prismaOptions.where }),
		]);

		// Transformar resultados de forma segura
		const transformedFolders = folders.map(folder => {
			try {
				return transformFolder(folder);
			} catch (error) {
				// En caso de error al transformar, devolver una versión básica pero válida
				logger.warn(`⚠️ Error transformando carpeta ${folder.id}:`, error);
				return {
					id: folder.id,
					name: folder.name || 'Carpeta sin nombre',
					path: folder.path || '/',
					description: folder.description || '',
					emoji: folder.emoji || '📁',
					color: folder.color || '#3b82f6',
					parentId: folder.parentId,
					createdAt: folder.createdAt,
					updatedAt: folder.updatedAt,
					children: [],
					parent: null,
					_count: {
						children: folder._count?.children || 0,
						images: folder._count?.images || 0,
						videos: folder._count?.videos || 0,
						uploadedImages: 0,
						tags: 0,
					},
					totalFiles: folder.totalFiles || 0,
					totalSize: folder.totalSize || 0,
					metadata: {},
					stats: null,
				} as FolderComplete;
			}
		});

		// Calcular si hay más resultados
		const skip = options.skip || 0;
		const take = options.take || 50;
		const hasMore = skip + transformedFolders.length < total;

		logger.info(`✅ Búsqueda completada, encontradas ${transformedFolders.length} carpetas`);

		await revalidateAllPaths();

		return transformedFolders;
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
		logger.error('❌ Error al buscar carpetas:', {
			message: errorMessage,
			stack: error instanceof Error ? error.stack : undefined,
			options,
		});
		// En caso de error, devolver un array vacío para evitar errores en cascada
		return [];
	}
}

/**
 * ➕ Crea una nueva carpeta
 *
 * @param data Datos para crear la carpeta
 * @returns La carpeta creada
 */
export async function createFolder(data: FolderCreateInput): Promise<FolderComplete> {
	try {
		logger.info('➕ Creando nueva carpeta:', data);

		// Mapear datos a formato Prisma
		const prismaData = mapCreateFolderDataToPrisma(data);

		// Crear la carpeta
		const folder = await prisma.folder.create({
			data: prismaData,
			include: {
				_count: {
					select: {
						children: true,
						images: true,
						videos: true,
					},
				},
			},
		});

		logger.info(`✅ Carpeta creada correctamente con ID: ${folder.id}`);
		await revalidateAllPaths();
		return transformFolder(folder);
	} catch (error) {
		logger.error('❌ Error al crear carpeta:', error);
		throw error;
	}
}

/**
 * 🔄 Actualiza una carpeta existente
 *
 * @param id ID de la carpeta a actualizar
 * @param data Datos para actualizar
 * @returns La carpeta actualizada
 */
export async function updateFolder(id: string, data: FolderUpdateInput): Promise<FolderComplete> {
	try {
		logger.info(`🔄 Actualizando carpeta con ID: ${id}`, data);

		// Verificar que la carpeta existe
		const existingFolder = await prisma.folder.findUnique({
			where: { id },
		});

		if (!existingFolder) {
			logger.error(`❌ No se encontró carpeta con ID: ${id}`);
			throw new Error(`No se encontró carpeta con ID: ${id}`);
		}

		// Mapear datos a formato Prisma
		const prismaData = mapUpdateFolderDataToPrisma(data);

		// Actualizar la carpeta
		const folder = await prisma.folder.update({
			where: { id },
			data: prismaData,
			include: {
				_count: {
					select: {
						children: true,
						images: true,
						videos: true,
					},
				},
			},
		});

		logger.info(`✅ Carpeta actualizada correctamente con ID: ${folder.id}`);
		await revalidateAllPaths();
		return transformFolder(folder);
	} catch (error) {
		logger.error(`❌ Error al actualizar carpeta con ID: ${id}:`, error);
		throw error;
	}
}

/**
 * 🗑️ Elimina una carpeta por su ID
 *
 * @param id ID de la carpeta a eliminar
 * @returns La carpeta eliminada
 */
export async function deleteFolder(id: string): Promise<Folder> {
	try {
		logger.info(`🗑️ Eliminando carpeta con ID: ${id}`);

		// Verificar que la carpeta existe
		const existingFolder = await prisma.folder.findUnique({
			where: { id },
			include: {
				_count: {
					select: {
						children: true,
						images: true,
					},
				},
			},
		});

		if (!existingFolder) {
			logger.error(`❌ No se encontró carpeta con ID: ${id}`);
			throw new Error(`No se encontró carpeta con ID: ${id}`);
		}

		// Verificar si tiene hijos o imágenes
		if ((existingFolder._count?.children || 0) > 0 || (existingFolder._count?.images || 0) > 0) {
			logger.warn(`⚠️ La carpeta con ID: ${id} tiene hijos o imágenes`);
			throw new Error('No se puede eliminar una carpeta con elementos');
		}

		// Eliminar la carpeta
		const folder = await prisma.folder.delete({
			where: { id },
		});

		logger.info(`✅ Carpeta eliminada correctamente con ID: ${folder.id}`);
		await revalidateAllPaths();
		return folder;
	} catch (error) {
		logger.error(`❌ Error al eliminar carpeta con ID: ${id}:`, error);
		throw error;
	}
}