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
