/**
 * @file Transformadores para la entidad Favorite
 * @module transformers/favorite/transformer
 * @description 🚨 Migración: Todos los tipos y enums se importan desde '@/types/entities/favorite/types'.
 * No usar ni importar tipos de base.ts o extended.ts (eliminados).
 
 */

import { EntityStats } from '@/types/entities/entity.types';
import {
	FAVORITE_ENTITY_COLORS as ENTITY_COLORS,
	FAVORITE_ENTITY_EMOJIS as ENTITY_ICONS,
	FavoriteEntityType,
	FavoriteStats,
	FavoriteWithStats,
} from '@/types/entities/favorite/base';

// Tipos auxiliares locales (no existen en barrel canónico)
interface FavoriteComplete extends FavoriteWithStats {}
interface FavoritesByType {
	entityType: FavoriteEntityType;
	favorites: FavoriteComplete[];
}

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
	// (Futuro) usar includeEntityDetails para enriquecer con datos de la entidad
	const baseStats: EntityStats = {
		imageCount: 0,
		videoCount: 0,
		albumCount: 0,
		collectionCount: 0,
		tagCount: 0,
		characterCount: 0,
		placeCount: 0,
		worldItemCount: 0,
		conceptCount: 0,
		promptCount: 0,
		noteCount: 0,
		wildcardCount: 0,
		propertyCount: 0,
		groupCount: 0,
		totalItems: 1,
		totalAssociations: 0,
		lastUpdated: favorite.updatedAt,
		size: 0,
		mtime: favorite.updatedAt,
		birthtime: favorite.createdAt,
		type: 'favorite',
	};

	const stats: FavoriteStats = {
		...baseStats,
		entityTypeName: favorite.entityType,
		formattedCreatedAt: favorite.createdAt.toISOString(),
		daysSinceFavorited: 0,
		isRecent: true,
		isOld: false,
	};

	return {
		id: favorite.id,
		entityId: favorite.entityId,
		entityType: favorite.entityType as FavoriteEntityType,
		userId: null,
		profileId: favorite.profileId,
		addedAt: favorite.createdAt,
		notes: null,
		category: null,
		priority: null,
		createdAt: favorite.createdAt,
		updatedAt: favorite.updatedAt,
		stats,
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
	const map = new Map<FavoriteEntityType, FavoriteComplete[]>();
	for (const fav of favorites) {
		const arr = map.get(fav.entityType);
		if (arr) {
			arr.push(fav);
		} else {
			map.set(fav.entityType, [fav]);
		}
	}
	return Array.from(map.entries()).map(([entityType, favorites]) => ({ entityType, favorites }));
}

/**
 * Calcula estadísticas para favoritos
 * ✅ MIGRADO A DRIZZLE
 */
// Devuelve estadísticas agregadas simples tomando el primero como base (placeholder hasta cálculo real)
export function calculateFavoriteStats(favorites: FavoriteComplete[]): FavoriteStats {
	if (favorites.length === 0) {
		const now = new Date();
		return {
			imageCount: 0,
			videoCount: 0,
			albumCount: 0,
			collectionCount: 0,
			tagCount: 0,
			characterCount: 0,
			placeCount: 0,
			worldItemCount: 0,
			conceptCount: 0,
			promptCount: 0,
			noteCount: 0,
			wildcardCount: 0,
			propertyCount: 0,
			groupCount: 0,
			totalItems: 0,
			totalAssociations: 0,
			lastUpdated: now,
			size: 0,
			mtime: now,
			birthtime: now,
			type: 'favorite',
			entityTypeName: 'favorite',
			formattedCreatedAt: now.toISOString(),
			daysSinceFavorited: 0,
			isRecent: false,
			isOld: false,
		};
	}
	// Usa stats del primero como base (homogeneizar luego si se requiere agregación real)
	return favorites[0].stats;
}
