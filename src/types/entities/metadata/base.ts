/**
 * 🏷️ METADATA BASE TYPES
 *
 * Tipos base para metadata usando tipos locales de Drizzle.
 *
 * @updated 2025-01-27
 */

/**
 * 🗿 Modelo base de Metadata, derivado del schema de Drizzle.
 */
export interface MetadataBase {
	colorSpace: string | null;
	compressionRatio: number | null;
	createdAt: Date;
	dpi: number | null;
	format: string;
	hasAlpha: boolean;
	height: number;
	id: string;
	orientation: string | null;
	size: number;
	updatedAt: Date;
	width: number;
}

import { EntityStats } from '../entity.types';

/**
 * 📊 Estadísticas calculadas para un Metadata.
 */
export interface MetadataStatistics extends EntityStats {
	aspectRatio: number; // Ratio width/height
	compressionEfficiency: number; // Eficiencia de compresión
	fileComplexity: number; // Complejidad basada en formato y propiedades
	qualityScore: number; // Score de calidad basado en resolución y propiedades
	resolution: number; // width * height
}

/**
 * ✨ Modelo extendido de Metadata con estadísticas.
 * Este es el tipo canónico que se debe usar en toda la aplicación.
 */
export interface MetadataWithStats extends MetadataBase {
	stats: MetadataStatistics;
}

/**
 * 📝 Datos para crear un Metadata
 */
export interface MetadataCreateInput {
	colorSpace?: string | null;
	compressionRatio?: number | null;
	dpi?: number | null;
	format: string;
	hasAlpha?: boolean;
	height: number;
	orientation?: string | null;
	size: number;
	width: number;
}

/**
 * 📝 Datos para actualizar un Metadata
 */
export interface MetadataUpdateInput {
	colorSpace?: string | null;
	compressionRatio?: number | null;
	dpi?: number | null;
	format?: string;
	hasAlpha?: boolean;
	height?: number;
	orientation?: string | null;
	size?: number;
	width?: number;
}

// ----------------------------------------------------------------
// TIPOS LEGACY PARA COMPATIBILIDAD TEMPORAL
// ----------------------------------------------------------------

/**
 * @deprecated Usar MetadataWithStats
 */
export type MetadataComplete = MetadataWithStats;
