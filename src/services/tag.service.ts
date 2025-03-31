/**
 * @file Servicio para la entidad Tag
 * @module services/tag.service
 */

import { TagTransformer } from '@/transformers/tag';
import type {
    TagComplete,
    TagCreateInput,
    TagSearchOptions,
    TagSearchResult,
    TagUpdateInput
} from '@/types/entities/tag/types';
import { PrismaClient } from '@prisma/client';

/**
 * Interfaz para el servicio de Tag
 */
export interface TagService {
  /**
   * Busca tags según criterios específicos
   * @param options Opciones de búsqueda y filtrado
   * @returns Resultado con tags y metadatos
   */
  search(options: TagSearchOptions): Promise<TagSearchResult>;

  /**
   * Busca un tag por su identificador
   * @param id Identificador del tag
   * @returns Tag encontrado o null
   */
  findById(id: string): Promise<TagComplete | null>;

  /**
   * Crea un nuevo tag
   * @param data Datos para la creación
   * @returns Tag creado
   */
  create(data: TagCreateInput): Promise<TagComplete>;

  /**
   * Actualiza un tag existente
   * @param id Identificador del tag
   * @param data Datos para actualizar
   * @returns Tag actualizado
   */
  update(id: string, data: TagUpdateInput): Promise<TagComplete>;

  /**
   * Elimina un tag
   * @param id Identificador del tag
   * @returns true si se eliminó correctamente
   */
  delete(id: string): Promise<boolean>;

  /**
   * Obtiene tags relacionados a un tag específico
   * @param id Identificador del tag
   * @param limit Límite de resultados
   * @returns Array de tags relacionados
   */
  getRelatedTags(id: string, limit?: number): Promise<TagComplete[]>;

  /**
   * Busca tags por su categoría
   * @param category Categoría a buscar
   * @param limit Límite de resultados
   * @returns Array de tags
   */
  findByCategory(category: string, limit?: number): Promise<TagComplete[]>;
}

/**
 * Implementación del servicio de Tag
 */
export class TagServiceImpl implements TagService {
  private prisma: PrismaClient;

  /**
   * Constructor del servicio
   * @param prismaClient Cliente Prisma
   */
  constructor(prismaClient: PrismaClient) {
    this.prisma = prismaClient;
  }

  /**
   * Busca tags según criterios específicos
   * @param options Opciones de búsqueda y filtrado
   * @returns Resultado con tags y metadatos
   */
  async search(options: TagSearchOptions): Promise<TagSearchResult> {
    return TagTransformer.search(options);
  }

  /**
   * Busca un tag por su identificador
   * @param id Identificador del tag
   * @returns Tag encontrado o null
   */
  async findById(id: string): Promise<TagComplete | null> {
    return TagTransformer.getById(id);
  }

  /**
   * Crea un nuevo tag
   * @param data Datos para la creación
   * @returns Tag creado
   */
  async create(data: TagCreateInput): Promise<TagComplete> {
    return TagTransformer.create(data);
  }

  /**
   * Actualiza un tag existente
   * @param id Identificador del tag
   * @param data Datos para actualizar
   * @returns Tag actualizado
   */
  async update(id: string, data: TagUpdateInput): Promise<TagComplete> {
    return TagTransformer.update(id, data);
  }

  /**
   * Elimina un tag
   * @param id Identificador del tag
   * @returns true si se eliminó correctamente
   */
  async delete(id: string): Promise<boolean> {
    try {
      await TagTransformer.delete(id);
      return true;
    } catch (error) {
      console.error('Error al eliminar tag:', error);
      return false;
    }
  }

  /**
   * Obtiene tags relacionados a un tag específico
   * @param id Identificador del tag
   * @param limit Límite de resultados
   * @returns Array de tags relacionados
   */
  async getRelatedTags(id: string, limit = 10): Promise<TagComplete[]> {
    try {
      // Obtener el tag principal
      const tag = await this.findById(id);
      if (!tag) return [];

      // Buscar tags que estén relacionados con las mismas entidades
      const relatedTagsQuery = {
        where: {
          OR: [] as any[],
          NOT: { id },
        },
        take: limit,
        orderBy: { name: 'asc' as const },
        include: {
          _count: true,
          images: { take: 0, select: { id: true } },
          albums: { take: 0, select: { id: true } },
        },
      };

      // Si el tag tiene imágenes, buscar tags que también tengan estas imágenes
      if (tag.images && tag.images.length > 0) {
        const imageIds = tag.images.map(img => img.id);
        relatedTagsQuery.where.OR.push({
          images: {
            some: {
              id: { in: imageIds },
            },
          },
        });
      }

      // Si el tag tiene álbumes, buscar tags que también estén en estos álbumes
      if (tag.albums && tag.albums.length > 0) {
        const albumIds = tag.albums.map(album => album.id);
        relatedTagsQuery.where.OR.push({
          albums: {
            some: {
              id: { in: albumIds },
            },
          },
        });
      }

      // Si no hay criterios OR, no habrá tags relacionados
      if (relatedTagsQuery.where.OR.length === 0) {
        return [];
      }

      // Realizar la búsqueda
      const tags = await this.prisma.tag.findMany(relatedTagsQuery);

      // Transformar los resultados usando el mismo patrón que search
      const options: TagSearchOptions = {
        take: limit,
        include: {
          images: true,
          albums: true,
        },
      };

      // Usamos un enfoque diferente para transformar los resultados
      const transformedTags = tags.map(tag => {
        // Crear una versión básica del tag
        const baseTag: TagComplete = {
          id: tag.id,
          name: tag.name,
          emoji: tag.emoji || '🏷️',
          color: tag.color || '#3b82f6',
          description: tag.description,
          shortcut: tag.shortcut,
          category: tag.category || 'general',
          featuredImage: tag.featuredImage,
          isFavorite: tag.isFavorite || false,
          createdAt: tag.createdAt,
          updatedAt: tag.updatedAt,
          images: tag.images,
          albums: tag.albums,
          _count: tag._count,
        };

        return baseTag;
      });

      return transformedTags;
    } catch (error) {
      console.error('Error al obtener tags relacionados:', error);
      return [];
    }
  }

  /**
   * Busca tags por su categoría
   * @param category Categoría a buscar
   * @param limit Límite de resultados
   * @returns Array de tags
   */
  async findByCategory(category: string, limit = 20): Promise<TagComplete[]> {
    const searchOptions: TagSearchOptions = {
      where: { categories: [category] },
      take: limit,
      orderBy: { name: 'asc' },
    };

    const result = await this.search(searchOptions);
    return result.items;
  }
}

// Singleton para la instancia del servicio
let tagServiceInstance: TagService | null = null;

/**
 * Obtiene una instancia del servicio
 * @param prisma Cliente Prisma opcional
 * @returns Instancia del servicio
 */
export function getTagService(prisma?: PrismaClient): TagService {
  if (!tagServiceInstance && prisma) {
    tagServiceInstance = new TagServiceImpl(prisma);
  }

  if (!tagServiceInstance) {
    throw new Error('TagService no ha sido inicializado');
  }

  return tagServiceInstance;
}

/**
 * Inicializa el servicio con un cliente prisma
 * @param prisma Cliente Prisma
 */
export function initTagService(prisma: PrismaClient): void {
  tagServiceInstance = new TagServiceImpl(prisma);
}