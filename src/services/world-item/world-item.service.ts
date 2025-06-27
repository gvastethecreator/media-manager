/**
 * 🌍 Servicio para la entidad WorldItem
 * @file Servicio de WorldItem con lógica de negocio
 * @module services/world-item.service
 * @description Capa de servicio para la entidad WorldItem que maneja la lógica de negocio
 * @updated 2025-07-01
 */

import { getPrismaClient } from '@/lib/database/db';
import { createEntityErrorObject, EntityErrorCode } from '@/lib/errors';
import { serverLogger } from '@/lib/logger/server-logger';
import { emit } from '@/lib/server/events.server';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats';
import {
	fromPrismaWorldItem,
	mapCreateWorldItemDataToPrisma,
	mapUpdateWorldItemDataToPrisma,
	mapWorldItemSearchOptionsToPrisma,
	toWorldItemWithStats,
	worldItemPayload,
} from '@/transformers/world-item';
import type { ImageComplete } from '@/types/entities/image';
import type {
	WorldItemComplete,
	WorldItemCreateInput,
	WorldItemSearchOptions,
	WorldItemUpdateInput,
	WorldItemWithStats,
} from '@/types/entities/world-item';

const worldItemLogger = serverLogger.withContext('WorldItemService');

// Función auxiliar para crear errores
const createWorldItemError = (
	message: string,
	code: EntityErrorCode = EntityErrorCode.OPERATION_FAILED,
	cause?: unknown
) => {
	return createEntityErrorObject('WorldItemError', message, code, cause);
};

/**
 * Obtiene todos los world items con opciones de búsqueda
 */
