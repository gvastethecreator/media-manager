/**
 * @file Esquemas de validación Zod para la entidad Album
 * @module transformers/album/schema
 * ✅ MIGRADO A DRIZZLE - Julio 2025
 
 */

import { z } from 'zod';

/**
 * Esquema base para álbumes
 */
export const albumBaseSchema = z.object({
	id: z.string(),
	name: z.string().min(1).max(100),
	description: z.string().nullable(),
	emoji: z.string().nullable(),
	color: z.string().nullable(),
	featuredImage: z.string().nullable(),
	isPublic: z.boolean(),
	isFavorite: z.boolean(),
	totalImages: z.number().nonnegative(),
	totalVideos: z.number().nonnegative(),
	totalSize: z.number().nonnegative(),
	lastImageAddedAt: z.date().nullable(),
	lastVideoAddedAt: z.date().nullable(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

/**
 * Esquema para estadísticas de álbum
 */
export const albumStatisticsSchema = z.object({
	imageCount: z.number().nonnegative(),
	videoCount: z.number().nonnegative(),
	collectionCount: z.number().nonnegative(),
	tagCount: z.number().nonnegative(),
	characterCount: z.number().nonnegative(),
	placeCount: z.number().nonnegative(),
	worldItemCount: z.number().nonnegative(),
	conceptCount: z.number().nonnegative(),
	promptCount: z.number().nonnegative(),
	noteCount: z.number().nonnegative(),
	wildcardCount: z.number().nonnegative(),
	propertyCount: z.number().nonnegative(),
	groupCount: z.number().nonnegative(),
});

/**
 * Esquema para álbumes completos con estadísticas
 */
export const albumWithStatsSchema = albumBaseSchema.extend({
	stats: albumStatisticsSchema,
});

/**
 * Esquema para filtros de álbumes
 */
export const albumFiltersSchema = z.object({
	searchQuery: z.string().optional(),
	categories: z.array(z.string()).optional(),
	isFavorite: z.boolean().optional(),
	isPublic: z.boolean().optional(),
	startDate: z.union([z.string(), z.date()]).optional(),
	endDate: z.union([z.string(), z.date()]).optional(),
	limit: z.number().positive().max(100).optional(),
	offset: z.number().nonnegative().optional(),
});

/**
 * Esquema para response de listado de álbumes
 */
export const albumListResponseSchema = z.object({
	albums: z.array(albumWithStatsSchema),
	totalCount: z.number(),
	hasMore: z.boolean(),
});

// Exportaciones de tipos derivados
export type AlbumBaseSchemaType = z.infer<typeof albumBaseSchema>;
export type AlbumStatisticsSchemaType = z.infer<typeof albumStatisticsSchema>;
export type AlbumWithStatsSchemaType = z.infer<typeof albumWithStatsSchema>;
export type AlbumFiltersSchemaType = z.infer<typeof albumFiltersSchema>;
export type AlbumListResponseSchemaType = z.infer<typeof albumListResponseSchema>;
