'use server';

import { worldItemsCache } from '@/lib/cache';
import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import type { EventType } from '@/lib/server/events.server';
import { emit } from '@/lib/server/events.server';
import { convertServerImageToFileItem, type ServerImage } from '@/services/image-converter.service';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats.service';
import { revalidatePath } from 'next/cache';
// Importar tipos y transformers
import {
	fromPrismaWorldItem,
	mapCreateWorldItemDataToPrisma,
	mapUpdateWorldItemDataToPrisma,
	mapWorldItemFiltersToPrisma,
	mapWorldItemOrderByToPrisma,
	transformWorldItemToExtended,
} from '@/transformers/world-item';
import type {
	CreateWorldItemData,
	UpdateWorldItemData,
	WorldItem,
	WorldItemBase,
	WorldItemExtended,
	WorldItemFilters,
	WorldItemSortCriteria,
} from '@/types/entities/world-item';
import type { FileItem } from '@/types/files';

// Configuración y utilidades
const worldItemLogger = serverLogger.withContext('WorldItemActions');
const REVALIDATE_PATHS = ['/settings', '/world-items', '/world-items/[id]'] as const;

// Códigos de error
enum WorldItemErrorCode {
	NOT_FOUND = 'NOT_FOUND',
	VALIDATION_ERROR = 'VALIDATION_ERROR',
	OPERATION_FAILED = 'OPERATION_FAILED',
}

// Función creadora de errores (enfoque funcional)
const createWorldItemError = (
	message: string,
	code: WorldItemErrorCode = WorldItemErrorCode.OPERATION_FAILED,
	cause?: unknown
) => {
	const error = new Error(message);
	error.name = 'WorldItemError';
	Object.assign(error, { code, cause });
	return error;
};

// Interfaces adicionales para compatibilidad y extensión
export interface WorldItemWithStats extends WorldItemBase {
	_count: {
		images: number;
		groups: number;
		properties: number;
		wildcards: number;
	};
	totalSize: number;
	lastUpdated: Date;
	distribution?: Array<{
		name: string;
		count: number;
	}>;
	recentImages: string[];
}

export interface WorldItemWithImages extends WorldItemBase {
	images: FileItem[];
}

// Funciones utilitarias
const revalidateAllPaths = async () => {
	for (const path of REVALIDATE_PATHS) {
		revalidatePath(path);
	}
	worldItemLogger.info('🔄 Rutas revalidadas');
};

const notifyWorldItemChange = async (
	action: 'create' | 'update' | 'delete' | 'addImage' | 'removeImage',
	worldItemId: string,
	worldItem?: WorldItem,
	imageId?: string
) => {
	// Emitir eventos generales
	if (action === 'create' || action === 'update' || action === 'delete') {
		await emit({
			type: 'world-items:modified' as EventType,
			...(worldItemId ? { id: worldItemId } : {}),
			data: {
				action,
				...(worldItem ? { item: worldItem } : {}),
			},
		});
	} else if (imageId) {
		// Para acciones relacionadas con imágenes
		await emit({
			type: 'world-items:modified' as EventType,
			id: worldItemId,
			imageId,
			data: { action },
		});
	}

	// Actualizar estadísticas
	if (action === 'create' || action === 'update' || action === 'delete') {
		statsEventEmitter.emit(STATS_EVENTS.WORLD_ITEM_CHANGE);
	} else {
		statsEventEmitter.emit(STATS_EVENTS.STATS_UPDATED);
	}
};

// Acciones del servidor
/**
 * Obtiene todos los objetos del mundo
 * @param filters Filtros opcionales para la búsqueda
 * @param sortBy Criterio de ordenación opcional
 * @returns Lista de objetos del mundo con estadísticas
 */
export async function getWorldItems(
	filters?: WorldItemFilters,
	sortBy?: WorldItemSortCriteria
): Promise<
	(WorldItemExtended & {
		totalSize: number;
		imageCount?: number;
		recentImages?: string[];
	})[]
