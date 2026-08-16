/**
 * @file Mappers para la entidad Favorite.
 * @module transformers/favorite/mappers
 */

import {
	type FavoriteBase,
	FavoriteEntityType,
	type FavoriteStatistics,
	type FavoriteWithStats,
	getFavoriteEntityDisplayName,
} from '@/types/entities/favorite';

/**
 * 📊 Calcula las estadísticas de un favorito.
 *
 * @param favorite - El favorito base desde Drizzle
 * @returns Las estadísticas calculadas del favorito
 */
function calculateFavoriteStats(favorite: FavoriteBase): FavoriteStatistics {
	const now = new Date();
	const addedAt = new Date(favorite.addedAt);
	const daysSinceAdded = Math.floor((now.getTime() - addedAt.getTime()) / (1000 * 60 * 60 * 24));

	return {
		daysSinceAdded,
		entityTypeName: getFavoriteEntityDisplayName(favorite.entityType),
		formattedAddedAt: addedAt.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		}),
		isRecent: daysSinceAdded <= 7,
		isOld: daysSinceAdded > 30,
	};
}

/**
 * ⭐ Transforma un favorito base en un favorito con estadísticas.
 * Esta es la función principal de transformación para la entidad Favorite.
 *
 * @param favorite - El favorito base desde Drizzle
 * @returns Un favorito enriquecido con estadísticas calculadas
 */
export function toFavoriteWithStats(favorite: FavoriteBase): FavoriteWithStats {
	const stats = calculateFavoriteStats(favorite);

	return {
		...favorite,
		entityName: getFavoriteEntityDisplayName(favorite.entityType),
		entityThumbnail: null,
		stats,
	};
}

/**
 * ⭐ Transforma una lista de favoritos base en favoritos con estadísticas.
 *
 * @param favorites - Lista de favoritos base desde Drizzle
 * @returns Lista de favoritos enriquecidos con estadísticas
 */
export function toFavoriteWithStatsList(favorites: FavoriteBase[]): FavoriteWithStats[] {
	return favorites.map(toFavoriteWithStats);
}

/**
 * 📊 Agrupa favoritos por tipo de entidad.
 *
 * @param favorites - Lista de favoritos con estadísticas
 * @returns Objeto con favoritos agrupados por tipo de entidad
 */
export function groupFavoritesByType(favorites: FavoriteWithStats[]): Record<FavoriteEntityType, FavoriteWithStats[]> {
	const grouped = {} as Record<FavoriteEntityType, FavoriteWithStats[]>;

	// Inicializar grupos vacíos
	for (const type of Object.values(FavoriteEntityType)) {
		grouped[type] = [];
	}

	// Agrupar favoritos
	for (const favorite of favorites) {
		if (grouped[favorite.entityType]) {
			grouped[favorite.entityType].push(favorite);
		}
	}

	return grouped;
}

/**
 * 📊 Obtiene estadísticas generales de favoritos.
 *
 * @param favorites - Lista de favoritos con estadísticas
 * @returns Resumen estadístico de los favoritos
 */
export function getFavoritesSummary(favorites: FavoriteWithStats[]) {
	const byType = Object.fromEntries(
		Object.values(FavoriteEntityType).map((type) => [type, favorites.filter((f) => f.entityType === type).length])
	) as Partial<Record<FavoriteEntityType, number>>;

	const recentFavorites = favorites.filter((f) => f.stats.isRecent);
	const oldFavorites = favorites.filter((f) => f.stats.isOld);

	return {
		total: favorites.length,
		byType,
		recentCount: recentFavorites.length,
		oldCount: oldFavorites.length,
		mostRecentDate: favorites.reduce((latest, f) => (f.addedAt > latest ? f.addedAt : latest), new Date(0)),
		oldestDate: favorites.reduce((oldest, f) => (f.addedAt < oldest ? f.addedAt : oldest), new Date()),
	};
}
