/**
 * @file Exportaciones principales de tipos para la entidad Favorite.
 * @module types/entities/favorite
 * @description
 *   Este archivo centraliza las exportaciones de tipos para la entidad Favorite.
 *   El tipo canónico para usar en la aplicación es **`FavoriteWithStats`**.
 *
 *   - `FavoriteBase`: Tipo base desde Drizzle.
 *   - `FavoriteStatistics`: Estadísticas calculadas.
 *   - `FavoriteWithStats`: Tipo enriquecido con estadísticas (CANÓNICO).
 *
 * @see /src/types/entities/favorite/base.ts
 * ✅ MIGRADO A DRIZZLE - Enero 2025
 */

// --- Tipos Canónicos ---
export type { CanonicalFavoriteEntityType, FavoriteBase, FavoriteStatistics, FavoriteWithStats } from './base';
// --- Enums ---
export {
	CANONICAL_FAVORITE_ENTITY_TYPES,
	FAVORITE_ENTITY_COLORS,
	FAVORITE_ENTITY_DISPLAY_NAMES,
	FAVORITE_ENTITY_EMOJIS,
	FavoriteEntityType,
	getFavoriteEntityDisplayName,
	isCanonicalFavoriteEntityType,
} from './base';

// --- Tipos adicionales ---
export type {
	CreateFavoriteData,
	FavoriteComplete,
	FavoriteCreateInput,
	FavoriteExtended,
	FavoriteFilters,
	FavoriteStats,
	FavoriteSearchOptions,
	FavoriteSearchResult,
	FavoritesByType,
	FavoriteUpdateInput,
	FavoriteWithImage,
} from './types';
