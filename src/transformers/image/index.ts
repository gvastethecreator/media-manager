/**
 * @file Exportaciones de transformers para la entidad Image
 * @module transformers/image
 */

import { Logger } from '@/lib/logger';
import type {
    ImageComplete,
    ImageCreateInput,
    ImageSearchOptions,
    ImageSearchResult,
    ImageUpdateInput,
} from '@/types/entities/image/types';
import { handleTransformerError } from '@/utils/transformers/errors';
import { PrismaClient } from '@prisma/client';
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

const logger = new Logger('ImageTransformer');
const prisma = new PrismaClient();

/**
 * 🖼️ Transformer para entidades Image
 */
export class ImageTransformer {
  /**
   * 🔍 Busca imágenes según los criterios especificados
   */
  static async search(options: ImageSearchOptions): Promise<ImageSearchResult> {
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
  static async getById(id: string): Promise<ImageComplete | null> {
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
  static async create(data: ImageCreateInput): Promise<ImageComplete> {
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
  static async update(id: string, data: ImageUpdateInput): Promise<ImageComplete> {
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
  static async delete(id: string): Promise<void> {
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
  static toRelated(image: ImageComplete): { id: string } {
    try {
      return mapImageToRelatedImage(image);
    } catch (error) {
      throw handleTransformerError(error);
    }
  }

  /**
   * 🔍 Parsea filtros de imagen
   */
  static parseFilters(filters: unknown): Record<string, unknown> {
    try {
      return parseImageFilters(filters);
    } catch (error) {
      throw handleTransformerError(error);
    }
  }
}

// Exportar funciones individuales para uso directo
export {
    extendImage, fromPrismaImage, mapCreateImageDataToPrisma, mapImageSearchOptionsToPrisma,
    mapImageToRelatedImage, mapUpdateImageDataToPrisma, parseImageFilters, toPrismaImage, validateImage
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

