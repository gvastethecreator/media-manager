/**
 * @file Esquemas Zod para la entidad Collection.
 * @module transformers/collection/schema
 * @description Esquemas de validación Zod para transformaciones de Collection.
 * ✅ MIGRADO A DRIZZLE - Enero 2025
 */

import { z } from 'zod';

/**
 * 🗿 Esquema Zod para CollectionBase (datos base de Drizzle).
 */
export const CollectionBaseSchema = z.object({
	id: z.string().min(1, 'ID es requerido'),
	name: z.string().min(1, 'Nombre es requerido').max(255, 'Nombre debe tener máximo 255 caracteres'),
	description: z.string().nullable(),
	emoji: z.string().nullable(),
	color: z.string().nullable(),
	featuredImage: z.string().nullable(),

	isFavorite: z.boolean().default(false),
	totalImages: z.number().int().min(0).default(0),
	totalVideos: z.number().int().min(0).default(0),
	totalSize: z.number().int().min(0).default(0),
	lastImageAddedAt: z.date().nullable(),
	lastVideoAddedAt: z.date().nullable(),
	parentId: z.string().nullable(),
	category: z.string().nullable(),
	platform: z.string().nullable(),
	price: z.number().nullable(),
	network: z.string().nullable(),
	tokenId: z.string().nullable(),
	url: z.string().nullable(),
	alternativeUrl: z.string().nullable(),
	editions: z.array(z.any()).nullable(),
	sourceImage: z.string().nullable(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

/**
 * 📊 Esquema Zod para CollectionStatistics.
 */
export const CollectionStatisticsSchema = z.object({
	imageCount: z.number().int().min(0).default(0),
	videoCount: z.number().int().min(0).default(0),
	albumCount: z.number().int().min(0).default(0),
	tagCount: z.number().int().min(0).default(0),
	characterCount: z.number().int().min(0).default(0),
	placeCount: z.number().int().min(0).default(0),
	worldItemCount: z.number().int().min(0).default(0),
	conceptCount: z.number().int().min(0).default(0),
	promptCount: z.number().int().min(0).default(0),
	noteCount: z.number().int().min(0).default(0),
	wildcardCount: z.number().int().min(0).default(0),
	propertyCount: z.number().int().min(0).default(0),
	groupCount: z.number().int().min(0).default(0),
});

/**
 * ✨ Esquema Zod para CollectionWithStats (tipo canónico).
 */
export const CollectionWithStatsSchema = CollectionBaseSchema.extend({
	entityType: z.literal('collection'),
	stats: CollectionStatisticsSchema,
});

/**
 * 🔄 Esquema para los conteos de relaciones desde Drizzle.
 */
export const CollectionCountsSchema = z.object({
	images: z.number().int().min(0).default(0),
	videos: z.number().int().min(0).default(0),
	albums: z.number().int().min(0).default(0),
	tags: z.number().int().min(0).default(0),
	characters: z.number().int().min(0).default(0),
	places: z.number().int().min(0).default(0),
	worldItems: z.number().int().min(0).default(0),
	concepts: z.number().int().min(0).default(0),
	prompts: z.number().int().min(0).default(0),
	notes: z.number().int().min(0).default(0),
	wildcards: z.number().int().min(0).default(0),
	properties: z.number().int().min(0).default(0),
	groups: z.number().int().min(0).default(0),
});

/**
 * 📝 Esquema para datos de creación de Collection.
 */
export const CollectionCreateSchema = z.object({
	name: z.string().min(1, 'Nombre es requerido').max(255),
	description: z.string().nullable().optional(),
	emoji: z.string().nullable().optional(),
	color: z.string().nullable().optional(),
	featuredImage: z.string().nullable().optional(),

	isFavorite: z.boolean().optional(),
	parentId: z.string().nullable().optional(),
});

/**
 * ✏️ Esquema para datos de actualización de Collection.
 */
export const CollectionUpdateSchema = CollectionCreateSchema.partial();
