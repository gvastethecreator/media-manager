/**
 * @file Enumeraciones para la entidad Album
 * @module types/entities/album/enums
 */

/**
 * Tipos de álbumes
 */
export enum AlbumType {
  STANDARD = 'standard',
  EVENT = 'event',
  COLLECTION = 'collection',
  PROJECT = 'project',
  PORTFOLIO = 'portfolio',
  THEME = 'theme',
}

/**
 * Modos de visualización de álbumes
 */
export enum AlbumViewMode {
  GRID = 'grid',
  LIST = 'list',
  COMPACT = 'compact',
  COVER_FLOW = 'cover_flow',
  MASONRY = 'masonry',
}

/**
 * Criterios de ordenación para álbumes
 */
export enum AlbumSortCriteria {
  NAME_ASC = 'name_asc',
  NAME_DESC = 'name_desc',
  DATE_CREATED_ASC = 'date_created_asc',
  DATE_CREATED_DESC = 'date_created_desc',
  DATE_UPDATED_ASC = 'date_updated_asc',
  DATE_UPDATED_DESC = 'date_updated_desc',
  ITEM_COUNT_ASC = 'item_count_asc',
  ITEM_COUNT_DESC = 'item_count_desc',
  CUSTOM = 'custom',
}

/**
 * Estados de visualización de álbum
 */
export enum AlbumDisplayState {
  COLLAPSED = 'collapsed',
  EXPANDED = 'expanded',
  COVER_ONLY = 'cover_only',
  DETAILS = 'details',
}

/**
 * Niveles de privacidad de álbum
 */
export enum AlbumPrivacyLevel {
  PUBLIC = 'public',
  UNLISTED = 'unlisted',
  PRIVATE = 'private',
  SHARED = 'shared',
}