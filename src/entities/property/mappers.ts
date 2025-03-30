/**
 * @file Mappers para la entidad Property
 * @module entities/property/mappers
 */

import { logger } from '@/lib/logger';
import { type CreatePropertyData, PROPERTY_SORT_PROPERTY_MAP, type PropertyFilters, type PropertySortCriteria, type UpdatePropertyData } from '@/types/entities/property/types';
import type { Prisma } from '@prisma/client';

/**
 * Mapea los datos de creación de una propiedad al formato de Prisma
 */
export function mapCreatePropertyDataToPrisma(data: CreatePropertyData): Prisma.PropertyCreateInput {
  try {
    const { name, emoji, color, description, shortcut, category, featuredImage, isFavorite } = data;

    return {
      name,
      emoji: emoji || '🏷️',
      color: color || '#4F46E5',
      description,
      shortcut,
      category,
      featuredImage,
      isFavorite: isFavorite ?? false
    };
  } catch (error) {
    logger.error('Error mapeando datos de creación de propiedad:', error);
    throw error;
  }
}

/**
 * Mapea los datos de actualización de una propiedad al formato de Prisma
 */
export function mapUpdatePropertyDataToPrisma(data: UpdatePropertyData): Prisma.PropertyUpdateInput {
  try {
    const { name, emoji, color, description, shortcut, category, featuredImage, isFavorite } = data;

    const prismaData: Prisma.PropertyUpdateInput = {};

    // Solo incluir campos que están presentes
    if (name !== undefined) prismaData.name = name;
    if (emoji !== undefined) prismaData.emoji = emoji;
    if (color !== undefined) prismaData.color = color;
    if (description !== undefined) prismaData.description = description;
    if (shortcut !== undefined) prismaData.shortcut = shortcut;
    if (category !== undefined) prismaData.category = category;
    if (featuredImage !== undefined) prismaData.featuredImage = featuredImage;
    if (isFavorite !== undefined) prismaData.isFavorite = isFavorite;

    return prismaData;
  } catch (error) {
    logger.error('Error mapeando datos de actualización de propiedad:', error);
    throw error;
  }
}

/**
 * Mapea los filtros de propiedad al formato de Prisma
 */
export function mapPropertyFiltersToPrisma(filters?: PropertyFilters): Prisma.PropertyWhereInput {
  if (!filters) return {};

  const prismaFilters: Prisma.PropertyWhereInput = {};
  const { searchQuery, categories, onlyFavorites } = filters;

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

  return prismaFilters;
}

/**
 * Mapea las opciones de búsqueda de propiedades al formato de Prisma
 */
export function mapPropertySearchOptionsToPrisma(options: {
  take?: number;
  skip?: number;
  sortBy?: PropertySortCriteria;
  filters?: PropertyFilters;
  include?: Record<string, boolean>;
}): Prisma.PropertyFindManyArgs {
  try {
    const { take = 10, skip = 0, sortBy, filters, include } = options;

    // Determinar el campo y dirección de ordenamiento
    let orderBy: Prisma.PropertyOrderByWithRelationInput | undefined;
    if (sortBy) {
      const field = PROPERTY_SORT_PROPERTY_MAP[sortBy];
      const direction = sortBy.toLowerCase().includes('desc') ? 'desc' : 'asc';
      orderBy = { [field]: direction };
    } else {
      orderBy = { name: 'asc' };
    }

    const prismaOptions: Prisma.PropertyFindManyArgs = {
      take,
      skip,
      orderBy,
      where: mapPropertyFiltersToPrisma(filters),
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
        ...(include?.groups && { groups: true })
      }
    };

    return prismaOptions;
  } catch (error) {
    logger.error('Error mapeando opciones de búsqueda de propiedades:', error);
    throw error;
  }
}