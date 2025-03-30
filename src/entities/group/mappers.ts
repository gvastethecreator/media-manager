/**
 * @file Mappers para la entidad Group
 * @module entities/group/mappers
 */

import { logger } from '@/lib/logger';
import type { GroupCreateInput, GroupFilters, GroupSortCriteria, GroupUpdateInput } from '@/types/entities/group/types';
import type { Prisma } from '@prisma/client';
import { serializeGroupFilters } from './serializers';

/**
 * Mapea los datos de creación de un grupo al formato de Prisma
 */
export function mapCreateGroupDataToPrisma(data: GroupCreateInput): Prisma.GroupCreateInput {
  try {
    const {
      name,
      emoji,
      color,
      description,
      shortcut,
      category,
      sortBy,
      filters,
      featuredImage,
      isFavorite,
      ...relations
    } = data;

    // Datos básicos del grupo
    const prismaData: Prisma.GroupCreateInput = {
      name,
      emoji: emoji || '👥',
      color: color || '#8B5CF6',
      description,
      shortcut,
      category,
      sortBy: sortBy || 'name:asc',
      filters: typeof filters === 'string' ? filters : serializeGroupFilters(filters as any || {}),
      featuredImage,
      isFavorite: isFavorite ?? false
    };

    // Agregar relaciones si están presentes
    if (relations.images?.length) {
      prismaData.images = { connect: relations.images };
    }
    if (relations.videos?.length) {
      prismaData.videos = { connect: relations.videos };
    }
    if (relations.albums?.length) {
      prismaData.albums = { connect: relations.albums };
    }
    if (relations.collections?.length) {
      prismaData.collections = { connect: relations.collections };
    }
    if (relations.tags?.length) {
      prismaData.tags = { connect: relations.tags };
    }
    if (relations.characters?.length) {
      prismaData.characters = { connect: relations.characters };
    }
    if (relations.places?.length) {
      prismaData.places = { connect: relations.places };
    }
    if (relations.worldItems?.length) {
      prismaData.worldItems = { connect: relations.worldItems };
    }
    if (relations.concepts?.length) {
      prismaData.concepts = { connect: relations.concepts };
    }
    if (relations.prompts?.length) {
      prismaData.prompts = { connect: relations.prompts };
    }
    if (relations.notes?.length) {
      prismaData.notes = { connect: relations.notes };
    }
    if (relations.wildcards?.length) {
      prismaData.wildcards = { connect: relations.wildcards };
    }
    if (relations.properties?.length) {
      prismaData.properties = { connect: relations.properties };
    }

    return prismaData;
  } catch (error) {
    logger.error('Error mapeando datos de creación de grupo:', error);
    throw error;
  }
}

/**
 * Mapea los datos de actualización de un grupo al formato de Prisma
 */
export function mapUpdateGroupDataToPrisma(data: GroupUpdateInput): Prisma.GroupUpdateInput {
  try {
    const {
      name,
      emoji,
      color,
      description,
      shortcut,
      category,
      sortBy,
      filters,
      featuredImage,
      isFavorite,
      ...relations
    } = data;

    const prismaData: Prisma.GroupUpdateInput = {};

    // Solo incluir campos que están presentes
    if (name !== undefined) prismaData.name = name;
    if (emoji !== undefined) prismaData.emoji = emoji;
    if (color !== undefined) prismaData.color = color;
    if (description !== undefined) prismaData.description = description;
    if (shortcut !== undefined) prismaData.shortcut = shortcut;
    if (category !== undefined) prismaData.category = category;
    if (sortBy !== undefined) prismaData.sortBy = sortBy;
    if (filters !== undefined) {
      prismaData.filters = typeof filters === 'string' ? filters : serializeGroupFilters(filters as any || {});
    }
    if (featuredImage !== undefined) prismaData.featuredImage = featuredImage;
    if (isFavorite !== undefined) prismaData.isFavorite = isFavorite;

    // Agregar relaciones si están presentes
    if (relations.images?.length) {
      prismaData.images = { connect: relations.images };
    }
    if (relations.videos?.length) {
      prismaData.videos = { connect: relations.videos };
    }
    if (relations.albums?.length) {
      prismaData.albums = { connect: relations.albums };
    }
    if (relations.collections?.length) {
      prismaData.collections = { connect: relations.collections };
    }
    if (relations.tags?.length) {
      prismaData.tags = { connect: relations.tags };
    }
    if (relations.characters?.length) {
      prismaData.characters = { connect: relations.characters };
    }
    if (relations.places?.length) {
      prismaData.places = { connect: relations.places };
    }
    if (relations.worldItems?.length) {
      prismaData.worldItems = { connect: relations.worldItems };
    }
    if (relations.concepts?.length) {
      prismaData.concepts = { connect: relations.concepts };
    }
    if (relations.prompts?.length) {
      prismaData.prompts = { connect: relations.prompts };
    }
    if (relations.notes?.length) {
      prismaData.notes = { connect: relations.notes };
    }
    if (relations.wildcards?.length) {
      prismaData.wildcards = { connect: relations.wildcards };
    }
    if (relations.properties?.length) {
      prismaData.properties = { connect: relations.properties };
    }

    return prismaData;
  } catch (error) {
    logger.error('Error mapeando datos de actualización de grupo:', error);
    throw error;
  }
}

