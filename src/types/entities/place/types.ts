/**
 * @file Enums y tipos principales para la entidad Place
 * @module types/entities/place/types
 */

import type { PlaceWithStats } from './base';

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

export interface PlaceBase {
	id: string;
	name: string;
	description: string | null;
	emoji: string | null;
	color: string | null;
	category: string | null;

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
}

export interface PlaceSearchOptions {
	query?: string;
	category?: PlaceCategory;
	type?: PlaceType;
	limit?: number;
	offset?: number;
	sortBy?: PlaceSortCriteria;
	sortOrder?: 'asc' | 'desc';
}

// Alias para compatibilidad
export type PlaceComplete = PlaceWithStats;

export interface PlaceFilters {
	search?: string;
	category?: PlaceCategory[];
	type?: PlaceType[];
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
	return {
		...place,
		entityType: 'place' as const,
		_stats: {
			spatialRelevance: 0,
			completenessScore: 0,
			geoContextLevel: 0,
			popularity: 0,
		},
		stats: {
			spatialRelevance: 0,
			completenessScore: 0,
			geoContextLevel: 0,
			popularity: 0,
		},
	};
}

/**
 * Función para extender múltiples lugares
 */
export function extendPlaces(places: PlaceBase[]): PlaceWithStats[] {
	return places.map(extendPlace);
}
