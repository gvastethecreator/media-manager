/**
 * @file Validadores para la entidad Image
 * @module lib/validators/image-validators
 */

import { z } from 'zod';

/**
 * Esquema para validar una imagen base
 */
export const BaseImageSchema = z.object({
	id: z.string(),
	name: z.string().default('Imagen sin nombre'),
	path: z.string(),
	hash: z.string().nullable().optional(),
	createdAt: z.date().or(z.string().pipe(z.coerce.date())),
	updatedAt: z.date().or(z.string().pipe(z.coerce.date())),
	size: z.number().int().nonnegative(),
	width: z.number().int().nonnegative(),
	height: z.number().int().nonnegative(),
	folderId: z.string().nullable().optional(),
});

/**
 * Esquema para validar un objeto de estadísticas de imagen
 * NOTA: Campo downloads eliminado - no existe en el esquema de base de datos ImageStats
 */
export const ImageStatsSchema = z.object({
	views: z.number().int().nonnegative().default(0),

	favorites: z.number().int().nonnegative().default(0),
	lastAccessed: z.date().nullable().optional(),
});

/**
 * Esquema para validar la configuración visual de una imagen
 */
export const ImageVisualConfigSchema = z.object({
	isHidden: z.boolean().default(false),
	isPinned: z.boolean().default(false),
	dominantColor: z
		.string()
		.regex(/^#[0-9A-Fa-f]{6}$/)
		.default('#333333'),
});

/**
 * Esquema para validar un objeto de miniaturas
 */
export const ImageThumbnailSchema = z.record(
	z.string(),
	z.object({
		url: z.string(),
		width: z.number().int().positive().optional(),
		height: z.number().int().positive().optional(),
		quality: z.string().optional(),
	})
);

/**
 * Esquema para validar una imagen completa con todos sus campos
 */
export const CompleteImageSchema = BaseImageSchema.extend({
	url: z.string(),
	aspectRatio: z.number().positive(),
	thumbnails: z.record(z.string(), ImageThumbnailSchema).default({}),
	metadata: z.record(z.string(), z.unknown()).default({}),
	stats: ImageStatsSchema.default({ views: 0, favorites: 0, lastAccessed: null }),
	visualConfig: ImageVisualConfigSchema.default({ isHidden: false, isPinned: false, dominantColor: '#333333' }),
});

/**
 * Esquema para validar una imagen extendida (UI) con campos adicionales para la interfaz
 */
export const ExtendedImageSchema = CompleteImageSchema.extend({
	isSelected: z.boolean().default(false),
	isHighlighted: z.boolean().default(false),
	isVisible: z.boolean().default(true),
	isFavorite: z.boolean().default(false),
	isNew: z.boolean().default(false),
	dominantColor: z.string().optional(),
	displaySize: z.string().optional(),
	displayDimensions: z.string().optional(),
	tags: z.array(z.string()).default([]),
	albums: z
		.array(
			z.object({
				id: z.string(),
				name: z.string(),
			})
		)
		.default([]),
});

/**
 * Tipo inferido para imagen base
 */
export type BaseImageSchemaType = z.infer<typeof BaseImageSchema>;

/**
 * Tipo inferido para imagen completa
 */
export type CompleteImageSchemaType = z.infer<typeof CompleteImageSchema>;

/**
 * Tipo inferido para imagen extendida (UI)
 */
export type ExtendedImageSchemaType = z.infer<typeof ExtendedImageSchema>;
