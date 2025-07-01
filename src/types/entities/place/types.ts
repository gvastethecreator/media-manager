/**
 * @file Enums y tipos principales para la entidad Place
 * @module types/entities/place/types
 */

export enum PlaceCategory {
	CITY = 'city',
	COUNTRY = 'country',
	REGION = 'region',
	LANDMARK = 'landmark',
	OTHER = 'other',
}

export enum PlaceSortCriteria {
	NAME = 'name',
	DATE = 'date',
	CATEGORY = 'category',
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
	description?: string;
	location?: string;
	coordinates?: string;
	category?: PlaceCategory;
	type?: PlaceType;
	createdAt: Date;
	updatedAt: Date;
}

export interface PlaceComplete extends PlaceBase {
	// Relaciones completas cuando sea necesario
}

export interface PlacePreview extends Pick<PlaceBase, 'id' | 'name' | 'location' | 'category'> {
	stats?: {
		imageCount?: number;
	};
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
