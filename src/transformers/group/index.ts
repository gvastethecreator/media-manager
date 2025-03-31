/**
 * @file Transformer para la entidad Group
 * @module transformers/group
 */

import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@/lib/constants';
import { prisma } from '@/lib/db';
import { NotFoundError, TransformerError, ValidationError } from '@/lib/errors';
import { serverLogger } from '@/lib/logger/server-logger';
import type {
    GroupCreateInput,
    GroupExtended,
    GroupSearchResult,
    GroupUpdateInput
} from '@/types/entities/group';
import { toGroupListItem } from './mappers';
import { parseGroupFilterObject, toExtendedGroup, toPrismaGroup, validateGroup } from './serializers';

const logger = serverLogger.withContext('GroupTransformer');

/**
 * Busca grupos según los filtros proporcionados
 */
export async function searchGroups(
  filters: Record<string, any> = {},
  options: {
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    includeInactive?: boolean;
  } = {}
): Promise<GroupSearchResult> {
  try {
    const {
      page = 1,
      pageSize = DEFAULT_PAGE_SIZE,
      sortBy = 'name',
      sortOrder = 'asc',
      includeInactive = false,
    } = options;

    // Limitar el tamaño de página
    const limitedPageSize = Math.min(pageSize, MAX_PAGE_SIZE);

    // Calcular offset para paginación
    const skip = (page - 1) * limitedPageSize;

    // Parsear filtros
    const parsedFilters = parseGroupFilterObject(filters);

    // Agregar filtro para incluir/excluir inactivos
    if (!includeInactive) {
      parsedFilters.isActive = true;
    }

    // Ordenación
    const orderBy = { [sortBy]: sortOrder };

    // Ejecutar consulta
    const [groups, totalCount] = await Promise.all([
      prisma.group.findMany({
        where: parsedFilters,
        orderBy,
        skip,
        take: limitedPageSize,
      }),
      prisma.group.count({
        where: parsedFilters,
      }),
    ]);

    // Calcular metadata de paginación
    const totalPages = Math.ceil(totalCount / limitedPageSize);
    const hasMore = page < totalPages;

    // Mapear resultados
    const items = groups.map(group => toGroupListItem(group));

    return {
      items,
      pagination: {
        page,
        pageSize: limitedPageSize,
        totalItems: totalCount,
        totalPages,
        hasMore,
      },
    };
  } catch (error) {
    logger.error('Error buscando grupos:', error);
    throw new TransformerError('Error al buscar grupos', { cause: error });
  }
}

/**
 * Obtiene un grupo por su ID
 */
export async function getGroupById(
  id: string,
  options: {
    includeRelations?: boolean;
    throwIfNotFound?: boolean;
  } = {}
): Promise<GroupExtended | null> {
  try {
    const { includeRelations = false, throwIfNotFound = true } = options;

    // Construir opciones de inclusión de relaciones
    const include = includeRelations ? {
      members: true,
      images: true,
      _count: {
        select: {
          members: true,
          images: true,
          notes: true,
        },
      },
    } : undefined;

    // Buscar grupo
    const group = await prisma.group.findUnique({
      where: { id },
      include,
    });

    // Si no existe y se debe lanzar error
    if (!group && throwIfNotFound) {
      throw new NotFoundError(`Grupo con ID ${id} no encontrado`);
    }

    // Si no existe, devolver null
    if (!group) {
      return null;
    }

    // Transformar a formato extendido
    return toExtendedGroup(group);
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    logger.error(`Error obteniendo grupo ${id}:`, error);
    throw new TransformerError(`Error al obtener grupo ${id}`, { cause: error });
  }
}

/**
 * Obtiene varios grupos por sus IDs
 */
export async function getGroupsByIds(
  ids: string[],
  options: {
    includeRelations?: boolean;
  } = {}
): Promise<GroupExtended[]> {
  try {
    const { includeRelations = false } = options;

    // Si no hay IDs, devolver array vacío
    if (!ids.length) {
      return [];
    }

    // Construir opciones de inclusión de relaciones
    const include = includeRelations
      ? {
          members: true,
          images: true,
          _count: {
            select: {
              members: true,
              images: true,
              notes: true,
            },
          },
        }
      : undefined;

    // Buscar grupos
    const groups = await prisma.group.findMany({
      where: {
        id: { in: ids },
      },
      include,
    });

    // Transformar a formato extendido
    return groups.map(group => toExtendedGroup(group));
  } catch (error) {
    logger.error('Error obteniendo grupos por IDs:', error);
    throw new TransformerError('Error al obtener grupos por IDs', { cause: error });
  }
}

