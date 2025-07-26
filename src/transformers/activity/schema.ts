/**
 * @file Esquemas de validación Zod para la entidad Activity
 * @module transformers/activity/schema
 */

import { z } from 'zod';
import { ActivityCategory, ActivitySortCriteria, ActivityType } from '../../types/entities/activity';

/**
 * Esquema base para actividades
 */
export const activityBaseSchema = z.object({
	id: z.string(),
	type: z.string(),
	entityType: z.string(),
	entityId: z.string(),
	action: z.string(),
	userId: z.string(),
	description: z.string(),
	metadata: z.record(z.string(), z.unknown()).nullable().optional(),
	ipAddress: z.string().nullable().optional(),
	userAgent: z.string().nullable().optional(),
	sessionId: z.string().nullable().optional(),
	imageId: z.string().nullable().optional(),
	createdAt: z.union([z.string(), z.date()]),
});

/**
 * Esquema para relaciones de imagen en actividades
 */
export const activityImageRelationSchema = z.object({
	id: z.string(),
	name: z.string(),
	path: z.string(),
	thumbnail: z.string().nullable().optional(),
});

/**
 * Esquema para actividades completas
 */
export const activitySchema = activityBaseSchema.extend({
	image: activityImageRelationSchema.nullable().optional(),
	iconEmoji: z.string().optional(),
	iconColor: z.string().optional(),
	category: z.string().optional(),
	isSelected: z.boolean().optional(),
	isExpanded: z.boolean().optional(),
});

/**
 * Esquema para creación de actividades
 */
export const createActivitySchema = z.object({
	type: z.string(),
	description: z.string(),
	imageId: z.string().optional(),
});

/**
 * Esquema para filtros de actividades
 */
export const activityFiltersSchema = z.object({
	types: z.array(z.string()).optional(),
	startDate: z.union([z.string(), z.date()]).optional(),
	endDate: z.union([z.string(), z.date()]).optional(),
	imageId: z.string().optional(),
	searchQuery: z.string().optional(),
	limit: z.number().positive().optional(),
	offset: z.number().nonnegative().optional(),
});

/**
 * Esquema para response de listado de actividades
 */
export const activityListResponseSchema = z.object({
	activities: z.array(activitySchema),
	totalCount: z.number(),
	hasMore: z.boolean(),
});

/**
 * Esquema para metadatos adicionales específicos por tipo de actividad
 */
export const activityMetadataSchema = z.record(z.string(), z.unknown());

/**
 * Esquema para tipos de actividad permitidos
 */
export const activityTypeSchema = z.nativeEnum(ActivityType);

/**
 * Esquema para categorías de actividad
 */
export const activityCategorySchema = z.nativeEnum(ActivityCategory);

/**
 * Esquema para criterios de ordenación
 */
export const activitySortCriteriaSchema = z.nativeEnum(ActivitySortCriteria);

// Exportaciones de tipos derivados
export type ActivitySchemaType = z.infer<typeof activitySchema>;
export type CreateActivitySchemaType = z.infer<typeof createActivitySchema>;
export type ActivityFiltersSchemaType = z.infer<typeof activityFiltersSchema>;
export type ActivityListResponseSchemaType = z.infer<typeof activityListResponseSchema>;
