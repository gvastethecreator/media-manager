/**
 * 🌍 Servicio para la entidad Place
 * @file Servicio de Place con lógica de negocio
 * @module services/place.service
 * @description Capa de servicio para la entidad Place que maneja la lógica de negocio
 * @updated 2025-07-01
 */

import { db } from '@/lib/drizzle';
import { places } from '@/lib/drizzle/schema';
import { createEntityErrorObject, EntityErrorCode } from '@/lib/errors';
import { serverLogger } from '@/lib/logger/server-logger';
import { emit } from '@/lib/server/events.server';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats';
import {
    mapCreatePlaceDataToPrisma,
    mapPlaceSearchOptionsToPrisma,
    mapUpdatePlaceDataToPrisma,
    toPlaceWithStats,
} from '@/transformers/place';
import type {
    PlaceCreateInput,
    PlaceSearchOptions,
    PlaceUpdateInput,
    PlaceWithStats
} from '@/types/entities/place';
import type { Prisma } from '@prisma/client';
import { asc, eq } from 'drizzle-orm';

const placeLogger = serverLogger.withContext('PlaceService');

// Función auxiliar para crear errores
const createPlaceError = (
	message: string,
	code: EntityErrorCode = EntityErrorCode.OPERATION_FAILED,
	cause?: unknown
) => {
	return createEntityErrorObject('PlaceError', message, code, cause);
};

// Payload para incluir los conteos necesarios para las estadísticas
const placeIncludeWithCounts = {
	_count: {
		select: {
			images: true,
			notes: true,
			tags: true,
			characters: true,
			collections: true,
			concepts: true,
		},
	},
} satisfies Prisma.PlaceInclude;

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

		// **VALIDACIÓN DUAL EN DESARROLLO**
		if (process.env.NODE_ENV === 'development') {
			try {
				const prisma = await getPrismaClient();
				const findOptions = mapPlaceSearchOptionsToPrisma(options);

				const prismaPlaces = await prisma.place.findMany({
					...findOptions,
					include: placeIncludeWithCounts,
				});

				if (Math.abs(transformedPlaces.length - prismaPlaces.length) > 0) {
					placeLogger.warn('⚠️ Diferencia en conteo getPlaces:', {
						drizzle: transformedPlaces.length,
						prisma: prismaPlaces.length
					});
				} else {
					placeLogger.info('✅ Validación dual exitosa getPlaces:', {
						total: transformedPlaces.length
					});
				}
			} catch (validationError) {
				placeLogger.error('❌ Error en validación dual getPlaces:', validationError);
			}
		}

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

		// **VALIDACIÓN DUAL EN DESARROLLO**
		if (process.env.NODE_ENV === 'development') {
			try {
				const prisma = await getPrismaClient();
				const prismaPlace = await prisma.place.findUnique({
					where: { id },
					include: placeIncludeWithCounts,
				});

				if (prismaPlace && transformedPlace) {
					placeLogger.info('✅ Validación dual exitosa getPlaceById:', {
						placeName: transformedPlace.name
					});
				} else if (!prismaPlace && !transformedPlace) {
					placeLogger.info('✅ Validación dual exitosa getPlaceById: ambos null');
				} else {
					placeLogger.warn('⚠️ Diferencia en getPlaceById:', {
						drizzleFound: !!transformedPlace,
						prismaFound: !!prismaPlace
					});
				}
			} catch (validationError) {
				placeLogger.error('❌ Error en validación dual getPlaceById:', validationError);
			}
		}

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

		const prisma = await getPrismaClient();
		const data = mapCreatePlaceDataToPrisma(input);

		const newPlace = await prisma.place.create({ data });

		// Emitir eventos
		await emit({
			type: 'places:modified',
			data: { action: 'create', place: newPlace },
		});
		statsEventEmitter.emit(STATS_EVENTS.PLACE_CHANGE);

		// Volvemos a buscar para obtener los _counts actualizados
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

		const prisma = await getPrismaClient();
		const data = mapUpdatePlaceDataToPrisma(input);

		await prisma.place.update({
			where: { id },
			data,
		});

		// Emitir eventos
		await emit({
			type: 'places:modified',
			id,
			data: { action: 'update', place: { id, ...input } },
		});
		statsEventEmitter.emit(STATS_EVENTS.PLACE_CHANGE, id);

		// Volvemos a buscar para obtener los _counts actualizados
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

		const prisma = await getPrismaClient();

		// Verificar que existe
		const place = await prisma.place.findUnique({
			where: { id },
			select: { id: true, name: true },
		});

		if (!place) {
			throw createPlaceError('Place no encontrado', EntityErrorCode.NOT_FOUND);
		}

		await prisma.place.delete({ where: { id } });

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
		const prisma = await getPrismaClient();
		const count = await prisma.place.count({
			where: { id },
		});
		return count > 0;
	} catch (error) {
		placeLogger.error(`Error al verificar existencia del place ${id}:`, error);
		return false;
	}
}

/**
 * Obtiene el conteo total de places
 */
export async function getPlaceCount(filters?: PlaceSearchOptions): Promise<number> {
	try {
		const prisma = await getPrismaClient();
		const findOptions = mapPlaceSearchOptionsToPrisma(filters || {});

		return await prisma.place.count({
			where: findOptions.where,
		});
	} catch (error) {
		placeLogger.error('Error al obtener conteo de places:', error);
		throw createPlaceError('Error al obtener conteo de lugares', EntityErrorCode.OPERATION_FAILED, error);
	}
}
