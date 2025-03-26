/**
 * @file Enumeraciones para la entidad Activity
 * @module types/entities/activity/enums
 */

/**
 * Tipos de actividad
 */
export enum ActivityType {
  // Actividades de imágenes
  IMAGE_UPLOAD = 'image_upload',
  IMAGE_UPDATE = 'image_update',
  IMAGE_DELETE = 'image_delete',
  IMAGE_VIEW = 'image_view',
  IMAGE_DOWNLOAD = 'image_download',
  IMAGE_SHARE = 'image_share',
  IMAGE_TAG = 'image_tag',
  IMAGE_UNTAG = 'image_untag',
  IMAGE_FAVORITE = 'image_favorite',
  IMAGE_UNFAVORITE = 'image_unfavorite',

  // Actividades de videos
  VIDEO_UPLOAD = 'video_upload',
  VIDEO_UPDATE = 'video_update',
  VIDEO_DELETE = 'video_delete',
  VIDEO_VIEW = 'video_view',
  VIDEO_SHARE = 'video_share',

  // Actividades de carpetas
  FOLDER_CREATE = 'folder_create',
  FOLDER_UPDATE = 'folder_update',
  FOLDER_DELETE = 'folder_delete',
  FOLDER_MOVE = 'folder_move',

  // Actividades de álbumes
  ALBUM_CREATE = 'album_create',
  ALBUM_UPDATE = 'album_update',
  ALBUM_DELETE = 'album_delete',
  ALBUM_ADD_IMAGE = 'album_add_image',
  ALBUM_REMOVE_IMAGE = 'album_remove_image',

  // Actividades de colecciones
  COLLECTION_CREATE = 'collection_create',
  COLLECTION_UPDATE = 'collection_update',
  COLLECTION_DELETE = 'collection_delete',
  COLLECTION_ADD_IMAGE = 'collection_add_image',
  COLLECTION_REMOVE_IMAGE = 'collection_remove_image',

  // Actividades de sistema
  SYSTEM_ERROR = 'system_error',
  SYSTEM_WARNING = 'system_warning',
  SYSTEM_INFO = 'system_info',
  SYSTEM_SYNC = 'system_sync',
  SYSTEM_BACKUP = 'system_backup',
  SYSTEM_RESTORE = 'system_restore',
  SYSTEM_UPDATE = 'system_update',

  // Actividades de usuarios
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  USER_SETTINGS_UPDATE = 'user_settings_update',
  USER_PROFILE_UPDATE = 'user_profile_update',

  // Actividades de búsqueda
  SEARCH_QUERY = 'search_query',
  SEARCH_ADVANCED = 'search_advanced',

  // Otros
  CUSTOM = 'custom'
}

/**
 * Categorías de actividad
 */
export enum ActivityCategory {
  IMAGES = 'images',
  VIDEOS = 'videos',
  FOLDERS = 'folders',
  ALBUMS = 'albums',
  COLLECTIONS = 'collections',
  SYSTEM = 'system',
  USER = 'user',
  SEARCH = 'search',
  OTHER = 'other'
}

/**
 * Criterios para ordenar actividades
 */
export enum ActivitySortCriteria {
  DATE_ASC = 'date_asc',
  DATE_DESC = 'date_desc',
  TYPE_ASC = 'type_asc',
  TYPE_DESC = 'type_desc'
}

/**
 * Tipos de eventos de actividad para el sistema de eventos
 */
export enum ActivityEventType {
  CREATED = 'activity.created',
  UPDATED = 'activity.updated',
  DELETED = 'activity.deleted',
  MODIFIED = 'activity.modified',
  CLEARED = 'activity.cleared'
}