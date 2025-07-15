/**
 * @file Esquema de validación para la entidad Tag
 * @module types/entities/tag/schema
 */

import { z } from 'zod';
import { BaseEntitySchema } from '@/types/common/base';
import { MetadataFieldsSchema, UIFieldsSchema } from '@/types/common/transformer';

/**
 * 🔍 Esquema para filtros de búsqueda de tags
 */
export const TagFiltersSchema = z.object({
	search: z.string().optional(),
	categories: z.array(z.string()).optional(),
	isFavorite: z.boolean().optional(),
	hasImages: z.boolean().optional(),
	hasVideos: z.boolean().optional(),
	hasAlbums: z.boolean().optional(),
	hasCollections: z.boolean().optional(),
	minRelations: z.number().optional(),
	maxRelations: z.number().optional(),
	dateRange: z
		.object({
			start: z.date().optional(),
			end: z.date().optional(),
		})
		.optional(),
});

/**
 * 📄 Esquema para tag relacionado
 */
export const RelatedTagSchema = z.object({
	id: z.string(),
	name: z.string(),
	emoji: z.string(),
	color: z.string(),
	count: z.number(),
	strength: z.number(),
});

/**
 * 🏷️ Esquema principal para Tag
 */
export const TagSchema = z.object({
	...BaseEntitySchema.shape,
	...UIFieldsSchema.shape,
	...MetadataFieldsSchema.shape,
	name: z.string().min(1),
	emoji: z.string(),
	color: z.string(),
	description: z.string().nullable(),
	shortcut: z.string().nullable(),
	category: z.string(),
	featuredImage: z.string().nullable(),
	isFavorite: z.boolean().default(false),
});

/**
 * 🔄 Esquema para relación de tag-imagen
 */
export const TagImageRelationSchema = z.object({
	tagId: z.string(),
	imageId: z.string(),
	confidence: z.number(),
	source: z.string(),
	addedAt: z.date(),
});
