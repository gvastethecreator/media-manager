/**
 * @file Enums y tipos principales para la entidad Album
 * @module types/entities/album/types
 */

export enum AlbumSortCriteria {
	NAME = 'name',
	DATE = 'date',
	CATEGORY = 'category',
}

export enum AlbumViewMode {
	GRID = 'grid',
	LIST = 'list',
	DETAIL = 'detail',
}

export const ALBUM_SORT_PROPERTY_MAP = {
	name: 'Nombre',
	date: 'Fecha',
	category: 'Categoría',
};
