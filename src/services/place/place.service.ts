/**
 * 🌍 Servicio para la entidad Place
 * @file Servicio de Place con lógica de negocio
 * @module services/place.service
 * @description Capa de servicio para la entidad Place que maneja la lógica de negocio
 * @updated 2025-07-01
 */

import { getPrismaClient } from '@/lib/database/db';
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
	PlaceWithStats,
	PrismaPlaceWithCounts,
} from '@/types/entities/place';
import type { Prisma } from '@prisma/client';

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
		const prisma = await getPrismaClient();
		const findOptions = mapPlaceSearchOptionsToPrisma(options);

		const places = await prisma.place.findMany({
			...findOptions,
			include: placeIncludeWithCounts,
		});

		return places.map((place) => toPlaceWithStats(place as PrismaPlaceWithCounts));
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
		const prisma = await getPrismaClient();
		const place = await prisma.place.findUnique({
			where: { id },
			include: placeIncludeWithCounts,
		});

		return place ? toPlaceWithStats(place as PrismaPlaceWithCounts) : null;
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
