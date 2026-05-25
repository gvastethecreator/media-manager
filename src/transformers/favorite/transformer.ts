/**
 * @file Transformadores para la entidad Favorite
 * @module transformers/favorite/transformer
 */

import {
	FAVORITE_ENTITY_COLORS as ENTITY_COLORS,
	FAVORITE_ENTITY_DISPLAY_NAMES as ENTITY_DISPLAY_NAMES,
	FAVORITE_ENTITY_EMOJIS as ENTITY_ICONS,
	type FavoriteBase,
	type FavoriteComplete,
	type FavoriteEntityType,
	type FavoriteExtended,
	type FavoriteStats,
	type FavoritesByType,
} from '@/types/entities/favorite';
import { toFavoriteWithStats } from './mappers';

interface DrizzleFavorite {
	addedAt: Date;
	entityId: string;
	entityType: FavoriteEntityType;
	id: string;
	profileId: string;
}

interface TransformFavoriteOptions {
	includeEntityDetails?: boolean;
}

/**
 * Transforma un objeto favorito a su formato base
 * ✅ MIGRADO A DRIZZLE
 */
export function transformFavorite(favorite: DrizzleFavorite, options: TransformFavoriteOptions = {}): FavoriteComplete {
	// Valores por defecto para opciones
	const { includeEntityDetails: _includeEntityDetails = false } = options;

	return {
		id: favorite.id,
		entityId: favorite.entityId,
		entityType: favorite.entityType,
		profileId: favorite.profileId,
		addedAt: favorite.addedAt,
	};
}

/**
 * Transforma un array de favoritos
 * ✅ MIGRADO A DRIZZLE
 */
export function transformFavorites(
	favorites: DrizzleFavorite[],
	options?: TransformFavoriteOptions
): FavoriteComplete[] {
	return favorites.map((favorite) => transformFavorite(favorite, options));
}

/**
 * Transforma un favorito a su versión extendida con propiedades de UI
 * ✅ MIGRADO A DRIZZLE
 */
export function transformFavoriteToExtended(
	favorite: FavoriteComplete,
	entityDetails?: { name?: string; title?: string; preview?: string; thumbnail?: string }
): FavoriteExtended {
	const favoriteWithStats = toFavoriteWithStats(favorite as FavoriteBase);

	// Extraer las propiedades de UI
	const entityType = favoriteWithStats.entityType;
	const entityIcon = ENTITY_ICONS[entityType] || '⭐';
	const entityColor = ENTITY_COLORS[entityType] || 'var(--dt-primary-500)';

	// Propiedades de la entidad si están disponibles
	let entityName = '';
	let entityPreview = '';

	if (entityDetails) {
		entityName = entityDetails.name || entityDetails.title || '';
		entityPreview = entityDetails.preview || entityDetails.thumbnail || '';
	}

	return {
		...favoriteWithStats,
		entityName,
		entityPreview,
		entityIcon,
		entityColor,
	};
}

/**
 * Agrupa favoritos por tipo de entidad
 * ✅ MIGRADO A DRIZZLE
 */
export function groupFavoritesByType(favorites: FavoriteComplete[]): FavoritesByType[] {
	// Crear mapa para agrupar por tipo
	const groupsMap: Partial<Record<FavoriteEntityType, FavoriteComplete[]>> = {};

	// Agrupar los favoritos por tipo
	for (const favorite of favorites) {
		const type = favorite.entityType;

		if (!groupsMap[type]) {
			groupsMap[type] = [];
		}

		groupsMap[type].push(favorite);
	}

	// Convertir el mapa a array de grupos
	return (Object.entries(groupsMap) as [FavoriteEntityType, FavoriteComplete[]][]).map(([type, items]) => ({
		type,
		displayName: ENTITY_DISPLAY_NAMES[type] || type,
		icon: ENTITY_ICONS[type] || '⭐',
		color: ENTITY_COLORS[type] || 'var(--dt-primary-500)',
		count: items.length,
		items,
	}));
}

/**
 * Calcula estadísticas para favoritos
 * ✅ MIGRADO A DRIZZLE
 */
export function calculateFavoriteStats(favorites: FavoriteComplete[], recentLimit = 5): FavoriteStats {
	const byType: Partial<Record<FavoriteEntityType, number>> = {};

	for (const favorite of favorites) {
		const type = favorite.entityType;
		const currentCount = byType[type] ?? 0;
		byType[type] = currentCount + 1;
	}

	// Ordenar por fecha para obtener los más recientes
	const recentlyAdded = [...favorites]
		.sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime())
		.slice(0, recentLimit);

	return {
		totalCount: favorites.length,
		byType,
		recentlyAdded,
	};
}
