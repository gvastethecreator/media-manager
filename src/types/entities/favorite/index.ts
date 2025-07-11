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
export type {
	FavoriteBase,
	FavoriteStatistics,
	FavoriteWithStats,
} from './base';
// --- Enums ---
export { FavoriteEntityType } from './base';

// --- Tipos adicionales ---
export type {
	FavoriteCreateInput,
	FavoriteFilters,
	FavoriteSearchOptions,
	FavoriteSearchResult,
	FavoriteUpdateInput,
} from './types';
