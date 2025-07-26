/**
 * @file Validadores Zod para la entidad Favorite.
 * @module transformers/favorite/validators
 * @description Esquemas de validación para Favorite usando Zod.
 * ✅ MIGRADO A DRIZZLE - Enero 2025
 */

import { z } from 'zod';
import { FavoriteEntityType } from '../../types/entities/favorite';

/**
 * ⭐ Esquema base para validar favoritos.
 */
export const favoriteBaseSchema = z.object({
	id: z.string().uuid('ID debe ser un UUID válido'),
	entityId: z.string().uuid('ID de entidad debe ser UUID válido'),
	entityType: z.nativeEnum(FavoriteEntityType, {
		errorMap: () => ({ message: 'Tipo de entidad no válido' }),
	}),
	userId: z.string().uuid().nullable(),
	profileId: z.string().uuid().nullable(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

/**
 * 📊 Esquema para estadísticas de favoritos.
 */
export const favoriteStatisticsSchema = z.object({
	entityTypeName: z.string(),
	formattedCreatedAt: z.string(),
	daysSinceFavorited: z.number().int().min(0),
	isRecent: z.boolean(),
	isOld: z.boolean(),
});

/**
 * ⭐ Esquema para favorito con estadísticas.
 */
export const favoriteWithStatsSchema = favoriteBaseSchema.extend({
	stats: favoriteStatisticsSchema,
});

/**
 * 🆕 Esquema para crear favoritos.
 */
export const favoriteCreateSchema = favoriteBaseSchema.omit({
	id: true,
	createdAt: true,
	updatedAt: true,
});

/**
 * ✏️ Esquema para actualizar favoritos.
 */
export const favoriteUpdateSchema = favoriteCreateSchema.partial();

/**
 * 🔍 Esquema para búsqueda de favoritos.
 */
export const favoriteSearchSchema = z.object({
	entityIds: z.array(z.string().uuid()).optional(),
	entityTypes: z.array(z.nativeEnum(FavoriteEntityType)).optional(),
	userId: z.string().uuid().optional(),
	profileId: z.string().uuid().optional(),
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
