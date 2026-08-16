/**
 * @file Tipos extendidos para la entidad Thumbnail
 * @module types/entities/thumbnail/extended
 */

import { z } from 'zod';
import { ThumbnailBase, ThumbnailMetadata, thumbnailBaseSchema } from './types';

/**
 * Interfaz completa para Thumbnail con información adicional
 */
export interface ThumbnailComplete extends ThumbnailBase {
	_count?: {
		usages?: number;
	};
	errorMessage?: string | null;
	errorTimestamp?: Date | null;
	metadata?: ThumbnailMetadata | null;
	optimizedAt?: Date | null;
	url: string;
}

/**
 * Interfaz para estadísticas de Thumbnail
 */
export interface ThumbnailStats {
	averageHeight: number;
	averageSize: number;
	averageWidth: number;
	errorRate: number;
	formatsDistribution: Record<string, number>;
	lastGenerated: Date | null;
	optimizationRate: number;
	qualityDistribution: Record<string, number>;
	totalSize: number;
}

/**
 * Interfaz para Thumbnail con estadísticas
 */
export interface ThumbnailWithStats extends ThumbnailComplete {
	stats: ThumbnailStats;
}

/**
 * Interfaz para Thumbnail con propiedades de UI
 */
export interface ThumbnailExtended extends ThumbnailComplete {
	downloadUrl: string;
	formattedCreatedAt: string;
	formattedDimensions: string;
	// Propiedades de UI
	formattedSize: string;
	formattedUpdatedAt: string;
	hasFailed: boolean;
	optimizationStatus: 'optimized' | 'not-optimized' | 'error';
	viewUrl: string;
}

// Validaciones Zod
export const thumbnailCompleteSchema = thumbnailBaseSchema.extend({
	url: z.string(),
	metadata: z.record(z.string(), z.unknown()).nullable().optional(),
	errorMessage: z.string().nullable().optional(),
	errorTimestamp: z.date().nullable().optional(),
	optimizedAt: z.date().nullable().optional(),
	_count: z
		.object({
			usages: z.number().optional(),
		})
		.optional(),
});

export const thumbnailStatsSchema = z.object({
	totalSize: z.number(),
	averageSize: z.number(),
	averageWidth: z.number(),
	averageHeight: z.number(),
	formatsDistribution: z.record(z.string(), z.number()),
	qualityDistribution: z.record(z.string(), z.number()),
	lastGenerated: z.date().nullable(),
	optimizationRate: z.number(),
	errorRate: z.number(),
});

export const thumbnailWithStatsSchema = thumbnailCompleteSchema.extend({
	stats: thumbnailStatsSchema,
});

export const thumbnailExtendedSchema = thumbnailCompleteSchema.extend({
	formattedSize: z.string(),
	formattedCreatedAt: z.string(),
	formattedUpdatedAt: z.string(),
	formattedDimensions: z.string(),
	optimizationStatus: z.enum(['optimized', 'not-optimized', 'error']),
	hasFailed: z.boolean(),
	viewUrl: z.string(),
	downloadUrl: z.string(),
});
