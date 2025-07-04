/**
 * @file Esquemas para Tag - Definiciones Zod y tipos
 * @module transformers/tag/schema
 * ✅ MIGRADO A DRIZZLE - Julio 2025
 */

import { z } from 'zod';

/**
 * Esquema base para validar Tag
 */
export const tagBaseSchema = z.object({
	id: z.string().uuid('ID debe ser un UUID válido'),
	name: z.string().min(1, 'Nombre es requerido').max(100, 'Nombre no puede exceder 100 caracteres'),
	description: z.string().max(500, 'Descripción no puede exceder 500 caracteres').nullable(),
	emoji: z.string().max(10, 'Emoji no puede exceder 10 caracteres').nullable(),
	color: z
		.string()
		.regex(/^#[0-9A-Fa-f]{6}$/, 'Color debe ser un código hexadecimal válido')
		.nullable(),
	category: z.string().max(50, 'Categoría no puede exceder 50 caracteres').nullable(),
	shortcut: z.string().max(10, 'Shortcut no puede exceder 10 caracteres').nullable(),
	featuredImage: z.string().url('Featured image debe ser una URL válida').nullable(),
	isFavorite: z.boolean(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

/**
 * Esquema para crear un Tag
 */
export const tagCreateSchema = z.object({
	name: z.string().min(1, 'Nombre es requerido').max(100, 'Nombre no puede exceder 100 caracteres'),
	description: z.string().max(500).optional(),
	emoji: z.string().max(10).optional(),
	color: z
		.string()
		.regex(/^#[0-9A-Fa-f]{6}$/)
		.default('#6B7280'),
	category: z.string().max(50).optional(),
	shortcut: z.string().max(10).optional(),
	featuredImage: z.string().url().optional(),
	isFavorite: z.boolean().default(false),
});

/**
 * Esquema para actualizar un Tag
 */
export const tagUpdateSchema = z.object({
	name: z.string().min(1).max(100).optional(),
	description: z.string().max(500).nullable().optional(),
	emoji: z.string().max(10).nullable().optional(),
	color: z
		.string()
		.regex(/^#[0-9A-Fa-f]{6}$/)
		.nullable()
		.optional(),
	category: z.string().max(50).nullable().optional(),
	shortcut: z.string().max(10).nullable().optional(),
	featuredImage: z.string().url().nullable().optional(),
	isFavorite: z.boolean().optional(),
});

/**
 * Esquema para estadísticas de Tag
 */
export const tagStatisticsSchema = z.object({
	totalFiles: z.number().int().min(0),
	totalImages: z.number().int().min(0),
	totalVideos: z.number().int().min(0),
	totalDocuments: z.number().int().min(0),
	totalAudios: z.number().int().min(0),
	totalFolders: z.number().int().min(0),
	lastUsed: z.date().nullable(),
	completeness: z.number().min(0).max(1),
});

/**
 * Esquema para Tag con estadísticas
 */
export const tagWithStatsSchema = tagBaseSchema.extend({
	statistics: tagStatisticsSchema,
});

/**
 * Esquemas para búsqueda y filtrado
 */
export const tagSearchSchema = z.object({
	query: z.string().optional(),
	category: z.string().optional(),
	isFavorite: z.boolean().optional(),
	color: z.string().optional(),
	limit: z.number().int().min(1).max(100).default(20),
	offset: z.number().int().min(0).default(0),
	sortBy: z.enum(['name', 'createdAt', 'updatedAt', 'totalFiles']).default('name'),
	sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

/**
 * Esquema para filtros de Tag
 */
export const tagFilterSchema = z.object({
	categories: z.array(z.string()).optional(),
	colors: z.array(z.string()).optional(),
	isFavorite: z.boolean().optional(),
	hasFiles: z.boolean().optional(),
	dateRange: z
		.object({
			from: z.date(),
			to: z.date(),
		})
		.optional(),
});

// Tipos inferidos de los esquemas
export type TagCreate = z.infer<typeof tagCreateSchema>;
export type TagUpdate = z.infer<typeof tagUpdateSchema>;
export type TagStatistics = z.infer<typeof tagStatisticsSchema>;
export type TagWithStats = z.infer<typeof tagWithStatsSchema>;
export type TagSearch = z.infer<typeof tagSearchSchema>;
export type TagFilter = z.infer<typeof tagFilterSchema>;

// Re-exportar esquema base
export { tagBaseSchema as tagSchema };
