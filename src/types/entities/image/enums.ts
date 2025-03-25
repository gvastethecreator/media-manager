/**
 * @file Enumeraciones y constantes para la entidad Image
 * @module types/entities/image/enums
 */

/**
 * Formatos de imagen soportados
 */
export enum ImageFormat {
  JPEG = 'jpeg',
  JPG = 'jpg',
  PNG = 'png',
  WEBP = 'webp',
  AVIF = 'avif',
  GIF = 'gif',
  SVG = 'svg',
  TIFF = 'tiff',
  BMP = 'bmp',
  ICO = 'ico',
  HEIC = 'heic',
}

/**
 * Estado de la imagen en el proceso de carga/procesamiento
 */
export enum ImageStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  OPTIMIZING = 'optimizing',
  GENERATING_THUMBNAIL = 'generating_thumbnail',
  EXTRACTING_METADATA = 'extracting_metadata',
  COMPLETE = 'complete',
  ERROR = 'error',
}

/**
 * Filtros disponibles para las imágenes
 */
export enum ImageFilter {
  NONE = 'none',
  GRAYSCALE = 'grayscale',
  SEPIA = 'sepia',
  BLUR = 'blur',
  INVERT = 'invert',
  SATURATE = 'saturate',
  CONTRAST = 'contrast',
  BRIGHTNESS = 'brightness',
  HUE_ROTATE = 'hue-rotate',
}

/**
 * Modos de visualización de imágenes
 */
export enum ImageViewMode {
  GRID = 'grid',
  LIST = 'list',
  GALLERY = 'gallery',
  CAROUSEL = 'carousel',
  FULLSCREEN = 'fullscreen',
  SLIDESHOW = 'slideshow',
}

/**
 * Criterios de ordenación para las imágenes
 */
export enum ImageSortCriteria {
  NAME_ASC = 'name_asc',
  NAME_DESC = 'name_desc',
  DATE_ASC = 'date_asc',
  DATE_DESC = 'date_desc',
  SIZE_ASC = 'size_asc',
  SIZE_DESC = 'size_desc',
  DIMENSIONS_ASC = 'dimensions_asc',
  DIMENSIONS_DESC = 'dimensions_desc',
  VIEWS_ASC = 'views_asc',
  VIEWS_DESC = 'views_desc',
}

/**
 * Tipos de generación de imágenes por IA
 */
export enum ImageAIType {
  TEXT_TO_IMAGE = 'text_to_image',
  IMAGE_TO_IMAGE = 'image_to_image',
  INPAINTING = 'inpainting',
  OUTPAINTING = 'outpainting',
  UPSCALE = 'upscale',
  STYLE_TRANSFER = 'style_transfer',
}

/**
 * Nivel de calidad para el thumbnail
 */
export enum ThumbnailQuality {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  ORIGINAL = 'original',
}