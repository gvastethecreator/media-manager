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
	createdAt: Date;
	format: string;
	height: number;
	id: string;
	path: string;
	quality: ThumbnailQuality;
	size: number;
	sourceId: string;
	sourceType: string;
	updatedAt: Date;
	width: number;
}

import { EntityStats } from '../entity.types';

/**
 * 📊 Estadísticas calculadas para un Thumbnail.
 */
export interface ThumbnailStatistics extends EntityStats {
	aspectRatio: number; // Ratio width/height
	compressionRatio: number; // Estimación de compresión basada en tamaño vs dimensiones

	// File system functions
	isDirectory: boolean;
	isFile: boolean;
	storageEfficiency: number; // Eficiencia de almacenamiento (calidad vs tamaño)
	usageCount: number; // Número de veces que se ha usado este thumbnail
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
	format: string;
	height: number;
	path: string;
	quality?: ThumbnailQuality;
	size: number;
	sourceId: string;
	sourceType: string;
	width: number;
}

/**
 * 📝 Datos para actualizar un Thumbnail
 */
export interface ThumbnailUpdateInput {
	format?: string;
	height?: number;
	path?: string;
	quality?: ThumbnailQuality;
	size?: number;
	width?: number;
}

// ----------------------------------------------------------------
// TIPOS LEGACY PARA COMPATIBILIDAD TEMPORAL
// ----------------------------------------------------------------
