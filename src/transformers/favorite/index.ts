/**
 * @file Punto de entrada para transformadores de Favorite
 * @module transformers/favorite
 * ✅ MIGRADO A DRIZZLE
 */

export {
	toFavoriteExtended,
	toFavoritesExtended,
	mapFavoriteFiltersToDrizzle,
	mapCreateFavoriteDataToDrizzle,
	mapUpdateFavoriteDataToDrizzle,
	groupFavoritesByType,
	// Alias para compatibilidad, marcados como deprecated
	mapFavoriteFiltersToPrisma,
	mapCreateFavoriteDataToPrisma,
	mapUpdateFavoriteDataToPrisma,
} from './mappers';

export { fromDrizzleFavorite, fromDrizzleFavorites, toFavoriteWithStats } from './transformer';

// TODO: Revisar y migrar esquemas de validación
// export { FavoriteCreateInputSchema, FavoriteUpdateInputSchema } from './schema';
