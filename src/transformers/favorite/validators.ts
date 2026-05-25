/**
 * @file Validadores Zod para la entidad Favorite.
 * @module transformers/favorite/validators
 * @description Esquemas de validación para Favorite usando Zod.
 * ✅ MIGRADO A DRIZZLE - Enero 2025
 */

import { z } from 'zod';
import { FavoriteEntityType } from '@/types/entities/favorite';

/**
 * ⭐ Esquema base para validar favoritos.
 */
export const favoriteBaseSchema = z.object({
	id: z.string().min(1, 'ID es requerido'),
	profileId: z.string().min(1, 'profileId es requerido'),
	entityId: z.string().min(1, 'entityId es requerido'),
	entityType: z.nativeEnum(FavoriteEntityType),
	addedAt: z.date(),
});

/**
 * 📊 Esquema para estadísticas de favoritos.
 */
export const favoriteStatisticsSchema = z.object({
	daysSinceAdded: z.number().int().min(0),
	entityTypeName: z.string(),
	formattedAddedAt: z.string(),
	isRecent: z.boolean(),
	isOld: z.boolean(),
});

/**
 * ⭐ Esquema para favorito con estadísticas.
 */
export const favoriteWithStatsSchema = favoriteBaseSchema.extend({
	entityName: z.string(),
	entityThumbnail: z.string().nullable(),
	stats: favoriteStatisticsSchema,
});

/**
 * 🆕 Esquema para crear favoritos.
 */
export const favoriteCreateSchema = favoriteBaseSchema.omit({
	id: true,
	profileId: true,
	addedAt: true,
});

/**
 * ✏️ Esquema para actualizar favoritos.
 */
export const favoriteUpdateSchema = favoriteCreateSchema.partial();

/**
 * 🔍 Esquema para búsqueda de favoritos.
 */
export const favoriteSearchSchema = z.object({
	entityIds: z.array(z.string().min(1)).optional(),
	entityTypes: z.array(z.nativeEnum(FavoriteEntityType)).optional(),
	profileId: z.string().min(1).optional(),
	dateFrom: z.date().optional(),
	dateTo: z.date().optional(),
	isRecent: z.boolean().optional(),
});

/**
 * 📊 Esquema para agrupación de favoritos por tipo.
 */
export const favoriteGroupByTypeSchema = z.object({
	entityType: z.nativeEnum(FavoriteEntityType),
	count: z.number().int().min(0),
	favorites: z.array(favoriteWithStatsSchema),
});

// Tipos inferidos desde esquemas Zod
export type FavoriteBase = z.infer<typeof favoriteBaseSchema>;
export type FavoriteStatistics = z.infer<typeof favoriteStatisticsSchema>;
export type FavoriteWithStats = z.infer<typeof favoriteWithStatsSchema>;
export type FavoriteCreateInput = z.infer<typeof favoriteCreateSchema>;
export type FavoriteUpdateInput = z.infer<typeof favoriteUpdateSchema>;
export type FavoriteSearchInput = z.infer<typeof favoriteSearchSchema>;
export type FavoriteGroupByType = z.infer<typeof favoriteGroupByTypeSchema>;
