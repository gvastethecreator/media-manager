/**
 * @file Funciones de mapeo para la entidad Group
 * @module transformers/group/mappers
 */

import { DEFAULT_VIEW_CONFIG } from '@/lib/constants';
import { serverLogger } from '@/lib/logger/server-logger';
import type {
    GroupCard,
    GroupListItem,
    GroupListItemImage,
    GroupListProps,
    GroupSearchParams
} from '@/types/entities/group';
import type { Group, Prisma } from '@prisma/client';

const logger = serverLogger.withContext('GroupMappers');

/**
 * Mapear un Group para listado
 */
export function toGroupListItem(
  group: Group,
  options: {
    imageUrls?: string[],
    selected?: boolean,
    imageCount?: number,
    videoCount?: number
  } = {}
): GroupListItem {
  try {
    // Valores por defecto
    const {
      imageUrls = [],
      selected = false,
      imageCount = 0,
      videoCount = 0
    } = options;

    // Mapear imágenes a formato de listado
    const mappedImages: GroupListItemImage[] = imageUrls.map(url => ({
      url
    }));

    // Construir objeto de listado
    return {
      id: group.id,
      name: group.name,
      emoji: group.emoji || '📂',
      color: group.color || '#3b82f6',
      category: group.category || 'general',
      isFavorite: group.favorite || false,
      selected,
      images: mappedImages,
      imageCount,
      videoCount,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt
    };
  } catch (error) {
    logger.error('Error en toGroupListItem:', error);
    // Devolver objeto básico en caso de error
    return {
      id: group.id,
      name: group.name,
      emoji: '📂',
      color: '#3b82f6',
      category: 'general',
      isFavorite: false,
      selected: false,
      images: [],
      imageCount: 0,
      videoCount: 0,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt
    };
  }
}

/**
 * Mapear un Group para tarjeta
 */
export function toGroupCard(
  group: Group,
  options: {
    imageUrl?: string,
    selected?: boolean,
    imageCount?: number,
    videoCount?: number
  } = {}
): GroupCard {
  try {
    // Valores por defecto
    const {
      imageUrl = '',
      selected = false,
      imageCount = 0,
      videoCount = 0
    } = options;

    // Construir objeto de tarjeta
    return {
      id: group.id,
      name: group.name,
      emoji: group.emoji || '📂',
      color: group.color || '#3b82f6',
      category: group.category || 'general',
      description: group.description || '',
      isFavorite: group.favorite || false,
      selected,
      imageUrl,
      imageCount,
      videoCount,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt
    };
  } catch (error) {
    logger.error('Error en toGroupCard:', error);
    // Devolver objeto básico en caso de error
    return {
      id: group.id,
      name: group.name,
      emoji: '📂',
      color: '#3b82f6',
      category: 'general',
      description: '',
      isFavorite: false,
      selected: false,
      imageUrl: '',
      imageCount: 0,
      videoCount: 0,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt
    };
  }
}

/**
 * Convierte un grupo a un objeto mapeado para referencias
 */
export function toGroupReference(group: Group): {
  id: string;
  name: string;
  type: string;
  emoji: string;
  color: string;
} {
  try {
    return {
      id: group.id,
      name: group.name,
      type: 'group',
      emoji: group.emoji || '📂',
      color: group.color || '#3b82f6'
    };
  } catch (error) {
    logger.error('Error en toGroupReference:', error);
    return {
      id: group.id,
      name: group.name || 'Error',
      type: 'group',
      emoji: '📂',
      color: '#3b82f6'
    };
  }
}

/**
 * Parsea opciones de búsqueda para Group
 */
export function parseGroupSearchParams(
  params: GroupSearchParams
): {
  where: Prisma.GroupWhereInput;
  orderBy: Prisma.GroupOrderByWithRelationInput;
  skip: number;
  take: number;
} {
  try {
    // Parsear parámetros de paginación
    const { page = 1, pageSize = DEFAULT_VIEW_CONFIG.pageSize } = params;

    // Calcular skip y take para paginación
    const skip = (page - 1) * pageSize;
    const take = Math.min(pageSize, 100); // Usar 100 como máximo si MAX_PAGE_SIZE no existe

    // Construir condiciones de búsqueda
    const where: Prisma.GroupWhereInput = {};

    // Filtro de búsqueda por texto
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } }
      ];
    }

    // Filtros de igualdad exacta
    if (params.category) {
      where.category = params.category;
    }

    // Filtros booleanos
    if (params.favorite !== undefined) {
      where.favorite = params.favorite;
    }

    // Ordenación
    const sortBy = params.sortBy || 'name';
    const sortDirection = params.sortDirection || 'asc';
    const orderBy = { [sortBy]: sortDirection };

    return { where, orderBy, skip, take };
  } catch (error) {
    logger.error('Error parseando parámetros de búsqueda:', error);
    // Valores por defecto en caso de error
    return {
      where: {},
      orderBy: { name: 'asc' },
      skip: 0,
      take: DEFAULT_VIEW_CONFIG.pageSize
    };
  }
}

/**
 * Convierte parámetros de búsqueda en filtros para UI
 */
export function toGroupSearchFilters(params: GroupSearchParams): Record<string, any> {
  try {
    const filters: Record<string, any> = {};

    // Filtros aplicados
    if (params.search) filters.search = params.search;
    if (params.category) filters.category = params.category;
    if (params.favorite !== undefined) filters.favorite = params.favorite;

    return filters;
  } catch (error) {
    logger.error('Error convirtiendo parámetros a filtros:', error);
    return {};
  }
}

/**
 * Genera props para listado de grupos
 */
export function toGroupListProps(
  groups: Group[],
  params: GroupSearchParams,
  totalCount: number
): GroupListProps {
  try {
    // Calcular metadatos de paginación
    const { page = 1, pageSize = DEFAULT_VIEW_CONFIG.pageSize } = params;
    const totalPages = Math.ceil(totalCount / pageSize);
    const hasMore = page < totalPages;

    // Mapear grupos para listado
    const items = groups.map(group => toGroupListItem(group));

    // Generar filtros aplicados
    const filters = toGroupSearchFilters(params);

    return {
      items,
      filters,
      pagination: {
        page,
        pageSize,
        totalItems: totalCount,
        totalPages,
        hasMore
      }
    };
  } catch (error) {
    logger.error('Error generando props para listado:', error);
    return {
      items: [],
      filters: {},
      pagination: {
        page: 1,
        pageSize: DEFAULT_VIEW_CONFIG.pageSize,
        totalItems: 0,
        totalPages: 0,
        hasMore: false
      }
    };
  }
}

// Exportación para compatibilidad
export const GroupMapper = {
  toGroupListItem,
  toGroupCard,
  toGroupReference,
  parseGroupSearchParams,
  toGroupSearchFilters,
  toGroupListProps
};

export default GroupMapper;