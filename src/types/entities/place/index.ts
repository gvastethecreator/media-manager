/**
 * @file Índice de tipos para la entidad Place
 * @module types/entities/place
 */

// Exportar desde archivo base
// Exportar tipo principal
export type {
	CreatePlaceData,
	PlaceBase,
	PlaceComplete,
	PlaceDanger,
	PlaceExtended,
	PlaceExtendedComplete,
	PlaceExtendedComplete as Place,
	PlaceFilters,
	PlaceResource,
	PlaceStat,
	PlaceStats,
	PlaceWithRelations,
	UpdatePlaceData,
} from './types';
// Exportar desde enumeraciones
export {
	PLACE_SORT_PROPERTY_MAP,
	PlaceCategory,
	PlaceClimate,
	PlaceSortCriteria,
	PlaceType,
} from './types';
