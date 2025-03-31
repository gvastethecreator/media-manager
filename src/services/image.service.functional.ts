/**
 * @file Servicio de Image con enfoque funcional
 * @module services/image
 * @description Implementación funcional del servicio de imágenes
 */

import {
    createImage as createImageAction,
    deleteImage as deleteImageAction,
    getImage as getImageAction,
    getImages as getImagesAction,
    regenerateThumbnail as regenerateThumbnailAction,
    updateImage as updateImageAction
} from '@/app/actions/images';
import { extractMetadata } from '@/app/actions/metadata';
import { thumbnailCache } from '@/lib/cache';
import { imageConfig } from '@/lib/config';
import { Logger } from '@/lib/logger';
import { emit } from '@/lib/server/events.server';
import type { ImageStats } from '@/types/entities/image/types';
import { ThumbnailQuality } from '@/types/thumbnails';
import { ServiceErrorCode, createServiceError, toServiceError } from '@/utils/errors/service-errors';
import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import sharp from 'sharp';

// Logger específico para el servicio de imágenes
const imageLogger = new Logger('ImageService');

// Constantes
const CACHE_DIR = '.image-cache';
const SUPPORTED_FORMATS = imageConfig.processing.supportedFormats;
const THUMBNAIL_QUALITY_CONFIG = imageConfig.thumbnail.qualities;

// Eventos que puede emitir el servicio de imágenes
export enum IMAGE_EVENTS {
  PROGRESS = 'image:progress',
  ERROR = 'image:error',
  COMPLETE = 'image:complete',
  STATS = 'image:stats',
  IMAGE_CREATED = 'image:created',
  IMAGE_UPDATED = 'image:updated',
  IMAGE_DELETED = 'image:deleted',
  IMAGES_CHANGED = 'images:changed',
  THUMBNAIL_GENERATED = 'image:thumbnail:generated',
  METADATA_UPDATED = 'image:metadata:updated',
}

// Tipos
export type { ThumbnailQuality };

export type CreateImageInput = {
  name: string;
  path: string;
  size: number;
  width: number;
  height: number;
  hash: string;
  folderId: string;
  metadata?: Record<string, string | number | boolean | string[] | null | undefined>;
  isPublic?: boolean;
};

export type ImageProcessingOptions = {
  quality?: number;
  width?: number;
  height?: number;
  format?: 'webp' | 'jpeg' | 'png';
  fit?: 'cover' | 'contain' | 'inside' | 'outside';
  type?: string;
};

// Tipos para los callbacks
type ProgressCallback = (status: { message: string; progress: number }) => void;
type ErrorCallback = (error: Error) => void;
type CompleteCallback = (data: unknown) => void;
type StatsCallback = (stats: ImageStats) => void;

// 📊 Estado interno del servicio
type ServiceState = {
  operationsInProgress: Map<string, boolean>;
  globalProgress: Map<string, { message: string; progress: number }>;
  startTimes: Map<string, number>;
  eventCallbacks: Map<string, Set<CallableFunction>>;
};

// Estado inicial
const state: ServiceState = {
  operationsInProgress: new Map(),
  globalProgress: new Map(),
  startTimes: new Map(),
  eventCallbacks: new Map(),
};

// 🛠️ Funciones auxiliares internas

/**
 * Añade un callback para un evento específico
 * @param event Nombre del evento
 * @param callback Función a ejecutar cuando ocurra el evento
 */
const addCallback = (event: string, callback: CallableFunction): void => {
  if (!state.eventCallbacks.has(event)) {
    state.eventCallbacks.set(event, new Set());
  }
  state.eventCallbacks.get(event)?.add(callback);
  imageLogger.debug(`🎧 Callback registrado para evento ${event}`);
};

/**
 * Elimina un callback para un evento específico
 * @param event Nombre del evento
 * @param callback Función a eliminar
 */
const removeCallback = (event: string, callback: CallableFunction): void => {
  state.eventCallbacks.get(event)?.delete(callback);
  imageLogger.debug(`🛑 Callback eliminado para evento ${event}`);
};

