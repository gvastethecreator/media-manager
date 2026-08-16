/**
 * @file Tipos para manejo de thumbnails
 * @module types/thumbnails
 */

import { z } from 'zod';
import type { JSONString } from '@/lib/utils/types/utility-types';

/**
 * Calidad de thumbnail
 */
export const ThumbnailQuality = {
	COMPRESSED: 'compressed',
	LOW: 'low',
	MEDIUM: 'medium',
	HIGH: 'high',
} as const;

export type ThumbnailQuality = (typeof ThumbnailQuality)[keyof typeof ThumbnailQuality];

/**
 * Modo de ajuste de thumbnail
 */
export const ThumbnailFit = {
	CONTAIN: 'contain',
	COVER: 'cover',
	FILL: 'fill',
	INSIDE: 'inside',
	OUTSIDE: 'outside',
} as const;

export type ThumbnailFit = (typeof ThumbnailFit)[keyof typeof ThumbnailFit];

/**
 * Posición de thumbnail
 */
export const ThumbnailPosition = {
	TOP: 'top',
	RIGHT_TOP: 'right-top',
	RIGHT: 'right',
	RIGHT_BOTTOM: 'right-bottom',
	BOTTOM: 'bottom',
	LEFT_BOTTOM: 'left-bottom',
	LEFT: 'left',
	LEFT_TOP: 'left-top',
	CENTER: 'center',
} as const;

export type ThumbnailPosition = (typeof ThumbnailPosition)[keyof typeof ThumbnailPosition];

/**
 * Opciones de generación de thumbnail
 */
export interface ThumbnailOptions {
	background?: string;
	fit?: ThumbnailFit;
	height?: number;
	optimizeOutput?: boolean;
	position?: ThumbnailPosition;
	progressive?: boolean;
	quality?: ThumbnailQuality;
	stripAlpha?: boolean;
	width?: number;
	withMetadata?: boolean;
}

/**
 * Metadatos de thumbnail
 */
export interface ThumbnailMetadata {
	format: string;
	generatedAt: Date;
	height: number;
	originalFormat: string;
	originalHeight: number;
	originalSize: number;
	originalWidth: number;
	quality: ThumbnailQuality;
	size: number;
	width: number;
}

/**
 * Resultado de generación de thumbnail
 */
export interface ThumbnailResult {
	metadata: JSONString<ThumbnailMetadata>;
	path: string;
	url: string;
}

/**
 * Estadísticas de thumbnails
 */
export interface ThumbnailStats {
	averageProcessingTime: number;
	errors: Array<{ message: string; path: string; timestamp: Date }>;
	failed: number;
	lastProcessedAt?: Date;
	pending: number;
	processed: number;
	processedSize: number;
	processingRate?: number;
	total: number;
	totalFiles: number;
	totalSize: number;
}

/**
 * Último thumbnail procesado
 */
export interface LastProcessedThumbnail {
	error?: string;
	id: string;
	path: string;
	processedAt: Date;
	status: 'success' | 'error';
}

/**
 * Opciones de procesamiento
 */
export interface ProcessOptions {
	forceRegenerate?: boolean;
	logProgress?: boolean;
	maxConcurrency?: number;
	quality?: ThumbnailQuality;
}

/**
 * Estado de procesamiento de thumbnails
 */
export interface ProcessStatus {
	current?: string;
	processed: number;
	progress: number;
	total: number;
}

/**
 * Estados de procesamiento
 */
export const ProcessState = {
	PENDING: 'pending',
	PROCESSING: 'processing',
	COMPLETED: 'completed',
	FAILED: 'failed',
} as const;

export type ProcessState = (typeof ProcessState)[keyof typeof ProcessState];

/**
 * Error de thumbnail
 */
export interface ThumbnailError {
	code?: string;
	details?: unknown;
	message: string;
	path?: string;
}

// Validaciones Zod
export const thumbnailQualitySchema = z.nativeEnum(ThumbnailQuality);
export const thumbnailFitSchema = z.nativeEnum(ThumbnailFit);
export const thumbnailPositionSchema = z.nativeEnum(ThumbnailPosition);

export const thumbnailOptionsSchema = z.object({
	width: z.number().positive().optional(),
	height: z.number().positive().optional(),
	quality: thumbnailQualitySchema.optional(),
	fit: thumbnailFitSchema.optional(),
	position: thumbnailPositionSchema.optional(),
	background: z
		.string()
		.regex(/^#([0-9A-F]{3}){1,2}$/i)
		.optional(),
	progressive: z.boolean().optional(),
	withMetadata: z.boolean().optional(),
	stripAlpha: z.boolean().optional(),
	optimizeOutput: z.boolean().optional(),
});

export const thumbnailMetadataSchema = z.object({
	width: z.number().positive(),
	height: z.number().positive(),
	format: z.string(),
	size: z.number().positive(),
	quality: thumbnailQualitySchema,
	originalWidth: z.number().positive(),
	originalHeight: z.number().positive(),
	originalFormat: z.string(),
	originalSize: z.number().positive(),
	generatedAt: z.date(),
});

export const thumbnailResultSchema = z.object({
	path: z.string(),
	url: z.string(),
	metadata: z.string(),
});

// Tipos inferidos
export type ThumbnailOptionsValidated = z.infer<typeof thumbnailOptionsSchema>;
export type ThumbnailMetadataValidated = z.infer<typeof thumbnailMetadataSchema>;
export type ThumbnailResultValidated = z.infer<typeof thumbnailResultSchema>;
