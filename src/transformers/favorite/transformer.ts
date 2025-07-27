/**
 * @file Transformadores para la entidad Favorite
 * @module transformers/favorite/transformer
 * @description 🚨 Migración: Todos los tipos y enums se importan desde '@/types/entities/favorite/types'.
 * No usar ni importar tipos de base.ts o extended.ts (eliminados).
 
 */

import {
	FAVORITE_ENTITY_COLORS as ENTITY_COLORS,
	FAVORITE_ENTITY_DISPLAY_NAMES as ENTITY_DISPLAY_NAMES,
	FAVORITE_ENTITY_EMOJIS as ENTITY_ICONS,
	FavoriteComplete,
	FavoriteEntityType,
	FavoriteStats,
	FavoritesByType,
} from '../../types/entities/favorite/types';

// Tipos locales equivalentes a Drizzle
type DrizzleFavorite = {
	id: string;
	entityId: string;
	entityType: string;
	profileId: string;
	createdAt: Date;
	updatedAt: Date;
};

// Tipo extendido local para UI
type FavoriteExtended = FavoriteComplete & {
	entityName: string;
	entityPreview: string;
	entityIcon: string;
	entityColor: string;
};

interface TransformFavoriteOptions {
	includeEntityDetails?: boolean;
}

/**
 * Transforma un objeto favorito a su formato base
 * ✅ MIGRADO A DRIZZLE
 */
export function transformFavorite(favorite: DrizzleFavorite, options: TransformFavoriteOptions = {}): FavoriteComplete {
	// Valores por defecto para opciones
	const { includeEntityDetails = false } = options;

	return {
		id: favorite.id,
		entityId: favorite.entityId,
		entityType: favorite.entityType as FavoriteEntityType,
		userId: null, // Valor por defecto
		profileId: favorite.profileId,
		addedAt: favorite.createdAt, // Usar createdAt como addedAt
		notes: null, // Valor por defecto
		category: null, // Valor por defecto
		priority: null, // Valor por defecto
		createdAt: favorite.createdAt,
		updatedAt: favorite.updatedAt,
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
	// Extraer las propiedades de UI
	const entityType = favorite.entityType;
	const entityIcon = ENTITY_ICONS[entityType] || '⭐';
	const entityColor = ENTITY_COLORS[entityType] || '#3b82f6';

	// Propiedades de la entidad si están disponibles
	let entityName = '';
	let entityPreview = '';

	if (entityDetails) {
		entityName = entityDetails.name || entityDetails.title || '';
		entityPreview = entityDetails.preview || entityDetails.thumbnail || '';
	}

	return {
		...favorite,
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
	const groupsMap: Record<string, FavoriteComplete[]> = {};

	// Agrupar los favoritos por tipo
	for (const favorite of favorites) {
		const type = favorite.entityType;

		if (!groupsMap[type]) {
			groupsMap[type] = [];
		}

		groupsMap[type].push(favorite);
	}

	// Convertir el mapa a array de grupos
	return Object.entries(groupsMap).map(([type, items]) => ({
		type,
		displayName: ENTITY_DISPLAY_NAMES[type] || type,
		icon: ENTITY_ICONS[type] || '⭐',
		color: ENTITY_COLORS[type] || '#3b82f6',
		count: items.length,
		items,
	}));
}

/**
 * Calcula estadísticas para favoritos
 * ✅ MIGRADO A DRIZZLE
 */
export function calculateFavoriteStats(favorites: FavoriteComplete[], recentLimit = 5): FavoriteStats {
	// Contar por tipo
	const byType: Record<string, number> = {};

	for (const favorite of favorites) {
		const type = favorite.entityType;
		byType[type] = (byType[type] || 0) + 1;
	}

	// Ordenar por fecha para obtener los más recientes
	const recentlyAdded = [...favorites]
		.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
		.slice(0, recentLimit);

	return {
		totalCount: favorites.length,
		byType,
		recentlyAdded,
	};
}
