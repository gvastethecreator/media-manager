/**
 * @file Esquema Zod para la entidad Group
 * @module types/entities/group/schema
 */

import { z } from 'zod';
import { GroupViewMode } from './base';

/**
 * Esquema para filtros de búsqueda de grupos
 */
export const GroupFiltersSchema = z.object({
	search: z.string().optional(),
	categories: z.array(z.string()).optional(),
	tags: z.array(z.string()).optional(),
	dateRange: z
		.object({
			start: z.date().optional(),
			end: z.date().optional(),
		})
		.optional(),
	isFavorite: z.boolean().optional(),
	hasImages: z.boolean().optional(),
	hasVideos: z.boolean().optional(),
	hasAlbums: z.boolean().optional(),
	hasCollections: z.boolean().optional(),
});

/**
 * Esquema para estadísticas de uso de grupos
 */
export const GroupStatsSchema = z.object({
	usageCount: z.number().optional(),
	relatedEntitiesCount: z.number().optional(),
	lastUsed: z.date().optional(),
});

/**
 * Esquema para filtros avanzados
 */
export const GroupAdvancedFilterSchema = z.object({
	field: z.string(),
	operator: z.enum(['equals', 'contains', 'startsWith', 'endsWith', 'gt', 'gte', 'lt', 'lte', 'in', 'notIn']),
	value: z.any(),
	isActive: z.boolean().default(true),
});

/**
 * Esquema principal para la entidad Group
 */
export const GroupSchema = z.object({
	id: z.string(),
	name: z.string().min(1, 'El nombre es obligatorio'),
	emoji: z.string().default('👥'),
	color: z.string().default('#8B5CF6'),
	description: z.string().nullable().optional(),
	shortcut: z.string().nullable().optional(),
	category: z.string().nullable().optional(),
	sortBy: z.string().default('name:asc'),
	filters: z.string().default('{}'),
	featuredImage: z.string().nullable().optional(),
	isFavorite: z.boolean().default(false),
	createdAt: z.date().optional(),
	updatedAt: z.date().optional(),

	// Configuración de visualización
	viewMode: z.nativeEnum(GroupViewMode).optional(),
});

/**
 * Esquema para crear un grupo
 */
export const CreateGroupSchema = GroupSchema.omit({
	id: true,
	createdAt: true,
	updatedAt: true,
}).extend({
	name: z.string().min(1, 'El nombre es obligatorio'),
});

/**
 * Esquema para actualizar un grupo
 */
export const UpdateGroupSchema = GroupSchema.partial().omit({
	id: true,
	createdAt: true,
	updatedAt: true,
});

/**
 * Esquema para relaciones de un grupo
 */
export const GroupRelationsSchema = z.object({
	_count: z
		.object({
			images: z.number().default(0),
			videos: z.number().default(0),
			albums: z.number().default(0),
			collections: z.number().default(0),
			tags: z.number().default(0),
			characters: z.number().default(0),
			places: z.number().default(0),
			worldItems: z.number().default(0),
			concepts: z.number().default(0),
			prompts: z.number().default(0),
			notes: z.number().default(0),
			wildcards: z.number().default(0),
			properties: z.number().default(0),
		})
		.optional(),

	// Relaciones opcionales
	images: z.array(z.object({ id: z.string() })).optional(),
	videos: z.array(z.object({ id: z.string() })).optional(),
	albums: z.array(z.object({ id: z.string() })).optional(),
	collections: z.array(z.object({ id: z.string() })).optional(),
	tags: z.array(z.object({ id: z.string() })).optional(),
	characters: z.array(z.object({ id: z.string() })).optional(),
	places: z.array(z.object({ id: z.string() })).optional(),
	worldItems: z.array(z.object({ id: z.string() })).optional(),
	concepts: z.array(z.object({ id: z.string() })).optional(),
	prompts: z.array(z.object({ id: z.string() })).optional(),
	notes: z.array(z.object({ id: z.string() })).optional(),
	wildcards: z.array(z.object({ id: z.string() })).optional(),
	properties: z.array(z.object({ id: z.string() })).optional(),
});

/**
 * Esquema para opciones de búsqueda
 */
export const GroupSearchOptionsSchema = z.object({
	skip: z.number().optional(),
	take: z.number().optional(),
	orderBy: z.record(z.string(), z.enum(['asc', 'desc'])).optional(),
	where: GroupFiltersSchema.optional(),
	include: z.record(z.string(), z.boolean()).optional(),
});
