/**
 * @file Servicio funcional para la entidad Favorite
 * @module services/favorite
 */

import {
    addToFavorites,
    getFavoriteStats,
    getFavorites,
    isFavorited,
    removeFromFavorites,
    toggleFavorite
} from '@/app/actions/favorites/favorite.actions';
import { serverLogger } from '@/lib/logger/server-logger';
import { transformFavorite, transformFavorites } from '@/transformers/favorite';
import { FavoriteEntityType } from '@/types/entities/favorite';

// Logger específico para el servicio
const logger = serverLogger.child({ module: 'FavoriteService' });

/**
 * Obtiene todos los favoritos
 */
export async function getAllFavorites() {
  try {
    logger.info('📥 Obteniendo todos los favoritos');

    const favoritesData = await getFavorites();
    const favorites = transformFavorites(favoritesData);

    logger.info('✅ Favoritos obtenidos correctamente', { count: favorites.length });
    return favorites;
  } catch (error) {
    logger.error('❌ Error al obtener favoritos:', error);
    throw error;
  }
}

/**
 * Obtiene favoritos filtrados por tipo de entidad
 */
export async function getFavoritesByType(entityType: FavoriteEntityType) {
  try {
    logger.info('📥 Obteniendo favoritos por tipo:', entityType);

    const allFavorites = await getAllFavorites();
    const filtered = allFavorites.filter(favorite => favorite.entityType === entityType);

    logger.info('✅ Favoritos filtrados por tipo obtenidos', {
      type: entityType,
      count: filtered.length
    });

    return filtered;
  } catch (error) {
    logger.error('❌ Error al obtener favoritos por tipo:', error);
    throw error;
  }
}

/**
 * Agrega una entidad a favoritos
 */
export async function addEntityToFavorites(entityId: string, entityType: string) {
  try {
    logger.info('⭐ Agregando entidad a favoritos:', { entityId, entityType });

    const favoriteData = await addToFavorites(entityId, entityType);
    const favorite = transformFavorite(favoriteData);

    logger.info('✅ Entidad agregada a favoritos correctamente', {
      entityId,
      entityType
    });

    return favorite;
  } catch (error) {
    logger.error('❌ Error al agregar a favoritos:', { entityId, entityType, error });
    throw error;
  }
}

/**
 * Elimina una entidad de favoritos
 */
export async function removeEntityFromFavorites(entityId: string, entityType: string) {
  try {
    logger.info('🗑️ Eliminando entidad de favoritos:', { entityId, entityType });

    await removeFromFavorites(entityId, entityType);

    logger.info('✅ Entidad eliminada de favoritos correctamente', {
      entityId,
      entityType
    });

    return true;
  } catch (error) {
    logger.error('❌ Error al eliminar de favoritos:', { entityId, entityType, error });
    throw error;
  }
}

/**
 * Alterna el estado de favorito de una entidad
 */
export async function toggleEntityFavorite(entityId: string, entityType: string) {
  try {
    logger.info('🔄 Alternando estado de favorito:', { entityId, entityType });

    const result = await toggleFavorite(entityId, entityType);

    logger.info('✅ Estado de favorito alternado correctamente', {
      entityId,
      entityType,
      isFavorited: result
    });

    return result;
  } catch (error) {
    logger.error('❌ Error al alternar favorito:', { entityId, entityType, error });
    throw error;
  }
}

/**
 * Verifica si una entidad está en favoritos
 */
export async function checkIfFavorited(entityId: string, entityType: string) {
  try {
    logger.info('🔍 Verificando si entidad está en favoritos:', { entityId, entityType });

    const result = await isFavorited(entityId, entityType);

    logger.info('✅ Verificación de favorito completada', {
      entityId,
      entityType,
      isFavorited: result
    });

    return result;
  } catch (error) {
    logger.error('❌ Error al verificar favorito:', { entityId, entityType, error });
    throw error;
  }
}

/**
 * Obtiene estadísticas de favoritos
 */
export async function getFavoritesStatistics() {
  try {
    logger.info('📊 Obteniendo estadísticas de favoritos');

    const stats = await getFavoriteStats();

    logger.info('✅ Estadísticas de favoritos obtenidas', stats);

    return stats;
  } catch (error) {
    logger.error('❌ Error al obtener estadísticas de favoritos:', error);
    throw error;
  }
}

// Exportar el servicio como objeto único para API consistente
export const favoriteService = {
  getAllFavorites,
  getFavoritesByType,
  addEntityToFavorites,
  removeEntityFromFavorites,
  toggleEntityFavorite,
  checkIfFavorited,
  getFavoritesStatistics
};