/**
 * Emite un evento a todos los callbacks registrados y al sistema central
 * @param event Nombre del evento
 * @param args Argumentos a pasar al callback
 */
const emitEvent = async (event: string, ...args: unknown[]): Promise<void> => {
  try {
    // Obtener los callbacks para este evento
    const callbacks = state.eventCallbacks.get(event);
    if (callbacks && callbacks.size > 0) {
      // Invocar cada callback
      for (const callback of callbacks) {
        try {
          if (typeof callback === 'function') {
            await callback(...args);
          }
        } catch (error) {
          imageLogger.error(`Error en callback de evento ${event}:`, error);
        }
      }
    }

    // Mapeo de eventos locales a eventos del sistema central
    let serverEventType: string | null = null;
    switch (event) {
      case IMAGE_EVENTS.PROGRESS:
        serverEventType = 'images:progress';
        break;
      case IMAGE_EVENTS.ERROR:
        serverEventType = 'images:error';
        break;
      case IMAGE_EVENTS.COMPLETE:
        serverEventType = 'images:complete';
        break;
      case IMAGE_EVENTS.STATS:
        serverEventType = 'images:stats';
        break;
      case IMAGE_EVENTS.IMAGE_CREATED:
      case IMAGE_EVENTS.IMAGE_UPDATED:
      case IMAGE_EVENTS.IMAGE_DELETED:
      case IMAGE_EVENTS.IMAGES_CHANGED:
      case IMAGE_EVENTS.THUMBNAIL_GENERATED:
      case IMAGE_EVENTS.METADATA_UPDATED:
        serverEventType = 'images:modified';
        break;
      default:
        serverEventType = null;
    }

    // Emitir al sistema central si hay mapeo
    if (serverEventType) {
      try {
        await emit({
          type: serverEventType,
          data: args[0],
        });
        imageLogger.debug(`Evento ${event} emitido al sistema central como ${serverEventType}`);
      } catch (emitError) {
        imageLogger.error(`Error al emitir evento ${event} al sistema central:`, emitError);
      }
    }
  } catch (error) {
    imageLogger.error(`Error emitiendo evento ${event}:`, error);
  }
};

/**
 * Control de concurrencia para operaciones asíncronas
 * @param operation Identificador único de la operación
 * @param fn Función a ejecutar
 * @returns Resultado de la función
 */
const withConcurrencyControl = async <T>(operation: string, fn: () => Promise<T>): Promise<T> => {
  if (state.operationsInProgress.get(operation)) {
    throw createServiceError({
      code: ServiceErrorCode.OPERATION_IN_PROGRESS,
      message: `Operación ${operation} en progreso`,
      serviceName: 'ImageService'
    });
  }

  state.operationsInProgress.set(operation, true);
  try {
    return await fn();
  } finally {
    state.operationsInProgress.set(operation, false);
  }
};

/**
 * Asegura que el directorio de caché exista
 */
const ensureCacheDir = async (): Promise<void> => {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  } catch (error) {
    throw toServiceError(error, {
      code: ServiceErrorCode.FILE_WRITE_ERROR,
      message: 'Error al crear directorio de caché',
      serviceName: 'ImageService'
    });
  }
};

/**
 * Genera una clave de caché única para una imagen y opciones de procesamiento
 */
const getCacheKey = (filePath: string, options: ImageProcessingOptions): string => {
  const hash = createHash('md5');
  hash.update(filePath + JSON.stringify(options));
  return hash.digest('hex');
};

/**
 * Procesa una imagen según las opciones especificadas
 */
