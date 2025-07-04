/**
 * @file Punto de entrada para los transformadores de la entidad Favorite.
 * @module transformers/favorite
 * @description Exporta funciones de transformación, validación y serialización para Favorite.
 * ✅ MIGRADO A DRIZZLE - Enero 2025
 */

// --- Transformadores principales ---
export {
	toFavoriteWithStats,
	toFavoriteWithStatsList,
	groupFavoritesByType,
	getFavoritesSummary,
} from './mappers';

// --- Serializadores ---
export {
	serializeFavoriteBase,
	serializeFavoriteWithStats,
	serializeFavoriteList,
	serializeFavoriteGroupedStats,
	serializeFavoritesSummary,
} from './serializers';

// --- Validadores y esquemas ---
export {
	favoriteBaseSchema,
	favoriteStatisticsSchema,
	favoriteWithStatsSchema,
	favoriteCreateSchema,
	favoriteUpdateSchema,
	favoriteSearchSchema,
	favoriteGroupByTypeSchema,
	type FavoriteBase,
	type FavoriteStatistics,
	type FavoriteWithStats,
	type FavoriteCreateInput,
	type FavoriteUpdateInput,
	type FavoriteSearchInput,
	type FavoriteGroupByType,
} from './validators';

// --- Schema de Drizzle ---
export {
	favoritesTable,
	favoriteEntityTypeEnum,
	type FavoriteSchema,
	type FavoriteInsert,
} from './schema';
