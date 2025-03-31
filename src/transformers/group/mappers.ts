/**
 * @file Funciones de mapeo para la entidad Group
 * @module transformers/group/mappers
 */

import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@/lib/constants';
import { serverLogger } from '@/lib/logger/server-logger';
// Importar solo los tipos que se necesitan
import type {
    GroupCard,
    GroupListItem,
    GroupListItemImage
} from '@/types/entities/group';
// Definir los tipos que no están disponibles (mock)
type GroupBaseProps = {
    id: string;
    name: string;
    type: string;
    subtype?: string;
    description: string;
};
type GroupListProps = {
    items: GroupListItem[];
    filters: Record<string, any>;
    sort: {
        field: string;
        direction: string;
    };
    pagination: {
        totalItems: number;
        page: number;
        pageSize: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
    };
};
type GroupSearchParams = {
    search?: string;
    type?: string;
    category?: string;
    status?: string;
    favorite?: boolean;
    active?: boolean;
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
};
type GroupSortField = 'name' | 'type' | 'category' | 'status' | 'createdAt' | 'updatedAt';
type GroupSort = {
    field: GroupSortField;
    direction: 'asc' | 'desc';
};

import type { Group } from '@prisma/client';

const logger = serverLogger.withContext('GroupMappers');

/**
 * Mapear un Group para listado
 */
export function toGroupListItem(
  group: Group,
  options: {
    imageUrls?: string[],
    selected?: boolean,
    memberCount?: number
  } = {}
): GroupListItem {
  try {
    // Valores por defecto
    const { imageUrls = [], selected = false, memberCount = 0 } = options;

    // Mapear imágenes a formato de listado
    const mappedImages: GroupListItemImage[] = imageUrls.map(url => ({
      url
    }));

    // Construir objeto de listado
    return {
      id: group.id,
      name: group.name,
      type: group.type || 'generic',
      category: group.category || 'group',
      status: group.status || 'active',
      isFavorite: group.favorite || false,
      selected,
      images: mappedImages,
      memberCount
    };
  } catch (error) {
    logger.error('Error en toGroupListItem:', error);
    // Devolver objeto básico en caso de error
    return {
      id: group.id,
      name: group.name,
      type: group.type || 'generic',
      category: group.category || 'group',
      status: group.status || 'active',
      isFavorite: false,
      selected: false,
      images: [],
      memberCount: 0
    };
  }
}

/**
 * Mapear un Group para tarjeta
 */
export function toGroupCard(
  group: Group,
  options: {
    imageUrls?: string[],
    selected?: boolean,
    memberCount?: number
  } = {}
): GroupCard {
  try {
    // Valores por defecto
    const { imageUrls = [], selected = false, memberCount = 0 } = options;

    // Construir objeto de tarjeta
    return {
      id: group.id,
      name: group.name,
      type: group.type || 'generic',
      category: group.category || 'group',
      status: group.status || 'active',
      isFavorite: group.favorite || false,
      description: group.description || '',
      selected,
      imageUrl: imageUrls[0] || '',
      memberCount
    };
  } catch (error) {
    logger.error('Error en toGroupCard:', error);
    // Devolver objeto básico en caso de error
    return {
      id: group.id,
      name: group.name,
      type: group.type || 'generic',
      category: group.category || 'group',
      status: group.status || 'active',
      isFavorite: false,
      description: '',
      selected: false,
      imageUrl: '',
      memberCount: 0
    };
  }
}

/**
 * Convierte un grupo a un objeto mapeado para referencias
 */
export function toGroupReference(group: Group): GroupBaseProps {
  try {
    return {
      id: group.id,
      name: group.name,
      type: 'group',
      subtype: group.type || 'generic',
      description: group.description || '',
    };
  } catch (error) {
    logger.error('Error en toGroupReference:', error);
    return {
      id: group.id,
      name: group.name || 'Error',
      type: 'group',
      subtype: 'generic',
      description: '',
    };
  }
}

/**
 * Parsea opciones de búsqueda para Group
 */
export function parseGroupSearchParams(
  params: GroupSearchParams
): {
  where: Record<string, any>;
  orderBy: Record<string, string>[];
  skip: number;
  take: number;
} {
  try {
    // Parsear parámetros de paginación
    const { page = 1, pageSize = DEFAULT_PAGE_SIZE } = params;

    // Calcular skip y take para paginación
    const skip = (page - 1) * pageSize;
    const take = Math.min(pageSize, MAX_PAGE_SIZE);

    // Construir condiciones de búsqueda
    const where: Record<string, any> = {};

    // Filtro de búsqueda por texto
    if (params.search) {
      where.OR = [
        { name: { contains: params.search } },
        { description: { contains: params.search } }
      ];
    }

    // Filtros de igualdad exacta
    if (params.type) {
      where.type = params.type;
    }
    if (params.category) {
      where.category = params.category;
    }
    if (params.status) {
      where.status = params.status;
    }

    // Filtros booleanos
    if (params.favorite !== undefined) {
      where.favorite = params.favorite;
    }
    if (params.active !== undefined) {
      where.isActive = params.active;
    }

    // Ordenación
    const sortBy = params.sortBy || 'name';
    const sortDirection = params.sortDirection || 'asc';
    const orderBy = [{ [sortBy]: sortDirection }];

    return { where, orderBy, skip, take };
  } catch (error) {
    logger.error('Error parseando parámetros de búsqueda:', error);
    // Valores por defecto en caso de error
    return {
      where: {},
      orderBy: [{ name: 'asc' }],
      skip: 0,
      take: DEFAULT_PAGE_SIZE
    };
  }
}

/**
 * Convierte parámetros de búsqueda en filtros para UI
 */
export function toGroupSearchFilters(params: GroupSearchParams): Record<string, any> {
  try {
    return {
      search: params.search || '',
      type: params.type || '',
      category: params.category || '',
      status: params.status || '',
      favorite: params.favorite,
      active: params.active
    };
  } catch (error) {
    logger.error('Error al convertir a filtros de búsqueda:', error);
    return {
      search: '',
      type: '',
      category: '',
      status: ''
    };
  }
}

/**
 * Prepara datos para la vista de listado
 */
export function toGroupListProps(
  groups: Group[],
  params: GroupSearchParams,
  totalCount: number
): GroupListProps {
  try {
    // Construir ordenación
    const sort: GroupSort = {
      field: (params.sortBy as GroupSortField) || 'name',
      direction: params.sortDirection || 'asc'
    };

    // Construir paginación
    const page = Number(params.page) || 1;
    const pageSize = Number(params.pageSize) || DEFAULT_PAGE_SIZE;
    const totalPages = Math.ceil(totalCount / pageSize);

    const pagination = {
      totalItems: totalCount,
      page,
      pageSize,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    };

    // Construir filtros
    const filters = toGroupSearchFilters(params);

    // Mapear grupos a formato de listado
    const items = groups.map(group => toGroupListItem(group));

    return {
      items,
      filters,
      sort,
      pagination
    };
  } catch (error) {
    logger.error('Error preparando datos para lista:', error);
    return {
      items: [],
      filters: {
        search: '',
        type: '',
        category: '',
        status: ''
      },
      sort: {
        field: 'name',
        direction: 'asc'
      },
      pagination: {
        totalItems: 0,
        page: 1,
        pageSize: DEFAULT_PAGE_SIZE,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false
      }
    };
  }
}