const processImage = async (
  inputPath: string,
  options: ImageProcessingOptions = {}
): Promise<{ buffer: Buffer; metadata: sharp.OutputInfo }> => {
  try {
    let pipeline = sharp(inputPath);
    const metadata = await pipeline.metadata();

    // Verificar que los valores de ancho y alto existen antes de usarlos
    const width = metadata.width ?? 0;
    const height = metadata.height ?? 0;

    if (options.width || options.height) {
      const aspectRatio = width > 0 && height > 0 ? width / height : 1;
      let targetWidth = options.width;
      let targetHeight = options.height;

      if (aspectRatio > 1 && targetWidth) {
        targetHeight = Math.round(targetWidth / aspectRatio);
      } else if (targetHeight) {
        targetWidth = Math.round(targetHeight * aspectRatio);
      }

      pipeline = pipeline.resize(targetWidth, targetHeight, {
        fit: options.fit || 'cover',
        withoutEnlargement: true,
      });
    }

    if (options.format === 'webp') {
      pipeline = pipeline.webp({
        quality: options.quality || 80,
        effort: 4,
        nearLossless: true,
      });
    } else if (options.format === 'jpeg') {
      pipeline = pipeline.jpeg({
        quality: options.quality || 80,
        progressive: true,
      });
    } else if (options.format === 'png') {
      pipeline = pipeline.png({
        progressive: true,
        compressionLevel: 9,
      });
    }

    const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });
    return { buffer: data, metadata: info };
  } catch (error) {
    throw toServiceError(error, {
      code: ServiceErrorCode.FILE_READ_ERROR,
      message: 'Error al procesar imagen',
      context: { inputPath, options },
      serviceName: 'ImageService'
    });
  }
};

/**
 * Genera el nombre del archivo del thumbnail
 */
const getThumbnailFilename = (imageId: string, quality: ThumbnailQuality): string => {
  return `${imageId}_${quality}.webp`;
};

/**
 * Genera la ruta completa del thumbnail
 */
const getThumbnailPath = (imageId: string, quality: ThumbnailQuality): string => {
  return path.join(CACHE_DIR, getThumbnailFilename(imageId, quality));
};

/**
 * Genera un thumbnail para una imagen
 */
const generateThumbnail = async (
  imageId: string,
  imagePath: string,
  quality: ThumbnailQuality
): Promise<string> => {
  await ensureCacheDir();

  const thumbnailPath = getThumbnailPath(imageId, quality);
  const qualityConfig = THUMBNAIL_QUALITY_CONFIG[quality];

  try {
    // Verificar si el thumbnail ya existe
    try {
      await fs.access(thumbnailPath);
      imageLogger.debug(`Thumbnail existente: ${thumbnailPath}`);
      return thumbnailPath;
    } catch {
      // El thumbnail no existe, generarlo
    }

    // Procesar la imagen
    const { buffer } = await processImage(imagePath, {
      width: qualityConfig.width,
      format: 'webp',
      quality: qualityConfig.quality,
    });

    // Guardar el thumbnail
    await fs.writeFile(thumbnailPath, buffer);

    // Emitir evento
    await emitEvent(IMAGE_EVENTS.THUMBNAIL_GENERATED, { id: imageId, quality });

    // Actualizar caché
    thumbnailCache.set(`thumb_${imageId}_${quality}`, thumbnailPath);

    return thumbnailPath;
  } catch (error) {
    throw toServiceError(error, {
      code: ServiceErrorCode.FILE_WRITE_ERROR,
      message: 'Error al generar thumbnail',
      context: { imageId, quality },
      serviceName: 'ImageService'
    });
  }
};

// 🌍 API Pública del Servicio

/**
 * 📷 Obtiene una imagen por su ID
 */
export const getImageById = async (id: string) => {
  try {
    return await getImageAction(id);
  } catch (error) {
    imageLogger.error(`Error al obtener imagen ${id}:`, error);
    throw toServiceError(error, {
      code: ServiceErrorCode.GET_ENTITY_ERROR,
      message: `Error al obtener imagen con ID ${id}`,
      serviceName: 'ImageService',
      context: { id }
    });
  }
};

/**
 * 📷 Obtiene múltiples imágenes según criterios
 */
