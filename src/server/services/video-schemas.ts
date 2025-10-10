/**
 * @file Esquemas de validación Zod para videos
 * @module server/services/video-schemas
 */

import { z } from 'zod';

/**
 * Schema para crear un video
 */
export const CreateVideoSchema = z.object({
	name: z.string().min(1, 'El nombre es requerido').max(255),
	description: z.string().max(1000).optional().nullable(),
	path: z.string().min(1, 'La ruta es requerida'),
	size: z.number().int().positive(),
	mimeType: z.string().max(100),

	// Identificador de integridad
	hash: z.string().min(1, 'El hash es requerido'),

	// Metadatos de video específicos
	duration: z.number().positive().optional().nullable(),
	width: z.number().int().positive().optional().nullable(),
	height: z.number().int().positive().optional().nullable(),
	framerate: z.number().positive().optional().nullable(),
	bitrate: z.number().int().positive().optional().nullable(),
	codec: z.string().max(50).optional().nullable(),
	format: z.string().max(50).optional().nullable(),

	// Propiedades base
	isHidden: z.boolean().default(false).optional(),
	isFavorite: z.boolean().default(false).optional(),
	tags: z.string().default('[]').optional(),
	notes: z.string().default('').optional(),

	// Relaciones opcionales
	folderId: z.string().uuid().optional().nullable(),
});

/**
 * Schema para actualizar un video (todos los campos opcionales)
 */
export const UpdateVideoSchema = CreateVideoSchema.partial();

/**
 * Schema para filtros de búsqueda de videos
 */
export const VideoFiltersSchema = z.object({
	folderId: z.string().uuid().optional(),
	codec: z.string().optional(),
	format: z.string().optional(),
	isFavorite: z.boolean().optional(),
	isHidden: z.boolean().optional(),
	minDuration: z.number().positive().optional(),
	maxDuration: z.number().positive().optional(),
	minWidth: z.number().int().positive().optional(),
	maxWidth: z.number().int().positive().optional(),
	minHeight: z.number().int().positive().optional(),
	maxHeight: z.number().int().positive().optional(),
	minSize: z.number().int().positive().optional(),
	maxSize: z.number().int().positive().optional(),
	search: z.string().optional(),
	limit: z.number().int().positive().max(100).default(20).optional(),
	offset: z.number().int().min(0).default(0).optional(),
	sortBy: z.enum(['name', 'createdAt', 'updatedAt', 'size', 'duration', 'width', 'height']).default('name').optional(),
	sortOrder: z.enum(['asc', 'desc']).default('asc').optional(),
});
