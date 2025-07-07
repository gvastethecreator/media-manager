/**
 * @file Serializadores para la entidad Place
 * @module transformers/place/serializers
 
 */

import type { PlaceWithStats } from '@/types/entities/place';

/**
 * Serializa un objeto Place para respuesta de API
 */
export function serializePlace(place: PlaceWithStats) {
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
		createdAt: place.createdAt.toISOString(),
		updatedAt: place.updatedAt.toISOString(),
		stats: place.stats,
	};
}

/**
 * Serializa un array de Places para respuesta de API
 */
export function serializePlaces(places: PlaceWithStats[]) {
	return places.map(serializePlace);
}

/**
 * Normaliza las coordenadas de un lugar
 */
export function normalizeCoordinates(coordinates: any): { lat: number; lng: number } | null {
	if (!coordinates) return null;

	const lat = Number.parseFloat(coordinates.lat);
	const lng = Number.parseFloat(coordinates.lng);

	if (Number.isNaN(lat) || Number.isNaN(lng)) return null;

	return { lat, lng };
}
