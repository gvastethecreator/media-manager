/**
 * @file Transformadores para la entidad Favorite
 * @module transformers/favorite/transformer
 */

import { FavoriteBase, FavoriteEntityType } from '@/types/entities/favorite/base';
import { FavoriteExtended, FavoriteStats, FavoritesByType } from '@/types/entities/favorite/extended';

// Mapa de iconos por tipo de entidad
const ENTITY_ICONS: Record<string, string> = {
	[FavoriteEntityType.IMAGE]: '🖼️',
	[FavoriteEntityType.ALBUM]: '📸',
	[FavoriteEntityType.COLLECTION]: '🌟',
	[FavoriteEntityType.FOLDER]: '📁',
	[FavoriteEntityType.CHARACTER]: '👤',
	[FavoriteEntityType.PLACE]: '📍',
	[FavoriteEntityType.WORLD_ITEM]: '🎯',
	[FavoriteEntityType.CONCEPT]: '💡',
	[FavoriteEntityType.PROMPT]: '🎯',
	[FavoriteEntityType.NOTE]: '📝',
};

// Mapa de colores por tipo de entidad
const ENTITY_COLORS: Record<string, string> = {
	[FavoriteEntityType.IMAGE]: '#3b82f6',
	[FavoriteEntityType.ALBUM]: '#f97316',
	[FavoriteEntityType.COLLECTION]: '#8b5cf6',
	[FavoriteEntityType.FOLDER]: '#22c55e',
	[FavoriteEntityType.CHARACTER]: '#f43f5e',
	[FavoriteEntityType.PLACE]: '#0ea5e9',
	[FavoriteEntityType.WORLD_ITEM]: '#d946ef',
	[FavoriteEntityType.CONCEPT]: '#fbbf24',
	[FavoriteEntityType.PROMPT]: '#10b981',
	[FavoriteEntityType.NOTE]: '#ef4444',
};

// Mapa de nombres para mostrar por tipo de entidad
const ENTITY_DISPLAY_NAMES: Record<string, string> = {
	[FavoriteEntityType.IMAGE]: 'Imágenes',
	[FavoriteEntityType.ALBUM]: 'Álbumes',
	[FavoriteEntityType.COLLECTION]: 'Colecciones',
	[FavoriteEntityType.FOLDER]: 'Carpetas',
	[FavoriteEntityType.CHARACTER]: 'Personajes',
	[FavoriteEntityType.PLACE]: 'Lugares',
	[FavoriteEntityType.WORLD_ITEM]: 'Objetos',
	[FavoriteEntityType.CONCEPT]: 'Conceptos',
	[FavoriteEntityType.PROMPT]: 'Prompts',
	[FavoriteEntityType.NOTE]: 'Notas',
};

interface TransformFavoriteOptions {
	includeEntityDetails?: boolean;
}

/**
 * Transforma un objeto favorito a su formato base
 */
export function transformFavorite<T extends Record<string, any>>(
	favorite: T,
	options: TransformFavoriteOptions = {}
): FavoriteBase {
	// Valores por defecto para opciones
	const { includeEntityDetails = false } = options;

	// Extraer propiedades básicas
	const id = favorite.id || '';
	const entityId = favorite.entityId || favorite.entity_id || '';
	const entityType = favorite.entityType || favorite.entity_type || '';
	const userId = favorite.userId || favorite.user_id || undefined;

	// Fechas
	const createdAt =
		favorite.createdAt instanceof Date
			? favorite.createdAt
			: new Date(favorite.createdAt || favorite.created_at || Date.now());

	const updatedAt =
		favorite.updatedAt instanceof Date
			? favorite.updatedAt
			: new Date(favorite.updatedAt || favorite.updated_at || Date.now());

	return {
		id,
		entityId,
		entityType,
		userId,
		createdAt,
		updatedAt,
	};
}

/**
 * Transforma un array de favoritos
 */
export function transformFavorites<T extends Record<string, any>>(
	favorites: T[],
	options?: TransformFavoriteOptions
): FavoriteBase[] {
	return favorites.map((favorite) => transformFavorite(favorite, options));
}

/**
 * Transforma un favorito a su versión extendida con propiedades de UI
 */
export function transformFavoriteToExtended<T extends Record<string, any>>(
	favorite: T,
	entityDetails?: Record<string, any>
): FavoriteExtended {
	// Transformar primero a la versión base
	const baseFavorite = transformFavorite(favorite);

	// Extraer las propiedades de UI
	const entityType = baseFavorite.entityType;
	const entityIcon = ENTITY_ICONS[entityType] || '⭐';
	const entityColor = ENTITY_COLORS[entityType] || '#3b82f6';

	// Propiedades de la entidad si están disponibles
	let entityName = favorite.entityName || '';
	let entityPreview = favorite.entityPreview || '';

	// Si se proporcionaron detalles de la entidad, usarlos
	if (entityDetails) {
		entityName = entityDetails.name || entityDetails.title || entityName;
		entityPreview = entityDetails.preview || entityDetails.thumbnail || entityPreview;
	}

	// Propiedades de seguimiento
	const isSelected = !!favorite.isSelected;
	const isHovered = !!favorite.isHovered;

	// Conteos
	const _count = favorite._count || {};

	return {
		...baseFavorite,
		entityName,
		entityPreview,
		entityIcon,
		entityColor,
		isSelected,
		isHovered,
		_count,
	};
}

/**
 * Agrupa favoritos por tipo de entidad
 */
export function groupFavoritesByType(favorites: FavoriteExtended[]): FavoritesByType[] {
	// Crear mapa para agrupar por tipo
	const groupsMap: Record<string, FavoriteExtended[]> = {};

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
 */
export function calculateFavoriteStats(favorites: FavoriteExtended[], recentLimit = 5): FavoriteStats {
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
