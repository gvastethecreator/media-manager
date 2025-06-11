/**
 * @file Tipos para la entidad Wildcard
 * @module types/entities/wildcard/types
 */


// Importar tipos principales usando los alias de índice para evitar errores de importación y mantener consistencia
import type { AlbumComplete } from '../album/extended';
import type { CharacterWithRelations as Character } from '../character';
import type { CollectionWithRelations as Collection } from '../collection';
import type { Concept } from '../concept';
import type { Group } from '../group';
import type { Image } from '../image';
import type { Note } from '../note';
import type { Place } from '../place';
import type { Prompt } from '../prompt';
import type { Property } from '../property';
import type { Tag } from '../tag';
import type { Video } from '../video';
import type { WorldItem } from '../world-item';

/**
 * Interfaz para un hijo de wildcard
 */
export interface WildcardChild {
	id?: string;
	name: string;
	emoji?: string;
	color?: string;
	shortcut?: string | null;
	children?: WildcardChild[];
}

/**
 * Interfaz base para comodín
 */
export interface WildcardBase {
       id: string;
       name: string;
       emoji: string;
       color: string;
       description: string | null;
       shortcut: string | null;
       category: string | null;
       children: string; // JSON string de hijos
       featuredImage: string | null;
       isFavorite: boolean;
       parentId: string | null;
       createdAt: Date;
       updatedAt: Date;
}

/**
 * Interfaz para relaciones de Wildcard
 */
export interface WildcardRelations {
       // Relaciones jerárquicas
       parent?: WildcardBase | null;
       childWildcards?: WildcardBase[];

	// Otras relaciones
	images?: Image[];
	videos?: Video[];
	albums?: AlbumComplete[];
	collections?: Collection[];
	tags?: Tag[];
	characters?: Character[];
	places?: Place[];
	worldItems?: WorldItem[];
	concepts?: Concept[];
	prompts?: Prompt[];
	notes?: Note[];
	properties?: Property[];
	groups?: Group[];
}

/**
 * Interfaz para conteos de relaciones
 */
export interface WildcardCounts {
	childWildcards?: number;
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
	properties?: number;
	groups?: number;
}

/**
 * Interfaz para campos UI calculados
 */
export interface WildcardUI {
	hasParent: boolean;
	hasChildren: boolean;
	itemCount: number;
	parsedChildren: WildcardChild[];
	lastUpdated: Date;
}

/**
 * Interfaz para datos deserializados
 */
export interface WildcardDeserialized extends WildcardBase {
	parsedChildren?: WildcardChild[];
	_relations?: WildcardRelations;
	_count?: WildcardCounts;
	_ui?: WildcardUI;
}

/**
 * Interfaz extendida que incluye relaciones
 */
export interface WildcardWithRelations extends WildcardBase {
	_relations: WildcardRelations;
	childrenData?: WildcardChild[];
}

/**
 * Interfaz completa que incluye todos los campos y relaciones
 */
export interface WildcardComplete extends WildcardBase {
	parsedChildren: WildcardChild[];
	_relations?: WildcardRelations;
	_count?: WildcardCounts;
	_ui: WildcardUI;
}

/**
 * Interfaz extendida para Wildcard con propiedades adicionales para UI
 */
export interface WildcardExtended extends WildcardComplete {
	// Puedes agregar aquí propiedades adicionales para la UI si es necesario
	// Ejemplo: isSelected, isEditing, etc.
	isSelected?: boolean;
	isEditing?: boolean;
	isExpanded?: boolean;
	isLoading?: boolean;
	isDropTarget?: boolean;
	isDragging?: boolean;
	isHighlighted?: boolean;
	hasError?: boolean;
}

/**
 * Interfaz para Wildcard con estadísticas calculadas
 */
export interface WildcardWithStats extends WildcardComplete {
	stats?: {
		childCount?: number;
		depth?: number;
		[item: string]: number | undefined;
	};
}

/**
 * Interfaz para crear un comodín
 */
export interface CreateWildcardData {
	name: string;
	emoji?: string;
	color?: string;
	description?: string | null;
	shortcut?: string | null;
	category?: string | null;
	children?: string | WildcardChild[];
	featuredImage?: string | null;
	isFavorite?: boolean;
	parentId?: string | null;
}

/**
 * Interfaz para actualizar un comodín
 */
export interface UpdateWildcardData {
	name?: string;
	emoji?: string;
	color?: string;
	description?: string | null;
	shortcut?: string | null;
	category?: string | null;
	children?: string | WildcardChild[];
	featuredImage?: string | null;
	isFavorite?: boolean;
	parentId?: string | null;
}

/**
 * Alias para mantener compatibilidad con la API actual
 */
export type WildcardUpdateInput = UpdateWildcardData;

/**
 * Interfaz para filtros de búsqueda de comodines
 */
export interface WildcardFilters {
	searchQuery?: string;
	categories?: string[];
	onlyFavorites?: boolean;
	parentId?: string | null;
	hasChildren?: boolean;
}

/**
 * Interfaz para opciones de búsqueda de comodines
 */
export interface WildcardSearchOptions {
	page?: number;
	pageSize?: number;
	sortBy?: WildcardSortCriteria;
	filters?: WildcardFilters;
	include?: {
		parent?: boolean;
		childWildcards?: boolean;
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
		properties?: boolean;
		groups?: boolean;
	};
}

/**
 * Interfaz para resultados de búsqueda de comodines
 */
export interface WildcardSearchResult {
	items: WildcardComplete[];
	total: number;
	totalPages: number;
}

/**
 * Enumeración para criterios de ordenación
 */
export enum WildcardSortCriteria {
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
export enum WildcardViewMode {
	GRID = 'grid',
	LIST = 'list',
	CARDS = 'cards',
	TREE = 'tree',
	DETAILS = 'details',
}

/**
 * Mapa de propiedades para ordenación
 */
export const WILDCARD_SORT_PROPERTY_MAP: Record<WildcardSortCriteria, string> = {
	[WildcardSortCriteria.NAME_ASC]: 'name',
	[WildcardSortCriteria.NAME_DESC]: 'name',
	[WildcardSortCriteria.CREATED_ASC]: 'createdAt',
	[WildcardSortCriteria.CREATED_DESC]: 'createdAt',
	[WildcardSortCriteria.UPDATED_ASC]: 'updatedAt',
	[WildcardSortCriteria.UPDATED_DESC]: 'updatedAt',
};
