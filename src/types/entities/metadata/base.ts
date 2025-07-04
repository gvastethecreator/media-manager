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
	id: string;
	format: string;
	width: number;
	height: number;
	size: number;
	colorSpace: string | null;
	hasAlpha: boolean;
	compressionRatio: number | null;
	orientation: string | null;
	dpi: number | null;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * 📊 Estadísticas calculadas para un Metadata.
 */
export interface MetadataStatistics {
	aspectRatio: number; // Ratio width/height
	resolution: number; // width * height
	qualityScore: number; // Score de calidad basado en resolución y propiedades
	compressionEfficiency: number; // Eficiencia de compresión
	fileComplexity: number; // Complejidad basada en formato y propiedades
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
	format: string;
	width: number;
	height: number;
	size: number;
	colorSpace?: string | null;
	hasAlpha?: boolean;
	compressionRatio?: number | null;
	orientation?: string | null;
	dpi?: number | null;
}

/**
 * 📝 Datos para actualizar un Metadata
 */
export interface MetadataUpdateInput {
	format?: string;
	width?: number;
	height?: number;
	size?: number;
	colorSpace?: string | null;
	hasAlpha?: boolean;
	compressionRatio?: number | null;
	orientation?: string | null;
	dpi?: number | null;
}

// ----------------------------------------------------------------
// TIPOS LEGACY PARA COMPATIBILIDAD TEMPORAL
// ----------------------------------------------------------------

/**
 * @deprecated Usar MetadataWithStats
 */
export type MetadataComplete = MetadataWithStats;
