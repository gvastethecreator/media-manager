/**
 * @file Enums y tipos principales para la entidad Place
 * @module types/entities/place/types
 */

import type { PlaceBase, PlaceWithStats } from './base';

export enum PlaceCategory {
	CITY = 'city',
	COUNTRY = 'country',
	REGION = 'region',
	LANDMARK = 'landmark',
	OTHER = 'other',
}

export enum PlaceSortCriteria {
	NAME_ASC = 'name:asc',
	NAME_DESC = 'name:desc',
	DATE_ASC = 'date:asc',
	DATE_DESC = 'date:desc',
	CATEGORY_ASC = 'category:asc',
	CATEGORY_DESC = 'category:desc',
	CREATED_ASC = 'createdAt:asc',
	CREATED_DESC = 'createdAt:desc',
	UPDATED_ASC = 'updatedAt:asc',
	UPDATED_DESC = 'updatedAt:desc',
}

export enum PlaceType {
	PHYSICAL = 'physical',
	VIRTUAL = 'virtual',
}

export enum PlaceViewMode {
	GRID = 'grid',
	LIST = 'list',
	DETAIL = 'detail',
}

export interface PlaceSearchOptions {
	query?: string;
	category?: PlaceCategory;
	type?: PlaceType;
	limit?: number;
	offset?: number;
	sortBy?: PlaceSortCriteria;
	sortOrder?: 'asc' | 'desc';
	orderBy?: Record<string, 'asc' | 'desc'>;
	filters?: PlaceFilters;
	pagination?: {
		skip?: number;
		take?: number;
	};
}

// Alias para compatibilidad
export type PlaceComplete = PlaceWithStats;

export interface PlaceFilters {
	search?: string;
	category?: PlaceCategory[] | PlaceCategory;
	type?: PlaceType[] | PlaceType;
	location?: string;
	isFavorite?: boolean;
	hasImages?: boolean;
	hasVideos?: boolean;
	dateRange?: {
		start?: Date;
		end?: Date;
	};
	populationRange?: {
		min?: number;
		max?: number;
	};
}

/**
 * Función para extender un lugar con información adicional
 */
export function extendPlace(place: PlaceBase): PlaceWithStats {
	const stats = {
		spatialRelevance: 0,
		completenessScore: 0,
		geoContextLevel: 0,
		popularity: 0,
	};

	return {
		...place,
		entityType: 'place' as const,
		_stats: stats,
		stats: stats,
		parsedDangers: [],
		parsedResources: [],
		parsedStats: {},
		metadata: {},
		region: null,
		images: 0,
		videos: 0,
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
