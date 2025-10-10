/**
 * @file albums.validators.ts
 * @module server/routes/albums/validators
 * @description Schemas de validación Zod para rutas de albums
 */

import { z } from 'zod';

/**
 * Schema para filtros de búsqueda de albums
 */
export const AlbumFiltersSchema = z.object({
	search: z.string().optional(),
	limit: z.coerce.number().min(1).max(100).default(20),
	offset: z.coerce.number().min(0).default(0),
	sortBy: z.enum(['name', 'createdAt', 'updatedAt']).default('updatedAt'),
	sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Schema para creación de album
 */
export const AlbumCreateSchema = z.object({
	name: z.string().min(1).max(255),
	description: z.string().nullable().optional(),
	emoji: z.string().nullable().optional(),
	color: z.string().nullable().optional(),
	featuredImage: z.string().nullable().optional(),
	isFavorite: z.boolean().default(false),
	totalImages: z.number().int().min(0).default(0),
	totalVideos: z.number().int().min(0).default(0),
	totalSize: z.number().int().min(0).default(0),
	filters: z.string().nullable().optional(),
	shortcut: z.string().nullable().optional(),
	category: z.string().nullable().optional(),
	metadata: z.string().nullable().optional(),
	lastImageAddedAt: z.date().nullable().optional(),
	lastVideoAddedAt: z.date().nullable().optional(),
	parentId: z.string().nullable().optional(),
});

/**
 * Schema para actualización de album
 */
export const AlbumUpdateSchema = z.object({
	name: z.string().min(1).max(255).optional(),
	description: z.string().nullable().optional(),
	emoji: z.string().nullable().optional(),
	color: z.string().nullable().optional(),
	featuredImage: z.string().nullable().optional(),
	isFavorite: z.boolean().optional(),
	totalImages: z.number().int().min(0).optional(),
	totalVideos: z.number().int().min(0).optional(),
	totalSize: z.number().int().min(0).optional(),
	filters: z.string().nullable().optional(),
	shortcut: z.string().nullable().optional(),
	category: z.string().nullable().optional(),
	metadata: z.string().nullable().optional(),
	lastImageAddedAt: z.date().nullable().optional(),
	lastVideoAddedAt: z.date().nullable().optional(),
	parentId: z.string().nullable().optional(),
});

export type AlbumFilters = z.infer<typeof AlbumFiltersSchema>;
export type AlbumCreate = z.infer<typeof AlbumCreateSchema>;
export type AlbumUpdate = z.infer<typeof AlbumUpdateSchema>;
