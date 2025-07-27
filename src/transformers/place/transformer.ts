/**
 * @file Transformador principal para la entidad Place
 * @module transformers/place/transformer

 */

import { TransformerError } from '../../lib/errors/transformer-error';
import { serverLogger } from '../../lib/logger/server-logger';
import type { PlaceBase, PlaceStatistics, PlaceWithStats } from '../../types/entities/place';

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

		// Calcular estadísticas según PlaceStatistics
		const totalRelations =
			(_count?.images || 0) +
			(_count?.videos || 0) +
			(_count?.characters || 0) +
			(_count?.tags || 0) +
			(_count?.notes || 0) +
			(_count?.collections || 0) +
			(_count?.concepts || 0) +
			(_count?.albums || 0) +
			(_count?.worldItems || 0) +
			(_count?.prompts || 0) +
			(_count?.wildcards || 0) +
			(_count?.properties || 0) +
			(_count?.groups || 0);

		const stats: PlaceStatistics = {
			spatialRelevance: Math.min(100, totalRelations * 5), // Relevancia espacial basada en relaciones
			completenessScore: calculateCompletenessScore(baseData), // Puntuación de completitud
			geoContextLevel: calculateGeoContextLevel(baseData), // Nivel de contexto geográfico
			popularity: Math.min(100, totalRelations * 2), // Popularidad basada en relaciones
		};

		return {
			...baseData,
			entityType: 'place' as const,
			_stats: stats,
			stats, // Alias para _stats
			_count: _count
				? {
						images: _count.images || 0,
						videos: _count.videos || 0,
						tags: _count.tags || 0,
						notes: _count.notes || 0,
						characters: _count.characters || 0,
						collections: _count.collections || 0,
						concepts: _count.concepts || 0,
						albums: _count.albums || 0,
						worldItems: _count.worldItems || 0,
						prompts: _count.prompts || 0,
						wildcards: _count.wildcards || 0,
						properties: _count.properties || 0,
						groups: _count.groups || 0,
					}
				: undefined,
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
/**
 * Calcula la puntuación de completitud del lugar
 */
function calculateCompletenessScore(place: PlaceBase): number {
	let score = 0;
	if (place.name) score += 20;
	if (place.description) score += 20;
	if (place.location) score += 15;
	if (place.climate) score += 10;
	if (place.population) score += 10;
	if (place.government) score += 5;
	if (place.economy) score += 5;
	if (place.culture) score += 5;
	if (place.history) score += 5;
	if (place.geography) score += 5;
	return Math.min(100, score);
}

/**
 * Calcula el nivel de contexto geográfico
 */
function calculateGeoContextLevel(place: PlaceBase): number {
	let level = 0;
	if (place.location) level += 30;
	if (place.geography) level += 25;
	if (place.climate) level += 20;
	if (place.landmarks) level += 15;
	if (place.resources) level += 10;
	return Math.min(100, level);
}

/**
 * Parsea campos JSON de forma segura
 */
function parseJsonField(field: string | null): unknown[] {
	if (!field) return [];
	try {
		return JSON.parse(field);
	} catch {
		return [];
	}
}

export function toDrizzlePlace(place: PlaceBase): any {
	return {
		id: place.id,
		name: place.name,
		description: place.description,
		type: place.type,
		location: place.location,
		climate: place.climate,
		population: place.population,
		government: place.government,
		economy: place.economy,
		culture: place.culture,
		history: place.history,
		geography: place.geography,
		landmarks: place.landmarks,
		dangers: place.dangers,
		resources: place.resources,
		notes: place.notes,
		featuredImage: place.featuredImage,
		parentId: place.parentId,
		isFavorite: place.isFavorite,
		createdAt: place.createdAt,
		updatedAt: place.updatedAt,
	};
}
