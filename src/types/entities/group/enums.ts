/**
 * @file Enumeraciones para la entidad Group.
 * @module types/entities/group/enums
 * @description Define todos los enums utilizados por la entidad Group.
 * @updated 2025-01-27
 */

/**
 * Criterios de ordenamiento para grupos
 */
export enum GroupSortCriteria {
	NAME_ASC = 'name:asc',
	NAME_DESC = 'name:desc',
	CATEGORY_ASC = 'category:asc',
	CATEGORY_DESC = 'category:desc',
	DATE_CREATED_ASC = 'created:asc',
	DATE_CREATED_DESC = 'created:desc',
	DATE_UPDATED_ASC = 'updated:asc',
	DATE_UPDATED_DESC = 'updated:desc',
	ITEMS_COUNT_ASC = 'items:asc',
	ITEMS_COUNT_DESC = 'items:desc',
}

/**
 * Tipos de grupos
 */
export enum GroupType {
	COLLECTION = 'collection',
	ALBUM = 'album',
	FOLDER = 'folder',
	SMART = 'smart',
	TEMPORARY = 'temporary',
}

/**
 * Mapa de propiedades de ordenamiento para grupos
 */
export const GROUP_SORT_PROPERTY_MAP: Record<GroupSortCriteria, string> = {
	[GroupSortCriteria.NAME_ASC]: 'name',
	[GroupSortCriteria.NAME_DESC]: 'name',
	[GroupSortCriteria.CATEGORY_ASC]: 'category',
	[GroupSortCriteria.CATEGORY_DESC]: 'category',
	[GroupSortCriteria.DATE_CREATED_ASC]: 'createdAt',
	[GroupSortCriteria.DATE_CREATED_DESC]: 'createdAt',
	[GroupSortCriteria.DATE_UPDATED_ASC]: 'updatedAt',
	[GroupSortCriteria.DATE_UPDATED_DESC]: 'updatedAt',
	[GroupSortCriteria.ITEMS_COUNT_ASC]: 'itemsCount',
	[GroupSortCriteria.ITEMS_COUNT_DESC]: 'itemsCount',
};
