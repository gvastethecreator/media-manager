/**
 * @file Enums y constantes principales para la entidad Wildcard
 * @module types/entities/wildcard/types
 */

export enum WildcardSortCriteria {
	NAME = 'name',
	DATE = 'date',
	CATEGORY = 'category',
}

export enum WildcardViewMode {
	GRID = 'grid',
	LIST = 'list',
	DETAIL = 'detail',
}

export const WILDCARD_SORT_PROPERTY_MAP = {
	name: 'Nombre',
	date: 'Fecha',
	category: 'Categoría',
};
