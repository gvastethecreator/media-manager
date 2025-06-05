/**
 * @file Índice de tipos para la entidad Place
 * @module types/entities/place
 */

// Exportar desde archivo base
export type {
	CreatePlaceData,
	PlaceBase,
	PlaceComplete,
	PlaceDanger,
	PlaceExtended,
	PlaceExtendedComplete,
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

// Exportar tipo principal
export type { PlaceExtendedComplete as Place } from './types';
