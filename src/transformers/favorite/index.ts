/**
 * @file Punto de entrada para transformadores de Favorite
 * @module transformers/favorite
 * ✅ MIGRADO A DRIZZLE - Sin dependencias de Prisma
 */

// Exportaciones de mappers
export { mapToFavoriteBase, mapToFavoriteWithCounts, mapToFavoriteWithStats } from './mappers';

// Exportaciones de serializadores
import { toFavoritesWithImages, toFavoriteWithImage, transformImageToEntityWithStats, transformImageToFileItem } from './serializers';

export {
	toFavoritesWithImages,
	toFavoriteWithImage,
	transformImageToEntityWithStats,
	transformImageToFileItem, // Alias para compatibilidad
};

// Esquemas de validación
export {
	FavoriteCreateInputSchema,
	FavoriteSchema,
	FavoriteUpdateInputSchema,
	FavoriteWithImageSchema,
} from './schema';

// Exportaciones adicionales (si las hay)
export type { FavoriteWithImage } from '@/types/entities/favorite';

// --- Funciones principales para uso externo ---

/**
 * Función principal para transformar datos de favoritos
 * @deprecated Usar transformImageToEntityWithStats directamente
 */
export const transformFavoriteData = {
	/**
	 * @deprecated Usar transformImageToEntityWithStats
	 */
	transformImageToFileItem: transformImageToEntityWithStats,
	transformImageToEntityWithStats: transformImageToEntityWithStats,
	toFavoriteWithImage,
	toFavoritesWithImages,
};
