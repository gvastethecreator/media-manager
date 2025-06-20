/**
 * 🌍 Tipos canónicos para la entidad WorldItem
 * @file Tipos unificados para la entidad WorldItem
 * @module types/entities/world-item/types
 * @description Definición de tipos canónicos basados en Prisma para WorldItem
 * @updated 2025-06-20
 */

import type { Image } from '../image/types';
import type {
	WorldItemRelationshipType,
	WorldItemSortCriteria,
	WorldItemViewMode
} from './enums';
import { WORLD_ITEM_SORT_PROPERTY_MAP } from './enums';

/**
 * 📝 Tipo base canónico para WorldItem
 * Replica los campos del modelo Prisma sin exponer el tipo directamente
 */
export interface WorldItemBase {
        id: string;
        name: string;
        emoji: string;
        color: string;
        description?: string | null;
        shortcut?: string | null;
        category?: string | null;
        sortBy: string;
        filters: string;
        type: string;
        rarity: string;
        attributes: string;
        effects: string;
        size: string;
        requirements: string;
        origin: string;
        stats: string;
        properties: string;
        featuredImage?: string | null;
        isFavorite: boolean;
        createdAt: Date;
        updatedAt: Date;
}

/**
 * 🔧 Interfaces para estructuras de datos serializadas
 */
export interface WorldItemAttribute {
	name: string;
	value: number;
	maxValue?: number;
}

/**
 * 💫 Efectos que puede tener un objeto del mundo
 */
export interface WorldItemEffect {
	name: string;
	description: string;
	duration?: string;
	cooldown?: string;
}

/**
 * 📋 Requisitos para usar un objeto del mundo
 */
export interface WorldItemRequirement {
	name: string;
	value: number;
	description?: string;
}

/**
 * 📊 Estadísticas de un objeto del mundo
 */
export interface WorldItemStat {
	name: string;
	value: number;
	modifier?: string;
}

/**
 * 🏷️ Propiedades de un objeto del mundo
 */
export interface WorldItemProperty {
	name: string;
	value: string | number | boolean;
	description?: string;
}

/**
 * 🔍 Filtro para objetos del mundo
 */
export interface WorldItemFilter {
	type: 'tag' | 'character' | 'place' | 'concept' | 'worldItem';
	operator: 'AND' | 'OR' | 'NOT';
	value: string | number | boolean;
	field?: string;
}

/**
 * 🏷️ Etiquetas para objetos del mundo
 */
export interface WorldItemTags {
	tags: string[];
}

/**
 * 🔗 Relaciones de un objeto del mundo con otras entidades
 */
export interface WorldItemRelations {
	images?: Image[];
	relatedItems?: WorldItemBase[];
	relationType?: WorldItemRelationshipType;
}

/**
 * 🔢 Contadores de relaciones
 */
export interface WorldItemCounts {
	images?: number;
	videos?: number;
	albums?: number;
	collections?: number;
	tags?: number;
	characters?: number;
	places?: number;
	concepts?: number;
	prompts?: number;
	notes?: number;
	wildcards?: number;
	properties?: number;
	groups?: number;
	relatedItems?: number;
}

/**
 * 🔍 Filtros para búsqueda de objetos del mundo
 */
export interface WorldItemFilters {
	sortBy: WorldItemSortCriteria;
	searchTerm: string | null;
	type: string | null;
	category: string | null;
	rarity: string | null;
	minLevel?: number;
	maxLevel?: number;
	minValue?: number;
	maxValue?: number;
	isFavorite?: boolean;
	hasImages?: boolean;
	hasFiles?: boolean;
	hasNotes?: boolean;
	hasConcepts?: boolean;
	hasPrompts?: boolean;
}

/**
 * 🔍 Opciones para búsqueda de objetos del mundo
 */
