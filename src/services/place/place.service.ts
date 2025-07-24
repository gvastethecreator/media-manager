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
import { places } from '@/lib/drizzle/schema/index';
import { createEntityErrorObject, EntityErrorCode } from '@/lib/errors';
import { serverLogger } from '@/lib/logger/server-logger';
import { emit } from '@/lib/server/events.server';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats';
import { toPlaceWithStats } from '@/transformers/place';
import type { PlaceCreateInput, PlaceSearchOptions, PlaceUpdateInput, PlaceWithStats } from '@/types/entities/place';

// Tipo local para Drizzle Place con counts
type DrizzlePlaceWithCounts = {
	id: string;
	name: string;
	description: string | null;
	emoji: string | null;
	color: string | null;
	category: string | null;
	isPublic: boolean;
	isFavorite: boolean;
	totalImages: number;
	totalVideos: number;
	type: string | null;
	location: string | null;
	climate: string | null;
	population: string | null;
	government: string | null;
	economy: string | null;
	culture: string | null;
	history: string | null;
	geography: string | null;
	landmarks: string | null;
	dangers: string | null;
	resources: string | null;
	notes: string | null;
	featuredImage: string | null;
	parentId: string | null;
	createdAt: Date;
	updatedAt: Date;
	_count?: {
		images?: number;
		notes?: number;
		tags?: number;
		characters?: number;
		collections?: number;
		concepts?: number;
	};
};

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
				category: places.category,
				isPublic: places.isPublic,
				isFavorite: places.isFavorite,
				totalImages: places.totalImages,
				totalVideos: places.totalVideos,
				type: places.type,
				location: places.location,
				climate: places.climate,
				population: places.population,
				government: places.government,
				economy: places.economy,
				culture: places.culture,
				history: places.history,
				geography: places.geography,
				landmarks: places.landmarks,
				resources: places.resources,
				dangers: places.dangers,
				notes: places.notes,
				featuredImage: places.featuredImage,
				parentId: places.parentId,
				createdAt: places.createdAt,
				updatedAt: places.updatedAt,
			})
			.from(places)
			.orderBy(asc(places.name));

		// Transformar a formato compatible con transformadores legacy
		const transformedPlaces = drizzlePlaces.map((rawPlace: typeof drizzlePlaces[0]) => ({
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

		return transformedPlaces.map((place: DrizzlePlaceWithCounts) => toPlaceWithStats(place));
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
		// **MIGRACIÓN A DRIZZLE - VERSIÓN SIMPLIFICADA**
		placeLogger.info(`🔍 Obteniendo place por ID: ${id}`);

		const drizzlePlace = await db
			.select({
				id: places.id,
				name: places.name,
				description: places.description,
				emoji: places.emoji,
				color: places.color,
				category: places.category,
				isPublic: places.isPublic,
				isFavorite: places.isFavorite,
				totalImages: places.totalImages,
				totalVideos: places.totalVideos,
				type: places.type,
				location: places.location,
				climate: places.climate,
				population: places.population,
				government: places.government,
				economy: places.economy,
				culture: places.culture,
				history: places.history,
				geography: places.geography,
				landmarks: places.landmarks,
				dangers: places.dangers,
				resources: places.resources,
				notes: places.notes,
				featuredImage: places.featuredImage,
				parentId: places.parentId,
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

		// Transformar a formato compatible con transformadores legacy
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

		return toPlaceWithStats(transformedPlace as DrizzlePlaceWithCounts);
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

		// **MIGRACIÓN A DRIZZLE - VERSIÓN SIMPLIFICADA**
		const result = await db
			.insert(places)
			.values({
				id: crypto.randomUUID(),
				name: input.name,
				description: input.description || null,
				emoji: input.emoji || '🌍',
				color: input.color || '#3b82f6',
				category: input.category || null,
				location: input.location || null,
				climate: input.climate || null,
				population: input.population || null,
				government: input.government || null,
				economy: input.economy || null,
				culture: input.culture || null,
				history: input.history || null,
				geography: input.geography || null,
				landmarks: input.landmarks || null,
				resources: input.resources || null,
				dangers: input.dangers || null,
				notes: input.notes || null,
				featuredImage: input.featuredImage || null,
				parentId: input.parentId || null,
				isFavorite: input.isFavorite || false,
				totalImages: 0,
				totalVideos: 0,
				isPublic: input.isPublic || false,
				type: input.type || null,
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

		// **MIGRACIÓN A DRIZZLE - VERSIÓN SIMPLIFICADA**
		const updateData: Partial<typeof places.$inferInsert> = {
			updatedAt: new Date(),
		};

		// Solo actualizar campos que existen en el schema
		if (input.name !== undefined) updateData.name = input.name;
		if (input.description !== undefined) updateData.description = input.description;
		if (input.emoji !== undefined) updateData.emoji = input.emoji;
		if (input.color !== undefined) updateData.color = input.color;
		if (input.category !== undefined) updateData.category = input.category;
		if (input.location !== undefined) updateData.location = input.location;
		if (input.climate !== undefined) updateData.climate = input.climate;
		if (input.population !== undefined) updateData.population = input.population;
		if (input.government !== undefined) updateData.government = input.government;
		if (input.economy !== undefined) updateData.economy = input.economy;
		if (input.culture !== undefined) updateData.culture = input.culture;
		if (input.history !== undefined) updateData.history = input.history;
		if (input.geography !== undefined) updateData.geography = input.geography;
		if (input.landmarks !== undefined) updateData.landmarks = input.landmarks;
		if (input.resources !== undefined) updateData.resources = input.resources;
		if (input.dangers !== undefined) updateData.dangers = input.dangers;
		if (input.notes !== undefined) updateData.notes = input.notes;
		if (input.featuredImage !== undefined) updateData.featuredImage = input.featuredImage;
		if (input.parentId !== undefined) updateData.parentId = input.parentId;
		if (input.isFavorite !== undefined) updateData.isFavorite = input.isFavorite;
		if (input.isPublic !== undefined) updateData.isPublic = input.isPublic;
		if (input.type !== undefined) updateData.type = input.type;

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
	async getPlaces(filters?: PlaceSearchOptions): Promise<{ places: PlaceWithStats[]; total: number }> {
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

	async getPlaceImages(id: string): Promise<Array<{ id: string; name: string; path: string }>> {
		// TODO: Implementar lógica para obtener imágenes del lugar
		placeLogger.info(`Obteniendo imágenes del lugar ${id}`);
		return [];
	}

	async getRecentPlaceMedia(id: string, limit: number): Promise<Array<{ id: string; type: string; name: string }>> {
		// TODO: Implementar lógica para obtener media reciente del lugar
		placeLogger.info(`Obteniendo media reciente del lugar ${id} (limit: ${limit})`);
		return [];
	}
}

// Exportar instancia de PlaceService para compatibilidad con routes
const placeServiceInstance = new PlaceService();

// Exportar métodos individuales para compatibilidad con import * as placeService
export const getPlaceImages = placeServiceInstance.getPlaceImages.bind(placeServiceInstance);
export const getRecentPlaceMedia = placeServiceInstance.getRecentPlaceMedia.bind(placeServiceInstance);

export default placeServiceInstance;
