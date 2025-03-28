/**
 * @file Enumeraciones para la entidad Tag
 * @module types/entities/tag/enums
 */

/**
 * Categorías predefinidas para etiquetas
 */
export enum TagCategory {
	CHARACTER = 'character',
	LOCATION = 'location',
	OBJECT = 'object',
	CONCEPT = 'concept',
	EVENT = 'event',
	COLOR = 'color',
	STYLE = 'style',
	EMOTION = 'emotion',
	CUSTOM = 'custom',
	OTHER = 'other',
}

/**
 * Criterios para ordenar etiquetas
 */
export enum TagSortCriteria {
	NAME_ASC = 'name_asc',
	NAME_DESC = 'name_desc',
	COUNT_ASC = 'count_asc',
	COUNT_DESC = 'count_desc',
	CREATED_ASC = 'created_asc',
	CREATED_DESC = 'created_desc',
	UPDATED_ASC = 'updated_asc',
	UPDATED_DESC = 'updated_desc',
}

/**
 * Niveles de rareza para etiquetas
 */
export enum TagRarity {
	COMMON = 'common',
	UNCOMMON = 'uncommon',
	RARE = 'rare',
	EPIC = 'epic',
	LEGENDARY = 'legendary',
}

/**
 * Tipos de visualización de etiquetas
 */
export enum TagViewMode {
	LIST = 'list',
	GRID = 'grid',
	CLOUD = 'cloud',
	GROUP = 'group',
}
