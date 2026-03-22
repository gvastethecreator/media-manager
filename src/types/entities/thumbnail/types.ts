/**
 * 🖼️ Tipos canónicos para la entidad Thumbnail
 *
 * - Este archivo contiene todos los tipos base, relaciones e inputs para Thumbnail.
 * - Usar SIEMPRE estos tipos en transformers, services y server actions.
 * - No usar ni importar tipos de base.ts (eliminado).
 *
 * Estructura:
 * - ThumbnailBase: tipo canónico principal
 * - ThumbnailRelations: relaciones con otras entidades (any[] si no existen tipos canónicos)
 * - ThumbnailCreateInput, ThumbnailUpdateInput: inputs para mutaciones
 *
 * 🛡️ Todos los campos clave (id, createdAt, updatedAt) son obligatorios.
 * 📝 Documenta cualquier cambio relevante aquí.
 */

import { z } from 'zod';

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
 * Formato de los thumbnails
 */
export enum ThumbnailFormat {
	JPEG = 'jpeg',
	PNG = 'png',
	WEBP = 'webp',
	AVIF = 'avif',
	GIF = 'gif',
}

/**
 * Metadatos del thumbnail
 */
export interface ThumbnailMetadata {
	color?: {
		dominant?: string;
		palette?: string[];
		brightness?: number;
		contrast?: number;
	};
	compression?: {
		algorithm?: string;
		level?: number;
		originalSize?: number;
		savings?: number;
	};
	processing?: {
		duration?: number;
		steps?: string[];
		version?: string;
	};
	[key: string]: unknown;
}

/**
 * Tipo base canónico para Thumbnail
 */
export interface ThumbnailBase {
	createdAt: Date;
	entityId: string;
	entityType: string;
	fileSize: number;
	format: string;
	height: number;
	id: string;
	isGenerated: boolean;
	path: string;
	quality: number;
	size: string;
	updatedAt: Date;
	width: number;
}

/**
 * Relaciones de Thumbnail con otras entidades
 */
export interface ThumbnailRelations {
	source?: unknown; // Entidad a la que pertenece el thumbnail
	usages?: unknown[]; // Entidades que usan este thumbnail
}

/**
 * Input para creación de Thumbnail
 */
export interface ThumbnailCreateInput extends Omit<ThumbnailBase, 'id' | 'createdAt' | 'updatedAt'> {
	metadata?: ThumbnailMetadata;
}

/**
 * Input para actualización de Thumbnail
 */
export interface ThumbnailUpdateInput extends Partial<Omit<ThumbnailBase, 'id' | 'sourceId' | 'sourceType'>> {
	errorMessage?: string | null;
	errorTimestamp?: Date | null;
	metadata?: ThumbnailMetadata;
	optimizedAt?: Date | null;
}

/**
 * Esquema Zod para validación de ThumbnailBase
 */
export const thumbnailBaseSchema = z.object({
	id: z.string(),
	sourceId: z.string(),
	sourceType: z.string(),
	path: z.string(),
	size: z.number(),
	width: z.number(),
	height: z.number(),
	format: z.string(),
	quality: z.nativeEnum(ThumbnailQuality),
	createdAt: z.date(),
	updatedAt: z.date(),
});

// ...existing code...
