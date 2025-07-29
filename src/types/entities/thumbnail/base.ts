/**
 * 🖼️ THUMBNAIL BASE TYPES
 *
 * Tipos base para thumbnails usando tipos locales de Drizzle.
 *
 * @updated 2025-01-27
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
 * 🗿 Modelo base de Thumbnail, derivado del schema de Drizzle.
 */
export interface ThumbnailBase {
	id: string;
	sourceId: string;
	sourceType: string;
	path: string;
	size: number;
	width: number;
	height: number;
	format: string;
	quality: ThumbnailQuality;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * 📊 Estadísticas calculadas para un Thumbnail.
 */
export interface ThumbnailStatistics {
	aspectRatio: number; // Ratio width/height
	compressionRatio: number; // Estimación de compresión basada en tamaño vs dimensiones
	qualityScore: number; // Score de calidad basado en resolución y formato
	usageCount: number; // Número de veces que se ha usado este thumbnail
	storageEfficiency: number; // Eficiencia de almacenamiento (calidad vs tamaño)

	// File system properties for browser integration
	/** File size in bytes */
	size: number;
	/** Last modification time */
	mtime: Date;
	/** File creation time */
	birthtime: Date;
	/** File type for browser compatibility */
	type: string;
	/** Whether this is a directory */
	isDirectory: boolean;
	/** Whether this is a file */
	isFile: boolean;
}

/**
 * ✨ Modelo extendido de Thumbnail con estadísticas.
 * Este es el tipo canónico que se debe usar en toda la aplicación.
 */
export interface ThumbnailWithStats extends ThumbnailBase {
	stats: ThumbnailStatistics;
}

/**
 * 📝 Datos para crear un Thumbnail
 */
export interface ThumbnailCreateInput {
	sourceId: string;
	sourceType: string;
	path: string;
	size: number;
	width: number;
	height: number;
	format: string;
	quality?: ThumbnailQuality;
}

/**
 * 📝 Datos para actualizar un Thumbnail
 */
export interface ThumbnailUpdateInput {
	path?: string;
	size?: number;
	width?: number;
	height?: number;
	format?: string;
	quality?: ThumbnailQuality;
}

// ----------------------------------------------------------------
// TIPOS LEGACY PARA COMPATIBILIDAD TEMPORAL
// ----------------------------------------------------------------

/**
 * @deprecated Usar ThumbnailWithStats
 */
export type ThumbnailComplete = ThumbnailWithStats;

/**
 * @deprecated Usar ThumbnailWithStats
 */
export type ThumbnailExtended = ThumbnailWithStats;
