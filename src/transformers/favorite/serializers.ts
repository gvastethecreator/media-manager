/**
 * @file Serializadores para la entidad Favorite.
 * @module transformers/favorite/serializers
 * @description Contiene funciones para serializar datos de Favorite para respuestas API y cliente.
 * ✅ MIGRADO A DRIZZLE - Enero 2025
 */

import type { FavoriteBase, FavoriteWithStats } from '../../types/entities/favorite';

/**
 * ⭐ Serializa un favorito base para respuestas API.
 * Omite campos sensibles y aplica formato estándar.
 *
 * @param favorite - Favorito base desde Drizzle
 * @returns Favorito serializado para API
 */
export function serializeFavoriteBase(favorite: FavoriteBase) {
	return {
		id: favorite.id,
		entityId: favorite.entityId,
		entityType: favorite.entityType,
		userId: favorite.userId,
		profileId: favorite.profileId,
		createdAt: favorite.createdAt.toISOString(),
		updatedAt: favorite.updatedAt.toISOString(),
	};
}

/**
 * 📊 Serializa un favorito con estadísticas para respuestas API.
 *
 * @param favorite - Favorito con estadísticas
 * @returns Favorito serializado con estadísticas
 */
export function serializeFavoriteWithStats(favorite: FavoriteWithStats) {
	return {
		...serializeFavoriteBase(favorite),
		stats: {
			entityTypeName: favorite.stats.entityTypeName,
			formattedCreatedAt: favorite.stats.formattedCreatedAt,
			daysSinceFavorited: favorite.stats.daysSinceFavorited,
			isRecent: favorite.stats.isRecent,
			isOld: favorite.stats.isOld,
		},
	};
}

/**
 * ⭐ Serializa una lista de favoritos para respuestas API.
 *
 * @param favorites - Lista de favoritos con estadísticas
 * @returns Lista serializada
 */
export function serializeFavoriteList(favorites: FavoriteWithStats[]) {
	return favorites.map(serializeFavoriteWithStats);
}

/**
 * 📊 Serializa estadísticas agrupadas de favoritos.
 *
 * @param grouped - Favoritos agrupados por tipo
 * @returns Estadísticas serializadas
 */
export function serializeFavoriteGroupedStats(grouped: Record<string, FavoriteWithStats[]>) {
	if (!grouped || typeof grouped !== 'object') {
		return [];
	}
	return Object.entries(grouped).map(([entityType, favorites]) => ({
		entityType,
		count: favorites.length,
		favorites: favorites.map(serializeFavoriteWithStats),
	}));
}

/**
 * 📊 Serializa resumen de favoritos.
 *
 * @param summary - Resumen de estadísticas de favoritos
 * @returns Resumen serializado
 */
export function serializeFavoritesSummary(summary: {
	total: number;
	byType: Record<string, number>;
	recentCount: number;
	oldCount: number;
	mostRecentDate: Date;
	oldestDate: Date;
}) {
	return {
		total: summary.total,
		byType: summary.byType,
		recentCount: summary.recentCount,
		oldCount: summary.oldCount,
		mostRecentDate: summary.mostRecentDate.toISOString(),
		oldestDate: summary.oldestDate.toISOString(),
	};
}
