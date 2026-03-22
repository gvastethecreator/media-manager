/**
 * @file Tipos extendidos para la entidad WorldItem
 * @module types/entities/world-item/extended
 */

import { WorldItemSortCriteria, WorldItemViewMode } from './enums';
import type { WorldItemEffect, WorldItemProperty, WorldItemRequirement, WorldItemStats } from './stats-types';
import type { WorldItemBase, WorldItemFilters, WorldItemRelations } from './types';

/**
 * Configuración visual para la entidad WorldItem
 */
export interface WorldItemVisualConfig {
	expandedWorldItemIds: string[];
	filters: string;
	lastViewedWorldItemId: string | null;
	selectedWorldItemIds: string[];
	sortBy: WorldItemSortCriteria;
	view: WorldItemViewMode;
}

/**
 * Configuración visual parseada con campos deserializados
 */
export interface ParsedWorldItemVisualConfig {
	expandedWorldItemIds: string[];
	filters: WorldItemFilters;
	lastViewedWorldItemId: string | null;
	selectedWorldItemIds: string[];
	sortBy: WorldItemSortCriteria;
	view: WorldItemViewMode;
}

/**
 * Datos de objeto del mundo con campos parseados
 */
export interface ParsedWorldItem
	extends Omit<WorldItemBase, 'stats' | 'attributes' | 'effects' | 'properties' | 'requirements' | 'filters'> {
	attributesArray: string[];
	effectsArray: WorldItemEffect[];
	filtersObject: WorldItemFilters;
	propertiesArray: WorldItemProperty[];
	requirementsObject: Record<string, WorldItemRequirement>;
	statsObject: WorldItemStats;
}

/**
 * Datos completos de objeto del mundo con relaciones y campos parseados
 */
export interface ParsedWorldItemWithRelations
	extends Omit<WorldItemRelations, keyof ParsedWorldItem>,
		ParsedWorldItem {}

/**
 * Interfaz extendida con campos deserializados para WorldItem
 * Convierte los campos JSON string a sus respectivos objetos/arrays
 */
export interface WorldItemExtended
	extends Omit<WorldItemBase, 'stats' | 'attributes' | 'effects' | 'properties' | 'requirements' | 'filters'> {
	attributes: string[];
	conceptsCount?: number;
	effects: WorldItemEffect[];
	filters: WorldItemFilters;

	// Cache de relaciones
	imagesCount?: number;
	isEditing?: boolean;
	isExpanded?: boolean;

	// Propiedades de UI
	isSelected?: boolean;
	notesCount?: number;
	promptsCount?: number;
	properties: WorldItemProperty[];
	requirements: Record<string, WorldItemRequirement>;
	// Campos deserializados
	stats: WorldItemStats;
}