export interface WorldItemSearchOptions {
	filters?: WorldItemFilters;
	sortBy?: WorldItemSortCriteria;
	page?: number;
	pageSize?: number;
	includeImages?: boolean;
	includeStats?: boolean;
	includeRelations?: boolean;
}

/**
 * 🔄 Campos deserializados de JSON para WorldItem
 */
export interface WorldItemDeserializedFields {
	attributesList: WorldItemAttribute[];
	effectsList: WorldItemEffect[];
	requirementsList: WorldItemRequirement[];
	statsList: WorldItemStat[];
	propertiesList: WorldItemProperty[];
	filtersList: WorldItemFilter[];
	tagsList: string[];
}

/**
 * 📝 WorldItem con campos JSON deserializados
 */
export interface WorldItemDeserialized extends WorldItemBase, WorldItemDeserializedFields {}

/**
 * 🌟 WorldItem completo con todas sus relaciones y campos
 */
export interface WorldItemComplete extends WorldItemDeserialized {
        relations: WorldItemRelations;
        counts: WorldItemCounts;
        ui?: WorldItemUI;
}

/**
 * 🌟 WorldItem con relaciones y conteos
 */
export interface WorldItemWithRelations extends WorldItemBase, WorldItemRelations {
	_count?: WorldItemCounts;
}

/**
 * 📊 Datos UI para visualización de WorldItem
 */
export interface WorldItemUI {
	viewMode?: WorldItemViewMode;
	formattedDate?: string;
	displayRarity?: string;
	displayValue?: string;
	displayLevel?: string;
	rarityClass?: string;
	isSelected?: boolean;
	isExpanded?: boolean;
	isEditing?: boolean;
	isHighlighted?: boolean;
}

/**
 * ➕ Input para crear un nuevo objeto del mundo
 */
export interface WorldItemCreateInput {
	name: string;
	description?: string | null;
	shortcut?: string | null;
	category?: string;
	type?: string;
	rarity?: string;
	size?: string;
	origin?: string;
	attributes?: string | WorldItemAttribute[];
	effects?: string | WorldItemEffect[];
	requirements?: string | WorldItemRequirement[];
	stats?: string | WorldItemStat[];
	properties?: string | WorldItemProperty[];
	filters?: string | WorldItemFilter[];
	tags?: string | string[];
	featuredImage?: string | null;
	isFavorite?: boolean;
	emoji?: string;
	color?: string;
	sortBy?: string;
	images?: { connect: { id: string }[] };
}

/**
 * 🔄 Input para actualizar un objeto del mundo
 */
export interface WorldItemUpdateInput {
	name?: string;
	description?: string | null;
	shortcut?: string | null;
	category?: string;
	type?: string;
	rarity?: string;
	size?: string;
	origin?: string;
	attributes?: string | WorldItemAttribute[];
	effects?: string | WorldItemEffect[];
	requirements?: string | WorldItemRequirement[];
	stats?: string | WorldItemStat[];
	properties?: string | WorldItemProperty[];
	filters?: string | WorldItemFilter[];
	tags?: string | string[];
	featuredImage?: string | null;
	isFavorite?: boolean;
	emoji?: string;
	color?: string;
	sortBy?: string;
	images?: { set: { id: string }[] };
}

/* Exportación de tipos adicionales para retrocompatibilidad */
export type {
	WorldItemCreateInput as CreateWorldItemData,
	WorldItemUpdateInput as UpdateWorldItemData,
	WorldItemDeserialized as WorldItem,
	WorldItemAttribute as WorldItemAttributes,
	WorldItemEffect as WorldItemEffects,
	WorldItemFilter as WorldItemFilterType,
	WorldItemProperty as WorldItemProperties,
	WorldItemRequirement as WorldItemRequirements,
	WorldItemStat as WorldItemStats
};

// Exportar el mapa de propiedades y los criterios de ordenación
	export { WORLD_ITEM_SORT_PROPERTY_MAP };
	export type { WorldItemSortCriteria };

