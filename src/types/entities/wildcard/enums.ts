/**
 * @file Enums para la entidad Wildcard
 * @module types/entities/wildcard/enums
 */

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
