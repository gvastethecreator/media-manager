/**
 * @file Tipos canónicos para la entidad Wildcard
 * @module types/entities/wildcard/types
 * @warning ⚠️ No importar tipos de Prisma ni de archivos legacy. Usar solo estos tipos en transformers, server actions y validaciones.
 * @description Estructura unificada y validada para Wildcard.
 * Última migración: 2025-06-18
 */

/**
 * Criterios de ordenación para wildcards
 */
export enum WildcardSortCriteria {
	NAME_ASC = 'name:asc',
	NAME_DESC = 'name:desc',
	USAGE_ASC = 'usage:asc',
	USAGE_DESC = 'usage:desc',
	CREATED_ASC = 'createdAt:asc',
	CREATED_DESC = 'createdAt:desc',
	UPDATED_ASC = 'updatedAt:asc',
	UPDATED_DESC = 'updatedAt:desc',
}

/**
 * Modos de visualización para wildcards
 */
export enum WildcardViewMode {
	GRID = 'grid',
	LIST = 'list',
	TREE = 'tree', // Vista jerárquica
	COMPACT = 'compact',
}

/**
 * Mapa de propiedades para ordenación
 */
export const WILDCARD_SORT_PROPERTY_MAP: Record<WildcardSortCriteria, string> = {
	[WildcardSortCriteria.NAME_ASC]: 'name',
	[WildcardSortCriteria.NAME_DESC]: 'name',
	[WildcardSortCriteria.USAGE_ASC]: 'usage',
	[WildcardSortCriteria.USAGE_DESC]: 'usage',
	[WildcardSortCriteria.CREATED_ASC]: 'createdAt',
	[WildcardSortCriteria.CREATED_DESC]: 'createdAt',
	[WildcardSortCriteria.UPDATED_ASC]: 'updatedAt',
	[WildcardSortCriteria.UPDATED_DESC]: 'updatedAt',
};

/**
 * Tipo base canónico para Wildcard
 */
export interface WildcardBase {
	id: string;
	name: string;
	emoji: string;
	color: string;
	description?: string | null;
	shortcut?: string | null;
	category?: string | null;
	children: string; // JSON string de hijos
	featuredImage?: string | null;
	isFavorite: boolean;
	parentId?: string | null;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Input para creación
 */
export interface WildcardCreateInput {
	id?: string;
	name: string;
	emoji?: string;
	color?: string;
	description?: string | null;
	shortcut?: string | null;
	category?: string | null;
	childrenIds?: string[];
	featuredImage?: string | null;
	isFavorite?: boolean;
	parentId?: string | null;
}

/**
 * Input para actualización
 */
export type WildcardUpdateInput = Partial<Omit<WildcardBase, 'id' | 'createdAt' | 'updatedAt'>>;

/**
 * Input para actualización en lote
 */
export interface WildcardBulkUpdateData {
	parentId?: string | null;
	category?: string | null;
	isFavorite?: boolean;
}

/**
 * Versión simplificada de Wildcard para relaciones
 */
export interface WildcardRelated {
	id: string;
	name: string;
	emoji: string;
	color: string;
	category?: string | null;
	parentId?: string | null;
	isFavorite: boolean;
}

/**
 * Estructura de un hijo de wildcard
 */
export interface WildcardChild {
	id: string;
	name: string;
}

/**
 * Relaciones de wildcard con otras entidades
 */
export interface WildcardRelations {
	parent?: WildcardComplete | null;
	childWildcards?: WildcardComplete[];
}

/**
 * Conteos de relaciones de wildcard
 */
export interface WildcardCounts {
	_count?: {
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
	};
}

/**
 * Filtros para búsqueda de wildcards
 */
export interface WildcardFilters {
	searchQuery?: string;
	categories?: string[];
	onlyFavorites?: boolean;
	parentId?: string | null;
	hasChildren?: boolean;
}

/**
 * Filtros avanzados para búsqueda de wildcards
 */
export interface WildcardSearchFilters {
	category?: string;
	parentId?: string | null;
	isFavorite?: boolean;
	ids?: string[];
	excludeIds?: string[];
	createdAfter?: Date;
	createdBefore?: Date;
	updatedAfter?: Date;
	updatedBefore?: Date;
}

/**
 * Opciones UI para wildcards
 */
export interface WildcardUI {
	sortBy?: WildcardSortCriteria;
	viewMode?: WildcardViewMode;
}

/**
 * Wildcard completo con todas sus relaciones
 */
export interface WildcardComplete extends WildcardBase, WildcardRelations, WildcardCounts {}

/**
 * Opciones de búsqueda para wildcards
 */
export interface WildcardSearchOptions {
	skip?: number;
	take?: number;
	page?: number;
	limit?: number;
	sortBy?: string;
	sortOrder?: 'asc' | 'desc';
	searchQuery?: string;
	filters?: WildcardSearchFilters;
	includeStats?: boolean;
	includeImages?: boolean;
	includeVideos?: boolean;
	includeAlbums?: boolean;
	includeTags?: boolean;
	includeParent?: boolean;
}

/**
 * Resultado de búsqueda de wildcards
 */
export interface WildcardSearchResult {
	items: WildcardComplete[];
	total: number;
	hasMore: boolean;
}

// Alias para compatibilidad
export type CreateWildcardData = WildcardCreateInput;
export type UpdateWildcardData = WildcardUpdateInput;
export type WildcardExtended = WildcardComplete;
export type WildcardWithRelations = WildcardComplete;
export type WildcardWithStats = WildcardComplete;
export type WildcardDeserialized = WildcardComplete;

// 🟢 Documentación y advertencia:
// - Usar solo estos tipos en transformers, server actions y validaciones.
// - No importar tipos de Prisma ni de archivos legacy.
