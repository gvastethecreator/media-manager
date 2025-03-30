/**
 * @file Funciones para mapear datos de Wildcard entre formatos
 * @module transformers/wildcard/mappers
 */

import { createLogger } from '@/lib/logger';
import {
    CreateWildcardData,
    UpdateWildcardData,
    WILDCARD_SORT_PROPERTY_MAP,
    WildcardBase,
    WildcardComplete,
    WildcardFilters,
    WildcardSortCriteria
} from '@/types/entities/wildcard';
import { Prisma } from '@prisma/client';
import { DEFAULT_WILDCARD_COLOR, DEFAULT_WILDCARD_EMOJI, serializeWildcardChildren, toRelatedWildcard } from './serializers';

// Logger específico para este módulo
const logger = createLogger('WildcardTransformer:Mappers');

/**
 * Mapea datos de creación de Wildcard al formato de Prisma
 * @param data Datos para crear un Wildcard
 * @returns Datos en formato Prisma.WildcardCreateInput
 */
export function mapCreateWildcardDataToPrisma(
  data: CreateWildcardData
): Prisma.WildcardCreateInput {
  try {
    // Valores por defecto
    const emoji = data.emoji || DEFAULT_WILDCARD_EMOJI;
    const color = data.color || DEFAULT_WILDCARD_COLOR;

    // Datos base
    const result: Prisma.WildcardCreateInput = {
      name: data.name,
      emoji,
      color,
      description: data.description || '',
      children: serializeWildcardChildren(data.children || []),
      isPublic: data.isPublic ?? true,
      isActive: data.isActive ?? true,
      isLocked: data.isLocked ?? false,
      isHidden: data.isHidden ?? false,
      isDefault: data.isDefault ?? false,
      sortOrder: data.sortOrder ?? 0,
      userId: data.userId
    };

    // Agregar relación padre si existe
    if (data.parentId) {
      result.parent = {
        connect: { id: data.parentId }
      };
    }

    // Manejar colección si se proporciona
    if (data.collectionId) {
      result.collections = {
        connect: [{ id: data.collectionId }]
      };
    }

    // Manejar etiquetas si se proporcionan
    if (data.tagIds && data.tagIds.length > 0) {
      result.tags = {
        connect: data.tagIds.map(id => ({ id }))
      };
    }

    return result;
  } catch (error) {
    logger.error('Error en mapCreateWildcardDataToPrisma:', error);
    throw new Error(`Error mapeando datos de creación: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Mapea datos de actualización de Wildcard al formato de Prisma
 * @param id ID del Wildcard a actualizar
 * @param data Datos para actualizar un Wildcard
 * @returns Datos en formato Prisma.WildcardUpdateArgs
 */
export function mapUpdateWildcardDataToPrisma(
  id: string,
  data: UpdateWildcardData
): Prisma.WildcardUpdateArgs {
  try {
    // Datos base para actualizar
    const updateData: Prisma.WildcardUpdateInput = {
      name: data.name,
      emoji: data.emoji,
      color: data.color,
      description: data.description,
      isPublic: data.isPublic,
      isActive: data.isActive,
      isLocked: data.isLocked,
      isHidden: data.isHidden,
      isDefault: data.isDefault,
      sortOrder: data.sortOrder,
      userId: data.userId
    };

    // Eliminar campos undefined
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof typeof updateData] === undefined) {
        delete updateData[key as keyof typeof updateData];
      }
    });

    // Manejar hijos si se proporcionan
    if (data.children !== undefined) {
      updateData.children = serializeWildcardChildren(data.children);
    }

    // Manejar relación padre
    if (data.parentId !== undefined) {
      if (data.parentId === null) {
        updateData.parent = { disconnect: true };
      } else {
        updateData.parent = { connect: { id: data.parentId } };
      }
    }

    // Manejar etiquetas
    if (data.tagIds) {
      updateData.tags = {
        set: data.tagIds.map(id => ({ id }))
      };
    }

    // Manejar colecciones
    if (data.collectionIds) {
      updateData.collections = {
        set: data.collectionIds.map(id => ({ id }))
      };
    }

    return {
      where: { id },
      data: updateData
    };
  } catch (error) {
    logger.error('Error en mapUpdateWildcardDataToPrisma:', error);
    throw new Error(`Error mapeando datos de actualización: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Mapea filtros de Wildcard al formato de Prisma para consultas
 * @param filters Filtros para consultar Wildcards
 * @returns Filtros en formato Prisma.WildcardWhereInput
 */
export function mapWildcardFiltersToPrisma(
  filters: WildcardFilters = {}
): {
  where: Prisma.WildcardWhereInput;
  orderBy: Prisma.WildcardOrderByWithRelationInput | Prisma.WildcardOrderByWithRelationInput[];
  skip?: number;
  take?: number;
} {
  try {
    // Construir filtro base
    const where: Prisma.WildcardWhereInput = {};

    // Filtrar por IDs
    if (filters.ids && filters.ids.length > 0) {
      where.id = { in: filters.ids };
    }

    // Filtrar por ID único
    if (filters.id) {
      where.id = filters.id;
    }

    // Filtrar por nombre
    if (filters.name) {
      where.name = {
        contains: filters.name,
        mode: 'insensitive'
      };
    }

    // Filtrar por usuario
    if (filters.userId) {
      where.userId = filters.userId;
    }

    // Filtrar por visibilidad
    if (filters.isPublic !== undefined) {
      where.isPublic = filters.isPublic;
    }

    // Filtrar por estado activo
    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    // Filtrar por estado bloqueado
    if (filters.isLocked !== undefined) {
      where.isLocked = filters.isLocked;
    }

    // Filtrar por estado oculto
    if (filters.isHidden !== undefined) {
      where.isHidden = filters.isHidden;
    }

    // Filtrar por estado por defecto
    if (filters.isDefault !== undefined) {
      where.isDefault = filters.isDefault;
    }

    // Filtrar por padre
    if (filters.parentId !== undefined) {
      if (filters.parentId === null) {
        where.parentId = null;
      } else {
        where.parentId = filters.parentId;
      }
    }

    // Filtrar por etiquetas
    if (filters.tagIds && filters.tagIds.length > 0) {
      where.tags = {
        some: {
          id: { in: filters.tagIds }
        }
      };
    }

    // Filtrar por colecciones
    if (filters.collectionIds && filters.collectionIds.length > 0) {
      where.collections = {
        some: {
          id: { in: filters.collectionIds }
        }
      };
    }

    // Filtrar por tipo de elemento relacionado
    if (filters.relatedTo) {
      const { entityType, entityId } = filters.relatedTo;

      switch (entityType) {
        case 'image':
          where.images = { some: { id: entityId } };
          break;
        case 'video':
          where.videos = { some: { id: entityId } };
          break;
        case 'album':
          where.albums = { some: { id: entityId } };
          break;
        case 'collection':
          where.collections = { some: { id: entityId } };
          break;
        case 'tag':
          where.tags = { some: { id: entityId } };
          break;
        case 'character':
          where.characters = { some: { id: entityId } };
          break;
        case 'place':
          where.places = { some: { id: entityId } };
          break;
        case 'worldItem':
          where.worldItems = { some: { id: entityId } };
          break;
        case 'concept':
          where.concepts = { some: { id: entityId } };
          break;
        case 'prompt':
          where.prompts = { some: { id: entityId } };
          break;
        case 'note':
          where.notes = { some: { id: entityId } };
          break;
        case 'property':
          where.properties = { some: { id: entityId } };
          break;
        case 'group':
          where.groups = { some: { id: entityId } };
          break;
        default:
          logger.warn(`Tipo de entidad no soportado: ${entityType}`);
      }
    }

    // Filtrar por búsqueda de texto
    if (filters.searchTerm) {
      const term = filters.searchTerm.trim();
      if (term) {
        where.OR = [
          { name: { contains: term, mode: 'insensitive' } },
          { description: { contains: term, mode: 'insensitive' } }
        ];
      }
    }

    // Determinar ordenamiento
    const orderBy: Prisma.WildcardOrderByWithRelationInput = {};

    if (filters.sortBy) {
      const sortProperty = WILDCARD_SORT_PROPERTY_MAP[filters.sortBy as WildcardSortCriteria] || 'createdAt';
      const sortOrder = filters.sortDirection === 'asc' ? 'asc' : 'desc';

      orderBy[sortProperty as keyof Prisma.WildcardOrderByWithRelationInput] = sortOrder;
    } else {
      // Ordenamiento por defecto
      orderBy.createdAt = 'desc';
    }

    // Paginación
    const skip = filters.skip;
    const take = filters.limit || 100;

    return { where, orderBy, skip, take };
  } catch (error) {
    logger.error('Error en mapWildcardFiltersToPrisma:', error);
    throw new Error(`Error mapeando filtros: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Mapea un Wildcard a un formato simplificado para relaciones
 * @param wildcard Wildcard completo a simplificar
 * @returns Wildcard simplicado para relaciones
 */
export function mapWildcardToRelatedWildcard(
  wildcard: WildcardBase | WildcardComplete | null
): ReturnType<typeof toRelatedWildcard> | null {
  if (!wildcard) return null;
  return toRelatedWildcard(wildcard);
}

/**
 * Convierte un array de Wildcards a formato para relaciones
 * @param wildcards Array de Wildcards a convertir
 * @returns Array de Wildcards simplificados
 */
export function mapWildcardsToRelatedWildcards(
  wildcards: Array<WildcardBase | WildcardComplete> | null
): Array<ReturnType<typeof toRelatedWildcard>> {
  if (!wildcards || !Array.isArray(wildcards)) return [];
  return wildcards.map(wildcard => toRelatedWildcard(wildcard));
}