/**
 * Mapea los filtros de grupo al formato de Prisma
 */
export function mapGroupFiltersToPrisma(filters?: GroupFilters): Prisma.GroupWhereInput {
  if (!filters) return {};

  const prismaFilters: Prisma.GroupWhereInput = {};
  const { search, categories, tags, dateRange, isFavorite, hasImages, hasVideos, hasAlbums, hasCollections } = filters;

  // Búsqueda por texto
  if (search) {
    prismaFilters.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } }
    ];
  }

  // Filtro por categorías
  if (categories?.length) {
    prismaFilters.category = { in: categories };
  }

  // Filtro por tags (requiere relación)
  if (tags?.length) {
    prismaFilters.tags = {
      some: {
        id: { in: tags }
      }
    };
  }

  // Filtro por rango de fechas
  if (dateRange) {
    if (dateRange.start) {
      prismaFilters.createdAt = { ...prismaFilters.createdAt, gte: dateRange.start };
    }
    if (dateRange.end) {
      prismaFilters.createdAt = { ...prismaFilters.createdAt, lte: dateRange.end };
    }
  }

  // Filtro por favoritos
  if (isFavorite !== undefined) {
    prismaFilters.isFavorite = isFavorite;
  }

  // Filtros por entidades relacionadas
  if (hasImages) {
    prismaFilters.images = { some: {} };
  }
  if (hasVideos) {
    prismaFilters.videos = { some: {} };
  }
  if (hasAlbums) {
    prismaFilters.albums = { some: {} };
  }
  if (hasCollections) {
    prismaFilters.collections = { some: {} };
  }

  return prismaFilters;
}

/**
 * Mapea las opciones de búsqueda de grupos al formato de Prisma
 */
export function mapGroupSearchOptionsToPrisma(options: {
  take?: number;
  skip?: number;
  sortBy?: GroupSortCriteria;
  filters?: GroupFilters;
  include?: Record<string, boolean>;
}): Prisma.GroupFindManyArgs {
  try {
    const { take = 10, skip = 0, sortBy, filters, include } = options;

    // Determinar el campo y dirección de ordenamiento
    let orderBy: Prisma.GroupOrderByWithRelationInput | undefined;
    if (sortBy) {
      const [field, direction] = sortBy.split(':');
      orderBy = { [field]: direction };
    } else {
      orderBy = { name: 'asc' };
    }

    const prismaOptions: Prisma.GroupFindManyArgs = {
      take,
      skip,
      orderBy,
      where: mapGroupFiltersToPrisma(filters),
      include: {
        _count: true,
        ...(include?.images && { images: true }),
        ...(include?.videos && { videos: true }),
        ...(include?.albums && { albums: true }),
        ...(include?.collections && { collections: true }),
        ...(include?.tags && { tags: true }),
        ...(include?.characters && { characters: true }),
        ...(include?.places && { places: true }),
        ...(include?.worldItems && { worldItems: true }),
        ...(include?.concepts && { concepts: true }),
        ...(include?.prompts && { prompts: true }),
        ...(include?.notes && { notes: true }),
        ...(include?.wildcards && { wildcards: true }),
        ...(include?.properties && { properties: true })
      }
    };

    return prismaOptions;
  } catch (error) {
    logger.error('Error mapeando opciones de búsqueda de grupos:', error);
    throw error;
  }
}