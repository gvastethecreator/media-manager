/**
 * @file Transformador principal para la entidad Image
 * @module transformers/image/transformer
 */

import { Logger } from '@/lib/logger';
import type { Image, ImageComplete, ImageExtended } from '@/types/entities/image/types';
import { mapImageToComplete } from './mappers';
import { extendImage } from './serializers';

const logger = new Logger('ImageTransformer');

/**
 * 🖼️ Transformador principal para la entidad Image
 * Punto de entrada unificado para transformar objetos Image a diferentes formatos
 *
 * @param image Objeto Image a transformar (puede ser de Prisma, parcial, etc)
 * @returns Objeto ImageComplete con todas las propiedades
 */
export function transformImage(image: any): ImageComplete {
  try {
    // Validar entrada
    if (!image || typeof image !== 'object') {
      logger.warn('⚠️ Intentando transformar un objeto Image inválido:', image);
      throw new Error('Invalid image object');
    }

    // Convertir a formato completo
    const imageComplete = mapImageToComplete(image);

    // Extender con propiedades adicionales
    return extendImage(imageComplete);
  } catch (error) {
    logger.error('❌ Error transformando Image:', error);
    // En caso de error, devolver el objeto original con estructura mínima
    return {
      id: image?.id || 'unknown',
      name: image?.name || 'Unknown Image',
      description: image?.description || '',
      path: image?.path || '',
      hash: image?.hash || '',
      size: image?.size || 0,
      width: image?.width || 0,
      height: image?.height || 0,
      thumbnailPath: image?.thumbnailPath || null,
      thumbnailWidth: image?.thumbnailWidth || 0,
      thumbnailHeight: image?.thumbnailHeight || 0,
      metadata: image?.metadata || null,
      isFavorite: image?.isFavorite || false,
      isPublic: image?.isPublic || false,
      folderId: image?.folderId || null,
      createdAt: image?.createdAt || new Date(),
      updatedAt: image?.updatedAt || new Date(),
      addedAt: image?.addedAt || new Date(),
      folder: image?.folder || null,
      tags: image?.tags || [],
      albums: image?.albums || [],
      collections: image?.collections || [],
      characters: image?.characters || [],
      places: image?.places || [],
      prompts: image?.prompts || [],
      _count: image?._count || {
        tags: 0,
        albums: 0,
        collections: 0,
        characters: 0,
        places: 0,
        prompts: 0,
      }
    };
  }
}

/**
 * 🔄 Transforma un Image a la versión extendida para UI
 *
 * @param image Objeto Image a transformar
 * @param isSelected Estado de selección (opcional)
 * @returns Objeto ImageExtended con propiedades de UI
 */
export function transformImageToExtended(
  image: Image | ImageComplete,
  isSelected = false
): ImageExtended {
  try {
    // Primero asegurar que tenemos un ImageComplete
    const imageComplete = '_count' in image ? image : transformImage(image);

    // Calcular propiedades adicionales para UI
    const hasThumbnail = !!imageComplete.thumbnailPath;
    const thumbnailUrl = hasThumbnail
      ? `/api/images/${imageComplete.id}/thumbnail`
      : null;
    const fullUrl = `/api/images/${imageComplete.id}`;
    const aspectRatio = imageComplete.width && imageComplete.height
      ? imageComplete.width / imageComplete.height
      : 1;
    const parsedMetadata = imageComplete.metadata
      ? (typeof imageComplete.metadata === 'string'
          ? JSON.parse(imageComplete.metadata)
          : imageComplete.metadata)
      : null;

    // Extender con propiedades de UI
    return {
      ...imageComplete,
      isSelected,
      isLoading: false,
      hasError: false,
      isDragging: false,
      isDropTarget: false,
      displayName: imageComplete.name || 'Sin nombre',
      thumbnailUrl,
      fullUrl,
      aspectRatio,
      metadata: parsedMetadata,
      hasThumbnail,
      hasMetadata: !!parsedMetadata,
      isProcessed: true,
    };
  } catch (error) {
    logger.error('❌ Error transformando Image a Extended:', error);
    // Devolver versión básica en caso de error
    return {
      ...image,
      isSelected,
      isLoading: false,
      hasError: true, // Marcamos como error
      isDragging: false,
      isDropTarget: false,
      displayName: image.name || 'Sin nombre',
      thumbnailUrl: null,
      fullUrl: `/api/images/${image.id}`,
      aspectRatio: 1,
      metadata: null,
      hasThumbnail: false,
      hasMetadata: false,
      isProcessed: false,
    } as ImageExtended;
  }
}