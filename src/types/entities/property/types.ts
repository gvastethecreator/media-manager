/**
 * @file Tipos para la entidad Property
 * @module types/entities/property/property-types
 */

import type { Album } from '../album/types';
import type { Character } from '../character/types';
import type { Collection } from '../collection/types';
import type { Concept } from '../concept/types';
import type { Group } from '../group/types';
import type { Image } from '../image/image-types';
import type { Note } from '../note/types';
import type { Place } from '../place/types';
import type { Prompt } from '../prompt/types';
import type { Tag } from '../tag/types';
import type { Video } from '../video/video-types';
import type { Wildcard } from '../wildcard/types';
import type { WorldItem } from '../world-item/types';

/**
 * Interfaz base para propiedad
 */
export interface PropertyBase {
	id: string;
	name: string;
	emoji: string;
	color: string;
	description: string | null;
	shortcut: string | null;
	category: string | null;
	featuredImage: string | null;
	isFavorite: boolean;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Interfaz para relaciones de propiedad
 */
export interface PropertyRelations {
	images?: Image[];
	videos?: Video[];
	albums?: Album[];
	collections?: Collection[];
	tags?: Tag[];
	characters?: Character[];
	places?: Place[];
	worldItems?: WorldItem[];
	concepts?: Concept[];
	prompts?: Prompt[];
	notes?: Note[];
	wildcards?: Wildcard[];
	groups?: Group[];
}

/**
 * Interfaz para conteos de relaciones de propiedad
 */
export interface PropertyCounts {
	images?: number;
	videos?: number;
	albums?: number;
	collections?: number;
	tags?: number;
	characters?: number;
	places?: number;
	worldItems?: number;
	concepts?: number;
	prompts?: number;
	notes?: number;
	wildcards?: number;
	groups?: number;
}

/**
 * Interfaz para campos UI calculados de propiedad
 */
export interface PropertyUI {
	lastUpdated: Date;
	itemCount: number;
}

/**
 * Interfaz para propiedades deserializadas
 */
export interface PropertyDeserialized extends PropertyBase {
	_relations?: PropertyRelations;
	_count?: PropertyCounts;
	_ui?: PropertyUI;
}

/**
 * Interfaz extendida que incluye relaciones
 */
export interface PropertyWithRelations extends PropertyBase {
	_relations: PropertyRelations;
}

/**
 * Interfaz completa que incluye todos los campos y relaciones
 */
export interface PropertyComplete extends PropertyBase {
	_relations?: PropertyRelations;
	_count?: PropertyCounts;
	_ui?: PropertyUI;
}

/**
 * Interfaz extendida con campos adicionales para UI
 */
export interface PropertyExtended extends PropertyComplete {
	displayName: string;
	formattedDate: string;
	colorClass: string;
	categoryLabel: string;
}

/**
 * Interfaz para estadísticas de propiedad
 */
export interface PropertyStats {
	imageCount: number;
	videoCount: number;
	albumCount: number;
	collectionCount: number;
	tagCount: number;
	characterCount: number;
	placeCount: number;
	worldItemCount: number;
	conceptCount: number;
	promptCount: number;
	noteCount: number;
	wildcardCount: number;
	groupCount: number;
	totalContentItems: number;
	usageCount: number;
	lastUpdated: Date;
}

/**
 * Interfaz para propiedad con estadísticas
 */
export interface PropertyWithStats extends PropertyComplete {
	stats: PropertyStats;
}

/**
 * Interfaz para crear una propiedad
 */
export interface CreatePropertyData {
	name: string;
	emoji?: string;
	color?: string;
	description?: string | null;
	shortcut?: string | null;
	category?: string | null;
	featuredImage?: string | null;
	isFavorite?: boolean;
}

/**
 * Interfaz para actualizar una propiedad
 */
export interface UpdatePropertyData {
	name?: string;
	emoji?: string;
	color?: string;
	description?: string | null;
	shortcut?: string | null;
	category?: string | null;
	featuredImage?: string | null;
	isFavorite?: boolean;
}

/**
 * Alias para mantener compatibilidad con la API actual
 */
export type PropertyUpdateInput = UpdatePropertyData;

/**
 * Interfaz para filtros de búsqueda de propiedades
 */
export interface PropertyFilters {
	searchQuery?: string;
	categories?: string[];
	onlyFavorites?: boolean;
}

/**
 * Interfaz para opciones de búsqueda de propiedades
 */
export interface PropertySearchOptions {
	page?: number;
	pageSize?: number;
	sortBy?: PropertySortCriteria;
	filters?: PropertyFilters;
	include?: {
		images?: boolean;
		videos?: boolean;
		albums?: boolean;
		collections?: boolean;
		tags?: boolean;
		characters?: boolean;
		places?: boolean;
		worldItems?: boolean;
		concepts?: boolean;
		prompts?: boolean;
		notes?: boolean;
		wildcards?: boolean;
		groups?: boolean;
	};
}

/**
 * Interfaz para resultados de búsqueda de propiedades
 */
export interface PropertySearchResult {
	items: PropertyComplete[];
	total: number;
	totalPages: number;
}

/**
 * Enumeración para criterios de ordenación
 */
export enum PropertySortCriteria {
	NAME_ASC = 'name:asc',
	NAME_DESC = 'name:desc',
	CREATED_ASC = 'created:asc',
	CREATED_DESC = 'created:desc',
	UPDATED_ASC = 'updated:asc',
	UPDATED_DESC = 'updated:desc',
}

/**
 * Enumeración para modos de visualización
 */
export enum PropertyViewMode {
	GRID = 'grid',
	LIST = 'list',
	CARDS = 'cards',
	DETAILS = 'details',
}

/**
 * Mapa de propiedades para ordenación
 */
export const PROPERTY_SORT_PROPERTY_MAP: Record<PropertySortCriteria, string> = {
	[PropertySortCriteria.NAME_ASC]: 'name',
	[PropertySortCriteria.NAME_DESC]: 'name',
	[PropertySortCriteria.CREATED_ASC]: 'createdAt',
	[PropertySortCriteria.CREATED_DESC]: 'createdAt',
	[PropertySortCriteria.UPDATED_ASC]: 'updatedAt',
	[PropertySortCriteria.UPDATED_DESC]: 'updatedAt',
};
