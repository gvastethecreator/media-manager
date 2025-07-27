/**
 * @file Mappers para la entidad Favorite.
 * @module transformers/favorite/mappers
 * @description Contiene funciones para transformar datos de Favorite entre tipos base y enriquecidos.
 * ✅ MIGRADO A DRIZZLE - Enero 2025
 */

import {
	type FavoriteBase,
	FavoriteEntityType,
	type FavoriteStatistics,
	type FavoriteWithStats,
} from '@/types/entities/favorite';

/**
 * 📊 Calcula las estadísticas de un favorito.
 *
 * @param favorite - El favorito base desde Drizzle
 * @returns Las estadísticas calculadas del favorito
 */
function calculateFavoriteStats(favorite: FavoriteBase): FavoriteStatistics {
	const now = new Date();
	const createdAt = new Date(favorite.createdAt);
	const daysSinceFavorited = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

	// Mapeo de tipos de entidad a nombres legibles
	const entityTypeNames: Record<FavoriteEntityType, string> = {
		[FavoriteEntityType.IMAGE]: 'Imagen',
		[FavoriteEntityType.VIDEO]: 'Video',
		[FavoriteEntityType.ALBUM]: 'Álbum',
		[FavoriteEntityType.COLLECTION]: 'Colección',
		[FavoriteEntityType.FOLDER]: 'Carpeta',
		[FavoriteEntityType.CHARACTER]: 'Personaje',
		[FavoriteEntityType.PLACE]: 'Lugar',
		[FavoriteEntityType.WORLD_ITEM]: 'Elemento del Mundo',
		[FavoriteEntityType.CONCEPT]: 'Concepto',
		[FavoriteEntityType.PROMPT]: 'Prompt',
		[FavoriteEntityType.NOTE]: 'Nota',
		[FavoriteEntityType.DOCUMENT]: 'Documento',
		[FavoriteEntityType.FILE]: 'Archivo',
		[FavoriteEntityType.TAG]: 'Etiqueta',
		[FavoriteEntityType.GROUP]: 'Grupo',
	};

	return {
		entityTypeName: entityTypeNames[favorite.entityType],
		formattedCreatedAt: createdAt.toLocaleDateString('es-ES', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		}),
		daysSinceFavorited,
		isRecent: daysSinceFavorited <= 7,
		isOld: daysSinceFavorited > 30,
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

	const favoriteStats = stats;

	return {
		...favorite,
		statistics: favoriteStats,
		stats: favoriteStats,
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
	);

	const recentFavorites = favorites.filter((f) => f.stats.isRecent);
	const oldFavorites = favorites.filter((f) => f.stats.isOld);

	return {
		total: favorites.length,
		byType,
		recentCount: recentFavorites.length,
		oldCount: oldFavorites.length,
		mostRecentDate: favorites.reduce((latest, f) => (f.createdAt > latest ? f.createdAt : latest), new Date(0)),
		oldestDate: favorites.reduce((oldest, f) => (f.createdAt < oldest ? f.createdAt : oldest), new Date()),
	};
}
