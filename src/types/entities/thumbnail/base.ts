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

import { EntityStats } from '../entity.types';

/**
 * 📊 Estadísticas calculadas para un Thumbnail.
 */
export interface ThumbnailStatistics extends EntityStats {
	aspectRatio: number; // Ratio width/height
	compressionRatio: number; // Estimación de compresión basada en tamaño vs dimensiones
	usageCount: number; // Número de veces que se ha usado este thumbnail
	storageEfficiency: number; // Eficiencia de almacenamiento (calidad vs tamaño)

	// File system functions
	isDirectory: boolean;
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
