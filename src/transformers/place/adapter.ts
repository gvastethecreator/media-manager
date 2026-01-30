/**
 * @file Place Result to WithStats Adapter
 * @module transformers/place/adapter
 */

import type { PlaceStatistics, PlaceWithStats } from '@/types/entities/place';

/**
 * Estadísticas por defecto para Place
 */
function defaultPlaceStats(): PlaceStatistics {
	const now = new Date();

	return {
		// Estadísticas de EntityStats base
		imageCount: 0,
		videoCount: 0,
		albumCount: 0,
		collectionCount: 0,
		tagCount: 0,
		characterCount: 0,
		placeCount: 0,
		worldItemCount: 0,
		conceptCount: 0,
		promptCount: 0,
		noteCount: 0,
		wildcardCount: 0,
		propertyCount: 0,
		groupCount: 0,
		totalItems: 0,
		totalAssociations: 0,
		lastUpdated: now,
		lastViewed: null,
		lastModified: null,

		// Métricas de uso opcionales
		viewCount: 0,
		downloadCount: 0,
		likeCount: 0,
		commentCount: 0,

		// Métricas de calidad opcionales
		qualityScore: 0.5,
		completenessScore: 0.6,

		// Estado opcionales
		isDuplicate: false,
		isOrphaned: false,
		needsAttention: false,

		// Propiedades del sistema de archivos
		size: 0,
		mtime: now,
		birthtime: now,
		type: 'place',

		// Estadísticas específicas de Place
		spatialRelevance: 0.5,
		geoContextLevel: 0.5,
		popularity: 0.5,
		isDirectory: false,
		isFile: false,
	};
}

/**
 * Adapta un objeto Place raw de la base de datos al formato PlaceWithStats
 */
export function adaptPlaceToWithStats(place: any): PlaceWithStats {
	// Calcular isFavorite basado en algún criterio simple
	const isFavorite = place.description ? place.description.includes('favorite') : false;

	return {
		...place,
		stats: defaultPlaceStats(),
		isFavorite,
		entityType: 'place' as const,
	};
}

/**
 * Adapta una lista de Place raw al formato PlaceWithStats[]
 */
export function adaptPlaceListToWithStats(places: any[]): PlaceWithStats[] {
	return places.map(adaptPlaceToWithStats);
}
