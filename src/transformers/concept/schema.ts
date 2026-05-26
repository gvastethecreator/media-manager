/**
 * @file Esquemas Zod para la entidad Concept.
 * @module transformers/concept/schema
 * @description Esquemas de validación Zod para transformaciones de Concept.
 * ✅ MIGRADO A DRIZZLE - Enero 2025
 */

import { z } from 'zod';

/**
 * 🗿 Esquema Zod para ConceptBase (datos base de Drizzle).
 */
export const ConceptBaseSchema = z.object({
	id: z.string().min(1, 'ID es requerido'),
	name: z.string().min(1, 'Nombre es requerido').max(255, 'Nombre debe tener máximo 255 caracteres'),
	emoji: z.string().min(1, 'Emoji es requerido'),
	color: z.string().min(1, 'Color es requerido'),
	description: z.string().nullable(),
	content: z.string().min(1, 'Contenido es requerido'),
	category: z.string().nullable(),
	isFavorite: z.boolean().default(false),
	totalImages: z.number().int().min(0).default(0),
	totalVideos: z.number().int().min(0).default(0),
	type: z.string().nullable(),
	complexity: z.string().nullable(),
	applications: z.string().nullable(),
	examples: z.string().nullable(),
	relatedConcepts: z.string().nullable(),
	notes: z.string().nullable(),
	featuredImage: z.string().nullable(),
	parentId: z.string().nullable(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

/**
 * 📊 Esquema Zod para ConceptStatistics.
 */
export const ConceptStatisticsSchema = z
	.object({
		imageCount: z.number().int().min(0).default(0),
		videoCount: z.number().int().min(0).default(0),
		albumCount: z.number().int().min(0).default(0),
		collectionCount: z.number().int().min(0).default(0),
		tagCount: z.number().int().min(0).default(0),
		characterCount: z.number().int().min(0).default(0),
		placeCount: z.number().int().min(0).default(0),
		worldItemCount: z.number().int().min(0).default(0),
		promptCount: z.number().int().min(0).default(0),
		noteCount: z.number().int().min(0).default(0),
		wildcardCount: z.number().int().min(0).default(0),
		propertyCount: z.number().int().min(0).default(0),
		groupCount: z.number().int().min(0).default(0),
		totalAssociations: z.number().int().min(0).default(0),
		lastUpdated: z.date(),
	})
	.passthrough();

/**
 * ✨ Esquema Zod para ConceptWithStats (tipo canónico).
 */
export const ConceptWithStatsSchema = ConceptBaseSchema.extend({
	entityType: z.literal('concept'),
	statistics: ConceptStatisticsSchema,
	stats: ConceptStatisticsSchema,
	_count: z
		.object({
			images: z.number().int().min(0).default(0),
			videos: z.number().int().min(0).default(0),
			prompts: z.number().int().min(0).default(0),
			notes: z.number().int().min(0).default(0),
			characters: z.number().int().min(0).default(0),
			places: z.number().int().min(0).default(0),
			worldItems: z.number().int().min(0).default(0),
			properties: z.number().int().min(0).default(0),
			wildcards: z.number().int().min(0).default(0),
			groups: z.number().int().min(0).default(0),
			albums: z.number().int().min(0).default(0),
			collections: z.number().int().min(0).default(0),
			tags: z.number().int().min(0).default(0),
		})
		.optional(),
});

/**
 * 🔄 Esquema para los conteos de relaciones desde Drizzle.
 */
export const ConceptCountsSchema = z.object({
	images: z.number().int().min(0).default(0),
	videos: z.number().int().min(0).default(0),
	albums: z.number().int().min(0).default(0),
	collections: z.number().int().min(0).default(0),
	tags: z.number().int().min(0).default(0),
	characters: z.number().int().min(0).default(0),
	places: z.number().int().min(0).default(0),
	worldItems: z.number().int().min(0).default(0),
	prompts: z.number().int().min(0).default(0),
	notes: z.number().int().min(0).default(0),
	wildcards: z.number().int().min(0).default(0),
	properties: z.number().int().min(0).default(0),
	groups: z.number().int().min(0).default(0),
});

/**
 * 📝 Esquema para datos de creación de Concept.
 */
export const ConceptCreateSchema = z.object({
	name: z.string().min(1, 'Nombre es requerido').max(255),
	emoji: z.string().min(1, 'Emoji es requerido'),
	color: z.string().min(1, 'Color es requerido'),
	description: z.string().nullable().optional(),
	content: z.string().min(1, 'Contenido es requerido'),
	category: z.string().min(1, 'Categoría es requerida'),
	featuredImage: z.string().nullable().optional(),
});

/**
 * ✏️ Esquema para datos de actualización de Concept.
 */
export const ConceptUpdateSchema = ConceptCreateSchema.partial();

/**
 * 🔍 Esquema para filtros de búsqueda de Concept.
 */
export const ConceptFiltersSchema = z.object({
	name: z.string().optional(),
	color: z.string().optional(),
	category: z.string().optional(),
	isFavorite: z.boolean().optional(),
	createdAfter: z.date().optional(),
	createdBefore: z.date().optional(),
});

/**
 * 📋 Esquema para opciones de ordenamiento de Concept.
 */
export const ConceptSortOptionsSchema = z.object({
	field: z.enum(['name', 'createdAt', 'updatedAt', 'imageCount', 'videoCount']),
	direction: z.enum(['asc', 'desc']),
});
