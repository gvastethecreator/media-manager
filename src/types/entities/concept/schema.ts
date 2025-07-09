/**
 * @file Esquema de validación para la entidad Concept
 * @module types/entities/concept/schema
 */

import { z } from 'zod';
import { BaseEntitySchema } from '@/types/common/base';
import { MetadataFieldsSchema, UIFieldsSchema } from '@/types/common/transformer';

/**
 * 🏷️ Esquema para tags de concepto
 */
export const ConceptTagsSchema = z.object({
	items: z.array(z.string()),
});

/**
 * 🔍 Esquema para filtros de búsqueda
 */
export const ConceptFiltersSchema = z.object({
	searchQuery: z.string().optional(),
	categories: z.array(z.string()).optional(),
	onlyFavorites: z.boolean().optional(),
	contentContains: z.string().optional(),
});

/**
 * 📊 Esquema para estadísticas de concepto
 */
export const ConceptStatsSchema = z.object({
	images: z.number().optional(),
	videos: z.number().optional(),
	albums: z.number().optional(),
	collections: z.number().optional(),
	tags: z.number().optional(),
	characters: z.number().optional(),
	places: z.number().optional(),
	worldItems: z.number().optional(),
	prompts: z.number().optional(),
	notes: z.number().optional(),
	wildcards: z.number().optional(),
	properties: z.number().optional(),
	groups: z.number().optional(),
});

/**
 * 🔄 Esquema para relación de concepto
 */
export const ConceptRelationSchema = z.object({
	entityId: z.string(),
	entityType: z.string(),
	conceptId: z.string(),
});

/**
 * 📝 Esquema principal para Concept
 */
export const ConceptSchema = z.object({
	...BaseEntitySchema.shape,
	...UIFieldsSchema.shape,
	...MetadataFieldsSchema.shape,
	name: z.string().min(1),
	emoji: z.string().default('💡'),
	color: z.string().default('#4B5563'),
	description: z.string().nullable(),
	content: z.string().default(''),
	category: z.string().default('general'),
	tags: z.union([z.string(), z.array(z.string())]).optional(),
	featuredImage: z.string().nullable(),
	isFavorite: z.boolean().default(false),
	sortBy: z.string().optional(),
});

// Tipos inferidos de los esquemas
export type ConceptStats = z.infer<typeof ConceptStatsSchema>;
