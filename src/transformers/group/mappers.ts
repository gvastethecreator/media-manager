/**
 * @file Funciones de mapeo para la entidad Group
 * @module transformers/group/mappers
 */

import { Logger } from '@/lib/logger';
import type {
    GroupComplete,
    GroupCreateInput,
    GroupFilters,
    GroupSearchOptions,
    GroupUpdateInput,
} from '@/types/entities/group/types';
import { DEFAULT_SEARCH_OPTIONS, DEFAULT_UI_VALUES } from '@/utils/transformers/constants';
import { handleTransformerError } from '@/utils/transformers/errors';
import { preparePrismaRelations } from '@/utils/transformers/relations';
import type { Prisma } from '@prisma/client';

const logger = new Logger('GroupMapper');

/**
 * 🔄 Mapea datos de creación a formato Prisma
 */
export function mapCreateGroupDataToPrisma(data: GroupCreateInput): Prisma.GroupCreateInput {
  try {
    // Preparar datos base
    const baseData = {
      name: data.name,
      emoji: data.emoji || DEFAULT_UI_VALUES.emoji,
      color: data.color || DEFAULT_UI_VALUES.color,
      description: data.description,
      shortcut: data.shortcut,
      category: data.category,
      sortBy: data.sortBy || 'name',
      filters: data.filters || '{}',
      featuredImage: data.featuredImage,
      isFavorite: data.isFavorite || false,
    };

    // Preparar relaciones
    const relations = preparePrismaRelations('Group', data);

    return {
      ...baseData,
      ...relations,
    };
  } catch (error) {
    throw handleTransformerError(error);
  }
}

/**
 * 🔄 Mapea datos de actualización a formato Prisma
 */
export function mapUpdateGroupDataToPrisma(data: GroupUpdateInput): Prisma.GroupUpdateInput {
  try {
    // Preparar datos base
    const baseData: Prisma.GroupUpdateInput = {};

    if (data.name !== undefined) baseData.name = data.name;
    if (data.emoji !== undefined) baseData.emoji = data.emoji;
    if (data.color !== undefined) baseData.color = data.color;
    if (data.description !== undefined) baseData.description = data.description;
    if (data.shortcut !== undefined) baseData.shortcut = data.shortcut;
    if (data.category !== undefined) baseData.category = data.category;
    if (data.sortBy !== undefined) baseData.sortBy = data.sortBy;
    if (data.filters !== undefined) baseData.filters = data.filters;
    if (data.featuredImage !== undefined) baseData.featuredImage = data.featuredImage;
    if (data.isFavorite !== undefined) baseData.isFavorite = data.isFavorite;

    // Preparar relaciones
    const relations = preparePrismaRelations('Group', data);

    return {
      ...baseData,
      ...relations,
    };
  } catch (error) {
    throw handleTransformerError(error);
  }
}

/**
 * 🔍 Mapea opciones de búsqueda a formato Prisma
 */
export function mapGroupSearchOptionsToPrisma(
  options: GroupSearchOptions = {}
): Prisma.GroupFindManyArgs {
  try {
    const { skip, take, orderBy } = { ...DEFAULT_SEARCH_OPTIONS, ...options };

    const args: Prisma.GroupFindManyArgs = {
      skip,
      take,
      orderBy: orderBy || { createdAt: 'desc' },
    };

    // Agregar condiciones de búsqueda
    if (options.where) {
      args.where = mapGroupFiltersToPrisma(options.where);
    }

    // Agregar includes
    if (options.include) {
      args.include = {
        images: options.include.images,
        videos: options.include.videos,
        albums: options.include.albums,
        collections: options.include.collections,
        tags: options.include.tags,
        characters: options.include.characters,
        places: options.include.places,
        worldItems: options.include.worldItems,
        concepts: options.include.concepts,
        prompts: options.include.prompts,
        notes: options.include.notes,
        wildcards: options.include.wildcards,
        properties: options.include.properties,
        _count: true,
      };
    }

    return args;
  } catch (error) {
    throw handleTransformerError(error);
  }
}

/**
 * 🔍 Mapea filtros a formato Prisma
 */
export function mapGroupFiltersToPrisma(filters: GroupFilters): Prisma.GroupWhereInput {
  try {
    const where: Prisma.GroupWhereInput = {};

    // Búsqueda por texto
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Filtro por categorías
    if (filters.categories?.length) {
      where.category = { in: filters.categories };
    }

    // Filtro por tags
    if (filters.tags?.length) {
      where.tags = {
        some: {
          id: { in: filters.tags },
        },
      };
    }

    // Filtro por rango de fechas
    if (filters.dateRange) {
      where.createdAt = {};
      if (filters.dateRange.start) {
        where.createdAt.gte = filters.dateRange.start;
      }
      if (filters.dateRange.end) {
        where.createdAt.lte = filters.dateRange.end;
      }
    }

    // Filtro por favoritos
    if (filters.isFavorite !== undefined) {
      where.isFavorite = filters.isFavorite;
    }

    // Filtros de relaciones
    if (filters.hasImages) {
      where.images = { some: {} };
    }
    if (filters.hasVideos) {
      where.videos = { some: {} };
    }
    if (filters.hasAlbums) {
      where.albums = { some: {} };
    }
    if (filters.hasCollections) {
      where.collections = { some: {} };
    }

    return where;
  } catch (error) {
    throw handleTransformerError(error);
  }
}

/**
 * 🔄 Mapea un grupo a su versión relacionada
 */
export function mapGroupToRelatedGroup(group: GroupComplete) {
  try {
    return {
      id: group.id,
      name: group.name,
      emoji: group.emoji,
      color: group.color,
      description: group.description,
      featuredImage: group.featuredImage,
      _count: group._count,
    };
  } catch (error) {
    throw handleTransformerError(error);
  }
}