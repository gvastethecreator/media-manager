/**
 * @file Enums para la entidad Thumbnail
 * @module types/entities/thumbnail/enums
 */

/**
 * Calidad de los thumbnails
 */
export enum ThumbnailQuality {
	LOW = 'low',
	MEDIUM = 'medium',
	HIGH = 'high',
	ULTRA = 'ultra',
}

/**
 * Formato de los thumbnails
 */
export enum ThumbnailFormat {
	JPEG = 'jpeg',
	PNG = 'png',
	WEBP = 'webp',
	AVIF = 'avif',
	GIF = 'gif',
}