export const getImages = async (options: any) => {
  try {
    return await getImagesAction(options);
  } catch (error) {
    imageLogger.error('Error al obtener imágenes:', error);
    throw toServiceError(error, {
      code: ServiceErrorCode.GET_ENTITY_ERROR,
      message: 'Error al obtener imágenes',
      serviceName: 'ImageService',
      context: { options }
    });
  }
};

/**
 * ✨ Crea una nueva imagen
 */
export const createImage = async (data: CreateImageInput) => {
  return withConcurrencyControl(`create-image:${data.path}`, async () => {
    try {
      // Extraer metadatos si no se proporcionaron
      if (!data.metadata) {
        const metadataResult = await extractMetadata(data.path);
        if (metadataResult.success && metadataResult.metadata) {
          data.metadata = metadataResult.metadata;
        }
      }

      // Crear la imagen usando la server action
      const result = await createImageAction({
        name: data.name,
        path: data.path,
        size: data.size,
        width: data.width,
        height: data.height,
        hash: data.hash,
        folderId: data.folderId,
        metadata: data.metadata,
        isPublic: data.isPublic ?? false
      });

      if (result.error) {
        throw new Error(result.error);
      }

      // Generar thumbnails en segundo plano (sin esperar)
      if (result.image) {
        for (const quality of Object.values(ThumbnailQuality)) {
          generateThumbnail(result.image.id, data.path, quality).catch(err => {
            imageLogger.error(`Error generando thumbnail para ${result.image.id}:`, err);
          });
        }
      }

      // Emitir evento
      if (result.image) {
        await emitEvent(IMAGE_EVENTS.IMAGE_CREATED, result.image);
      }

      return result;
    } catch (error) {
      imageLogger.error('Error al crear imagen:', error);
      throw toServiceError(error, {
        code: ServiceErrorCode.CREATE_ENTITY_ERROR,
        message: 'Error al crear imagen',
        serviceName: 'ImageService',
        context: { data }
      });
    }
  });
};

/**
 * 🔄 Actualiza una imagen existente
 */
export const updateImage = async (id: string, data: any) => {
  return withConcurrencyControl(`update-image:${id}`, async () => {
    try {
      const result = await updateImageAction(id, data);

      if (result.error) {
        throw new Error(result.error);
      }

      // Emitir evento
      if (result.image) {
        await emitEvent(IMAGE_EVENTS.IMAGE_UPDATED, result.image);
      }

      return result;
    } catch (error) {
      imageLogger.error(`Error al actualizar imagen ${id}:`, error);
      throw toServiceError(error, {
        code: ServiceErrorCode.UPDATE_ENTITY_ERROR,
        message: `Error al actualizar imagen con ID ${id}`,
        serviceName: 'ImageService',
        context: { id, data }
      });
    }
  });
};

/**
 * 🗑️ Elimina una imagen
 */
export const deleteImage = async (id: string) => {
  return withConcurrencyControl(`delete-image:${id}`, async () => {
    try {
      const result = await deleteImageAction(id);

      if (result.error) {
        throw new Error(result.error);
      }

      // Eliminar thumbnails
      try {
        for (const quality of Object.values(ThumbnailQuality)) {
          const thumbnailPath = getThumbnailPath(id, quality);
          try {
            await fs.unlink(thumbnailPath);
            // Actualizar caché
            thumbnailCache.delete(`thumb_${id}_${quality}`);
          } catch (error) {
            // Ignorar errores si el archivo no existe
            imageLogger.debug(`Error al eliminar thumbnail ${thumbnailPath}:`, error);
          }
        }
      } catch (error) {
        imageLogger.error(`Error al eliminar thumbnails para ${id}:`, error);
      }

      // Emitir evento
      await emitEvent(IMAGE_EVENTS.IMAGE_DELETED, { id });

      return result;
    } catch (error) {
      imageLogger.error(`Error al eliminar imagen ${id}:`, error);
      throw toServiceError(error, {
        code: ServiceErrorCode.DELETE_ENTITY_ERROR,
        message: `Error al eliminar imagen con ID ${id}`,
        serviceName: 'ImageService',
        context: { id }
      });
    }
  });
};

