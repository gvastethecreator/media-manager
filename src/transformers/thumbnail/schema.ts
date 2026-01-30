/**
 * 🖼️ THUMBNAIL SCHEMA
 *
 * Schema de validación con Zod para la entidad Thumbnail.
 * Derivado del schema de Drizzle.
 *
 * @updated 2025-01-27
 */

import { z } from 'zod';
import { ThumbnailQuality } from '../../types/entities/thumbnail/base';

/**
 * Schema Zod para ThumbnailBase
 */
export const ZodThumbnailSchema = z.object({
	id: z.string().min(1, 'ID es requerido'),
	sourceId: z.string().min(1, 'ID de fuente es requerido'),
	sourceType: z.string().min(1, 'Tipo de fuente es requerido'),
	path: z.string().min(1, 'Ruta es requerida'),
	size: z.number().min(0, 'Tamaño debe ser mayor o igual a 0'),
	width: z.number().min(1, 'Ancho debe ser mayor a 0'),
	height: z.number().min(1, 'Alto debe ser mayor a 0'),
	format: z.string().min(1, 'Formato es requerido'),
	quality: z.nativeEnum(ThumbnailQuality),
	createdAt: z.date(),
	updatedAt: z.date(),
});

/**
 * Schema para crear un Thumbnail
 */
export const ZodThumbnailCreateSchema = ZodThumbnailSchema.omit({
	id: true,
	createdAt: true,
	updatedAt: true,
}).extend({
	quality: z.nativeEnum(ThumbnailQuality).default(ThumbnailQuality.MEDIUM),
});

/**
 * Schema para actualizar un Thumbnail
 */
export const ZodThumbnailUpdateSchema = ZodThumbnailCreateSchema.partial().omit({
	sourceId: true,
	sourceType: true,
});

export type ZodThumbnailType = z.infer<typeof ZodThumbnailSchema>;
export type ZodThumbnailCreateType = z.infer<typeof ZodThumbnailCreateSchema>;
export type ZodThumbnailUpdateType = z.infer<typeof ZodThumbnailUpdateSchema>;
