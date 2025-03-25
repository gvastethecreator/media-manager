/**
 * @file Serializadores para convertir entre formatos para la entidad Image
 * @module transformers/image/serializers
 */

import {
    type ImageBase,
    type ImageExtended,
    type ImageMetadata,
    type ImageVisualConfigBase,
    type ImageVisualConfigExtended
} from '../../types/entities/image';

/**
 * Serializa los metadatos de una imagen desde string a objeto
 * @param metadata String JSON con los metadatos
 * @returns Objeto tipado de metadatos o undefined si no es válido
 */
export function serializeImageMetadata(metadata: string | null | undefined): ImageMetadata | undefined {
  if (!metadata) return undefined;

  try {
    const parsed = JSON.parse(metadata);
    return parsed as ImageMetadata;
  } catch (error) {
    console.error('Error al serializar metadatos de imagen:', error);
    return undefined;
  }
}

/**
 * Deserializa los metadatos de una imagen a formato string para almacenamiento
 * @param metadata Objeto de metadatos
 * @returns String JSON para almacenamiento en BD
 */
export function deserializeImageMetadata(metadata: ImageMetadata | undefined | null): string | undefined {
  if (!metadata) return undefined;

  try {
    return JSON.stringify(metadata);
  } catch (error) {
    console.error('Error al deserializar metadatos de imagen:', error);
    return undefined;
  }
}

/**
 * Serializa la configuración visual de una imagen desde string a objeto
 * @param config String JSON con la configuración
 * @returns Objeto tipado de configuración o undefined si no es válido
 */
export function serializeImageVisualConfig(
  visualConfig: ImageVisualConfigBase | null | undefined
): ImageVisualConfigExtended | undefined {
  if (!visualConfig) return undefined;

  // Transformar la config básica en extendida
  const extendedConfig: ImageVisualConfigExtended = {
    ...visualConfig,
    effectsEnabled: true, // valor por defecto
  };

  // Procesar campos de tipo string JSON
  if (visualConfig.layerSystem) {
    try {
      extendedConfig.layersConfig = JSON.parse(visualConfig.layerSystem);
    } catch (error) {
      console.error('Error al serializar layerSystem:', error);
    }
  }

  // Procesar campos adicionales si es necesario

  return extendedConfig;
}

/**
 * Convierte una imagen base a un formato extendido con propiedades adicionales
 * @param image Imagen base desde Prisma
 * @returns Imagen extendida con propiedades adicionales
 */
export function extendImage(image: ImageBase): ImageExtended {
  // Crear una copia de la imagen base para modificarla
  const { metadata: rawMetadata, ...rest } = image;

  // Base para la imagen extendida
  const extended: Omit<ImageExtended, 'metadata'> & { metadata?: ImageMetadata } = {
    ...rest,
    hasMetadata: !!rawMetadata,
    hasThumbnail: !!image.thumbnail,
    hasError: !!image.thumbnailError,
    aspectRatio: image.width / image.height,
    // Inicialmente sin metadatos procesados
    metadata: undefined
  };

  // Procesar metadatos si existen
  if (rawMetadata) {
    extended.metadata = serializeImageMetadata(rawMetadata);
  }

  // Generar URLs para acceso a recursos
  extended.thumbnailUrl = `/api/images/${image.id}/thumbnail`;
  extended.fullUrl = `/api/images/${image.id}/full`;

  return extended as ImageExtended;
}

/**
 * Convierte un array de imágenes base a formato extendido
 * @param images Array de imágenes base
 * @returns Array de imágenes extendidas
 */
export function extendImages(images: ImageBase[]): ImageExtended[] {
  return images.map(extendImage);
}