/**
 * Crea un nuevo grupo
 */
export async function createGroup(
  data: GroupCreateInput
): Promise<GroupExtended> {
  try {
    // Validar datos
    validateGroup(data);

    // Transformar a formato Prisma
    const prismaData = toPrismaGroup(data);

    // Crear grupo
    const group = await prisma.group.create({
      data: prismaData,
    });

    // Transformar a formato extendido
    return toExtendedGroup(group);
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    logger.error('Error creando grupo:', error);
    throw new TransformerError('Error al crear grupo', { cause: error });
  }
}

/**
 * Actualiza un grupo existente
 */
export async function updateGroup(
  id: string,
  data: GroupUpdateInput
): Promise<GroupExtended> {
  try {
    // Verificar que el grupo existe
    const exists = await prisma.group.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundError(`Grupo con ID ${id} no encontrado`);
    }

    // Transformar a formato Prisma
    const prismaData = toPrismaGroup(data);

    // Actualizar grupo
    const updated = await prisma.group.update({
      where: { id },
      data: prismaData,
    });

    // Transformar a formato extendido
    return toExtendedGroup(updated);
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    logger.error(`Error actualizando grupo ${id}:`, error);
    throw new TransformerError(`Error al actualizar grupo ${id}`, { cause: error });
  }
}

/**
 * Elimina un grupo
 */
export async function deleteGroup(
  id: string,
  options: {
    softDelete?: boolean;
  } = {}
): Promise<boolean> {
  try {
    const { softDelete = true } = options;

    // Verificar que el grupo existe
    const exists = await prisma.group.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundError(`Grupo con ID ${id} no encontrado`);
    }

    if (softDelete) {
      // Marcar como inactivo en lugar de eliminar
      await prisma.group.update({
        where: { id },
        data: { isActive: false },
      });
    } else {
      // Eliminar permanentemente
      await prisma.group.delete({
        where: { id },
      });
    }

    return true;
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    logger.error(`Error eliminando grupo ${id}:`, error);
    throw new TransformerError(`Error al eliminar grupo ${id}`, { cause: error });
  }
}

/**
 * Parsea opciones de filtro para grupos
 */
export function parseGroupFilterOptions(
  options: Record<string, any> = {}
): Record<string, any> {
  try {
    const filters: Record<string, any> = {};

    // Filtro de búsqueda por texto
    if (options.search) {
      filters.OR = [
        { name: { contains: options.search, mode: 'insensitive' } },
        { description: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    // Filtros por propiedades exactas
    const exactProperties = ['type', 'category', 'status'];
    for (const prop of exactProperties) {
      if (options[prop]) {
        filters[prop] = options[prop];
      }
    }

    // Filtros booleanos
    if (options.favorite !== undefined) {
      filters.favorite = options.favorite === 'true' || options.favorite === true;
    }

    if (options.active !== undefined) {
      filters.isActive = options.active === 'true' || options.active === true;
    }

    return filters;
  } catch (error) {
    logger.error('Error parseando opciones de filtro:', error);
    return {};
  }
}

/**
 * Convierte un grupo a un formato relacionado (para asociaciones)
 */
export function toRelatedGroup(
  group: Record<string, any>,
  options: {
    includeDetails?: boolean;
  } = {}
): Record<string, any> {
  try {
    const { includeDetails = false } = options;

    if (!group) {
      return null;
    }

    if (!includeDetails) {
      // Versión básica con solo ID y nombre
      return {
        id: group.id,
        name: group.name,
        type: 'group',
      };
    }

    // Versión detallada con más propiedades
    return {
      id: group.id,
      name: group.name,
      type: 'group',
      category: group.category || '',
      description: group.description || '',
      memberCount: group._count?.members || 0,
    };
  } catch (error) {
    logger.error('Error convirtiendo a grupo relacionado:', error);
    return { id: group.id, name: group.name || 'Error', type: 'group' };
  }
}

// Exportar funciones individualmente y como compatibilidad con la API anterior
export default {
  searchGroups,
  getGroupById,
  getGroupsByIds,
  createGroup,
  updateGroup,
  deleteGroup,
  parseGroupFilterOptions,
  toRelatedGroup,
};