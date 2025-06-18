/**
 * 🌍 Tipos canónicos para la entidad WorldItem
 *
 * - Este archivo contiene todos los tipos base, relaciones e inputs para WorldItem.
 * - Usar SIEMPRE estos tipos en transformers, services y server actions.
 * - No usar ni importar tipos de base.ts (eliminado).
 *
 * Estructura:
 * - WorldItemBase: tipo canónico principal
 * - WorldItemRelations: relaciones con otras entidades (any[] si no existen tipos canónicos)
 * - WorldItemCreateInput, WorldItemUpdateInput: inputs para mutaciones
 *
 * 🛡️ Todos los campos clave (id, createdAt, updatedAt) son obligatorios.
 * 📝 Documenta cualquier cambio relevante aquí.
 */

/**
 * @file Tipos unificados para la entidad WorldItem
 * @module types/entities/world-item/types
 */

import type { BaseEntity, BaseRelationCounts } from '@/types/common/transformer';
import type { UIFields } from '@/utils/transformers/common';
import type { Image } from '../image';
import {
    WORLD_ITEM_SORT_PROPERTY_MAP,
    type WorldItemCategory,
    type WorldItemRarity,
    type WorldItemRelationshipType,
    WorldItemSortCriteria,
    type WorldItemType,
    type WorldItemViewMode,
} from './enums';

/**
 * Interfaz para atributos de objetos del mundo
 */
export interface WorldItemAttribute {
	name: string;
	value: number;
	maxValue?: number;
}

/**
 * Interfaz para efectos de objetos del mundo
 */
export interface WorldItemEffect {
	name: string;
	description: string;
	duration?: string;
	cooldown?: string;
}

/**
 * Interfaz para requisitos de objetos del mundo
 */
export interface WorldItemRequirement {
	name: string;
	value: number;
	description?: string;
}

/**
 * Interfaz para estadísticas de objetos del mundo
 */
export interface WorldItemStat {
	name: string;
	value: number;
	modifier?: string;
}

/**
 * Interfaz para propiedades de objetos del mundo
 */
export interface WorldItemProperty {
	name: string;
	value: string | number | boolean;
	description?: string;
}

/**
 * Interfaz para filtros de objetos del mundo
 */
export interface WorldItemFilter {
	type: 'tag' | 'character' | 'place' | 'concept' | 'worldItem';
	operator: 'AND' | 'OR' | 'NOT';
	value: string | number | boolean;
	field?: string;
}

/**
 * Etiquetas del objeto del mundo
 */
export interface WorldItemTags {
	tags: string[];
}

/**
 * Relaciones del objeto del mundo
 */
export interface WorldItemRelations {
	images?: Image[];
	relatedItems?: WorldItemBase[];
	relationType?: WorldItemRelationshipType;
}

/**
 * Contadores del objeto del mundo
 */
export interface WorldItemCounts extends BaseRelationCounts {
	images?: number;
	relatedItems?: number;
}

/**
 * Datos de UI para el objeto del mundo
 */
export interface WorldItemUI extends UIFields {
	emoji: string;
	color: string;
	viewMode?: WorldItemViewMode;
	formattedDate?: string; // 📅 Fecha formateada para mostrar en UI
}

/**
 * Filtros para búsqueda de objetos del mundo
 */
export interface WorldItemFilters {
	query?: string;
	types?: WorldItemType[];
	categories?: WorldItemCategory[];
	rarities?: WorldItemRarity[];
	minLevel?: number;
	maxLevel?: number;
	minValue?: number;
	maxValue?: number;
	isFavorite?: boolean;
	hasImages?: boolean;
	hasFiles?: boolean;
}

/**
 * Opciones para búsqueda de objetos del mundo
 */
export interface WorldItemSearchOptions {
	filters?: WorldItemFilters;
	sortBy?: WorldItemSortCriteria;
	page?: number;
	pageSize?: number;
	includeImages?: boolean;
	includeStats?: boolean;
}

/**
 * Entidad base para WorldItem
 */
export interface WorldItemBase extends BaseEntity {
	name: string;
	description: string | null;
	shortcut: string | null;
	category: string;
	type: string;
	rarity: string;
	size: string;
	origin: string;
	attributes: string;
	effects: string;
	requirements: string;
	stats: string;
	properties: string;
	filters: string;
	featuredImage: string | null;
	isFavorite: boolean;
	emoji: string;
	color: string;
	sortBy: string;
}

/**
 * Campos serializados/deserializados para WorldItem
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
 * Objeto del mundo con campos deserializados
 */
export interface WorldItemDeserialized extends WorldItemBase, WorldItemDeserializedFields {}

/**
 * Objeto del mundo completo con todas sus relaciones y campos
 */
export interface WorldItemComplete extends WorldItemDeserialized {
	ui: WorldItemUI;
	relations: WorldItemRelations;
	counts: WorldItemCounts;
}

/**
 * Datos para crear un nuevo objeto del mundo
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
 * Datos para actualizar un objeto del mundo existente
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

    export { WORLD_ITEM_SORT_PROPERTY_MAP, WorldItemSortCriteria };

