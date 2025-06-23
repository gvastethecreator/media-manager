/**
 * @file Enums y tipos principales para la entidad Tag
 * @module types/entities/tag/types
 */

export enum TagSortCriteria {
	NAME = 'name',
	DATE = 'date',
	CATEGORY = 'category',
}

export enum TagViewMode {
	GRID = 'grid',
	LIST = 'list',
	DETAIL = 'detail',
}

export const TAG_SORT_PROPERTY_MAP = {
	name: 'Nombre',
	date: 'Fecha',
	category: 'Categoría',
};
