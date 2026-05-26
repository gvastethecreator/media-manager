/**
 * Esquemas Zod para entidad Image (API server)
 * Mantiene compatibilidad con rutas actuales.
 */
import { z } from 'zod';
import { isValidFolderId } from '@/lib/utils/folder-id-generator';

// Schema de validación para crear imagen
export const CreateImageSchema = z.object({
	name: z.string().min(1, 'El nombre es requerido').max(255),
	description: z.string().max(1000).nullable().optional(),
	path: z.string().min(1, 'La ruta es requerida').max(500),
	hash: z.string().min(1, 'El hash es requerido'),
	size: z.number().int().positive('El tamaño debe ser positivo'),
	width: z.number().int().positive('El ancho debe ser positivo'),
	height: z.number().int().positive('El alto debe ser positivo'),
	metadata: z.string().nullable().optional(),
	thumbnail: z.string().nullable().optional(),
	thumbnailSize: z.number().int().min(0).nullable().optional(),
	thumbnailWidth: z.number().int().min(0).nullable().optional(),
	thumbnailHeight: z.number().int().min(0).nullable().optional(),
	thumbnailMimeType: z.string().nullable().optional(),
	thumbnailError: z.string().nullable().optional(),
	thumbnailErrorAt: z.date().nullable().optional(),
	thumbnailOptimizedAt: z.date().nullable().optional(),
	folderId: z.string().uuid('El ID de carpeta debe ser un UUID válido'),
	noteId: z.string().uuid().nullable().optional(),
	addedAt: z.date().optional(),
});

// Schema de validación para actualizar imagen
export const UpdateImageSchema = CreateImageSchema.partial()
	.omit({
		path: true,
		hash: true,
		size: true,
		width: true,
		height: true,
		folderId: true,
		addedAt: true,
	})
	.extend({
		// Campos de relaciones (compat)
		tags: z.array(z.string()).optional(),
		albums: z.array(z.string()).optional(),
		collections: z.array(z.string()).optional(),
		characters: z.array(z.string()).optional(),
		places: z.array(z.string()).optional(),
		worldItems: z.array(z.string()).optional(),
		concepts: z.array(z.string()).optional(),
		prompts: z.array(z.string()).optional(),
		notes: z.array(z.string()).optional(),
		wildcards: z.array(z.string()).optional(),
		properties: z.array(z.string()).optional(),
		groups: z.array(z.string()).optional(),
	});

// Schema para filtros de búsqueda
export const ImageFiltersSchema = z.object({
	folderId: z
		.string()
		.refine((id) => isValidFolderId(id), {
			message: 'ID de carpeta inválido',
		})
		.optional(),
	isFavorite: z.boolean().optional(),
	minWidth: z.number().int().positive().optional(),
	maxWidth: z.number().int().positive().optional(),
	minHeight: z.number().int().positive().optional(),
	maxHeight: z.number().int().positive().optional(),
	minSize: z.number().int().positive().optional(),
	maxSize: z.number().int().positive().optional(),
	search: z.string().optional(),
	// AI Metadata filters
	aiEngine: z.string().optional(),
	aiModel: z.string().optional(),
	aiOriginDetected: z.boolean().optional(),
	limit: z
		.preprocess((val) => (val ? Number.parseInt(String(val), 10) : 20), z.number().int().positive().max(100))
		.optional(),
	offset: z.preprocess((val) => (val ? Number.parseInt(String(val), 10) : 0), z.number().int().min(0)).optional(),
	sortBy: z.enum(['name', 'createdAt', 'updatedAt', 'size', 'width', 'height']).default('createdAt').optional(),
	sortOrder: z.enum(['asc', 'desc']).default('desc').optional(),
});

export type ImageCreateInput = z.infer<typeof CreateImageSchema>;
export type ImageUpdateInputZod = z.infer<typeof UpdateImageSchema>;
export type ImageFiltersInput = z.infer<typeof ImageFiltersSchema>;
