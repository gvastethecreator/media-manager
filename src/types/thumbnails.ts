/**
 * @file Tipos para manejo de thumbnails
 * @module types/thumbnails
 */

import { z } from 'zod';
import type { JSONString } from '@/lib/utils/types/utility-types';

/**
 * Calidad de thumbnail
 */
export enum ThumbnailQuality {
	COMPRESSED = 'compressed',
	LOW = 'low',
	MEDIUM = 'medium',
	HIGH = 'high',
}

/**
 * Modo de ajuste de thumbnail
 */
export enum ThumbnailFit {
	CONTAIN = 'contain',
	COVER = 'cover',
	FILL = 'fill',
	INSIDE = 'inside',
	OUTSIDE = 'outside',
}

/**
 * Posición de thumbnail
 */
export enum ThumbnailPosition {
	TOP = 'top',
	RIGHT_TOP = 'right-top',
	RIGHT = 'right',
	RIGHT_BOTTOM = 'right-bottom',
	BOTTOM = 'bottom',
	LEFT_BOTTOM = 'left-bottom',
	LEFT = 'left',
	LEFT_TOP = 'left-top',
	CENTER = 'center',
}

/**
 * Opciones de generación de thumbnail
 */
export interface ThumbnailOptions {
	width?: number;
	height?: number;
	quality?: ThumbnailQuality;
	fit?: ThumbnailFit;
	position?: ThumbnailPosition;
	background?: string;
	progressive?: boolean;
	withMetadata?: boolean;
	stripAlpha?: boolean;
	optimizeOutput?: boolean;
}

/**
 * Metadatos de thumbnail
 */
export interface ThumbnailMetadata {
	width: number;
	height: number;
	format: string;
	size: number;
	quality: ThumbnailQuality;
	originalWidth: number;
	originalHeight: number;
	originalFormat: string;
	originalSize: number;
	generatedAt: Date;
}

/**
 * Resultado de generación de thumbnail
 */
export interface ThumbnailResult {
	path: string;
	url: string;
	metadata: JSONString<ThumbnailMetadata>;
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
