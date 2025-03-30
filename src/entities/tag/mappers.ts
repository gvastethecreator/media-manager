/**
 * @file Mappers para la entidad Tag
 * @module entities/tag/mappers
 */

import { logger } from '@/lib/logger';
import type { TagCreateInput, TagFilters, TagSearchOptions, TagUpdateInput } from '@/types/entities/tag/types';
import type { Prisma } from '@prisma/client';

/**
 * Mapea los datos de creación de un tag al formato de Prisma
 */
export function mapCreateTagDataToPrisma(data: TagCreateInput): Prisma.TagCreateInput {
  try {
    const { name, emoji, color, description, shortcut, category, featuredImage, isFavorite, ...relations } = data;

    const prismaData: Prisma.TagCreateInput = {
      name,
      emoji,
      color,
      description,
      shortcut,
      category,
      featuredImage,
      isFavorite: isFavorite ?? false
    };

    // Mapear relaciones si existen
    if (relations.images?.length) {
      prismaData.images = { connect: relations.images.map(id => ({ id })) };
    }
    if (relations.videos?.length) {
      prismaData.videos = { connect: relations.videos.map(id => ({ id })) };
    }
    if (relations.albums?.length) {
      prismaData.albums = { connect: relations.albums.map(id => ({ id })) };
    }
    if (relations.collections?.length) {
      prismaData.collections = { connect: relations.collections.map(id => ({ id })) };
    }
    if (relations.characters?.length) {
      prismaData.characters = { connect: relations.characters.map(id => ({ id })) };
    }
    if (relations.places?.length) {
      prismaData.places = { connect: relations.places.map(id => ({ id })) };
    }
    if (relations.worldItems?.length) {
      prismaData.worldItems = { connect: relations.worldItems.map(id => ({ id })) };
    }
    if (relations.concepts?.length) {
      prismaData.concepts = { connect: relations.concepts.map(id => ({ id })) };
    }
    if (relations.prompts?.length) {
      prismaData.prompts = { connect: relations.prompts.map(id => ({ id })) };
    }
    if (relations.notes?.length) {
      prismaData.notes = { connect: relations.notes.map(id => ({ id })) };
    }
    if (relations.wildcards?.length) {
      prismaData.wildcards = { connect: relations.wildcards.map(id => ({ id })) };
    }
    if (relations.properties?.length) {
      prismaData.properties = { connect: relations.properties.map(id => ({ id })) };
    }
    if (relations.groups?.length) {
      prismaData.groups = { connect: relations.groups.map(id => ({ id })) };
    }

    return prismaData;
  } catch (error) {
    logger.error('Error mapeando datos de creación de tag:', error);
    throw error;
  }
}

/**
 * Mapea los datos de actualización de un tag al formato de Prisma
 */
