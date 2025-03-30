/**
 * @file Mappers para la entidad Concept
 * @module entities/concept/mappers
 */

import { logger } from '@/lib/logger';
import { CONCEPT_SORT_PROPERTY_MAP, type ConceptFilters, type ConceptSortCriteria, type CreateConceptData, type UpdateConceptData } from '@/types/entities/concept/types';
import type { Prisma } from '@prisma/client';
import { serializeConceptTags } from './serializers';

/**
 * Mapea los datos de creación de un concepto al formato de Prisma
 */
export function mapCreateConceptDataToPrisma(data: CreateConceptData): Prisma.ConceptCreateInput {
  try {
    const { name, emoji, color, description, content, category, tags, featuredImage, isFavorite, groupIds, propertyIds, wildcardIds } = data;

    const prismaData: Prisma.ConceptCreateInput = {
      name,
      emoji: emoji || '💡',
      color: color || '#4B5563',
      description,
      content: content || '',
      category: category || 'general',
      tags: Array.isArray(tags) ? serializeConceptTags(tags) : tags,
      featuredImage,
      isFavorite: isFavorite ?? false
    };

    // Mapear relaciones si existen
    if (groupIds?.length) {
      prismaData.groups = { connect: groupIds.map(id => ({ id })) };
    }
    if (propertyIds?.length) {
      prismaData.properties = { connect: propertyIds.map(id => ({ id })) };
    }
    if (wildcardIds?.length) {
      prismaData.wildcards = { connect: wildcardIds.map(id => ({ id })) };
    }

    return prismaData;
  } catch (error) {
    logger.error('Error mapeando datos de creación de concepto:', error);
    throw error;
  }
}

/**
 * Mapea los datos de actualización de un concepto al formato de Prisma
 */
export function mapUpdateConceptDataToPrisma(data: UpdateConceptData): Prisma.ConceptUpdateInput {
  try {
    const { name, emoji, color, description, content, category, tags, featuredImage, isFavorite, groupIds, propertyIds, wildcardIds } = data;

    const prismaData: Prisma.ConceptUpdateInput = {};

    // Solo incluir campos que están presentes
    if (name !== undefined) prismaData.name = name;
    if (emoji !== undefined) prismaData.emoji = emoji;
    if (color !== undefined) prismaData.color = color;
    if (description !== undefined) prismaData.description = description;
    if (content !== undefined) prismaData.content = content;
    if (category !== undefined) prismaData.category = category;
    if (tags !== undefined) prismaData.tags = Array.isArray(tags) ? serializeConceptTags(tags) : tags;
    if (featuredImage !== undefined) prismaData.featuredImage = featuredImage;
    if (isFavorite !== undefined) prismaData.isFavorite = isFavorite;

    // Mapear relaciones si existen
    if (groupIds?.length) {
      prismaData.groups = { set: groupIds.map(id => ({ id })) };
    }
    if (propertyIds?.length) {
      prismaData.properties = { set: propertyIds.map(id => ({ id })) };
    }
    if (wildcardIds?.length) {
      prismaData.wildcards = { set: wildcardIds.map(id => ({ id })) };
    }

    return prismaData;
  } catch (error) {
    logger.error('Error mapeando datos de actualización de concepto:', error);
    throw error;
  }
}

/**
 * Mapea los filtros de concepto al formato de Prisma
 */
export function mapConceptFiltersToPrisma(filters?: ConceptFilters): Prisma.ConceptWhereInput {
  if (!filters) return {};

  const prismaFilters: Prisma.ConceptWhereInput = {};
  const { searchQuery, categories, onlyFavorites, contentContains } = filters;

  if (searchQuery) {
    prismaFilters.OR = [
      { name: { contains: searchQuery, mode: 'insensitive' } },
      { description: { contains: searchQuery, mode: 'insensitive' } },
      { content: { contains: searchQuery, mode: 'insensitive' } }
    ];
  }

  if (categories?.length) {
    prismaFilters.category = { in: categories };
  }

  if (onlyFavorites) {
    prismaFilters.isFavorite = true;
  }

  if (contentContains) {
    prismaFilters.content = { contains: contentContains, mode: 'insensitive' };
  }

  return prismaFilters;
}

/**
 * Mapea las opciones de búsqueda de conceptos al formato de Prisma
 */
export function mapConceptSearchOptionsToPrisma(options: {
  take?: number;
  skip?: number;
  sortBy?: ConceptSortCriteria;
  filters?: ConceptFilters;
  include?: Record<string, boolean>;
}): Prisma.ConceptFindManyArgs {
  try {
    const { take = 10, skip = 0, sortBy, filters, include } = options;

    // Determinar el campo y dirección de ordenamiento
    let orderBy: Prisma.ConceptOrderByWithRelationInput | undefined;
    if (sortBy) {
      const field = CONCEPT_SORT_PROPERTY_MAP[sortBy];
      const direction = sortBy.toLowerCase().includes('desc') ? 'desc' : 'asc';
      orderBy = { [field]: direction };
    } else {
      orderBy = { name: 'asc' };
    }

    const prismaOptions: Prisma.ConceptFindManyArgs = {
      take,
      skip,
      orderBy,
      where: mapConceptFiltersToPrisma(filters),
      include: {
        _count: true,
        ...(include?.images && { images: true }),
        ...(include?.videos && { videos: true }),
        ...(include?.albums && { albums: true }),
        ...(include?.collections && { collections: true }),
        ...(include?.tagEntities && { tags: true }),
        ...(include?.characters && { characters: true }),
        ...(include?.places && { places: true }),
        ...(include?.worldItems && { worldItems: true }),
        ...(include?.prompts && { prompts: true }),
        ...(include?.notes && { notes: true }),
        ...(include?.wildcards && { wildcards: true }),
        ...(include?.properties && { properties: true }),
        ...(include?.groups && { groups: true })
      }
    };

    return prismaOptions;
  } catch (error) {
    logger.error('Error mapeando opciones de búsqueda de conceptos:', error);
    throw error;
  }
}