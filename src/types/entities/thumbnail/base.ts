/**
 * @file Tipos base para la entidad Thumbnail
 * @module types/entities/thumbnail/base
 */

import { z } from 'zod';

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
 * 🖼️ Tipo base para Thumbnail, solo campos canónicos y serializables
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

// Validaciones Zod
export const thumbnailQualitySchema = z.nativeEnum(ThumbnailQuality);
export const thumbnailFitSchema = z.nativeEnum(ThumbnailFit);
export const thumbnailPositionSchema = z.nativeEnum(ThumbnailPosition);

export const thumbnailBaseSchema = z.object({
	id: z.string(),
	sourceId: z.string(),
	sourceType: z.string(),
	path: z.string(),
	size: z.number().positive(),
	width: z.number().positive(),
	height: z.number().positive(),
	format: z.string(),
	quality: thumbnailQualitySchema,
	createdAt: z.date(),
	updatedAt: z.date(),
});

// ✅ ThumbnailBase ahora es seguro y serializable para frontend/backend.
