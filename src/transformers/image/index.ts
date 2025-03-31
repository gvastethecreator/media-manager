/**
 * @file Exportaciones de transformers para la entidad Image
 * @module transformers/image
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import type {
    ImageComplete,
    ImageCreateInput,
    ImageSearchOptions,
    ImageSearchResult,
    ImageUpdateInput,
} from '@/types/entities/image/types';
import { handleTransformerError } from '@/utils/transformers/errors';
import {
    mapCreateImageDataToPrisma,
    mapImageSearchOptionsToPrisma,
    mapImageToRelatedImage,
    mapUpdateImageDataToPrisma,
} from './mappers';
import {
    extendImage,
    fromPrismaImage,
    parseImageFilters,
    toPrismaImage,
    validateImage,
} from './serializers';

const logger = serverLogger.withContext('ImageTransformer');

/**
 * 🔍 Busca imágenes según los criterios especificados
 */
export async function searchImages(options: ImageSearchOptions): Promise<ImageSearchResult> {
  try {
    const prismaOptions = mapImageSearchOptionsToPrisma(options);
    const [items, total] = await Promise.all([
      prisma.image.findMany(prismaOptions),
      prisma.image.count({ where: prismaOptions.where }),
    ]);

    const images = items.map(item => fromPrismaImage(item));
    const validatedImages = images.map(img => validateImage(img));

    return {
      items: validatedImages,
      total,
      page: options.page || 1,
      pageSize: prismaOptions.take || 10,
    };
  } catch (error) {
    throw handleTransformerError(error);
  }
}

/**
 * 🔍 Obtiene una imagen por su ID
 */
export async function getImageById(id: string): Promise<ImageComplete | null> {
  try {
    const image = await prisma.image.findUnique({
      where: { id },
      include: {
        folder: true,
        stats: true,
        activities: true,
        uploadedImages: true,
        profiles: true,
        albums: true,
        collections: true,
        tags: true,
        characters: true,
        places: true,
        worldItems: true,
        concepts: true,
        prompts: true,
        notes: true,
        wildcards: true,
        properties: true,
        groups: true,
        _count: true,
      },
    });

    if (!image) {
      return null;
    }

    const mapped = fromPrismaImage(image);
    return validateImage(mapped);
  } catch (error) {
    throw handleTransformerError(error);
  }
}

/**
 * ➕ Crea una nueva imagen
 */
export async function createImage(data: ImageCreateInput): Promise<ImageComplete> {
  try {
    const prismaData = mapCreateImageDataToPrisma(data);
    const image = await prisma.image.create({
      data: prismaData,
      include: {
        folder: true,
        stats: true,
        activities: true,
        uploadedImages: true,
        profiles: true,
        albums: true,
        collections: true,
        tags: true,
        characters: true,
        places: true,
        worldItems: true,
        concepts: true,
        prompts: true,
        notes: true,
        wildcards: true,
        properties: true,
        groups: true,
        _count: true,
      },
    });

    const mapped = fromPrismaImage(image);
    return validateImage(mapped);
  } catch (error) {
    throw handleTransformerError(error);
  }
}

/**
 * 📝 Actualiza una imagen existente
 */
export async function updateImage(id: string, data: ImageUpdateInput): Promise<ImageComplete> {
  try {
    const prismaData = mapUpdateImageDataToPrisma(data);
    const image = await prisma.image.update({
      where: { id },
      data: prismaData,
      include: {
        folder: true,
        stats: true,
        activities: true,
        uploadedImages: true,
        profiles: true,
        albums: true,
        collections: true,
        tags: true,
        characters: true,
        places: true,
        worldItems: true,
        concepts: true,
        prompts: true,
        notes: true,
        wildcards: true,
        properties: true,
        groups: true,
        _count: true,
      },
    });

    const mapped = fromPrismaImage(image);
    return validateImage(mapped);
  } catch (error) {
    throw handleTransformerError(error);
  }
}

/**
 * 🗑️ Elimina una imagen
 */
export async function deleteImage(id: string): Promise<void> {
  try {
    await prisma.image.delete({
      where: { id },
    });
  } catch (error) {
    throw handleTransformerError(error);
  }
}

/**
 * 🔄 Convierte una imagen a su versión relacionada
 */
export function toRelatedImage(image: ImageComplete): { id: string } {
  try {
    return mapImageToRelatedImage(image);
  } catch (error) {
    throw handleTransformerError(error);
  }
}

/**
 * 🔍 Parsea filtros de imagen
 */
export function parseImageFilterOptions(filters: unknown): Record<string, unknown> {
  try {
    return parseImageFilters(filters);
  } catch (error) {
    throw handleTransformerError(error);
  }
}

// Capa de compatibilidad para código existente
/**
 * @deprecated Use las funciones individuales exportadas en su lugar.
 * Las funciones recomendadas son:
 * - searchImages en lugar de ImageTransformer.search
 * - getImageById en lugar de ImageTransformer.getById
 * - createImage en lugar de ImageTransformer.create
 * - updateImage en lugar de ImageTransformer.update
 * - deleteImage en lugar de ImageTransformer.delete
 * - toRelatedImage en lugar de ImageTransformer.toRelated
 * - parseImageFilterOptions en lugar de ImageTransformer.parseFilters
 */
const ImageTransformerCompat = {
  search: searchImages,
  getById: getImageById,
  create: createImage,
  update: updateImage,
  delete: deleteImage,
  toRelated: toRelatedImage,
  parseFilters: parseImageFilterOptions
};

// Exportar objeto de compatibilidad bajo el mismo nombre que la clase original
export const ImageTransformer = ImageTransformerCompat;

// Exportar funciones individuales para uso directo
export {
    extendImage,
    fromPrismaImage,
    mapCreateImageDataToPrisma,
    mapImageSearchOptionsToPrisma,
    mapImageToRelatedImage,
    mapUpdateImageDataToPrisma,
    parseImageFilters,
    toPrismaImage,
    validateImage
};

// Exportar serializadores
    export {
        deserializeImageMetadata, extendImage,
        extendImages, fromImageComplete, fromImageVisualConfigComplete,
        // Funciones obsoletas, mantenidas por compatibilidad
        serializeImageMetadata, serializeImageVisualConfig, toImageComplete, toImageVisualConfigComplete
    } from './serializers';

// Exportar mappers
export {
    getDerivedImageProperties, mapCreateImageDataToPrisma, mapToImageSummaries, mapToImageSummary, mapUpdateImageDataToPrisma,
    // Función obsoleta, mantenida por compatibilidad
    updateImageMetadata
} from './mappers';

