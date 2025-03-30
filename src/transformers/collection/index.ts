/**
 * @file Índice de exportación para transformadores de Collection
 * @module transformers/collection
 */

import { Logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import type {
    CollectionComplete,
    CollectionCreateInput,
    CollectionSearchOptions,
    CollectionSearchResult,
    CollectionUpdateInput,
} from '@/types/entities/collection/types';
import { handleTransformerError } from '@/utils/transformers/errors';
import {
    mapCollectionSearchOptionsToPrisma,
    mapCollectionToRelatedCollection,
    mapCreateCollectionDataToPrisma,
    mapUpdateCollectionDataToPrisma,
} from './mappers';
import {
    fromPrismaCollection,
    parseCollectionFilters,
    toPrismaCollection,
    validateCollection,
} from './serializers';

const logger = new Logger('CollectionTransformer');

/**
 * 🔄 Transformer para gestionar colecciones
 */
export class CollectionTransformer {
  /**
   * 🔍 Busca colecciones según los criterios especificados
   */
  static async search(options: CollectionSearchOptions): Promise<CollectionSearchResult> {
    try {
      // Mapear opciones de búsqueda a formato Prisma
      const prismaOptions = mapCollectionSearchOptionsToPrisma(options);

      // Realizar búsqueda
      const [items, total] = await Promise.all([
        prisma.collection.findMany(prismaOptions),
        prisma.collection.count({ where: prismaOptions.where }),
      ]);

      // Deserializar resultados
      const collections = items.map(item => fromPrismaCollection(item));

      return {
        items: collections,
        total,
        page: options.page || 1,
        pageSize: prismaOptions.take || 10,
        totalPages: Math.ceil(total / (prismaOptions.take || 10)),
      };
    } catch (error) {
      throw handleTransformerError(error);
    }
  }

  /**
   * 🔍 Obtiene una colección por su ID
   */
  static async getById(id: string): Promise<CollectionComplete | null> {
    try {
      const collection = await prisma.collection.findUnique({
        where: { id },
        include: {
          owner: true,
          parent: true,
          children: true,
          images: true,
          videos: true,
          albums: true,
          tags: true,
          groups: true,
          characters: true,
          places: true,
          items: true,
          notes: true,
          sharedWith: true,
          _count: true,
        },
      });

      if (!collection) {
        return null;
      }

      return fromPrismaCollection(collection);
    } catch (error) {
      throw handleTransformerError(error);
    }
  }

  /**
   * ✨ Crea una nueva colección
   */
  static async create(data: CollectionCreateInput): Promise<CollectionComplete> {
    try {
      // Validar datos de entrada
      await validateCollection(data);

      // Serializar datos para Prisma
      const prismaData = toPrismaCollection(data);

      // Mapear datos a formato Prisma
      const createData = mapCreateCollectionDataToPrisma(data);

      // Crear colección
      const collection = await prisma.collection.create({
        data: createData,
        include: {
          owner: true,
          parent: true,
          children: true,
          images: true,
          videos: true,
          albums: true,
          tags: true,
          groups: true,
          characters: true,
          places: true,
          items: true,
          notes: true,
          sharedWith: true,
          _count: true,
        },
      });

      return fromPrismaCollection(collection);
    } catch (error) {
      throw handleTransformerError(error);
    }
  }

  /**
   * 📝 Actualiza una colección existente
   */
  static async update(id: string, data: CollectionUpdateInput): Promise<CollectionComplete> {
    try {
      // Validar datos de entrada
      await validateCollection(data);

      // Serializar datos para Prisma
      const prismaData = toPrismaCollection(data);

      // Mapear datos a formato Prisma
      const updateData = mapUpdateCollectionDataToPrisma(data);

      // Actualizar colección
      const collection = await prisma.collection.update({
        where: { id },
        data: updateData,
        include: {
          owner: true,
          parent: true,
          children: true,
          images: true,
          videos: true,
          albums: true,
          tags: true,
          groups: true,
          characters: true,
          places: true,
          items: true,
          notes: true,
          sharedWith: true,
          _count: true,
        },
      });

      return fromPrismaCollection(collection);
    } catch (error) {
      throw handleTransformerError(error);
    }
  }

  /**
   * 🗑️ Elimina una colección
   */
  static async delete(id: string): Promise<void> {
    try {
      await prisma.collection.delete({
        where: { id },
      });
    } catch (error) {
      throw handleTransformerError(error);
    }
  }

  /**
   * 🔄 Convierte una colección a su versión relacionada
   */
  static toRelated(collection: CollectionComplete) {
    try {
      return mapCollectionToRelatedCollection(collection);
    } catch (error) {
      throw handleTransformerError(error);
    }
  }

  /**
   * 🔍 Parsea filtros de colección
   */
  static parseFilters(filters: any) {
    try {
      return parseCollectionFilters(filters);
    } catch (error) {
      throw handleTransformerError(error);
    }
  }
}

// Exportar funciones individuales para uso directo
export {
    fromPrismaCollection, mapCollectionSearchOptionsToPrisma,
    mapCollectionToRelatedCollection, mapCreateCollectionDataToPrisma,
    mapUpdateCollectionDataToPrisma, parseCollectionFilters, toPrismaCollection, validateCollection
};

