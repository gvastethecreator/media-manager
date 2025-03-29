/**
 * @file Tipos extendidos para la entidad Place
 * @module types/entities/place/extended
 */

import type { PlaceBase, PlaceWithRelations } from './base';
import type { PlaceDanger, PlaceResource, PlaceStats } from './enums';

/**
 * Filtros para la búsqueda de lugares
 */
export interface PlaceFilters {
	searchQuery?: string;
	categories?: string[];
	types?: string[];
	climates?: string[];
	governments?: string[];
	dangerLevels?: string[];
	populationMin?: number;
	populationMax?: number;
	onlyFavorites?: boolean;
	hasImages?: boolean;
	hasNotes?: boolean;
	hasConcepts?: boolean;
	hasPrompts?: boolean;
}

/**
 * Datos de lugar con campos parseados
 */
export interface ParsedPlace extends PlaceBase {
	dangersArray: PlaceDanger[];
	resourcesArray: PlaceResource[];
	statsObject: PlaceStats;
	filtersObject: PlaceFilters;
}

/**
 * Datos completos de lugar con relaciones y campos parseados
 */
export interface ParsedPlaceWithRelations extends PlaceWithRelations, ParsedPlace {}

/**
 * Entidad Place extendida con propiedades de UI
 */
export interface Place extends ParsedPlaceWithRelations {
	// Propiedades de UI
	isSelected?: boolean;
	isExpanded?: boolean;
	isEditing?: boolean;
	isHighlighted?: boolean;

	// Cache de relaciones
	imagesCount?: number;
	notesCount?: number;
	conceptsCount?: number;
	promptsCount?: number;

	// Datos derivados
	dangerLevel?: string;
	displayPopulation?: string;
	displaySize?: string;
	regionPath?: string[];
}
