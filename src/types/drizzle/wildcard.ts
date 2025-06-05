/**
 * @file Tipos para la entidad Wildcard en Drizzle
 * @module types/drizzle/wildcard
 */

import type { CommonFilters, EntityCounts, OrganizationFields } from './base';

/**
 * Interfaz básica para Wildcard en Drizzle
 */
export interface WildcardEntity extends OrganizationFields {
	children: string; // JSON string con estructura de hijos
	parentId: string | null;
}

/**
 * Interfaz extendida con relaciones y conteos
 */
export interface WildcardWithRelations extends WildcardEntity {
	// Relaciones jerárquicas
	parent?: WildcardEntity | null;
	childWildcards?: WildcardEntity[];

	// Contadores
	_count?: EntityCounts & {
		childWildcards?: number;
	};
	totalEntities?: number;
	lastUpdated?: Date;
}

/**
 * Interfaz para crear un comodín nuevo
 */
export interface CreateWildcardData {
	name: string;
	emoji?: string;
	color?: string;
	description?: string | null;
	shortcut?: string | null;
	category?: string | null;
	children?: string;
	featuredImage?: string | null;
	isFavorite?: boolean;
	parentId?: string | null;
}

/**
 * Interfaz para actualizar un comodín existente
 */
export interface UpdateWildcardData {
	name?: string;
	emoji?: string;
	color?: string;
	description?: string | null;
	shortcut?: string | null;
	category?: string | null;
	children?: string;
	featuredImage?: string | null;
	isFavorite?: boolean;
	parentId?: string | null;
}

/**
 * Filtros específicos para Wildcard
 */
export interface WildcardFilters extends CommonFilters {
	parentId?: string | null;
	hasChildren?: boolean;
}

/**
 * Criterios de ordenación para Wildcard
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
 * Modos de visualización para Wildcard
 */
export enum WildcardViewMode {
	GRID = 'grid',
	LIST = 'list',
	TREE = 'tree',
	TABLE = 'table',
}

/**
 * Estado de visualización para un comodín individual
 */
export interface WildcardDisplayState {
	isExpanded: boolean;
	isSelected: boolean;
	isVisible: boolean;
}