/**
 * 🔄 Regenera los thumbnails de una imagen
 */
export const regenerateThumbnail = async (imageId: string, quality?: ThumbnailQuality) => {
  return withConcurrencyControl(`regenerate-thumbnail:${imageId}:${quality || 'all'}`, async () => {
    try {
      // Obtener la imagen para acceder a su ruta
      const imageResult = await getImageById(imageId);

      if (!imageResult || !imageResult.image) {
        throw new Error(`Imagen con ID ${imageId} no encontrada`);
      }

      const image = imageResult.image;

      if (quality) {
        // Regenerar un thumbnail específico
        await generateThumbnail(imageId, image.path, quality);
      } else {
        // Regenerar todos los thumbnails
        await Promise.all(
          Object.values(ThumbnailQuality).map(q =>
            generateThumbnail(imageId, image.path, q)
          )
        );
      }

      // También podemos usar la server action para mayor compatibilidad
      const result = await regenerateThumbnailAction(imageId, quality);

      return result;
    } catch (error) {
      imageLogger.error(`Error al regenerar thumbnails para ${imageId}:`, error);
      throw toServiceError(error, {
        code: ServiceErrorCode.PROCESSING_ERROR,
        message: `Error al regenerar thumbnails para imagen con ID ${imageId}`,
        serviceName: 'ImageService',
        context: { imageId, quality }
      });
    }
  });
};

/**
 * 📊 Registrar callbacks para eventos
 */
export const onProgress = (callback: ProgressCallback) => {
  addCallback(IMAGE_EVENTS.PROGRESS, callback);
  return () => removeCallback(IMAGE_EVENTS.PROGRESS, callback);
};

export const onError = (callback: ErrorCallback) => {
  addCallback(IMAGE_EVENTS.ERROR, callback);
  return () => removeCallback(IMAGE_EVENTS.ERROR, callback);
};

export const onComplete = (callback: CompleteCallback) => {
  addCallback(IMAGE_EVENTS.COMPLETE, callback);
  return () => removeCallback(IMAGE_EVENTS.COMPLETE, callback);
};

export const onStats = (callback: StatsCallback) => {
  addCallback(IMAGE_EVENTS.STATS, callback);
  return () => removeCallback(IMAGE_EVENTS.STATS, callback);
};

export const onImageCreated = (callback: CallableFunction) => {
  addCallback(IMAGE_EVENTS.IMAGE_CREATED, callback);
  return () => removeCallback(IMAGE_EVENTS.IMAGE_CREATED, callback);
};

export const onImageUpdated = (callback: CallableFunction) => {
  addCallback(IMAGE_EVENTS.IMAGE_UPDATED, callback);
  return () => removeCallback(IMAGE_EVENTS.IMAGE_UPDATED, callback);
};

export const onImageDeleted = (callback: CallableFunction) => {
  addCallback(IMAGE_EVENTS.IMAGE_DELETED, callback);
  return () => removeCallback(IMAGE_EVENTS.IMAGE_DELETED, callback);
};

export const onImagesChanged = (callback: CallableFunction) => {
  addCallback(IMAGE_EVENTS.IMAGES_CHANGED, callback);
  return () => removeCallback(IMAGE_EVENTS.IMAGES_CHANGED, callback);
};

export const onThumbnailGenerated = (callback: CallableFunction) => {
  addCallback(IMAGE_EVENTS.THUMBNAIL_GENERATED, callback);
  return () => removeCallback(IMAGE_EVENTS.THUMBNAIL_GENERATED, callback);
};

export const onMetadataUpdated = (callback: CallableFunction) => {
  addCallback(IMAGE_EVENTS.METADATA_UPDATED, callback);
  return () => removeCallback(IMAGE_EVENTS.METADATA_UPDATED, callback);
};

// Inicialización
ensureCacheDir().catch(err => {
  imageLogger.error('Error al inicializar directorio de caché:', err);
});