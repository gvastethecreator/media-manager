/**
 * 🌍 Servicio para la entidad WorldItem
 * @file Servicio de WorldItem con lógica de negocio
 * @module services/world-item.service
 * @description Capa de servicio para la entidad WorldItem que maneja la lógica de negocio
 * @updated 2025-07-01
 */

// Drizzle imports

import * as crypto from 'crypto';
import { and, asc, count, desc, eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { images, imageWorldItems, worldItems } from '@/lib/drizzle/schema/index';
import { createEntityErrorObject, EntityErrorCode } from '@/lib/errors';
import { serverLogger } from '@/lib/logger/server-logger';
import { emit } from '@/lib/server/events.server';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats';
import { toWorldItemWithStats } from '@/transformers/world-item';
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
				category: worldItems.category,

				isFavorite: worldItems.isFavorite,
				totalImages: worldItems.totalImages,
				totalVideos: worldItems.totalVideos,
				type: worldItems.type,
				rarity: worldItems.rarity,
				value: worldItems.value,
				weight: worldItems.weight,
				materials: worldItems.materials,
				origin: worldItems.origin,
				properties: worldItems.properties,
				uses: worldItems.uses,
				history: worldItems.history,
				notes: worldItems.notes,
				featuredImage: worldItems.featuredImage,
				parentId: worldItems.parentId,
				createdAt: worldItems.createdAt,
				updatedAt: worldItems.updatedAt,
			})
			.from(worldItems)
			.orderBy(asc(worldItems.name));

		// Transformar a formato esperado
		const transformedWorldItems = drizzleWorldItems.map((rawWorldItem: (typeof drizzleWorldItems)[0]) => ({
			...rawWorldItem,
			isFavorite: Boolean(rawWorldItem.isFavorite),
		}));

		// Transformar a WorldItemWithStats
		return transformedWorldItems.map((item: (typeof transformedWorldItems)[0]) => {
			// Crear WorldItemComplete directamente
			const complete: WorldItemComplete = item as WorldItemComplete;
			return toWorldItemWithStats(complete);
		});
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

		// Transformar a formato esperado
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

		return transformedWorldItem as WorldItemComplete;
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

		// **MIGRACIÓN A DRIZZLE**
		const result = await db
			.insert(worldItems)
			.values({
				id: crypto.randomUUID(),
				name: input.name,
				description: input.description || null,
				emoji: input.emoji || '🌍',
				color: input.color || '#3b82f6',
				category: input.category || null,

				isFavorite: input.isFavorite,
				totalImages: input.totalImages || 0,
				totalVideos: input.totalVideos || 0,
				type: input.type || null,
				rarity: input.rarity || null,
				value: input.value || null,
				weight: input.weight || null,
				materials: input.materials || null,
				origin: input.origin || null,
				properties: input.properties || null,
				uses: input.uses || null,
				history: input.history || null,
				notes: input.notes || null,
				featuredImage: input.featuredImage || null,
				parentId: input.parentId || null,
				createdAt: new Date(),
				updatedAt: new Date(),
			})
			.returning();

		const worldItem = result[0];

		// Transformar a formato compatible
		const complete: WorldItemComplete = {
			...worldItem,
			isFavorite: Boolean(worldItem.isFavorite),
		};

		// Emitir eventos
		await emit({
			type: 'world-items:modified',
			data: { action: 'create', worldItem: complete },
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

		// **MIGRACIÓN A DRIZZLE**
		const updateData: any = {
			updatedAt: new Date(),
		};

		// Mapear campos opcionales
		if (input.name !== undefined) {
			updateData.name = input.name;
		}
		if (input.description !== undefined) {
			updateData.description = input.description;
		}
		if (input.emoji !== undefined) {
			updateData.emoji = input.emoji;
		}
		if (input.color !== undefined) {
			updateData.color = input.color;
		}
		if (input.category !== undefined) {
			updateData.category = input.category;
		}

		if (input.isFavorite !== undefined) {
			updateData.isFavorite = input.isFavorite;
		}
		if (input.totalImages !== undefined) {
			updateData.totalImages = input.totalImages;
		}
		if (input.totalVideos !== undefined) {
			updateData.totalVideos = input.totalVideos;
		}
		if (input.type !== undefined) {
			updateData.type = input.type;
		}
		if (input.rarity !== undefined) {
			updateData.rarity = input.rarity;
		}
		if (input.value !== undefined) {
			updateData.value = input.value;
		}
		if (input.weight !== undefined) {
			updateData.weight = input.weight;
		}
		if (input.materials !== undefined) {
			updateData.materials = input.materials;
		}
		if (input.origin !== undefined) {
			updateData.origin = input.origin;
		}
		if (input.properties !== undefined) {
			updateData.properties = input.properties;
		}
		if (input.uses !== undefined) {
			updateData.uses = input.uses;
		}
		if (input.history !== undefined) {
			updateData.history = input.history;
		}
		if (input.notes !== undefined) {
			updateData.notes = input.notes;
		}
		if (input.featuredImage !== undefined) {
			updateData.featuredImage = input.featuredImage;
		}
		if (input.parentId !== undefined) {
			updateData.parentId = input.parentId;
		}

		const result = await db.update(worldItems).set(updateData).where(eq(worldItems.id, id)).returning();

		if (result.length === 0) {
			throw createWorldItemError('World item no encontrado', EntityErrorCode.NOT_FOUND);
		}

		const worldItem = result[0];

		// Transformar a formato compatible
		const complete: WorldItemComplete = {
			...worldItem,
			isFavorite: Boolean(worldItem.isFavorite),
		};

		// Emitir eventos
		await emit({
			type: 'world-items:modified',
			id,
			data: { action: 'update', worldItem: complete },
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

		// **MIGRACIÓN A DRIZZLE**
		// Verificar que existe
		const existingWorldItem = await db
			.select({ id: worldItems.id, name: worldItems.name })
			.from(worldItems)
			.where(eq(worldItems.id, id))
			.limit(1);

		if (existingWorldItem.length === 0) {
			throw createWorldItemError('World item no encontrado', EntityErrorCode.NOT_FOUND);
		}

		// Eliminar directamente (las relaciones many-to-many se manejan automáticamente)
		const result = await db.delete(worldItems).where(eq(worldItems.id, id)).returning();

		if (result.length === 0) {
			throw createWorldItemError('Error al eliminar world item', EntityErrorCode.OPERATION_FAILED);
		}

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
		// **MIGRACIÓN A DRIZZLE**
		// Verificar que el world item existe
		const worldItemExists = await db
			.select({ id: worldItems.id })
			.from(worldItems)
			.where(eq(worldItems.id, worldItemId))
			.limit(1);

		if (worldItemExists.length === 0) {
			throw createWorldItemError('World item no encontrado', EntityErrorCode.NOT_FOUND);
		}

		// Obtener las imágenes relacionadas con join
		const worldItemImages = await db
			.select({
				id: images.id,
				name: images.name,
				path: images.path,
				thumbnail: images.thumbnail,
				width: images.width,
				height: images.height,
				size: images.size,
				createdAt: images.createdAt,
				isFavorite: images.isFavorite,
			})
			.from(images)
			.innerJoin(imageWorldItems, eq(images.id, imageWorldItems.A))
			.where(eq(imageWorldItems.B, worldItemId))
			.orderBy(desc(images.isFavorite), desc(images.createdAt));

		// Transformar a formato esperado
		const transformedImages = worldItemImages.map((img: (typeof worldItemImages)[0]) => ({
			...img,
			isFavorite: Boolean(img.isFavorite),
		}));

		return { images: transformedImages as ImageComplete[] };
	} catch (error) {
		worldItemLogger.error('❗ Error al obtener imágenes del world item:', error);
		throw createWorldItemError('No se pudieron obtener las imágenes', EntityErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Agrega una imagen a un world item
 */
export async function addImageToWorldItem(worldItemId: string, imageId: string): Promise<{ success: boolean }> {
	try {
		worldItemLogger.info('🔗 Agregando imagen a world item:', { worldItemId, imageId });

		// **MIGRACIÓN A DRIZZLE**
		// Insertar relación en la tabla many-to-many
		await db
			.insert(imageWorldItems)
			.values({
				A: imageId, // imageId
				B: worldItemId, // worldItemId
			})
			.onConflictDoNothing(); // Evitar duplicados

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

		// **MIGRACIÓN A DRIZZLE**
		// Eliminar relación de la tabla many-to-many
		await db.delete(imageWorldItems).where(
			and(
				eq(imageWorldItems.A, imageId), // imageId
				eq(imageWorldItems.B, worldItemId) // worldItemId
			)
		);

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
		// **MIGRACIÓN A DRIZZLE**
		const result = await db.select({ count: count() }).from(worldItems).where(eq(worldItems.id, id));

		return result[0].count > 0;
	} catch (error) {
		worldItemLogger.error(`Error al verificar existencia del world item ${id}:`, error);
		return false;
	}
}

/**
 * Obtiene el conteo total de world items
 */
export async function getWorldItemCount(_filters?: WorldItemSearchOptions['filters']): Promise<number> {
	try {
		// **MIGRACIÓN A DRIZZLE**
		// Por ahora implementación básica sin filtros complejos
		const result = await db.select({ count: count() }).from(worldItems);
		return result[0].count;
	} catch (error) {
		worldItemLogger.error('Error al obtener conteo de world items:', error);
		throw createWorldItemError('Error al obtener conteo de objetos del mundo', EntityErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Clase de servicio para gestión de objetos del mundo
 */
export class WorldItemService {
	async getWorldItems(filters?: any): Promise<{ worldItems: WorldItemWithStats[]; total: number }> {
		const worldItems = await getWorldItems(filters || {});
		return { worldItems, total: worldItems.length };
	}

	async getWorldItemById(id: string): Promise<WorldItemWithStats | null> {
		const worldItem = await getWorldItemById(id);
		if (!worldItem) {
			return null;
		}
		return toWorldItemWithStats(worldItem);
	}

	async createWorldItem(data: WorldItemCreateInput): Promise<WorldItemWithStats> {
		const worldItem = await createWorldItem(data);
		return toWorldItemWithStats(worldItem);
	}

	async updateWorldItem(id: string, data: WorldItemUpdateInput): Promise<WorldItemWithStats | null> {
		try {
			const worldItem = await updateWorldItem(id, data);
			return toWorldItemWithStats(worldItem);
		} catch (error) {
			if (error instanceof Error && error.message.includes('World item no encontrado')) {
				return null;
			}
			throw error;
		}
	}

	async deleteWorldItem(id: string): Promise<boolean> {
		try {
			const result = await deleteWorldItem(id);
			return result.success;
		} catch (error) {
			if (error instanceof Error && error.message.includes('World item no encontrado')) {
				return false;
			}
			throw error;
		}
	}

	async getWorldItemImages(id: string): Promise<any[]> {
		try {
			const result = await getWorldItemImages(id);
			return result.images;
		} catch (error) {
			worldItemLogger.error(`Error al obtener imágenes del world item ${id}:`, error);
			return [];
		}
	}

	async getRecentWorldItemImages(id: string, limit: number): Promise<any[]> {
		// TODO: Implementar lógica para obtener imágenes recientes
		worldItemLogger.info(`Obteniendo imágenes recientes del world item ${id} (limit: ${limit})`);
		return [];
	}
}

// Exportar instancia de WorldItemService para compatibilidad con routes
const worldItemServiceInstance = new WorldItemService();

// Exportar métodos individuales para compatibilidad con import * as worldItemService
export const getRecentWorldItemImages =
	worldItemServiceInstance.getRecentWorldItemImages.bind(worldItemServiceInstance);

export default worldItemServiceInstance;