> {
	// Si hay filtros activos o un criterio de ordenación específico,
	// saltamos la caché para obtener datos frescos
	const useCache = !filters && !sortBy;

	if (useCache) {
		const cached = await worldItemsCache.get('all');
		if (cached) {
			worldItemLogger.info('✅ Objetos del mundo obtenidos de caché');

			// Convertir los datos del caché al formato esperado
			return cached.map((item) => ({
				...item,
				createdAt: new Date(item.createdAt as string),
				updatedAt: new Date(item.updatedAt as string),
				// Asegurar que los campos JSON estén correctamente deserializados
				attributes: Array.isArray(item.attributes) ? item.attributes : [],
				effects: Array.isArray(item.effects) ? item.effects : [],
				requirements: typeof item.requirements === 'object' ? item.requirements : {},
				stats: typeof item.stats === 'object' ? item.stats : {},
				tags: Array.isArray(item.tags) ? item.tags : [],
				filters: typeof item.filters === 'object' ? item.filters : {},
			}));
		}
	}

	try {
		worldItemLogger.info('🔍 Obteniendo objetos del mundo (simplificado)');

		// Crear el filtro y el ordenamiento con los nuevos transformadores
		const whereCondition = mapWorldItemFiltersToPrisma(filters);
		// Cambiar el orderBy por defecto: Eliminar ordenación por _count de relación
		const defaultOrderBy = { updatedAt: 'desc' } as const; // Ordenar por fecha de actualización por defecto
		const orderByCondition = sortBy ? mapWorldItemOrderByToPrisma(sortBy) : defaultOrderBy;

		// DEBUG: Log de condiciones (ya presente, pero aseguramos que esté activo)
		worldItemLogger.debug('🔍 Prisma findMany - Where:', JSON.stringify(whereCondition, null, 2));
		worldItemLogger.debug('🔍 Prisma findMany - OrderBy:', JSON.stringify(orderByCondition, null, 2));

		// Consulta simplificada: Solo incluir _count
		const worldItems = await prisma.worldItem.findMany({
			where: whereCondition,
			include: {
				_count: {
					select: {
						images: true,
						notes: true,
						concepts: true,
						prompts: true,
						groups: true,
						properties: true,
						wildcards: true,
						tags: true,
					},
				},
				// Comentado/Eliminado: Incluir relaciones completas es costoso aquí
				// images: { ... },
				// groups: { ... },
				// properties: { ... },
				// wildcards: { ... },
				// tagEntities: { ... },
			},
			orderBy: orderByCondition,
		});

		// Mapear resultados llamando directamente a los transformadores
		const processedItems = worldItems.map((worldItem) => {
			// Ahora que fromPrismaWorldItem es robusto y parsea JSON,
			// podemos llamar a transformWorldItemToExtended directamente.
			const extendedItem = transformWorldItemToExtended(fromPrismaWorldItem(worldItem));

			return {
				...extendedItem,
				totalSize: 0, // Calcular por separado o bajo demanda
				imageCount: worldItem._count?.images ?? 0,
				recentImages: [], // Obtener por separado o bajo demanda
			};
		});

		// Comentado/Eliminado: Cálculo complejo de estadísticas y recentImages movido
		// const processedItems = await Promise.all(
		// 	worldItems.map(async (worldItem) => {
		// 		// ... cálculo de totalSize y recentImages eliminado ...
		// 	})
		// );

		if (useCache) {
			await worldItemsCache.set('all', processedItems);
			worldItemLogger.info('💾 Caché de objetos del mundo actualizada');
		}

		worldItemLogger.info('✅ Objetos del mundo (simplificado) obtenidos', { count: worldItems.length });
		return processedItems;
	} catch (error) {
		worldItemLogger.error('❌ Error al obtener objetos del mundo (simplificado):', error);
		if (error instanceof Error && error.name === 'WorldItemError') {
			throw error;
		}
		throw createWorldItemError(
			'No se pudieron obtener los objetos del mundo',
			WorldItemErrorCode.OPERATION_FAILED,
			error
		);
	}
}

/**
 * Obtiene un objeto del mundo por su ID
 * @param id ID del objeto del mundo
 * @returns Objeto del mundo extendido con datos deserializados
 */
