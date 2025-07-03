/**
 * 🌍 Servicio para la entidad WorldItem
 * @file Servicio de WorldItem con lógica de negocio
 * @module services/world-item.service
 * @description Capa de servicio para la entidad WorldItem que maneja la lógica de negocio
 * @updated 2025-07-01
 */

// Drizzle imports

import { db } from '@/lib/drizzle';
import { images, imageWorldItems, worldItems } from '@/lib/drizzle/schema';
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
import * as crypto from 'crypto';
import { and, asc, count, desc, eq } from 'drizzle-orm';

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

		// Transformar a formato esperado
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

		// Transformar a WorldItemWithStats
		return transformedWorldItems.map((item) => {
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
		const result = await db.insert(worldItems).values({
			id: crypto.randomUUID(),
			name: input.name,
			description: input.description || null,
			emoji: input.emoji || '🌍',
			color: input.color || '#3b82f6',
			shortcut: input.shortcut || null,
			category: input.category || null,
			type: input.type || null,
			subtype: input.subtype || null,
			rarity: input.rarity || null,
			value: input.value || null,
			weight: input.weight || null,
			size: input.size || null,
			material: input.material || null,
			origin: input.origin || null,
			crafting: input.crafting || null,
			requirements: input.requirements || null,
			effects: input.effects || null,
			properties: input.properties || null,
			lore: input.lore || null,
			history: input.history || null,
			notes: input.notes || null,
			sortBy: input.sortBy || null,
			filters: input.filters || null,
			featuredImage: input.featuredImage || null,
			isFavorite: input.isFavorite || false,
			isArchived: input.isArchived || false,
			createdAt: new Date(),
			updatedAt: new Date(),
		}).returning();

		const worldItem = result[0];

		// Transformar a formato compatible
		const complete: WorldItemComplete = {
			...worldItem,
			isFavorite: Boolean(worldItem.isFavorite),
			isArchived: Boolean(worldItem.isArchived),
			// Counts vacíos para nueva entidad
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
		if (input.name !== undefined) updateData.name = input.name;
		if (input.description !== undefined) updateData.description = input.description;
		if (input.emoji !== undefined) updateData.emoji = input.emoji;
		if (input.color !== undefined) updateData.color = input.color;
		if (input.shortcut !== undefined) updateData.shortcut = input.shortcut;
		if (input.category !== undefined) updateData.category = input.category;
		if (input.type !== undefined) updateData.type = input.type;
		if (input.subtype !== undefined) updateData.subtype = input.subtype;
		if (input.rarity !== undefined) updateData.rarity = input.rarity;
		if (input.value !== undefined) updateData.value = input.value;
		if (input.weight !== undefined) updateData.weight = input.weight;
		if (input.size !== undefined) updateData.size = input.size;
		if (input.material !== undefined) updateData.material = input.material;
		if (input.origin !== undefined) updateData.origin = input.origin;
		if (input.crafting !== undefined) updateData.crafting = input.crafting;
		if (input.requirements !== undefined) updateData.requirements = input.requirements;
		if (input.effects !== undefined) updateData.effects = input.effects;
		if (input.properties !== undefined) updateData.properties = input.properties;
		if (input.lore !== undefined) updateData.lore = input.lore;
		if (input.history !== undefined) updateData.history = input.history;
		if (input.notes !== undefined) updateData.notes = input.notes;
		if (input.sortBy !== undefined) updateData.sortBy = input.sortBy;
		if (input.filters !== undefined) updateData.filters = input.filters;
		if (input.featuredImage !== undefined) updateData.featuredImage = input.featuredImage;
		if (input.isFavorite !== undefined) updateData.isFavorite = input.isFavorite;
		if (input.isArchived !== undefined) updateData.isArchived = input.isArchived;

		const result = await db
			.update(worldItems)
			.set(updateData)
			.where(eq(worldItems.id, id))
			.returning();

		if (result.length === 0) {
			throw createWorldItemError('World item no encontrado', EntityErrorCode.NOT_FOUND);
		}

		const worldItem = result[0];

		// Transformar a formato compatible
		const complete: WorldItemComplete = {
			...worldItem,
			isFavorite: Boolean(worldItem.isFavorite),
			isArchived: Boolean(worldItem.isArchived),
			// TODO: implementar conteos reales con subqueries
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
		const result = await db
			.delete(worldItems)
			.where(eq(worldItems.id, id))
			.returning();

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
		const transformedImages = worldItemImages.map((img) => ({
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
		await db.insert(imageWorldItems).values({
			A: imageId, // imageId
			B: worldItemId, // worldItemId
		}).onConflictDoNothing(); // Evitar duplicados

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
		await db
			.delete(imageWorldItems)
			.where(
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
		const result = await db
			.select({ count: count() })
			.from(worldItems)
			.where(eq(worldItems.id, id));
		
		return result[0].count > 0;
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
		// **MIGRACIÓN A DRIZZLE**
		// Por ahora implementación básica sin filtros complejos
		const result = await db.select({ count: count() }).from(worldItems);
		return result[0].count;
	} catch (error) {
		worldItemLogger.error('Error al obtener conteo de world items:', error);
		throw createWorldItemError('Error al obtener conteo de objetos del mundo', EntityErrorCode.OPERATION_FAILED, error);
	}
}