export function mapUpdateTagDataToPrisma(data: TagUpdateInput): Prisma.TagUpdateInput {
  try {
    const { name, emoji, color, description, shortcut, category, featuredImage, isFavorite, ...relations } = data;

    const prismaData: Prisma.TagUpdateInput = {};

    // Solo incluir campos que están presentes
    if (name !== undefined) prismaData.name = name;
    if (emoji !== undefined) prismaData.emoji = emoji;
    if (color !== undefined) prismaData.color = color;
    if (description !== undefined) prismaData.description = description;
    if (shortcut !== undefined) prismaData.shortcut = shortcut;
    if (category !== undefined) prismaData.category = category;
    if (featuredImage !== undefined) prismaData.featuredImage = featuredImage;
    if (isFavorite !== undefined) prismaData.isFavorite = isFavorite;

    // Mapear relaciones si existen
    if (relations.images?.length) {
      prismaData.images = { set: relations.images.map(id => ({ id })) };
    }
    if (relations.videos?.length) {
      prismaData.videos = { set: relations.videos.map(id => ({ id })) };
    }
    if (relations.albums?.length) {
      prismaData.albums = { set: relations.albums.map(id => ({ id })) };
    }
    if (relations.collections?.length) {
      prismaData.collections = { set: relations.collections.map(id => ({ id })) };
    }
    if (relations.characters?.length) {
      prismaData.characters = { set: relations.characters.map(id => ({ id })) };
    }
    if (relations.places?.length) {
      prismaData.places = { set: relations.places.map(id => ({ id })) };
    }
    if (relations.worldItems?.length) {
      prismaData.worldItems = { set: relations.worldItems.map(id => ({ id })) };
    }
    if (relations.concepts?.length) {
      prismaData.concepts = { set: relations.concepts.map(id => ({ id })) };
    }
    if (relations.prompts?.length) {
      prismaData.prompts = { set: relations.prompts.map(id => ({ id })) };
    }
    if (relations.notes?.length) {
      prismaData.notes = { set: relations.notes.map(id => ({ id })) };
    }
    if (relations.wildcards?.length) {
      prismaData.wildcards = { set: relations.wildcards.map(id => ({ id })) };
    }
    if (relations.properties?.length) {
      prismaData.properties = { set: relations.properties.map(id => ({ id })) };
    }
    if (relations.groups?.length) {
      prismaData.groups = { set: relations.groups.map(id => ({ id })) };
    }

    return prismaData;
  } catch (error) {
    logger.error('Error mapeando datos de actualización de tag:', error);
    throw error;
  }
}

/**
 * Mapea los filtros de tag al formato de Prisma
 */
export function mapTagFiltersToPrisma(filters?: TagFilters): Prisma.TagWhereInput {
  if (!filters) return {};

  const prismaFilters: Prisma.TagWhereInput = {};
  const { search, categories, isFavorite, hasImages, hasVideos, hasAlbums, hasCollections, minRelations, maxRelations, dateRange } = filters;

  if (search) {
    prismaFilters.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } }
    ];
  }

  if (categories?.length) {
    prismaFilters.category = { in: categories };
  }

  if (isFavorite !== undefined) {
    prismaFilters.isFavorite = isFavorite;
  }

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

  if (dateRange) {
    if (dateRange.start) {
      prismaFilters.createdAt = { ...(prismaFilters.createdAt || {}), gte: dateRange.start };
    }
    if (dateRange.end) {
      prismaFilters.createdAt = { ...(prismaFilters.createdAt || {}), lte: dateRange.end };
    }
  }

  // Nota: minRelations y maxRelations necesitarían una implementación más compleja
  // que involucraría subconsultas o procesamiento posterior

  return prismaFilters;
}

/**
 * Mapea las opciones de búsqueda de tags al formato de Prisma
 */
export function mapTagSearchOptionsToPrisma(options: TagSearchOptions): Prisma.TagFindManyArgs {
  try {
    const { skip = 0, take = 10, orderBy, where, include } = options;

    const prismaOptions: Prisma.TagFindManyArgs = {
      skip,
      take,
      orderBy: orderBy ? Object.entries(orderBy).map(([key, value]) => ({ [key]: value }))[0] : { name: 'asc' },
      where: mapTagFiltersToPrisma(where),
      include: {
        _count: true,
        ...(include?.images && { images: true }),
        ...(include?.videos && { videos: true }),
        ...(include?.albums && { albums: true }),
        ...(include?.collections && { collections: true }),
        ...(include?.characters && { characters: true }),
        ...(include?.places && { places: true }),
        ...(include?.worldItems && { worldItems: true }),
        ...(include?.concepts && { concepts: true }),
        ...(include?.prompts && { prompts: true }),
        ...(include?.notes && { notes: true }),
        ...(include?.wildcards && { wildcards: true }),
        ...(include?.properties && { properties: true }),
        ...(include?.groups && { groups: true })
      }
    };

    return prismaOptions;
  } catch (error) {
    logger.error('Error mapeando opciones de búsqueda de tags:', error);
    throw error;
  }
}