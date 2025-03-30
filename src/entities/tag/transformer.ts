/**
 * @file Transformer para la entidad Tag
 * @module entities/tag/transformer
 */

import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { RelatedTag, Tag, TagComplete, TagCreateInput, TagSearchOptions, TagSearchResult, TagUpdateInput } from '@/types/entities/tag/types';
import { mapCreateTagDataToPrisma, mapTagSearchOptionsToPrisma, mapUpdateTagDataToPrisma } from './mappers';
import { extendTag, validateTag } from './serializers';

/**
 * Transformer para la entidad Tag
 */
export class TagTransformer {
  /**
   * Busca múltiples tags con opciones de filtrado y paginación
   */
  static async findMany(options: TagSearchOptions = {}): Promise<TagSearchResult> {
    try {
      const prismaOptions = mapTagSearchOptionsToPrisma(options);
      const [items, total] = await Promise.all([
        prisma.tag.findMany(prismaOptions),
        prisma.tag.count({ where: prismaOptions.where })
      ]);

      const extendedItems = items.map(item => extendTag(item as Tag));
      const hasMore = (options.skip || 0) + items.length < total;

      return { items: extendedItems, total, hasMore };
    } catch (error) {
      logger.error('Error buscando tags:', error);
      throw error;
    }
  }

  /**
   * Busca un tag por su ID
   */
  static async findById(id: string): Promise<TagComplete | null> {
    try {
      const tag = await prisma.tag.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
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
              groups: true
            }
          }
        }
      });

      return tag ? extendTag(tag as Tag) : null;
    } catch (error) {
      logger.error(`Error buscando tag con ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Crea un nuevo tag
   */
  static async create(data: TagCreateInput): Promise<TagComplete> {
    try {
      const prismaData = mapCreateTagDataToPrisma(data);
      const tag = await prisma.tag.create({
        data: prismaData,
        include: {
          _count: {
            select: {
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
              groups: true
            }
          }
        }
      });

      return extendTag(tag as Tag);
    } catch (error) {
      logger.error('Error creando tag:', error);
      throw error;
    }
  }

  /**
   * Actualiza un tag existente
   */
  static async update(id: string, data: TagUpdateInput): Promise<TagComplete> {
    try {
      const prismaData = mapUpdateTagDataToPrisma(data);
      const tag = await prisma.tag.update({
        where: { id },
        data: prismaData,
        include: {
          _count: {
            select: {
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
              groups: true
            }
          }
        }
      });

      return extendTag(tag as Tag);
    } catch (error) {
      logger.error(`Error actualizando tag con ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Elimina un tag
   */
  static async delete(id: string): Promise<TagComplete> {
    try {
      const tag = await prisma.tag.delete({
        where: { id },
        include: {
          _count: {
            select: {
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
              groups: true
            }
          }
        }
      });

      return extendTag(tag as Tag);
    } catch (error) {
      logger.error(`Error eliminando tag con ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Encuentra tags relacionados con el tag especificado
   */
  static async findRelatedTags(tagId: string, limit = 10): Promise<RelatedTag[]> {
    try {
      // Este es un ejemplo simplificado. En una implementación real, se buscarían
      // tags que comparten relaciones con las mismas entidades
      const tag = await prisma.tag.findUnique({
        where: { id: tagId },
        include: {
          images: { select: { id: true } },
          videos: { select: { id: true } },
          albums: { select: { id: true } }
        }
      });

      if (!tag) return [];

      const imageIds = tag.images.map(img => img.id);
      const videoIds = tag.videos.map(vid => vid.id);
      const albumIds = tag.albums.map(alb => alb.id);

      const relatedTags = await prisma.tag.findMany({
        where: {
          id: { not: tagId },
          OR: [
            { images: { some: { id: { in: imageIds } } } },
            { videos: { some: { id: { in: videoIds } } } },
            { albums: { some: { id: { in: albumIds } } } }
          ]
        },
        include: {
          _count: {
            select: {
              images: true,
              videos: true,
              albums: true
            }
          }
        },
        take: limit
      });

      return relatedTags.map(relatedTag => {
        // Calcular una puntuación de "fuerza" basada en elementos compartidos
        const sharedImages = relatedTag.images.filter(img => imageIds.includes(img.id)).length;
        const sharedVideos = relatedTag.videos.filter(vid => videoIds.includes(vid.id)).length;
        const sharedAlbums = relatedTag.albums.filter(alb => albumIds.includes(alb.id)).length;

        const totalShared = sharedImages + sharedVideos + sharedAlbums;
        const totalRelated = relatedTag._count.images + relatedTag._count.videos + relatedTag._count.albums;

        // Crear un objeto RelatedTag con los datos necesarios
        return {
          id: relatedTag.id,
          name: relatedTag.name,
          emoji: relatedTag.emoji,
          color: relatedTag.color,
          count: totalRelated,
          strength: totalShared
        };
      }).sort((a, b) => b.strength - a.strength);
    } catch (error) {
      logger.error(`Error buscando tags relacionados para tag ${tagId}:`, error);
      throw error;
    }
  }

  /**
   * Extiende un tag con datos adicionales
   */
  static extend(tag: Tag): TagComplete {
    return extendTag(tag);
  }

  /**
   * Valida un tag
   */
  static validate(tag: Tag): boolean {
    return validateTag(tag);
  }
}

// Exportar funciones individuales para uso directo
export const findManyTags = TagTransformer.findMany;
export const findTagById = TagTransformer.findById;
export const createTag = TagTransformer.create;
export const updateTag = TagTransformer.update;
export const deleteTag = TagTransformer.delete;
export const findRelatedTags = TagTransformer.findRelatedTags;
export const extendTagTransform = TagTransformer.extend;
export const validateTagData = TagTransformer.validate;