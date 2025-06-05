/**
 * @file Punto de entrada para transformadores de Favorite
 * @module transformers/favorite
 */

// Importar explícitamente lo necesario de cada módulo
import {
	groupFavoritesByType as groupFavoritesByTypeMapper, // Renombrar si es necesario
	mapCreateFavoriteDataToPrisma,
	mapUpdateFavoriteDataToPrisma,
	toFavoriteExtended,
} from './mappers';

import { toFavoriteWithImage, toFavoritesWithImages, transformImageToFileItem } from './serializers';

import {
	calculateFavoriteStats, // Renombrar si es necesario
	transformFavorite,
	transformFavoriteToExtended,
	transformFavorites,
} from './transformer';

// Re-exportar explícitamente para controlar qué se expone
export {
	calculateFavoriteStats,
	// Exportar uno de los groupFavoritesByType, el que sea el principal
	groupFavoritesByTypeMapper as groupFavoritesByType,
	mapCreateFavoriteDataToPrisma,
	mapUpdateFavoriteDataToPrisma,
	toFavoriteExtended,
	toFavoriteWithImage,
	toFavoritesWithImages,
	transformFavorite,
	transformFavoriteToExtended,
	transformFavorites,
	transformImageToFileItem,
};

// Mantener el objeto agregado para posible compatibilidad,
// pero asegurándose de que las funciones existan.
// Nota: fromPrisma/toPrisma/toExtendedSerializer NO existen en serializers.ts
export const favoriteTransformer = {
	transform: transformFavorite,
	transformMany: transformFavorites,
	toExtended: transformFavoriteToExtended,
	// Usar el mapper o el transformer según corresponda
	groupByType: groupFavoritesByTypeMapper,
	calculateStats: calculateFavoriteStats,
	// Eliminar referencias a funciones inexistentes en serializers
	// fromPrisma: serializerFunctions.fromPrismaFavorite, // No existe
	// toPrisma: serializerFunctions.toPrismaFavorite, // No existe
	// toExtendedSerializer: serializerFunctions.toExtendedFavorite, // No existe
	mapCreateData: mapCreateFavoriteDataToPrisma,
	mapUpdateData: mapUpdateFavoriteDataToPrisma,
	// Añadir las que sí existen en serializers si son relevantes aquí
	toFavoriteWithImage: toFavoriteWithImage,
	toFavoritesWithImages: toFavoritesWithImages,
	transformImageToFileItem: transformImageToFileItem,
};

// Exportar por defecto el objeto agregado
export default favoriteTransformer;
