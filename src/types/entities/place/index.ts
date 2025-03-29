/**
 * @file Exportaciones principales de tipos para la entidad Place
 * @module types/entities/place
 */

export * from './base';
export * from './enums';
export * from './extended';
export * from './place-types';

// Alias común para el tipo principal
export type { PlaceWithRelations as Place } from './place-types';

// Reexportar enums explícitamente para evitar problemas de importación
export {
    ClimateType,
    DangerLevel,
    GovernmentType,
    PlaceCategory,
    PlaceSortCriteria,
    PlaceType,
    PlaceViewMode
} from './enums';

// Reexportar tipos explícitamente
export type {
    CreatePlaceData,
    PlaceBase,
    PlaceWithRelations,
    UpdatePlaceData
} from './base';

export type {
    ParsedPlace,
    ParsedPlaceVisualConfig,
    ParsedPlaceWithRelations,
    PlaceFilters,
    PlaceVisualConfig,
    PlaceVisualConfigUpdateData
} from './extended';

