/**
 * @file Esquema de validación para la entidad Property
 * @module types/entities/property/schema
 */

import { z } from 'zod';
import { PropertySortCriteria, PropertyViewMode } from '@/store/entities/property/types';
import { BaseEntitySchema } from '@/types/common/base';
import { MetadataFieldsSchema, UIFieldsSchema } from '@/types/common/transformer';

/**
 * 🔍 Esquema para filtros de búsqueda
 */
export const PropertyFiltersSchema = z.object({
	searchQuery: z.string().optional(),
	categories: z.array(z.string()).optional(),
	onlyFavorites: z.boolean().optional(),
});

/**
 * 🔎 Esquema para opciones de búsqueda
 */
export const PropertySearchOptionsSchema = z.object({
	page: z.number().int().positive().optional().default(1),
	pageSize: z.number().int().positive().optional().default(20),
	sortBy: z.nativeEnum(PropertySortCriteria).optional(),
	filters: PropertyFiltersSchema.optional(),
	include: z
		.object({
			images: z.boolean().optional(),
			videos: z.boolean().optional(),
			albums: z.boolean().optional(),
			collections: z.boolean().optional(),
			tags: z.boolean().optional(),
			characters: z.boolean().optional(),
			places: z.boolean().optional(),
			worldItems: z.boolean().optional(),
			concepts: z.boolean().optional(),
			prompts: z.boolean().optional(),
			notes: z.boolean().optional(),
			wildcards: z.boolean().optional(),
			groups: z.boolean().optional(),
		})
		.optional(),
});

/**
 * 📊 Esquema para estadísticas
 */
export const PropertyStatsSchema = z.object({
	usageCount: z.number().optional(),
	relatedEntitiesCount: z.number().optional(),
	lastUsed: z.date().optional(),
});

/**
 * 📝 Esquema principal para Property
 */
export const PropertySchema = z.object({
	...BaseEntitySchema.shape,
	...UIFieldsSchema.shape,
	...MetadataFieldsSchema.shape,
	name: z.string().min(1),
	emoji: z.string().default('🔍'),
	color: z.string().default('#3b82f6'),
	description: z.string().nullable(),
	shortcut: z.string().nullable(),
	category: z.string().nullable(),
	featuredImage: z.string().nullable(),
	isFavorite: z.boolean().default(false),
	sortBy: z.nativeEnum(PropertySortCriteria).optional(),
	viewMode: z.nativeEnum(PropertyViewMode).optional(),
});

/**
 * 🆕 Esquema para creación de Property
 */
export const CreatePropertySchema = z.object({
	name: z.string().min(1),
	emoji: z.string().optional(),
	color: z.string().optional(),
	description: z.string().nullable().optional(),
	shortcut: z.string().nullable().optional(),
	category: z.string().nullable().optional(),
	featuredImage: z.string().nullable().optional(),
	isFavorite: z.boolean().optional(),
});

/**
 * 🔄 Esquema para actualización de Property
 */
export const UpdatePropertySchema = z.object({
	name: z.string().min(1).optional(),
	emoji: z.string().optional(),
	color: z.string().optional(),
	description: z.string().nullable().optional(),
	shortcut: z.string().nullable().optional(),
	category: z.string().nullable().optional(),
	featuredImage: z.string().nullable().optional(),
	isFavorite: z.boolean().optional(),
});
