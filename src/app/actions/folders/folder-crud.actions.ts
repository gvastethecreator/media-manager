'use server';

/**
 * @file Funciones CRUD para la entidad Folder, expuestas como Server Actions.
 * @module app/actions/folders/folder-crud.actions
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { fromPrismaFolder, transformFolder } from '@/transformers/folder';
import {
	mapCreateFolderDataToPrisma,
	mapFolderSearchOptionsToPrisma,
	mapUpdateFolderDataToPrisma,
} from '@/transformers/folder/mappers';
import type {
	Folder,
	FolderComplete,
	FolderCreateInput,
	FolderSearchOptions,
	FolderUpdateInput,
	FolderWithStats,
} from '@/types/entities/folder/types';
import { revalidatePath } from 'next/cache';

// Logger centralizado
const logger = serverLogger.withContext('FolderCrudActions');

/**
 * 🔒 Asegura que cualquier objeto con thumbnail binario sea serializable
 * Convierte Uint8Array/Buffer a string (URL o base64)
 *
 * @param obj Objeto que puede contener thumbnails no serializables
 * @returns Objeto seguro para serialización
 */
function ensureSerializableThumbnails<T>(obj: T): T {
	// Si no es un objeto o es null, devolverlo tal cual
	if (!obj || typeof obj !== 'object') return obj;

	// Copia para no modificar el original
	const result = { ...obj as object } as Record<string, any>;

	// Procesar propiedades
	for (const key in result) {
		const value = result[key];

		// Si es un thumbnail de tipo Uint8Array/Buffer
		if (key === 'thumbnail' && value instanceof Uint8Array) {
			// Convertir a base64
			const thumbnailBuffer = Buffer.from(value);
			const mimeType = (result.thumbnailMimeType as string) || 'image/webp';
			result[key] = `data:${mimeType};base64,${thumbnailBuffer.toString('base64')}`;
		}
		// Si es un array, procesar cada elemento
		else if (Array.isArray(value)) {
			result[key] = value.map((item: unknown) =>
				item && typeof item === 'object'
					? ensureSerializableThumbnails(item)
					: item
			);
		}
		// Si es un objeto (que no sea Date ni null), procesarlo recursivamente
		else if (value && typeof value === 'object' && !(value instanceof Date)) {
			result[key] = ensureSerializableThumbnails(value);
		}
	}

	return result as unknown as T;
}

/**
 * Revalida todos los paths relevantes para carpetas
 */
async function revalidateAllPaths() {
	revalidatePath('/folders');
	revalidatePath('/');
}

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

		const transformedFolder = transformFolder(folder);
		// Asegurar que cualquier thumbnail sea serializable
		return ensureSerializableThumbnails(transformedFolder);
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

		// transformFolder ya incluye las estadísticas pero aseguramos que sea serializable
		const transformedFolder = transformFolder(folder) as FolderWithStats;
		return ensureSerializableThumbnails(transformedFolder);
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

		// Transformar resultados usando el transformador oficial
		const transformedFolders = folders.map((folder) => {
			try {
				return transformFolder(folder);
			} catch (error) {
				// En caso de error al transformar, loggear y continuar
				logger.warn(`⚠️ Error transformando carpeta ${folder.id}:`, error);
				// Intentar transformación básica
				return transformFolder({
					...folder,
					description: folder.description || '',
					// No acceder a _count directamente ya que puede no existir en el tipo
				});
			}
		});

		// Calcular si hay más resultados
		const skip = options.skip || 0;
		const take = options.take || 50;
		const hasMore = skip + transformedFolders.length < total;

		logger.info(`✅ Búsqueda completada, encontradas ${transformedFolders.length} carpetas`);

		// Asegurar que todos los thumbnails sean serializables
		const serializableFolders = transformedFolders.map(folder =>
			ensureSerializableThumbnails(folder)
		);

		await revalidateAllPaths();

		return serializableFolders;
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
		const transformedFolder = transformFolder(folder);
		return ensureSerializableThumbnails(transformedFolder);
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
		const transformedFolder = transformFolder(folder);
		return ensureSerializableThumbnails(transformedFolder);
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
		const deletedFolder = await prisma.folder.delete({
			where: { id },
		});

		logger.info(`✅ Carpeta eliminada correctamente con ID: ${deletedFolder.id}`);
		await revalidateAllPaths();

		// 🔧 Usar fromPrismaFolder para convertir correctamente Prisma -> Folder
		// Esta función maneja automáticamente description: null -> description: string
		return fromPrismaFolder(deletedFolder);
	} catch (error) {
		logger.error(`❌ Error al eliminar carpeta con ID: ${id}:`, error);
		throw error;
	}
}
