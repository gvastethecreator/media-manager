/**
 * 📤 UPLOADED-IMAGE SCHEMA
 *
 * Schema de validación con Zod para la entidad UploadedImage.
 * Derivado del schema de Drizzle.
 *
 * @updated 2025-01-27
 */

import { z } from 'zod';

/**
 * Schema Zod para UploadedImageBase
 */
export const ZodUploadedImageSchema = z.object({
	id: z.string().min(1, 'ID es requerido'),
	hash: z.string().min(1, 'Hash es requerido'),
	imageId: z.string().min(1, 'ID de imagen es requerido'),
	fileName: z.string().nullable(),
	fileSize: z.number().nullable(),
	mimeType: z.string().nullable(),
	uploadedAt: z.date(),
	isProcessed: z.boolean(),
	processingError: z.string().nullable(),
	width: z.number().min(0, 'Ancho debe ser mayor o igual a 0'),
	height: z.number().min(0, 'Alto debe ser mayor o igual a 0'),
	metadata: z.string().nullable(),
	name: z.string().min(1, 'Nombre es requerido'),
	createdAt: z.date(),
	updatedAt: z.date(),
});

/**
 * Schema para crear un UploadedImage
 */
export const ZodUploadedImageCreateSchema = ZodUploadedImageSchema.omit({
	id: true,
	createdAt: true,
	updatedAt: true,
	uploadedAt: true,
}).extend({
	isProcessed: z.boolean().default(false),
	processingError: z.string().nullable().default(null),
});

/**
 * Schema para actualizar un UploadedImage
 */
export const ZodUploadedImageUpdateSchema = ZodUploadedImageCreateSchema.partial().omit({
	hash: true,
	imageId: true,
});

export type ZodUploadedImageType = z.infer<typeof ZodUploadedImageSchema>;
export type ZodUploadedImageCreateType = z.infer<typeof ZodUploadedImageCreateSchema>;
export type ZodUploadedImageUpdateType = z.infer<typeof ZodUploadedImageUpdateSchema>;
