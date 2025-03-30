/**
 * @file Exportaciones principales de transformers para la entidad Tag
 * @module transformers/tag
 */

import { Logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import type {
    TagComplete,
    TagCreateInput,
    TagSearchOptions,
    TagSearchResult,
    TagUpdateInput,
} from '@/types/entities/tag/types';
import { handleTransformerError } from '@/utils/transformers/errors';
import {
    mapCreateTagDataToPrisma,
    mapTagSearchOptionsToPrisma,
    mapTagToRelatedTag,
    mapUpdateTagDataToPrisma,
} from './mappers';
import {
    extendTag,
    fromPrismaTag,
    parseTagFilters,
    toPrismaTag,
    validateTag,
} from './serializers';

const logger = new Logger('TagTransformer');

/**
 * 🏷️ Transformer para la entidad Tag
 */
export class TagTransformer {
  /**
   * 🔍 Busca tags según los criterios especificados
   */
  static async search(options: TagSearchOptions): Promise<TagSearchResult> {
    try {
      // Mapear opciones de búsqueda a formato Prisma
      const prismaOptions = mapTagSearchOptionsToPrisma(options);

      // Realizar búsqueda
      const [items, total] = await Promise.all([
        prisma.tag.findMany(prismaOptions),
        prisma.tag.count({ where: prismaOptions.where }),
      ]);

      // Deserializar resultados
      const tags = items.map(item => fromPrismaTag(item));

      return {
        items: tags,
        total,
        hasMore: total > (options.skip || 0) + items.length,
      };
    } catch (error) {
      throw handleTransformerError(error);
    }
  }

  /**
   * 🔍 Obtiene un tag por su ID
   */
  static async getById(id: string): Promise<TagComplete | null> {
    try {
      const tag = await prisma.tag.findUnique({
        where: { id },
        include: {
          images: true,
          videos: true,
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

      if (!tag) {
        return null;
      }

      return fromPrismaTag(tag);
    } catch (error) {
      throw handleTransformerError(error);
    }
  }

  /**
   * ✨ Crea un nuevo tag
   */
  static async create(data: TagCreateInput): Promise<TagComplete> {
    try {
      // Validar datos de entrada
      await validateTag(data);

      // Serializar datos para Prisma
      const prismaData = toPrismaTag(data);

      // Mapear datos a formato Prisma
      const createData = mapCreateTagDataToPrisma(data);

      // Crear tag
      const tag = await prisma.tag.create({
        data: createData,
        include: {
          images: true,
          videos: true,
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

      return fromPrismaTag(tag);
    } catch (error) {
      throw handleTransformerError(error);
    }
  }

  /**
   * 📝 Actualiza un tag existente
   */
  static async update(id: string, data: TagUpdateInput): Promise<TagComplete> {
    try {
      // Validar datos de entrada
      await validateTag(data);

      // Serializar datos para Prisma
      const prismaData = toPrismaTag(data);

      // Mapear datos a formato Prisma
      const updateData = mapUpdateTagDataToPrisma(data);

      // Actualizar tag
      const tag = await prisma.tag.update({
        where: { id },
        data: updateData,
        include: {
          images: true,
          videos: true,
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

      return fromPrismaTag(tag);
    } catch (error) {
      throw handleTransformerError(error);
    }
  }

  /**
   * 🗑️ Elimina un tag
   */
  static async delete(id: string): Promise<void> {
    try {
      await prisma.tag.delete({
        where: { id },
      });
    } catch (error) {
      throw handleTransformerError(error);
    }
  }

  /**
   * 🔄 Convierte un tag a su versión relacionada
   */
  static toRelated(tag: TagComplete) {
    try {
      return mapTagToRelatedTag(tag);
    } catch (error) {
      throw handleTransformerError(error);
    }
  }

  /**
   * 🔍 Parsea filtros de tag
   */
  static parseFilters(filters: unknown) {
    try {
      return parseTagFilters(filters);
    } catch (error) {
      throw handleTransformerError(error);
    }
  }
}

// Exportar funciones individuales para uso directo
export {
    extendTag,
    fromPrismaTag,
    mapCreateTagDataToPrisma,
    mapTagSearchOptionsToPrisma,
    mapTagToRelatedTag,
    mapUpdateTagDataToPrisma,
    parseTagFilters,
    toPrismaTag,
    validateTag
};

// Exportar serializadores
    export {
        extendTag,
        extendTags, formatSize, fromTagComplete, generateTagColor,
        generateTagEmoji, normalizeTagCategory,
        normalizeTagRarity, tagToTagWithStats, toTagComplete
    } from './serializers';

// Exportar mappers
export {
    createTagFilter,
    createTagOrderBy,
    mapCreateTagDataToPrisma,
    mapTagFiltersToPrisma,
    mapTagToRelatedTag,
    mapUpdateTagDataToPrisma,
    transformCompleteTagToPrisma,
    transformTagToPrisma
} from './mappers';

