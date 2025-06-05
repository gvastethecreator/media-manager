/**
 * @file Tipos extendidos para la entidad WorldItem
 * @module types/entities/world-item/extended
 */

import type { WorldItemSortCriteria, WorldItemViewMode } from './enums';
import type { WorldItemEffect, WorldItemProperty, WorldItemRequirement, WorldItemStats } from './stats-types';
import type { WorldItemBase, WorldItemFilters, WorldItemWithRelations } from './types';

/**
 * Configuración visual para la entidad WorldItem
 */
export interface WorldItemVisualConfig {
	view: WorldItemViewMode;
	sortBy: WorldItemSortCriteria;
	filters: string;
	lastViewedWorldItemId: string | null;
	expandedWorldItemIds: string[];
	selectedWorldItemIds: string[];
}

/**
 * Configuración visual parseada con campos deserializados
 */
export interface ParsedWorldItemVisualConfig {
	view: WorldItemViewMode;
	sortBy: WorldItemSortCriteria;
	filters: WorldItemFilters;
	lastViewedWorldItemId: string | null;
	expandedWorldItemIds: string[];
	selectedWorldItemIds: string[];
}

/**
 * Datos de objeto del mundo con campos parseados
 */
export interface ParsedWorldItem
	extends Omit<WorldItemBase, 'stats' | 'attributes' | 'effects' | 'properties' | 'requirements' | 'filters'> {
	statsObject: WorldItemStats;
	attributesArray: string[];
	effectsArray: WorldItemEffect[];
	propertiesArray: WorldItemProperty[];
	requirementsObject: Record<string, WorldItemRequirement>;
	filtersObject: WorldItemFilters;
}

/**
 * Datos completos de objeto del mundo con relaciones y campos parseados
 */
export interface ParsedWorldItemWithRelations
	extends Omit<WorldItemWithRelations, keyof ParsedWorldItem>,
		ParsedWorldItem {}

/**
 * Interfaz extendida con campos deserializados para WorldItem
 * Convierte los campos JSON string a sus respectivos objetos/arrays
 */
export interface WorldItemExtended
	extends Omit<WorldItemBase, 'stats' | 'attributes' | 'effects' | 'properties' | 'requirements' | 'filters'> {
	// Campos deserializados
	stats: WorldItemStats;
	attributes: string[];
	effects: WorldItemEffect[];
	properties: WorldItemProperty[];
	requirements: Record<string, WorldItemRequirement>;
	filters: WorldItemFilters;

	// Propiedades de UI
	isSelected?: boolean;
	isExpanded?: boolean;
	isEditing?: boolean;

	// Cache de relaciones
	imagesCount?: number;
	notesCount?: number;
	conceptsCount?: number;
	promptsCount?: number;
}
