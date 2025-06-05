/**
 * @file Enumeraciones para la entidad Tag
 * @module types/entities/tag/enums
 */

/**
 * Categorías de etiquetas
 * @description Refleja las posibles categorías que se usan como strings en el esquema
 */
export enum TagCategory {
	GENERAL = 'general',
	SUBJECT = 'subject',
	STYLE = 'style',
	COLOR = 'color',
	QUALITY = 'quality',
	TECHNIQUE = 'technique',
	COMPOSITION = 'composition',
	CONTENT = 'content',
	EMOTION = 'emotion',
	THEME = 'theme',
	GENRE = 'genre',
	CUSTOM = 'custom',
	OTHER = 'other',
}

/**
 * Rareza de etiquetas (no está en el esquema actual)
 * @description Para posible uso futuro o filtros en memoria
 */
export enum TagRarity {
	COMMON = 'common',
	UNCOMMON = 'uncommon',
	RARE = 'rare',
	VERY_RARE = 'very_rare',
	LEGENDARY = 'legendary',
}

/**
 * Criterios de ordenación para etiquetas
 */
export enum TagSortCriteria {
	NAME_ASC = 'name:asc',
	NAME_DESC = 'name:desc',
	USAGE_ASC = 'usage:asc',
	USAGE_DESC = 'usage:desc',
	CREATED_ASC = 'createdAt:asc',
	CREATED_DESC = 'createdAt:desc',
	UPDATED_ASC = 'updatedAt:desc',
	UPDATED_DESC = 'updatedAt:desc',
}

/**
 * Modos de visualización para etiquetas
 * @description Para UI, no afecta el esquema
 */
export enum TagViewMode {
	GRID = 'grid',
	LIST = 'list',
	CLOUD = 'cloud',
	HIERARCHY = 'hierarchy',
}

/**
 * Mapa de propiedades para ordenación
 */
export const TAG_SORT_PROPERTY_MAP: Record<TagSortCriteria, string> = {
	[TagSortCriteria.NAME_ASC]: 'name',
	[TagSortCriteria.NAME_DESC]: 'name',
	[TagSortCriteria.USAGE_ASC]: 'usage',
	[TagSortCriteria.USAGE_DESC]: 'usage',
	[TagSortCriteria.CREATED_ASC]: 'createdAt',
	[TagSortCriteria.CREATED_DESC]: 'createdAt',
	[TagSortCriteria.UPDATED_ASC]: 'updatedAt',
	[TagSortCriteria.UPDATED_DESC]: 'updatedAt',
};
