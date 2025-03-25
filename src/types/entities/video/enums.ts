/**
 * @file Enumeraciones para la entidad Video
 * @module types/entities/video/enums
 */

/**
 * Formatos de video soportados
 */
export enum VideoFormat {
  MP4 = 'mp4',
  MOV = 'mov',
  AVI = 'avi',
  WMV = 'wmv',
  MKV = 'mkv',
  WEBM = 'webm',
  FLV = 'flv'
}

/**
 * Tipos de video
 */
export enum VideoType {
  STANDARD = 'standard',
  CLIP = 'clip',
  REEL = 'reel',
  STORY = 'story',
  LIVE = 'live',
  TIMELAPSE = 'timelapse',
  SLOWMOTION = 'slowmotion',
  DOCUMENTARY = 'documentary'
}

/**
 * Calidades de video
 */
export enum VideoQuality {
  _4K = '4k',
  _2K = '2k',
  FULL_HD = 'fullhd',
  HD = 'hd',
  SD = 'sd',
  LOW = 'low'
}

/**
 * Niveles de privacidad de videos
 */
export enum VideoPrivacyLevel {
  PUBLIC = 'public',
  UNLISTED = 'unlisted',
  PRIVATE = 'private',
  SHARED = 'shared'
}

/**
 * Tipos de codecs de video
 */
export enum VideoCodec {
  H264 = 'h264',
  H265 = 'h265',
  VP8 = 'vp8',
  VP9 = 'vp9',
  AV1 = 'av1',
  MPEG4 = 'mpeg4',
  DIVX = 'divx',
  THEORA = 'theora',
  XVID = 'xvid',
}

/**
 * Modos de visualización de videos
 */
export enum VideoViewMode {
  GRID = 'grid',
  LIST = 'list',
  COMPACT = 'compact',
  TILES = 'tiles',
  CAROUSEL = 'carousel',
}

/**
 * Criterios de ordenación para videos
 */
export enum VideoSortCriteria {
  NAME_ASC = 'name_asc',
  NAME_DESC = 'name_desc',
  DATE_ASC = 'date_asc',
  DATE_DESC = 'date_desc',
  SIZE_ASC = 'size_asc',
  SIZE_DESC = 'size_desc',
  DURATION_ASC = 'duration_asc',
  DURATION_DESC = 'duration_desc',
  RESOLUTION_ASC = 'resolution_asc',
  RESOLUTION_DESC = 'resolution_desc',
}

/**
 * Estados de reproducción de video
 */
export enum VideoPlayState {
  PLAYING = 'playing',
  PAUSED = 'paused',
  STOPPED = 'stopped',
  LOADING = 'loading',
  ERROR = 'error',
}