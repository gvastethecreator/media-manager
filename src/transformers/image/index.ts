/**
 * @file Exportaciones principales de transformers para la entidad Image
 * @module transformers/image
 */

import { Logger } from '@/lib/logger';
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
    mapImageFiltersToPrisma,
    mapImageSearchOptionsToPrisma,
    mapImageToComplete,
    mapImageToRelatedImage,
    mapUpdateImageDataToPrisma
} from './mappers';
import {
    extendImage,
    fromPrismaImage,
    parseImageFilters,
    serializeImageMetadata,
    toPrismaImage,
    validateImage
} from './serializers';
// Importar transformador principal y sus funciones asociadas
import { transformImage, transformImageToExtended } from './transformer';

const logger = new Logger('ImageTransformer');

// Exportar el transformador principal y sus variantes
export { transformImage, transformImageToExtended };

// Compatibilidad con código existente:
/**
 * 🔍 Busca imágenes según los criterios especificados
 */
export async function searchImages(options: ImageSearchOptions): Promise<ImageSearchResult> {
  try {
    // Mapear opciones de búsqueda a formato Prisma
    const prismaOptions = mapImageSearchOptionsToPrisma(options);

    // Realizar búsqueda
    const [items, total] = await Promise.all([
      prisma.image.findMany(prismaOptions),
      prisma.image.count({ where: prismaOptions.where }),
    ]);

    // Deserializar resultados
    const images = items.map(item => transformImage(item));

    return {
      items: images,
      total,
      hasMore: total > (options.skip || 0) + items.length,
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
        tags: true,
        albums: true,
        collections: true,
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

    return transformImage(image);
  } catch (error) {
    throw handleTransformerError(error);
  }
}

/**
 * ✨ Crea una nueva imagen
 */
export async function createImage(data: ImageCreateInput): Promise<ImageComplete> {
  try {
    // Validar datos de entrada
    validateImage(data);

    // Mapear datos a formato Prisma
    const createData = mapCreateImageDataToPrisma(data);

    // Crear imagen
    const image = await prisma.image.create({
      data: createData,
      include: {
        folder: true,
        tags: true,
        albums: true,
        collections: true,
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

    return transformImage(image);
  } catch (error) {
    throw handleTransformerError(error);
  }
}

/**
 * 📝 Actualiza una imagen existente
 */
export async function updateImage(id: string, data: ImageUpdateInput): Promise<ImageComplete> {
  try {
    // Validar datos de entrada
    validateImage({ id, ...data });

    // Mapear datos a formato Prisma
    const updateData = mapUpdateImageDataToPrisma(data);

    // Actualizar imagen
    const image = await prisma.image.update({
      where: { id },
      data: updateData,
      include: {
        folder: true,
        tags: true,
        albums: true,
        collections: true,
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

    return transformImage(image);
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
export function toRelatedImage(image: ImageComplete) {
  try {
    return mapImageToRelatedImage(image);
  } catch (error) {
    throw handleTransformerError(error);
  }
}

// Exportar transformadores y funciones individuales para compatibilidad
export {
    // Serializadores
    extendImage,
    fromPrismaImage,
    // Mappers
    mapCreateImageDataToPrisma,
    mapImageFiltersToPrisma,
    mapImageSearchOptionsToPrisma,
    mapImageToComplete,
    mapImageToRelatedImage,
    mapUpdateImageDataToPrisma,
    parseImageFilters, serializeImageMetadata,
    toPrismaImage,
    validateImage
};

