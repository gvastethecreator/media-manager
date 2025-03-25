/**
 * @file Mappers para transformar entre diferentes formatos de la entidad Image
 * @module transformers/image/mappers
 */

import type {
    CreateImageData,
    ImageBase,
    ImageExtended,
    ImageMetadata,
    ImageSummary,
    UpdateImageData
} from '../../types/entities/image';
import { deserializeImageMetadata, serializeImageMetadata } from './serializers';

/**
 * Mapea una imagen extendida a un resumen para listados
 * @param image Imagen completa
 * @returns Resumen básico de la imagen
 */
export function mapToImageSummary(image: ImageBase | ImageExtended): ImageSummary {
  return {
    id: image.id,
    name: image.name,
    path: image.path,
    folderId: image.folderId,
    hash: image.hash,
    size: image.size,
    width: image.width,
    height: image.height,
    thumbnailWidth: image.thumbnailWidth,
    thumbnailHeight: image.thumbnailHeight,
    createdAt: image.createdAt,
    updatedAt: image.updatedAt
  };
}

/**
 * Mapea un array de imágenes a un array de resúmenes
 * @param images Array de imágenes
 * @returns Array de resúmenes de imágenes
 */
export function mapToImageSummaries(images: (ImageBase | ImageExtended)[]): ImageSummary[] {
  return images.map(mapToImageSummary);
}

/**
 * Prepara los datos de imagen para creación en la base de datos
 * @param data Datos de creación
 * @returns Objeto preparado para inserción en BD
 */
export function mapCreateImageDataToPrisma(data: CreateImageData): Record<string, unknown> {
  const result: Record<string, unknown> = {
    name: data.name,
    path: data.path,
    folderId: data.folderId,
    hash: data.hash,
    size: data.size,
    width: data.width,
    height: data.height,
  };

  if (data.description) {
    result.description = data.description;
  }

  if (data.presetId) {
    result.presetId = data.presetId;
  }

  // Serializar metadata si existe
  if (data.metadata) {
    if (typeof data.metadata === 'string') {
      result.metadata = data.metadata;
    } else {
      result.metadata = JSON.stringify(data.metadata);
    }
  }

  return result;
}

/**
 * Prepara los datos de actualización para la base de datos
 * @param data Datos de actualización
 * @returns Objeto preparado para actualización en BD
 */
export function mapUpdateImageDataToPrisma(data: UpdateImageData): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  if (data.name !== undefined) {
    result.name = data.name;
  }

  if (data.description !== undefined) {
    result.description = data.description;
  }

  if (data.presetId !== undefined) {
    result.presetId = data.presetId;
  }

  if (data.isFavorite !== undefined) {
    result.isFavorite = data.isFavorite;
  }

  if (data.isPublic !== undefined) {
    result.isPublic = data.isPublic;
  }

  return result;
}

/**
 * Genera propiedades derivadas para una imagen
 * @param image Imagen base
 * @returns Propiedades adicionales calculadas
 */
export function getDerivedImageProperties(image: ImageBase): Partial<ImageExtended> {
  const derived: Partial<ImageExtended> = {};

  // Calcular si tiene thumbnail
  derived.hasThumbnail = !!image.thumbnail || (!!image.thumbnailWidth && !!image.thumbnailHeight);

  // Calcular el aspect ratio
  derived.aspectRatio = image.width / image.height;

  // Extraer metadatos si existen
  if (image.metadata) {
    derived.metadata = serializeImageMetadata(image.metadata);
  }

  return derived;
}

/**
 * Actualiza los metadatos de una imagen
 * @param currentMetadata Metadatos actuales (string JSON o undefined)
 * @param updates Actualizaciones parciales a aplicar
 * @returns Metadatos actualizados en formato string
 */
export function updateImageMetadata(
  currentMetadata: string | undefined | null,
  updates: Partial<ImageMetadata>
): string {
  const current = serializeImageMetadata(currentMetadata) || {};
  const updated = { ...current, ...updates };
  return deserializeImageMetadata(updated) || '{}';
}