export async function getWorldItems(options: WorldItemSearchOptions = {}): Promise<WorldItemWithStats[]> {
	try {
		const prisma = await getPrismaClient();
		const findOptions = mapWorldItemSearchOptionsToPrisma(options);

		const worldItems = await prisma.worldItem.findMany({
			...findOptions,
			...worldItemPayload,
		});

		// Transformar a WorldItemWithStats
		return worldItems
			.map((item) => {
				const complete = fromPrismaWorldItem(item);
				return complete ? toWorldItemWithStats(complete) : null;
			})
			.filter((item): item is WorldItemWithStats => item !== null);
	} catch (error) {
		worldItemLogger.error('Error al obtener world items:', error);
		throw createWorldItemError('Error al obtener objetos del mundo', EntityErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Obtiene un world item por ID
 */
export async function getWorldItemById(id: string): Promise<WorldItemComplete | null> {
	try {
		const prisma = await getPrismaClient();
		const worldItem = await prisma.worldItem.findUnique({
			where: { id },
			...worldItemPayload,
		});

		if (!worldItem) {
			return null;
		}

		return fromPrismaWorldItem(worldItem);
	} catch (error) {
		worldItemLogger.error(`Error al obtener world item ${id}:`, error);
		throw createWorldItemError('Error al obtener objeto del mundo', EntityErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Obtiene un world item con estadísticas por ID
 */
export async function getWorldItemWithStatsById(id: string): Promise<WorldItemWithStats | null> {
	try {
		const worldItem = await getWorldItemById(id);
		return worldItem ? toWorldItemWithStats(worldItem) : null;
	} catch (error) {
		worldItemLogger.error(`Error al obtener world item con stats ${id}:`, error);
		throw createWorldItemError(
			'Error al obtener objeto del mundo con estadísticas',
			EntityErrorCode.OPERATION_FAILED,
			error
		);
	}
}

/**
 * Crea un nuevo world item
 */
export async function createWorldItem(input: WorldItemCreateInput): Promise<WorldItemComplete> {
	try {
		worldItemLogger.info('📝 Creando world item:', input.name);

		const prisma = await getPrismaClient();
		const data = mapCreateWorldItemDataToPrisma(input);

		const worldItem = await prisma.worldItem.create({
			data,
			...worldItemPayload,
		});

		const complete = fromPrismaWorldItem(worldItem);
		if (!complete) {
			throw createWorldItemError('Error al transformar world item creado', EntityErrorCode.OPERATION_FAILED);
		}

		// Emitir eventos
		await emit({
			type: 'world-items:modified',
			data: { action: 'create', worldItem },
		});
		statsEventEmitter.emit(STATS_EVENTS.WORLD_ITEM_CHANGE);

		worldItemLogger.info('✅ World item creado:', complete.name);
		return complete;
	} catch (error) {
		worldItemLogger.error('❌ Error al crear world item:', error);
		throw createWorldItemError('No se pudo crear el objeto del mundo', EntityErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Actualiza un world item existente
 */
export async function updateWorldItem(id: string, input: WorldItemUpdateInput): Promise<WorldItemComplete> {
	try {
		worldItemLogger.info('📝 Actualizando world item:', id);

		const prisma = await getPrismaClient();
		const data = mapUpdateWorldItemDataToPrisma(input);

		const worldItem = await prisma.worldItem.update({
			where: { id },
			data,
			...worldItemPayload,
		});

		const complete = fromPrismaWorldItem(worldItem);
		if (!complete) {
			throw createWorldItemError('Error al transformar world item actualizado', EntityErrorCode.OPERATION_FAILED);
		}

		// Emitir eventos
		await emit({
			type: 'world-items:modified',
			id,
			data: { action: 'update', worldItem },
		});
		statsEventEmitter.emit(STATS_EVENTS.WORLD_ITEM_CHANGE, id);

		worldItemLogger.info('✅ World item actualizado:', complete.name);
		return complete;
	} catch (error) {
		worldItemLogger.error('❌ Error al actualizar world item:', error);
		throw createWorldItemError('No se pudo actualizar el objeto del mundo', EntityErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Elimina un world item
 */
export async function deleteWorldItem(id: string): Promise<{ success: boolean }> {
	try {
		worldItemLogger.info('🗑️ Eliminando world item:', id);

		const prisma = await getPrismaClient();

		// Verificar que existe
		const worldItem = await prisma.worldItem.findUnique({
			where: { id },
			select: { id: true, name: true },
		});

		if (!worldItem) {
			throw createWorldItemError('World item no encontrado', EntityErrorCode.NOT_FOUND);
		}

		// Eliminar con desconexión de relaciones
		await prisma.$transaction([
			prisma.worldItem.update({
				where: { id },
				data: {
					images: { set: [] },
					videos: { set: [] },
					albums: { set: [] },
					collections: { set: [] },
					tags: { set: [] },
					characters: { set: [] },
					places: { set: [] },
					concepts: { set: [] },
					prompts: { set: [] },
					notes: { set: [] },
					wildcards: { set: [] },
					properties: { set: [] },
					groups: { set: [] },
				},
			}),
			prisma.worldItem.delete({
				where: { id },
			}),
		]);

		// Emitir eventos
		await emit({
			type: 'world-items:modified',
			id,
			data: { action: 'delete', id },
		});
		statsEventEmitter.emit(STATS_EVENTS.WORLD_ITEM_CHANGE);

		worldItemLogger.info('✅ World item eliminado:', id);
		return { success: true };
	} catch (error) {
		worldItemLogger.error('❌ Error al eliminar world item:', error);
		throw createWorldItemError('No se pudo eliminar el objeto del mundo', EntityErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Obtiene las imágenes de un world item
 */
export async function getWorldItemImages(worldItemId: string): Promise<{ images: ImageComplete[] }> {
	try {
		const prisma = await getPrismaClient();
		const worldItem = await prisma.worldItem.findUnique({
			where: { id: worldItemId },
			select: {
				images: {
					select: {
						id: true,
						name: true,
						path: true,
						thumbnail: true,
						width: true,
						height: true,
						size: true,
						createdAt: true,
					},
					orderBy: [{ isFavorite: 'desc' }, { createdAt: 'desc' }],
				},
			},
		});

		if (!worldItem) {
			throw createWorldItemError('World item no encontrado', EntityErrorCode.NOT_FOUND);
		}

		return { images: worldItem.images as ImageComplete[] };
	} catch (error) {
		worldItemLogger.error('❌ Error al obtener imágenes del world item:', error);
		throw createWorldItemError('No se pudieron obtener las imágenes', EntityErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Agrega una imagen a un world item
 */
export async function addImageToWorldItem(worldItemId: string, imageId: string): Promise<{ success: boolean }> {
	try {
		worldItemLogger.info('🔗 Agregando imagen a world item:', { worldItemId, imageId });

		const prisma = await getPrismaClient();
		await prisma.worldItem.update({
			where: { id: worldItemId },
			data: {
				images: {
					connect: { id: imageId },
				},
			},
		});

		// Emitir eventos
		await emit({
			type: 'world-items:modified',
			id: worldItemId,
			data: { action: 'update', relationModified: 'images' },
		});

		worldItemLogger.info('✅ Imagen agregada al world item');
		return { success: true };
	} catch (error) {
		worldItemLogger.error('❌ Error al agregar imagen:', error);
		throw createWorldItemError('No se pudo agregar la imagen', EntityErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Elimina una imagen de un world item
 */
export async function removeImageFromWorldItem(worldItemId: string, imageId: string): Promise<{ success: boolean }> {
	try {
		worldItemLogger.info('🔓 Eliminando imagen de world item:', { worldItemId, imageId });

		const prisma = await getPrismaClient();
		await prisma.worldItem.update({
			where: { id: worldItemId },
			data: {
				images: {
					disconnect: { id: imageId },
				},
			},
		});

		// Emitir eventos
		await emit({
			type: 'world-items:modified',
			id: worldItemId,
			data: { action: 'update', relationModified: 'images' },
		});

		worldItemLogger.info('✅ Imagen eliminada del world item');
		return { success: true };
	} catch (error) {
		worldItemLogger.error('❌ Error al eliminar imagen:', error);
		throw createWorldItemError('No se pudo eliminar la imagen', EntityErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Verifica si un world item existe
 */
export async function worldItemExists(id: string): Promise<boolean> {
	try {
		const prisma = await getPrismaClient();
		const count = await prisma.worldItem.count({
			where: { id },
		});
		return count > 0;
	} catch (error) {
		worldItemLogger.error(`Error al verificar existencia del world item ${id}:`, error);
		return false;
	}
}

/**
 * Obtiene el conteo total de world items
 */
export async function getWorldItemCount(filters?: WorldItemSearchOptions['filters']): Promise<number> {
	try {
		const prisma = await getPrismaClient();
		const findOptions = mapWorldItemSearchOptionsToPrisma({ filters });

		return await prisma.worldItem.count({
			where: findOptions.where,
		});
	} catch (error) {
		worldItemLogger.error('Error al obtener conteo de world items:', error);
		throw createWorldItemError('Error al obtener conteo de objetos del mundo', EntityErrorCode.OPERATION_FAILED, error);
	}
}
