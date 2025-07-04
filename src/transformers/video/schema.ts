/**
 * 🎬 VIDEO SCHEMA
 *
 * Schema de validación con Zod para la entidad Video.
 * Derivado del schema de Drizzle.
 *
 * @updated 2025-01-27
 */

import { z } from 'zod';

/**
 * Schema Zod para VideoBase
 */
export const ZodVideoSchema = z.object({
	id: z.string().min(1, 'ID es requerido'),
	name: z.string().nullable(),
	path: z.string().min(1, 'Ruta es requerida'),
	size: z.number().min(0, 'Tamaño debe ser mayor o igual a 0'),
	width: z.number().nullable(),
	height: z.number().nullable(),
	duration: z.number().min(0, 'Duración debe ser mayor o igual a 0'),
	metadata: z.string().nullable(),
	thumbnail: z.instanceof(Buffer).nullable(),
	thumbnailSize: z.number().nullable(),
	thumbnailWidth: z.number().nullable(),
	thumbnailHeight: z.number().nullable(),
	thumbnailError: z.string().nullable(),
	thumbnailErrorAt: z.date().nullable(),
	createdAt: z.date(),
	updatedAt: z.date(),
	folderId: z.string().nullable(),
	isStarred: z.boolean(),
	tags: z.array(z.string()).default([]),
	lastViewedAt: z.date().nullable(),
	encodingStatus: z.string().nullable(),
	quality: z.string().nullable(),
	frameRate: z.number().nullable(),
	bitrate: z.number().nullable(),
	codec: z.string().nullable(),
	fileExtension: z.string().nullable(),
	aspectRatio: z.string().nullable(),
});

/**
 * Schema para crear un Video
 */
export const ZodVideoCreateSchema = ZodVideoSchema.omit({
	id: true,
	createdAt: true,
	updatedAt: true,
}).extend({
	isStarred: z.boolean().default(false),
	tags: z.array(z.string()).default([]),
});

/**
 * Schema para actualizar un Video
 */
export const ZodVideoUpdateSchema = ZodVideoCreateSchema.partial().omit({
	path: true,
	size: true,
});

export type ZodVideoType = z.infer<typeof ZodVideoSchema>;
export type ZodVideoCreateType = z.infer<typeof ZodVideoCreateSchema>;
export type ZodVideoUpdateType = z.infer<typeof ZodVideoUpdateSchema>;
