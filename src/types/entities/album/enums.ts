/**
 * @file Enumeraciones para Album
 * @module types/entities/album/enums
 */

/**
 * Tipos de álbumes
 */
export enum AlbumType {
	STANDARD = 'standard',
	SMART = 'smart',
	FAVORITES = 'favorites',
	RECENT = 'recent',
	ARCHIVE = 'archive'
}

/**
 * Modos de visualización de álbumes
 */
export enum AlbumViewMode {
	GRID = 'grid',
	LIST = 'list',
	MASONRY = 'masonry',
	SLIDES = 'slides'
}

/**
 * Estados de visualización de álbumes
 */
export enum AlbumDisplayState {
	COLLAPSED = 'collapsed',
	EXPANDED = 'expanded',
	MINIMIZED = 'minimized'
}

/**
 * Niveles de privacidad de álbumes
 */
export enum AlbumPrivacyLevel {
	PRIVATE = 'private',
	PUBLIC = 'public',
	UNLISTED = 'unlisted',
	FRIENDS = 'friends'
}

/**
 * Criterios de ordenamiento de álbumes
 */
export enum AlbumSortCriteria {
	NAME_ASC = 'name_asc',
	NAME_DESC = 'name_desc',
	DATE_CREATED_ASC = 'date_created_asc',
	DATE_CREATED_DESC = 'date_created_desc',
	DATE_MODIFIED_ASC = 'date_modified_asc',
	DATE_MODIFIED_DESC = 'date_modified_desc',
	SIZE_ASC = 'size_asc',
	SIZE_DESC = 'size_desc',
	POPULARITY_ASC = 'popularity_asc',
	POPULARITY_DESC = 'popularity_desc'
}
