'use server';

import { getPrismaClient } from '@/lib/db';
import { createEntityErrorObject, EntityErrorCode } from '@/lib/errors';
import { serverLogger } from '@/lib/logger/server-logger';
import { emit } from '@/lib/server/events.server';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats.service';
import {
    fromPrismaWorldItem,
    mapCreateWorldItemDataToPrisma,
    mapUpdateWorldItemDataToPrisma,
    mapWorldItemSearchOptionsToPrisma,
    toWorldItemWithStats,
    worldItemPayload,
} from '@/transformers/world-item';
import type {
    WorldItemBase,
    WorldItemCreateInput,
    WorldItemSearchOptions,
    WorldItemUpdateInput,
    WorldItemWithStats,
} from '@/types/entities/world-item';
import { revalidatePath } from 'next/cache';

const worldItemLogger = serverLogger.withContext('WorldItemActions');

const REVALIDATE_PATHS = ['/settings/world-items', '/library/world-items'] as const;

const revalidateAllPaths = async (id?: string) => {
	for (const path of REVALIDATE_PATHS) {
		revalidatePath(path);
	}
	if (id) {
		revalidatePath(`/library/world-items/${id}`);
	}
	worldItemLogger.info('🔄 Rutas revalidadas');
};

// Función creadora de errores (enfoque funcional)
const createWorldItemError = (
	message: string,
	code: EntityErrorCode = EntityErrorCode.OPERATION_FAILED,
	cause?: unknown
) => {
	return createEntityErrorObject('WorldItemError', message, code, cause);
};

/**
 * Obtiene todos los world items con estadísticas
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
			.map(item => {
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
 * Obtiene un world item específico por ID con estadísticas
 */
export async function getWorldItemById(id: string): Promise<WorldItemWithStats | null> {
	try {
		const prisma = await getPrismaClient();
		const worldItem = await prisma.worldItem.findUnique({
			where: { id },
			...worldItemPayload,
		});

		if (!worldItem) {
			return null;
		}

		const complete = fromPrismaWorldItem(worldItem);
		return complete ? toWorldItemWithStats(complete) : null;
	} catch (error) {
		worldItemLogger.error(`Error al obtener world item ${id}:`, error);
		throw createWorldItemError('Error al obtener objeto del mundo', EntityErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Crea un nuevo world item
 */
export async function createWorldItem(input: WorldItemCreateInput): Promise<WorldItemBase> {
	try {
		worldItemLogger.info('📝 Creando world item:', input.name);

		const prisma = await getPrismaClient();
		const data = mapCreateWorldItemDataToPrisma(input);
		const worldItem = await prisma.worldItem.create({
			data,
		});

		await emit({
			type: 'worldItems:modified',
			data: { action: 'create', worldItem },
		});
		statsEventEmitter.emit(STATS_EVENTS.WORLD_ITEM_CHANGE);

		worldItemLogger.info('✅ World item creado:', worldItem.name);
		await revalidateAllPaths();
		return worldItem;
	} catch (error) {
		worldItemLogger.error('❌ Error al crear world item:', error);
		throw createWorldItemError('No se pudo crear el objeto del mundo', EntityErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Actualiza un world item existente
 */
export async function updateWorldItem(id: string, input: WorldItemUpdateInput): Promise<WorldItemBase> {
	try {
		worldItemLogger.info('📝 Actualizando world item:', id);

		const prisma = await getPrismaClient();
		const data = mapUpdateWorldItemDataToPrisma(input);
		const worldItem = await prisma.worldItem.update({
			where: { id },
			data,
		});

		await emit({
			type: 'worldItems:modified',
			id,
			data: { action: 'update', worldItem },
		});
		statsEventEmitter.emit(STATS_EVENTS.WORLD_ITEM_CHANGE, id);

		worldItemLogger.info('✅ World item actualizado:', worldItem.name);
		await revalidateAllPaths(id);
		return worldItem;
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

		await emit({
			type: 'worldItems:modified',
			id,
			data: { action: 'delete', id },
		});
		statsEventEmitter.emit(STATS_EVENTS.WORLD_ITEM_CHANGE);

		worldItemLogger.info('✅ World item eliminado:', id);
		await revalidateAllPaths();
		return { success: true };
	} catch (error) {
		worldItemLogger.error('❌ Error al eliminar world item:', error);
		throw createWorldItemError('No se pudo eliminar el objeto del mundo', EntityErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Obtiene las imágenes de un world item
 */
export async function getWorldItemImages(worldItemId: string): Promise<{ images: any[] }> {
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
						thumbnailUrl: true,
						width: true,
						height: true,
						size: true,
						createdAt: true,
					},
					orderBy: [
						{ isFavorite: 'desc' },
						{ createdAt: 'desc' },
					],
				},
			},
		});

		if (!worldItem) {
			throw createWorldItemError('World item no encontrado', EntityErrorCode.NOT_FOUND);
		}

		return { images: worldItem.images };
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

		await emit({
			type: 'worldItems:modified',
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

		await emit({
			type: 'worldItems:modified',
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
