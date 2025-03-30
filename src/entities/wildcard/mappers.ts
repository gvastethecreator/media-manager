/**
 * @file Mappers para la entidad Wildcard
 * @module entities/wildcard/mappers
 */

import { logger } from '@/lib/logger';
import { type CreateWildcardData, type UpdateWildcardData, WILDCARD_SORT_PROPERTY_MAP, type WildcardFilters, type WildcardSortCriteria } from '@/types/entities/wildcard/types';
import type { Prisma } from '@prisma/client';

/**
 * Mapea los datos de creación de un comodín al formato de Prisma
 */
export function mapCreateWildcardDataToPrisma(data: CreateWildcardData): Prisma.WildcardCreateInput {
  try {
    const {
      name,
      emoji,
      color,
      description,
      shortcut,
      category,
      children,
      featuredImage,
      isFavorite,
      parentId
    } = data;

    return {
      name,
      emoji: emoji || '🎭',
      color: color || '#6366F1',
      description,
      shortcut,
      category,
      children: children || '[]',
      featuredImage,
      isFavorite: isFavorite ?? false,
      parentId,
      ...(parentId && { parent: { connect: { id: parentId } } })
    };
  } catch (error) {
    logger.error('Error mapeando datos de creación de comodín:', error);
    throw error;
  }
}

/**
 * Mapea los datos de actualización de un comodín al formato de Prisma
 */
export function mapUpdateWildcardDataToPrisma(data: UpdateWildcardData): Prisma.WildcardUpdateInput {
  try {
    const {
      name,
      emoji,
      color,
      description,
      shortcut,
      category,
      children,
      featuredImage,
      isFavorite,
      parentId
    } = data;

    const prismaData: Prisma.WildcardUpdateInput = {};

    // Solo incluir campos que están presentes
    if (name !== undefined) prismaData.name = name;
    if (emoji !== undefined) prismaData.emoji = emoji;
    if (color !== undefined) prismaData.color = color;
    if (description !== undefined) prismaData.description = description;
    if (shortcut !== undefined) prismaData.shortcut = shortcut;
    if (category !== undefined) prismaData.category = category;
    if (children !== undefined) prismaData.children = children;
    if (featuredImage !== undefined) prismaData.featuredImage = featuredImage;
    if (isFavorite !== undefined) prismaData.isFavorite = isFavorite;

    // Manejo de relación con padre
    if (parentId !== undefined) {
      if (parentId === null) {
        prismaData.parent = { disconnect: true };
      } else {
        prismaData.parent = { connect: { id: parentId } };
      }
    }

    return prismaData;
  } catch (error) {
    logger.error('Error mapeando datos de actualización de comodín:', error);
    throw error;
  }
}

/**
 * Mapea los filtros de comodín al formato de Prisma
 */
export function mapWildcardFiltersToPrisma(filters?: WildcardFilters): Prisma.WildcardWhereInput {
  if (!filters) return {};

  const prismaFilters: Prisma.WildcardWhereInput = {};
  const { searchQuery, categories, onlyFavorites, parentId, hasChildren } = filters;

  if (searchQuery) {
    prismaFilters.OR = [
      { name: { contains: searchQuery, mode: 'insensitive' } },
      { description: { contains: searchQuery, mode: 'insensitive' } }
    ];
  }

  if (categories?.length) {
    prismaFilters.category = { in: categories };
  }

  if (onlyFavorites) {
    prismaFilters.isFavorite = true;
  }

  if (parentId !== undefined) {
    prismaFilters.parentId = parentId;
  }

  if (hasChildren !== undefined) {
    if (hasChildren) {
      prismaFilters.children = { not: '[]' };
    } else {
      prismaFilters.children = '[]';
    }
  }

  return prismaFilters;
}

/**
 * Mapea las opciones de búsqueda de comodines al formato de Prisma
 */
export function mapWildcardSearchOptionsToPrisma(options: {
  take?: number;
  skip?: number;
  sortBy?: WildcardSortCriteria;
  filters?: WildcardFilters;
  include?: Record<string, boolean>;
}): Prisma.WildcardFindManyArgs {
  try {
    const { take = 10, skip = 0, sortBy, filters, include } = options;

    // Determinar el campo y dirección de ordenamiento
    let orderBy: Prisma.WildcardOrderByWithRelationInput | undefined;
    if (sortBy) {
      const field = WILDCARD_SORT_PROPERTY_MAP[sortBy];
      const direction = sortBy.toLowerCase().includes('desc') ? 'desc' : 'asc';
      orderBy = { [field]: direction };
    } else {
      orderBy = { name: 'asc' };
    }

    const prismaOptions: Prisma.WildcardFindManyArgs = {
      take,
      skip,
      orderBy,
      where: mapWildcardFiltersToPrisma(filters),
      include: {
        _count: true,
        ...(include?.parent && { parent: true }),
        ...(include?.childWildcards && { childWildcards: true }),
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
        ...(include?.properties && { properties: true }),
        ...(include?.groups && { groups: true })
      }
    };

    return prismaOptions;
  } catch (error) {
    logger.error('Error mapeando opciones de búsqueda de comodines:', error);
    throw error;
  }
}