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
	description: string | null;
	emoji: string | null;
	color: string | null;
	category: string | null;
	isPublic: boolean;
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
