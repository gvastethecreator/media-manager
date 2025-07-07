/**
 * 🌍 Servicio para la entidad Place
 * @file Servicio de Place con lógica de negocio
 * @module services/place.service
 * @description Capa de servicio para la entidad Place que maneja la lógica de negocio
 * @updated 2025-07-01
 */

import * as crypto from 'crypto';
import { asc, count, eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { places } from '@/lib/drizzle/schema';
import { createEntityErrorObject, EntityErrorCode } from '@/lib/errors';
import { serverLogger } from '@/lib/logger/server-logger';
import { emit } from '@/lib/server/events.server';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats';
import { toPlaceWithStats } from '@/transformers/place';
import type { PlaceCreateInput, PlaceSearchOptions, PlaceUpdateInput, PlaceWithStats } from '@/types/entities/place';

const placeLogger = serverLogger.withContext('PlaceService');

// Función auxiliar para crear errores
const createPlaceError = (
	message: string,
	code: EntityErrorCode = EntityErrorCode.OPERATION_FAILED,
	cause?: unknown
) => {
	return createEntityErrorObject('PlaceError', message, code, cause);
};

/**
 * Obtiene todos los places con opciones de búsqueda
 */
export async function getPlaces(options: PlaceSearchOptions): Promise<PlaceWithStats[]> {
	try {
		// **MIGRACIÓN A DRIZZLE**
		placeLogger.info('🌍 Obteniendo places con opciones:', options);

		// Por ahora, implementación básica sin filtros complejos
		const drizzlePlaces = await db
			.select({
				id: places.id,
				name: places.name,
				description: places.description,
				emoji: places.emoji,
				color: places.color,
				shortcut: places.shortcut,
				category: places.category,
				location: places.location,
				coordinates: places.coordinates,
				climate: places.climate,
				terrain: places.terrain,
				population: places.population,
				government: places.government,
				economy: places.economy,
				culture: places.culture,
				history: places.history,
				geography: places.geography,
				landmarks: places.landmarks,
				resources: places.resources,
				threats: places.threats,
				allies: places.allies,
				enemies: places.enemies,
				secrets: places.secrets,
				rumors: places.rumors,
				hooks: places.hooks,
				notes: places.notes,
				size: places.size,
				importance: places.importance,
				sortBy: places.sortBy,
				filters: places.filters,
				featuredImage: places.featuredImage,
				isFavorite: places.isFavorite,
				createdAt: places.createdAt,
				updatedAt: places.updatedAt,
			})
			.from(places)
			.orderBy(asc(places.name));

		// Transformar a formato compatible con Prisma
		const transformedPlaces = drizzlePlaces.map((rawPlace) => ({
			...rawPlace,
			isFavorite: Boolean(rawPlace.isFavorite),
			// Counts vacíos por ahora (TODO: implementar subqueries)
			_count: {
				images: 0,
				notes: 0,
				tags: 0,
				characters: 0,
				collections: 0,
				concepts: 0,
			},
		}));

		return transformedPlaces.map((place) => toPlaceWithStats(place as any));
	} catch (error) {
		placeLogger.error('Error al obtener places:', error);
		throw createPlaceError('Error al obtener lugares', EntityErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Obtiene un place por ID con estadísticas
 */
export async function getPlaceById(id: string): Promise<PlaceWithStats | null> {
	try {
		// **MIGRACIÓN A DRIZZLE**
		placeLogger.info(`🔍 Obteniendo place por ID: ${id}`);

		const drizzlePlace = await db
			.select({
				id: places.id,
				name: places.name,
				description: places.description,
				emoji: places.emoji,
				color: places.color,
				shortcut: places.shortcut,
				category: places.category,
				location: places.location,
				coordinates: places.coordinates,
				climate: places.climate,
				terrain: places.terrain,
				population: places.population,
				government: places.government,
				economy: places.economy,
				culture: places.culture,
				history: places.history,
				geography: places.geography,
				landmarks: places.landmarks,
				resources: places.resources,
				threats: places.threats,
				allies: places.allies,
				enemies: places.enemies,
				secrets: places.secrets,
				rumors: places.rumors,
				hooks: places.hooks,
				notes: places.notes,
				size: places.size,
				importance: places.importance,
				sortBy: places.sortBy,
				filters: places.filters,
				featuredImage: places.featuredImage,
				isFavorite: places.isFavorite,
				createdAt: places.createdAt,
				updatedAt: places.updatedAt,
			})
			.from(places)
			.where(eq(places.id, id))
			.limit(1);

		if (drizzlePlace.length === 0) {
			placeLogger.warn(`Place no encontrado: ${id}`);
			return null;
		}

		const rawPlace = drizzlePlace[0];

		// Transformar a formato compatible con Prisma
		const transformedPlace = {
			...rawPlace,
			isFavorite: Boolean(rawPlace.isFavorite),
			// Counts vacíos por ahora (TODO: implementar subqueries)
			_count: {
				images: 0,
				notes: 0,
				tags: 0,
				characters: 0,
				collections: 0,
				concepts: 0,
			},
		};

		return toPlaceWithStats(transformedPlace as any);
	} catch (error) {
		placeLogger.error(`Error al obtener place ${id}:`, error);
		throw createPlaceError('Error al obtener lugar', EntityErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Crea un nuevo place
 */
export async function createPlace(input: PlaceCreateInput): Promise<PlaceWithStats> {
	try {
		placeLogger.info('📝 Creando place:', input.name);

		// **MIGRACIÓN A DRIZZLE**
		const result = await db
			.insert(places)
			.values({
				id: crypto.randomUUID(),
				name: input.name,
				description: input.description || null,
				emoji: input.emoji || '🌍',
				color: input.color || '#3b82f6',
				shortcut: input.shortcut || null,
				category: input.category || null,
				location: input.location || null,
				coordinates: input.coordinates || null,
				climate: input.climate || null,
				terrain: input.terrain || null,
				population: input.population || null,
				government: input.government || null,
				economy: input.economy || null,
				culture: input.culture || null,
				history: input.history || null,
				geography: input.geography || null,
				landmarks: input.landmarks || null,
				resources: input.resources || null,
				threats: input.threats || null,
				allies: input.allies || null,
				enemies: input.enemies || null,
				secrets: input.secrets || null,
				rumors: input.rumors || null,
				hooks: input.hooks || null,
				notes: input.notes || null,
				size: input.size || null,
				importance: input.importance || null,
				sortBy: input.sortBy || null,
				filters: input.filters || null,
				featuredImage: input.featuredImage || null,
				isFavorite: input.isFavorite || false,
				createdAt: new Date(),
				updatedAt: new Date(),
			})
			.returning();

		const newPlace = result[0];

		// Emitir eventos
		await emit({
			type: 'places:modified',
			data: { action: 'create', place: newPlace },
		});
		statsEventEmitter.emit(STATS_EVENTS.PLACE_CHANGE);

		// Obtener el place creado con estadísticas
		const createdPlaceWithStats = await getPlaceById(newPlace.id);
		if (!createdPlaceWithStats) {
			throw createPlaceError(
				'No se pudo recuperar el lugar recién creado con sus estadísticas',
				EntityErrorCode.OPERATION_FAILED
			);
		}

		placeLogger.info('✅ Place creado:', createdPlaceWithStats.name);
		return createdPlaceWithStats;
	} catch (error) {
		placeLogger.error('❌ Error al crear place:', error);
		throw createPlaceError('No se pudo crear el lugar', EntityErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Actualiza un place existente
 */
export async function updatePlace(id: string, input: PlaceUpdateInput): Promise<PlaceWithStats> {
	try {
		placeLogger.info('📝 Actualizando place:', id);

		// **MIGRACIÓN A DRIZZLE**
		const updateData: any = {
			updatedAt: new Date(),
		};

		// Solo actualizar campos que se envían
		if (input.name !== undefined) updateData.name = input.name;
		if (input.description !== undefined) updateData.description = input.description;
		if (input.emoji !== undefined) updateData.emoji = input.emoji;
		if (input.color !== undefined) updateData.color = input.color;
		if (input.shortcut !== undefined) updateData.shortcut = input.shortcut;
		if (input.category !== undefined) updateData.category = input.category;
		if (input.location !== undefined) updateData.location = input.location;
		if (input.coordinates !== undefined) updateData.coordinates = input.coordinates;
		if (input.climate !== undefined) updateData.climate = input.climate;
		if (input.terrain !== undefined) updateData.terrain = input.terrain;
		if (input.population !== undefined) updateData.population = input.population;
		if (input.government !== undefined) updateData.government = input.government;
		if (input.economy !== undefined) updateData.economy = input.economy;
		if (input.culture !== undefined) updateData.culture = input.culture;
		if (input.history !== undefined) updateData.history = input.history;
		if (input.geography !== undefined) updateData.geography = input.geography;
		if (input.landmarks !== undefined) updateData.landmarks = input.landmarks;
		if (input.resources !== undefined) updateData.resources = input.resources;
		if (input.threats !== undefined) updateData.threats = input.threats;
		if (input.allies !== undefined) updateData.allies = input.allies;
		if (input.enemies !== undefined) updateData.enemies = input.enemies;
		if (input.secrets !== undefined) updateData.secrets = input.secrets;
		if (input.rumors !== undefined) updateData.rumors = input.rumors;
		if (input.hooks !== undefined) updateData.hooks = input.hooks;
		if (input.notes !== undefined) updateData.notes = input.notes;
		if (input.size !== undefined) updateData.size = input.size;
		if (input.importance !== undefined) updateData.importance = input.importance;
		if (input.sortBy !== undefined) updateData.sortBy = input.sortBy;
		if (input.filters !== undefined) updateData.filters = input.filters;
		if (input.featuredImage !== undefined) updateData.featuredImage = input.featuredImage;
		if (input.isFavorite !== undefined) updateData.isFavorite = input.isFavorite;

		await db.update(places).set(updateData).where(eq(places.id, id));

		// Emitir eventos
		await emit({
			type: 'places:modified',
			id,
			data: { action: 'update', place: { id, ...input } },
		});
		statsEventEmitter.emit(STATS_EVENTS.PLACE_CHANGE, id);

		// Obtener el place actualizado con estadísticas
		const updatedPlaceWithStats = await getPlaceById(id);
		if (!updatedPlaceWithStats) {
			throw createPlaceError(
				'No se pudo recuperar el lugar actualizado con sus estadísticas',
				EntityErrorCode.OPERATION_FAILED
			);
		}

		placeLogger.info('✅ Place actualizado:', updatedPlaceWithStats.name);
		return updatedPlaceWithStats;
	} catch (error) {
		placeLogger.error('❌ Error al actualizar place:', error);
		throw createPlaceError('No se pudo actualizar el lugar', EntityErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Elimina un place
 */
export async function deletePlace(id: string): Promise<boolean> {
	try {
		placeLogger.info('🗑️ Eliminando place:', id);

		// **MIGRACIÓN A DRIZZLE**
		// Verificar que existe
		const existingPlace = await db
			.select({ id: places.id, name: places.name })
			.from(places)
			.where(eq(places.id, id))
			.limit(1);

		if (existingPlace.length === 0) {
			throw createPlaceError('Place no encontrado', EntityErrorCode.NOT_FOUND);
		}

		await db.delete(places).where(eq(places.id, id));

		// Emitir eventos
		await emit({
			type: 'places:modified',
			id,
			data: { action: 'delete', id },
		});
		statsEventEmitter.emit(STATS_EVENTS.PLACE_CHANGE);

		placeLogger.info('✅ Place eliminado:', id);
		return true;
	} catch (error) {
		placeLogger.error('❌ Error al eliminar place:', error);
		if (error instanceof Error && error.message.includes('Place no encontrado')) {
			return false;
		}
		throw createPlaceError('No se pudo eliminar el lugar', EntityErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Verifica si un place existe
 */
export async function placeExists(id: string): Promise<boolean> {
	try {
		// **MIGRACIÓN A DRIZZLE**
		const result = await db.select({ count: count() }).from(places).where(eq(places.id, id));

		return result[0]?.count > 0;
	} catch (error) {
		placeLogger.error(`Error al verificar existencia del place ${id}:`, error);
		return false;
	}
}

/**
 * Obtiene el conteo total de places
 */
export async function getPlaceCount(_filters?: PlaceSearchOptions): Promise<number> {
	try {
		// **MIGRACIÓN A DRIZZLE**
		// Por ahora, conteo simple sin filtros complejos
		const result = await db.select({ count: count() }).from(places);

		return result[0]?.count || 0;
	} catch (error) {
		placeLogger.error('Error al obtener conteo de places:', error);
		throw createPlaceError('Error al obtener conteo de lugares', EntityErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Clase de servicio para gestión de lugares
 */
export class PlaceService {
	async getPlaces(filters?: any): Promise<{ places: PlaceWithStats[]; total: number }> {
		const places = await getPlaces(filters || {});
		return { places, total: places.length };
	}

	async getPlaceById(id: string): Promise<PlaceWithStats | null> {
		return await getPlaceById(id);
	}

	async createPlace(data: PlaceCreateInput): Promise<PlaceWithStats> {
		return await createPlace(data);
	}

	async updatePlace(id: string, data: PlaceUpdateInput): Promise<PlaceWithStats | null> {
		try {
			return await updatePlace(id, data);
		} catch (error) {
			if (error instanceof Error && error.message.includes('Place no encontrado')) {
				return null;
			}
			throw error;
		}
	}

	async deletePlace(id: string): Promise<boolean> {
		return await deletePlace(id);
	}

	async getPlaceImages(id: string): Promise<any[]> {
		// TODO: Implementar lógica para obtener imágenes del lugar
		placeLogger.info(`Obteniendo imágenes del lugar ${id}`);
		return [];
	}

	async getRecentPlaceMedia(id: string, limit: number): Promise<any[]> {
		// TODO: Implementar lógica para obtener media reciente del lugar
		placeLogger.info(`Obteniendo media reciente del lugar ${id} (limit: ${limit})`);
		return [];
	}
}
