/**
 * 🌍 Servicio para la entidad WorldItem
 * @file Servicio de WorldItem con lógica de negocio
 * @module services/world-item.service
 * @description Capa de servicio para la entidad WorldItem que maneja la lógica de negocio
 * @updated 2025-07-01
 */

// Drizzle imports

import { db } from '@/lib/drizzle';
import { worldItems } from '@/lib/drizzle/schema';
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
import { asc, eq } from 'drizzle-orm';

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
		// **MIGRACIÓN A DRIZZLE**
		worldItemLogger.info('🌍 Obteniendo world items con opciones:', options);

		// Por ahora, implementación básica sin filtros complejos
		const drizzleWorldItems = await db
			.select({
				id: worldItems.id,
				name: worldItems.name,
				description: worldItems.description,
				emoji: worldItems.emoji,
				color: worldItems.color,
				shortcut: worldItems.shortcut,
				category: worldItems.category,
				type: worldItems.type,
				subtype: worldItems.subtype,
				rarity: worldItems.rarity,
				value: worldItems.value,
				weight: worldItems.weight,
				size: worldItems.size,
				material: worldItems.material,
				origin: worldItems.origin,
				crafting: worldItems.crafting,
				requirements: worldItems.requirements,
				effects: worldItems.effects,
				properties: worldItems.properties,
				lore: worldItems.lore,
				history: worldItems.history,
				notes: worldItems.notes,
				sortBy: worldItems.sortBy,
				filters: worldItems.filters,
				featuredImage: worldItems.featuredImage,
				isFavorite: worldItems.isFavorite,
				isArchived: worldItems.isArchived,
				createdAt: worldItems.createdAt,
				updatedAt: worldItems.updatedAt,
			})
			.from(worldItems)
			.orderBy(asc(worldItems.name));

		// Transformar a formato compatible con Prisma
		const transformedWorldItems = drizzleWorldItems.map((rawWorldItem) => ({
			...rawWorldItem,
			isFavorite: Boolean(rawWorldItem.isFavorite),
			isArchived: Boolean(rawWorldItem.isArchived),
			// Counts vacíos por ahora (TODO: implementar subqueries)
			_count: {
				images: 0,
				videos: 0,
				albums: 0,
				collections: 0,
				tags: 0,
				characters: 0,
				places: 0,
				concepts: 0,
				prompts: 0,
				notes: 0,
				wildcards: 0,
				properties: 0,
				groups: 0,
			},
		}));

		// **VALIDACIÓN DUAL EN DESARROLLO**
		if (process.env.NODE_ENV === 'development') {
			try {
				const prisma = await getPrismaClient();
				const findOptions = mapWorldItemSearchOptionsToPrisma(options);

				const prismaWorldItems = await prisma.worldItem.findMany({
					...findOptions,
					...worldItemPayload,
				});

				if (Math.abs(transformedWorldItems.length - prismaWorldItems.length) > 0) {
					worldItemLogger.warn('⚠️ Diferencia en conteo getWorldItems:', {
						drizzle: transformedWorldItems.length,
						prisma: prismaWorldItems.length
					});
				} else {
					worldItemLogger.info('✅ Validación dual exitosa getWorldItems:', {
						total: transformedWorldItems.length
					});
				}
			} catch (validationError) {
				worldItemLogger.error('❌ Error en validación dual getWorldItems:', validationError);
			}
		}

		// Transformar a WorldItemWithStats
		return transformedWorldItems
			.map((item) => {
				const complete = fromPrismaWorldItem(item as any);
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
		// **MIGRACIÓN A DRIZZLE**
		worldItemLogger.info(`🔍 Obteniendo world item por ID: ${id}`);

		const drizzleWorldItem = await db
			.select({
				id: worldItems.id,
				name: worldItems.name,
				description: worldItems.description,
				emoji: worldItems.emoji,
				color: worldItems.color,
				shortcut: worldItems.shortcut,
				category: worldItems.category,
				type: worldItems.type,
				subtype: worldItems.subtype,
				rarity: worldItems.rarity,
				value: worldItems.value,
				weight: worldItems.weight,
				size: worldItems.size,
				material: worldItems.material,
				origin: worldItems.origin,
				crafting: worldItems.crafting,
				requirements: worldItems.requirements,
				effects: worldItems.effects,
				properties: worldItems.properties,
				lore: worldItems.lore,
				history: worldItems.history,
				notes: worldItems.notes,
				sortBy: worldItems.sortBy,
				filters: worldItems.filters,
				featuredImage: worldItems.featuredImage,
				isFavorite: worldItems.isFavorite,
				isArchived: worldItems.isArchived,
				createdAt: worldItems.createdAt,
				updatedAt: worldItems.updatedAt,
			})
			.from(worldItems)
			.where(eq(worldItems.id, id))
			.limit(1);

		if (drizzleWorldItem.length === 0) {
			worldItemLogger.warn(`World item no encontrado: ${id}`);
			return null;
		}

		const rawWorldItem = drizzleWorldItem[0];

		// Transformar a formato compatible con Prisma
		const transformedWorldItem = {
			...rawWorldItem,
			isFavorite: Boolean(rawWorldItem.isFavorite),
			isArchived: Boolean(rawWorldItem.isArchived),
			// Counts vacíos por ahora (TODO: implementar subqueries)
			_count: {
				images: 0,
				videos: 0,
				albums: 0,
				collections: 0,
				tags: 0,
				characters: 0,
				places: 0,
				concepts: 0,
				prompts: 0,
				notes: 0,
				wildcards: 0,
				properties: 0,
				groups: 0,
			},
		};

		// **VALIDACIÓN DUAL EN DESARROLLO**
		if (process.env.NODE_ENV === 'development') {
			try {
				const prisma = await getPrismaClient();
				const prismaWorldItem = await prisma.worldItem.findUnique({
					where: { id },
					...worldItemPayload,
				});

				if (prismaWorldItem && transformedWorldItem) {
					worldItemLogger.info('✅ Validación dual exitosa getWorldItemById:', {
						worldItemName: transformedWorldItem.name
					});
				} else if (!prismaWorldItem && !transformedWorldItem) {
					worldItemLogger.info('✅ Validación dual exitosa getWorldItemById: ambos null');
				} else {
					worldItemLogger.warn('⚠️ Diferencia en getWorldItemById:', {
						drizzleFound: !!transformedWorldItem,
						prismaFound: !!prismaWorldItem
					});
				}
			} catch (validationError) {
				worldItemLogger.error('❌ Error en validación dual getWorldItemById:', validationError);
			}
		}

		return fromPrismaWorldItem(transformedWorldItem as any);
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
		// **MIGRACIÓN A DRIZZLE** - Usa el método migrado
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
