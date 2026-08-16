/**
 * @file Enums y tipos principales para la entidad Place
 * @module types/entities/place/types
 */

import { createDefaultEntityStats } from '@/lib/utils';
import type { PlaceBase, PlaceStatistics, PlaceWithStats } from './base';
import { PlaceCategory, PlaceSortCriteria, PlaceType, PlaceViewMode } from './enums';

export interface PlaceSearchOptions {
	category?: PlaceCategory;
	filters?: PlaceFilters;
	limit?: number;
	offset?: number;
	orderBy?: Record<string, 'asc' | 'desc'>;
	pagination?: {
		skip?: number;
		take?: number;
	};
	query?: string;
	sortBy?: PlaceSortCriteria;
	sortOrder?: 'asc' | 'desc';
	type?: PlaceType;
}

// Alias para compatibilidad
export type PlaceComplete = PlaceWithStats;

export interface PlaceFilters {
	category?: PlaceCategory[] | PlaceCategory;
	dateRange?: {
		start?: Date;
		end?: Date;
	};
	hasImages?: boolean;
	hasVideos?: boolean;
	isFavorite?: boolean;
	location?: string;
	populationRange?: {
		min?: number;
		max?: number;
	};
	search?: string;
	type?: PlaceType[] | PlaceType;
}

/**
 * Función para extender un lugar con información adicional
 */
export function extendPlace(place: PlaceBase): PlaceWithStats {
	const images = place.totalImages ?? 0;
	const videos = place.totalVideos ?? 0;
	const baseStats = createDefaultEntityStats({
		// FS + tipo entidad
		type: 'place',
		// Conteos básicos conocidos
		imageCount: images,
		videoCount: videos,
		totalItems: images + videos,
	});

	const stats: PlaceStatistics = {
		...baseStats,
		isDirectory: false,
		isFile: true,
		spatialRelevance: 0,
		completenessScore: 0,
		geoContextLevel: 0,
		popularity: 0,
	};

	return {
		...place,
		entityType: 'place' as const,
		stats,
		statistics: stats,
		parsedDangers: [],
		parsedResources: [],
		parsedStats: {},
		metadata: {},
		region: null,
		images,
		videos,
		tags: 0,
		characters: 0,
		collections: 0,
		concepts: 0,
	};
}

/**
 * Función para extender múltiples lugares
 */
export function extendPlaces(places: PlaceBase[]): PlaceWithStats[] {
	return places.map(extendPlace);
}
