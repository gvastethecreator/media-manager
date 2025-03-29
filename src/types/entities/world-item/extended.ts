/**
 * @file Tipos extendidos para la entidad WorldItem
 * @module types/entities/world-item/extended
 */

import type { WorldItemProperty, WorldItemRequirement, WorldItemStats } from './enums';
import type { WorldItemBase, WorldItemWithRelations } from './types';

/**
 * Filtros para la búsqueda de objetos del mundo
 */
export interface WorldItemFilters {
	searchQuery?: string;
	categories?: string[];
	types?: string[];
	rarities?: string[];
	minLevel?: number;
	maxLevel?: number;
	minValue?: number;
	maxValue?: number;
	onlyFavorites?: boolean;
	hasImages?: boolean;
	hasNotes?: boolean;
	hasConcepts?: boolean;
	hasPrompts?: boolean;
}

/**
 * Datos de objeto del mundo con campos parseados
 */
export interface ParsedWorldItem extends WorldItemBase {
	propertiesArray: WorldItemProperty[];
	requirementsObject: Record<string, WorldItemRequirement>;
	statsObject: WorldItemStats;
	filtersObject: WorldItemFilters;
	attributesArray: string[];
	effectsArray: string[];
}

/**
 * Datos completos de objeto del mundo con relaciones y campos parseados
 */
export interface ParsedWorldItemWithRelations extends WorldItemWithRelations, ParsedWorldItem {}

/**
 * Interfaz extendida con campos deserializados para WorldItem
 * Convierte los campos JSON string a sus respectivos objetos/arrays
 */
export interface WorldItemExtended extends Omit<
	WorldItemWithRelations,
	| 'attributes'
	| 'effects'
	| 'requirements'
	| 'stats'
	| 'filters'
	| 'tags'
> {
	/**
	 * Atributos del objeto como array de strings
	 * En la base de datos es almacenado como string JSON
	 */
	attributes: string[];

	/**
	 * Efectos del objeto como array de strings
	 * En la base de datos es almacenado como string JSON
	 */
	effects: string[];

	/**
	 * Requisitos del objeto como objeto
	 * En la base de datos es almacenado como string JSON
	 */
	requirements: Record<string, WorldItemRequirement>;

	/**
	 * Estadísticas del objeto como objeto tipado
	 * En la base de datos es almacenado como string JSON
	 */
	stats: WorldItemStats;

	/**
	 * Configuración de filtros como objeto
	 * En la base de datos es almacenado como string JSON
	 */
	filters: Record<string, any>;

	/**
	 * Tags como array de strings
	 * En la base de datos es almacenado como string JSON opcional
	 */
	tags: string[];

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
	displayRarity?: string;
	displayValue?: string;
	displayLevel?: string;
	rarityClass?: string;
}

/**
 * Tipo para configuración visual de objetos del mundo
 */
export interface WorldItemVisualConfig {
	view?: string;
	sortBy?: string;
	filters?: string;
	lastViewedWorldItemId?: string | null;
	expandedWorldItemIds?: string[];
	selectedWorldItemIds?: string[];
}

/**
 * Tipo para configuración visual parseada de objetos del mundo
 */
export interface ParsedWorldItemVisualConfig {
	view: string;
	sortBy: string;
	filters: Record<string, any>;
	lastViewedWorldItemId: string | null;
	expandedWorldItemIds: string[];
	selectedWorldItemIds: string[];
}

/**
 * Tipo para actualización de configuración visual
 */
export interface WorldItemVisualConfigUpdateData {
	view?: string;
	sortBy?: string;
	filters?: Record<string, any>;
	lastViewedWorldItemId?: string | null;
	expandedWorldItemIds?: string[];
	selectedWorldItemIds?: string[];
}

/**
 * Interfaz para resumen de objeto del mundo (vista previa)
 */
export interface WorldItemSummary {
	id: string;
	name: string;
	emoji: string;
	color: string;
	description: string | null;
	shortcut: string | null;
	category: string | null;
	type: string;
	rarity: string;
	size: string;
	featuredImage: string | null;
	isFavorite: boolean;
	createdAt: Date;
	updatedAt: Date;
	_count?: {
		images?: number;
		videos?: number;
		albums?: number;
		collections?: number;
		tagEntities?: number;
		characters?: number;
		places?: number;
		concepts?: number;
		prompts?: number;
		notes?: number;
		wildcards?: number;
		properties?: number;
		groups?: number;
	};
}