export async function getWorldItemById(id: string): Promise<WorldItemExtended> {
	try {
		worldItemLogger.info('🔍 Obteniendo objeto del mundo:', id);
		const worldItem = await prisma.worldItem.findUnique({
			where: { id },
			include: {
				_count: {
					select: {
						images: true,
						notes: true,
						concepts: true,
						prompts: true,
						groups: true,
						properties: true,
						wildcards: true,
						tagEntities: true,
					},
				},
				images: {
					take: 5,
					orderBy: { createdAt: 'desc' },
				},
				groups: {
					select: {
						id: true,
						name: true,
					},
				},
				properties: {
					select: {
						id: true,
						name: true,
					},
				},
				wildcards: {
					select: {
						id: true,
						name: true,
					},
				},
				tagEntities: {
					select: {
						id: true,
						name: true,
					},
				},
			},
		});

		if (!worldItem) {
			throw createWorldItemError('Objeto del mundo no encontrado', WorldItemErrorCode.NOT_FOUND);
		}

		worldItemLogger.info('✅ Objeto del mundo obtenido:', worldItem.name);

		// Transformar con los nuevos transformadores para deserializar correctamente los campos JSON
		return transformWorldItemToExtended(fromPrismaWorldItem(worldItem));
	} catch (error) {
		worldItemLogger.error('❌ Error al obtener objeto del mundo', { id, error });
		// Preservar el código de error si ya es un WorldItemError
		if (error instanceof Error && 'code' in error) {
			throw error;
		}
		throw createWorldItemError('No se pudo obtener el objeto del mundo', WorldItemErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Crea un nuevo objeto del mundo
 * @param data Datos para crear el objeto del mundo
 * @returns Objeto del mundo extendido con datos deserializados
 */
export async function createWorldItem(data: CreateWorldItemData): Promise<WorldItemExtended> {
	try {
		worldItemLogger.info('📝 Creando objeto del mundo:', data.name);

		// Usar el transformer para preparar los datos
		const createData = mapCreateWorldItemDataToPrisma(data);

		const worldItem = await prisma.worldItem.create({
			data: createData,
			include: {
				_count: {
					select: {
						images: true,
						notes: true,
						concepts: true,
						prompts: true,
						groups: true,
						properties: true,
						wildcards: true,
						tagEntities: true,
					},
				},
				groups: true,
				properties: true,
				wildcards: true,
				tagEntities: true,
			},
		});

		await notifyWorldItemChange('create', worldItem.id, worldItem);
		await revalidateAllPaths();

		worldItemLogger.info('✅ Objeto del mundo creado:', worldItem.name);

		// Transformar con los nuevos transformadores
		return transformWorldItemToExtended(fromPrismaWorldItem(worldItem));
	} catch (error) {
		worldItemLogger.error('❌ Error al crear objeto del mundo', error);
		throw createWorldItemError('No se pudo crear el objeto del mundo', WorldItemErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Actualiza un objeto del mundo existente
 * @param id ID del objeto del mundo a actualizar
 * @param data Datos para actualizar el objeto del mundo
 * @returns Objeto del mundo extendido con datos deserializados
 */
export async function updateWorldItem(id: string, data: UpdateWorldItemData): Promise<WorldItemExtended> {
	try {
		worldItemLogger.info('📝 Actualizando objeto del mundo:', id);

		// Verificar que el objeto existe
		const existing = await prisma.worldItem.findUnique({
			where: { id },
		});

		if (!existing) {
			throw createWorldItemError('Objeto del mundo no encontrado', WorldItemErrorCode.NOT_FOUND);
		}

		// Usar el transformer para preparar los datos
		const updateData = mapUpdateWorldItemDataToPrisma(data);

		// Actualizar el objeto
		const updated = await prisma.worldItem.update({
			where: { id },
			data: updateData,
			include: {
				_count: {
					select: {
						images: true,
						notes: true,
						concepts: true,
						prompts: true,
						groups: true,
						properties: true,
						wildcards: true,
						tagEntities: true,
					},
				},
				groups: true,
				properties: true,
				wildcards: true,
				tagEntities: true,
			},
		});

		await notifyWorldItemChange('update', id, updated);
		await revalidateAllPaths();

		worldItemLogger.info('✅ Objeto del mundo actualizado:', updated.name);

		// Transformar con los nuevos transformadores
		return transformWorldItemToExtended(fromPrismaWorldItem(updated));
	} catch (error) {
		worldItemLogger.error('❌ Error al actualizar objeto del mundo', { id, error });
		// Preservar el código de error si ya es un WorldItemError
		if (error instanceof Error && 'code' in error) {
			throw error;
		}
		throw createWorldItemError('No se pudo actualizar el objeto del mundo', WorldItemErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Elimina un objeto del mundo
 */
export async function deleteWorldItem(id: string): Promise<{ success: boolean }> {
	try {
		worldItemLogger.info('🗑️ Eliminando objeto del mundo:', id);

		// Verificar que el objeto existe
		const existing = await prisma.worldItem.findUnique({
			where: { id },
		});

		if (!existing) {
			throw createWorldItemError('Objeto del mundo no encontrado', WorldItemErrorCode.NOT_FOUND);
		}

		// Primero desconectar todas las relaciones
		await prisma.$transaction([
			prisma.worldItem.update({
				where: { id },
				data: {
					images: { set: [] },
					notes: { set: [] },
					concepts: { set: [] },
					prompts: { set: [] },
				},
			}),
			prisma.worldItem.delete({
				where: { id },
			}),
		]);

		await notifyWorldItemChange('delete', id);
		await revalidateAllPaths();

		worldItemLogger.info('✅ Objeto del mundo eliminado');
		return { success: true };
	} catch (error) {
		worldItemLogger.error('❌ Error al eliminar objeto del mundo', { id, error });
		// Preservar el código de error si ya es un WorldItemError
		if (error instanceof Error && 'code' in error) {
			throw error;
		}
		throw createWorldItemError('No se pudo eliminar el objeto del mundo', WorldItemErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Obtiene las imágenes asociadas a un objeto del mundo
 */
export async function getWorldItemImages(id: string): Promise<FileItem[]> {
	try {
		worldItemLogger.info('🖼️ Obteniendo imágenes para objeto del mundo:', id);

		// Verificar que el objeto existe
		const existing = await prisma.worldItem.findUnique({
			where: { id },
		});

		if (!existing) {
			throw createWorldItemError('Objeto del mundo no encontrado', WorldItemErrorCode.NOT_FOUND);
		}

		// Obtener imágenes asociadas
		const worldItem = await prisma.worldItem.findUnique({
			where: { id },
			include: {
				images: true,
			},
		});

		if (!worldItem) {
			throw createWorldItemError('Objeto del mundo no encontrado', WorldItemErrorCode.NOT_FOUND);
		}

		// Convertir imágenes a FileItem
		const images = worldItem.images.map((image) => convertServerImageToFileItem(image as unknown as ServerImage));

		worldItemLogger.info('✅ Imágenes obtenidas para objeto del mundo', { count: images.length });
		return images;
	} catch (error) {
		worldItemLogger.error('❌ Error al obtener imágenes para objeto del mundo', { id, error });
		// Preservar el código de error si ya es un WorldItemError
		if (error instanceof Error && 'code' in error) {
			throw error;
		}
		throw createWorldItemError('No se pudieron obtener las imágenes', WorldItemErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Asocia una imagen a un objeto del mundo
 */
export async function addImageToWorldItem(worldItemId: string, imageId: string): Promise<{ success: boolean }> {
	try {
		worldItemLogger.info('🖼️ Agregando imagen a objeto del mundo', { worldItemId, imageId });

		// Actualizar la relación
		await prisma.worldItem.update({
			where: { id: worldItemId },
			data: {
				images: {
					connect: { id: imageId },
				},
			},
		});

		await notifyWorldItemChange('addImage', worldItemId, undefined, imageId);
		await revalidateAllPaths();

		worldItemLogger.info('✅ Imagen agregada a objeto del mundo');
		return { success: true };
	} catch (error) {
		worldItemLogger.error('❌ Error al agregar imagen a objeto del mundo', { worldItemId, imageId, error });
		throw createWorldItemError(
			'No se pudo agregar la imagen al objeto del mundo',
			WorldItemErrorCode.OPERATION_FAILED,
			error
		);
	}
}

/**
 * Desasocia una imagen de un objeto del mundo
 */
export async function removeImageFromWorldItem(worldItemId: string, imageId: string): Promise<{ success: boolean }> {
	try {
		worldItemLogger.info('🖼️ Eliminando imagen de objeto del mundo', { worldItemId, imageId });

		// Actualizar la relación
		await prisma.worldItem.update({
			where: { id: worldItemId },
			data: {
				images: {
					disconnect: { id: imageId },
				},
			},
		});

		await notifyWorldItemChange('removeImage', worldItemId, undefined, imageId);
		await revalidateAllPaths();

		worldItemLogger.info('✅ Imagen eliminada de objeto del mundo');
		return { success: true };
	} catch (error) {
		worldItemLogger.error('❌ Error al eliminar imagen de objeto del mundo', { worldItemId, imageId, error });
		throw createWorldItemError(
			'No se pudo eliminar la imagen del objeto del mundo',
			WorldItemErrorCode.OPERATION_FAILED,
			error
		);
	}
}
