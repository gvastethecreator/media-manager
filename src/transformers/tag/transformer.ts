/**
 * @file Transformador principal para la entidad Tag
 * @module transformers/tag/transformer
 */

import { Logger } from '@/lib/logger';
import type {
    Tag,
    TagComplete,
    TagExtended,
    TagWithStats
} from '@/types/entities/tag/types';
import { extendTag } from './serializers';
import { mapTagToComplete } from './v2/converters';

const logger = new Logger('TagTransformer');

/**
 * 🏷️ Transformador principal para la entidad Tag
 * Punto de entrada unificado para transformar objetos Tag a diferentes formatos
 *
 * @param tag Objeto Tag a transformar (puede ser de Prisma, parcial, etc)
 * @returns Objeto TagComplete con todas las propiedades
 */
export function transformTag(tag: any): TagComplete {
  try {
    // Validar entrada
    if (!tag || typeof tag !== 'object') {
      logger.warn('⚠️ Intentando transformar un objeto Tag inválido:', tag);
      throw new Error('Invalid tag object');
    }

    // Convertir a formato completo
    const tagComplete = mapTagToComplete(tag);

    // Extender con propiedades adicionales
    return extendTag(tagComplete);
  } catch (error) {
    logger.error('❌ Error transformando Tag:', error);
    // En caso de error, devolver el objeto original con estructura mínima
    return {
      id: tag?.id || 'unknown',
      name: tag?.name || 'Unknown Tag',
      emoji: tag?.emoji || '🏷️',
      color: tag?.color || '#3b82f6',
      description: tag?.description || '',
      shortcut: tag?.shortcut || null,
      category: tag?.category || 'general',
      featuredImage: tag?.featuredImage || null,
      isFavorite: tag?.isFavorite || false,
      createdAt: tag?.createdAt || new Date(),
      updatedAt: tag?.updatedAt || new Date(),
      images: tag?.images || [],
      albums: tag?.albums || [],
      _count: tag?._count || {
        images: 0,
        videos: 0,
        albums: 0,
        collections: 0
      }
    };
  }
}

/**
 * 🔄 Transforma un Tag a la versión extendida para UI
 *
 * @param tag Objeto Tag a transformar
 * @param isSelected Estado de selección (opcional)
 * @returns Objeto TagExtended con propiedades de UI
 */
export function transformTagToExtended(
  tag: Tag | TagComplete,
  isSelected = false
): TagExtended {
  try {
    // Primero asegurar que tenemos un TagComplete
    const tagComplete = '_count' in tag ? tag : transformTag(tag);

    // Extender con propiedades de UI
    return {
      ...tagComplete,
      isSelected,
      isLoading: false,
      hasError: false,
      isDragging: false,
      isDropTarget: false
    };
  } catch (error) {
    logger.error('❌ Error transformando Tag a Extended:', error);
    // Devolver versión básica en caso de error
    return {
      ...tag,
      isSelected,
      isLoading: false,
      hasError: true, // Marcamos como error
      isDragging: false,
      isDropTarget: false
    } as TagExtended;
  }
}

/**
 * 📊 Transforma un Tag a la versión con estadísticas
 *
 * @param tag Objeto Tag a transformar
 * @returns Objeto TagWithStats con estadísticas adicionales
 */
export function transformTagToWithStats(
  tag: Tag | TagComplete
): TagWithStats {
  try {
    // Primero asegurar que tenemos un TagComplete
    const tagComplete = '_count' in tag ? tag : transformTag(tag);

    // Calcular estadísticas
    const totalItems =
      (tagComplete._count?.images || 0) +
      (tagComplete._count?.videos || 0) +
      (tagComplete._count?.albums || 0) +
      (tagComplete._count?.collections || 0) +
      (tagComplete._count?.characters || 0) +
      (tagComplete._count?.places || 0);

    // Devolver con estadísticas
    return {
      ...tagComplete,
      stats: {
        totalItems,
        totalImages: tagComplete._count?.images || 0,
        totalVideos: tagComplete._count?.videos || 0,
        totalAlbums: tagComplete._count?.albums || 0,
        totalCollections: tagComplete._count?.collections || 0,
        totalCharacters: tagComplete._count?.characters || 0,
        totalPlaces: tagComplete._count?.places || 0,
        lastUsed: null // Esto podría calcularse con lógica adicional
      }
    };
  } catch (error) {
    logger.error('❌ Error transformando Tag a WithStats:', error);
    // Devolver versión básica en caso de error
    return {
      ...tag,
      stats: {
        totalItems: 0,
        totalImages: 0,
        totalVideos: 0,
        totalAlbums: 0,
        totalCollections: 0,
        totalCharacters: 0,
        totalPlaces: 0,
        lastUsed: null
      }
    } as TagWithStats;
  }
}