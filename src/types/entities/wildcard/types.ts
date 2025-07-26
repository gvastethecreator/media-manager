/**
 * @file Enums y constantes principales para la entidad Wildcard
 * @module types/entities/wildcard/types
 */

// Re-export tipo base para compatibilidad
export type { WildcardWithStats } from './base';

/**
 * Criterios de ordenación para wildcards
 */
export enum WildcardSortCriteria {
	NAME_ASC = 'name:asc',
	NAME_DESC = 'name:desc',
	USAGE_ASC = 'usage:asc',
	USAGE_DESC = 'usage:desc',
	CREATED_ASC = 'created:asc',
	CREATED_DESC = 'created:desc',
	UPDATED_ASC = 'updated:asc',
	UPDATED_DESC = 'updated:desc',
	CATEGORY_ASC = 'category:asc',
	CATEGORY_DESC = 'category:desc',
}

/**
 * Modos de visualización para wildcards
 */
export enum WildcardViewMode {
	GRID = 'grid',
	LIST = 'list',
	CARDS = 'cards',
	COMPACT = 'compact',
	TREE = 'tree',
}

/**
 * Mapa de propiedades de ordenamiento para wildcards
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
	[WildcardSortCriteria.CATEGORY_ASC]: 'category',
	[WildcardSortCriteria.CATEGORY_DESC]: 'category',
};
