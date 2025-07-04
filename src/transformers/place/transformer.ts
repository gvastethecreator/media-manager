/**
 * @file Transformador principal para la entidad Place
 * @module transformers/place/transformer
 * ✅ MIGRADO A DRIZZLE - Sin dependencias de Prisma
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { TransformerError } from '@/lib/utils/transformers/errors';
import type { PlaceBase, PlaceStatistics, PlaceWithStats } from '@/types/entities/place';

const logger = serverLogger.withContext('PlaceTransformer');

/**
 * Transforma un objeto Place de Drizzle a PlaceWithStats
 */
export function fromDrizzlePlace(drizzlePlace: any): PlaceWithStats {
	if (!drizzlePlace) {
		throw new TransformerError('El objeto de lugar de Drizzle no puede ser nulo.');
	}

	try {
		const { _count, ...baseData } = drizzlePlace;

		const stats: PlaceStatistics = {
			imageCount: _count?.images || 0,
			videoCount: _count?.videos || 0,
			characterCount: _count?.characters || 0,
			eventCount: _count?.events || 0,
			visitCount: _count?.visits || 0,
			lastVisited: _count?.lastVisited || undefined,
			distance: undefined,
			popularity: Math.min(100, (((_count?.images || 0) + (_count?.videos || 0)) / 10) * 100),
		};

		return {
			...baseData,
			stats,
		};
	} catch (error) {
		logger.error('Error transformando lugar desde Drizzle', {
			error,
			placeId: drizzlePlace?.id,
		});
		throw new TransformerError(`Error al transformar el lugar: ${(error as Error).message}`);
	}
}

/**
 * Transforma una lista de lugares de Drizzle a PlaceWithStats[]
 */
export function fromDrizzlePlaces(drizzlePlaces: any[]): PlaceWithStats[] {
	return drizzlePlaces.map(fromDrizzlePlace);
}

/**
 * Convierte un PlaceBase a DrizzlePlace para inserción/actualización
 */
export function toDrizzlePlace(place: PlaceBase): any {
	return {
		id: place.id,
		name: place.name,
		description: place.description,
		type: place.type,
		coordinates: place.coordinates,
		address: place.address,
		country: place.country,
		region: place.region,
		city: place.city,
		isFavorite: place.isFavorite,
		createdAt: place.createdAt,
		updatedAt: place.updatedAt,
	};
}