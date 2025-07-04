/**
 * @file Punto de entrada para los transformadores de la entidad Favorite.
 * @module transformers/favorite
 * @description Exporta funciones de transformación, validación y serialización para Favorite.
 * ✅ MIGRADO A DRIZZLE - Enero 2025
 */

// --- Transformadores principales ---
export {
	getFavoritesSummary,
	groupFavoritesByType,
	toFavoriteWithStats,
	toFavoriteWithStatsList,
} from './mappers';
// --- Schema de Drizzle ---
export {
	type FavoriteInsert,
	type FavoriteSchema,
	favoriteEntityTypeEnum,
	favoritesTable,
} from './schema';
// --- Serializadores ---
export {
	serializeFavoriteBase,
	serializeFavoriteGroupedStats,
	serializeFavoriteList,
	serializeFavoritesSummary,
	serializeFavoriteWithStats,
} from './serializers';
// --- Validadores y esquemas ---
export {
	type FavoriteBase,
	type FavoriteCreateInput,
	type FavoriteGroupByType,
	type FavoriteSearchInput,
	type FavoriteStatistics,
	type FavoriteUpdateInput,
	type FavoriteWithStats,
	favoriteBaseSchema,
	favoriteCreateSchema,
	favoriteGroupByTypeSchema,
	favoriteSearchSchema,
	favoriteStatisticsSchema,
	favoriteUpdateSchema,
	favoriteWithStatsSchema,
} from './validators';
