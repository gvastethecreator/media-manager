/**
 * @file Enums y tipos principales para la entidad Audio
 * @module types/entities/audio/types
 */

export enum AudioSortCriteria {
	NAME = 'name',
	DATE = 'date',
	CATEGORY = 'category',
}

export enum AudioViewMode {
	GRID = 'grid',
	LIST = 'list',
	DETAIL = 'detail',
}

export const AUDIO_SORT_PROPERTY_MAP = {
	name: 'Nombre',
	date: 'Fecha',
	category: 'Categoría',
};
