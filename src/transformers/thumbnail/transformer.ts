/**
 * 🖼️ THUMBNAIL TRANSFORMER
 *
 * Transformador principal para la entidad Thumbnail.
 * Convierte datos de base de datos a estructuras optimizadas para UI.
 *
 * @updated 2025-01-27
 */

import { createDefaultEntityStats } from '../../lib/utils';
import type { ThumbnailBase, ThumbnailWithStats } from '../../types/entities/thumbnail';
import { ThumbnailQuality } from '../../types/entities/thumbnail';
import { toThumbnailWithStats } from './mappers';
import { validateThumbnail } from './validators';

/**
 * Tipo para datos de entrada del transformer
 */
export interface ThumbnailInputData extends Partial<ThumbnailBase> {
	// Propiedades adicionales que podrían venir de DB
	source_id?: string;
	source_type?: string;
	created_at?: Date | string;
	updated_at?: Date | string;
	usageCount?: number;
}

/**
 * Tipo completo de Thumbnail (alias para compatibilidad)
 */
export type ThumbnailComplete = ThumbnailWithStats;

/**
 * Transformador principal para Thumbnail
 */
export function transformThumbnail(
	data: ThumbnailInputData,
	options: {
		includeStats?: boolean;
		usageCount?: number;
	} = {}
): ThumbnailWithStats {
	const { includeStats = true, usageCount = 0 } = options;

	try {
		// Normalizar datos de entrada
		const normalizedData = normalizeThumbnailData(data);

		// Validar estructura básica
		const baseThumb = validateThumbnail(normalizedData);

		// Retornar con estadísticas si se solicita
		if (includeStats) {
			return toThumbnailWithStats(baseThumb, usageCount);
		}

		// Retornar con estadísticas vacías
		return {
			...baseThumb,
			stats: {
				...createDefaultEntityStats(),
				aspectRatio: 0,
				compressionRatio: 0,
				qualityScore: 0,
				usageCount: 0,
				storageEfficiency: 0,
				isDirectory: false,
				isFile: true,
			},
		};
	} catch (error) {
		throw new Error(`Error transforming thumbnail: ${error instanceof Error ? error.message : 'Unknown error'}`);
	}
}

/**
 * Normaliza datos de entrada para asegurar compatibilidad
 */
function normalizeThumbnailData(data: ThumbnailInputData): ThumbnailBase {
	return {
		id: data.id || '',
		sourceId: data.sourceId || data.source_id || '',
		sourceType: data.sourceType || data.source_type || '',
		path: data.path || '',
		size: data.size || 0,
		width: data.width || 0,
		height: data.height || 0,
		format: data.format || '',
		quality: data.quality || ThumbnailQuality.MEDIUM,
		createdAt: normalizeDate(data.createdAt || data.created_at),
		updatedAt: normalizeDate(data.updatedAt || data.updated_at),
	};
}

/**
 * Normaliza fechas desde diferentes formatos
 */
function normalizeDate(date?: Date | string | null): Date {
	if (!date) return new Date();
	if (date instanceof Date) return date;
	return new Date(date);
}

/**
 * Función de ayuda para calcular completeness
 */
function calculateCompleteness(thumbnail: ThumbnailBase, requiredFields: (keyof ThumbnailBase)[]): number {
	const completed = requiredFields.filter((field) => {
		const value = thumbnail[field];
		return value !== null && value !== undefined && value !== '';
	}).length;

	return Math.round((completed / requiredFields.length) * 100);
}
