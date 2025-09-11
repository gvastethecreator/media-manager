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
import { ThumbnailFormat, ThumbnailQuality } from './enums';

/**
 * Metadatos del thumbnail
 */
export interface ThumbnailMetadata {
	compression?: {
		algorithm?: string;
		level?: number;
		originalSize?: number;
		savings?: number;
	};
	color?: {
		dominant?: string;
		palette?: string[];
		brightness?: number;
		contrast?: number;
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
	id: string;
	entityType: string;
	entityId: string;
	size: string;
	path: string;
	width: number;
	height: number;
	format: string;
	quality: number;
	fileSize: number;
	isGenerated: boolean;
	createdAt: Date;
	updatedAt: Date;
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
	metadata?: ThumbnailMetadata;
	errorMessage?: string | null;
	errorTimestamp?: Date | null;
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
