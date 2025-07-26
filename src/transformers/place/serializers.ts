/**
 * @file Serializadores para la entidad Place
 * @module transformers/place/serializers
 
 */

import type { PlaceWithStats } from '@/types/entities/place/base';

/**
 * Serializa un objeto Place para respuesta de API
 */
export function serializePlace(place: PlaceWithStats) {
	return {
		id: place.id,
		name: place.name,
		description: place.description,
		type: place.type,
		location: place.location,
		region: place.region,
		climate: place.climate,
		population: place.population,
		government: place.government,
		economy: place.economy,
		culture: place.culture,
		history: place.history,
		geography: place.geography,
		landmarks: place.landmarks,
		isFavorite: place.isFavorite,
		createdAt: place.createdAt.toISOString(),
		updatedAt: place.updatedAt.toISOString(),
		stats: place.stats,
		_count: place._count,
	};
}

/**
 * Serializa un array de Places para respuesta de API
 */
export function serializePlaces(places: PlaceWithStats[]) {
	return places.map(serializePlace);
}

/**
 * Serializa un objeto Place con estadísticas completas
 */
export function serializePlaceWithStats(place: PlaceWithStats) {
	return {
		...serializePlace(place),
		_stats: place._stats,
		parsedDangers: place.parsedDangers,
		parsedResources: place.parsedResources,
		metadata: place.metadata,
	};
}
