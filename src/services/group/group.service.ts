/**
 * @file Servicio para la gestión de grupos
 * @module services/group
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { emit } from '@/lib/server/events.server';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats.service';
import {
    createGroup,
    deleteGroup,
    getGroupById,
    getGroupsByIds,
    searchGroups,
    updateGroup
} from '@/transformers/group';
import type {
    GroupComplete,
    GroupCreateInput,
    GroupRelations,
    GroupSearchResult,
    GroupUpdateInput,
    GroupWithStats
} from '@/types/entities/group';

// Logger específico para el servicio de grupos
const logger = serverLogger.withContext('GroupService');

// Códigos de error
export enum GroupErrorCode {
  NOT_FOUND = 'GROUP_NOT_FOUND',
  ALREADY_EXISTS = 'GROUP_ALREADY_EXISTS',
  INVALID_DATA = 'GROUP_INVALID_DATA',
  OPERATION_FAILED = 'GROUP_OPERATION_FAILED',
  PERMISSION_DENIED = 'GROUP_PERMISSION_DENIED'
}

// Constructor de errores para grupos
export const createGroupError = (
  message: string,
  code: GroupErrorCode = GroupErrorCode.OPERATION_FAILED,
  cause?: unknown
) => {
  const error = new Error(message);
  error.name = 'GroupServiceError';
  Object.assign(error, { code, cause });
  return error;
};

// Eventos del servicio
export const GROUP_EVENTS = {
  CREATED: 'group:created',
  UPDATED: 'group:updated',
  DELETED: 'group:deleted',
  ITEMS_ADDED: 'group:items:added',
  ITEMS_REMOVED: 'group:items:removed',
  STATS_UPDATED: 'group:stats:updated'
} as const;

// Notificación de cambios en grupos
export const notifyGroupChange = async (
  action: 'create' | 'update' | 'delete' | 'items:add' | 'items:remove',
  group: GroupComplete | { id: string }
) => {
  // Usar EventType válido del sistema central
  const eventType = 'update'; // Tipo válido para grupos según EventType

  // Emitir evento
  await emit({
    type: eventType,
    data: { action, group },
  });

  // Notificar a estadísticas
  statsEventEmitter.emit(STATS_EVENTS.GROUP_CHANGE);

  logger.info(`🔔 Notificado cambio en grupo: ${action}`, { groupId: group.id });
};

/**
 * Obtiene un grupo por su ID
 */
export const getGroupService = async (id: string): Promise<GroupComplete | null> => {
  try {
    logger.info(`🔍 Buscando grupo con ID: ${id}`);
    const group = await getGroupById(id, { includeRelations: true, throwIfNotFound: false });

    if (!group) {
      logger.warn(`⚠️ Grupo no encontrado: ${id}`);
      return null;
    }

    logger.info(`✅ Grupo encontrado: ${group.name}`);
    return group;
  } catch (error) {
    logger.error('❌ Error al obtener grupo por ID', { error, groupId: id });

    // Type guard para manejar error unknown
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw createGroupError(`Error al obtener grupo: ${errorMessage}`, GroupErrorCode.OPERATION_FAILED, error);
  }
};

/**
 * Obtiene múltiples grupos por sus IDs
 */
export const getGroupsByIdsService = async (ids: string[]): Promise<GroupComplete[]> => {
  try {    logger.info(`🔍 Buscando grupos por IDs, cantidad: ${ids.length}`);

    if (ids.length === 0) {
      return [];
    }

    const groups = await getGroupsByIds(ids, { includeRelations: true });
    logger.info(`✅ Grupos encontrados: ${groups.length}`);
    return groups;  } catch (error) {
    logger.error('❌ Error al obtener grupos por IDs', { error, ids });
    throw createGroupError(`Error al obtener grupos: ${error instanceof Error ? error.message : String(error)}`, GroupErrorCode.OPERATION_FAILED, error);
  }
};

/**
 * Busca grupos según criterios específicos
 */
export const searchGroupsService = async (
  filters: Record<string, any> = {},
  options: {
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    includeInactive?: boolean;
  } = {}
): Promise<GroupSearchResult> => {  try {
    logger.info('🔍 Buscando grupos con filtros');
    const result = await searchGroups(filters, options);
    logger.info(`✅ Búsqueda completada, encontrados ${result.total} grupos`);
    return result;
  } catch (error) {
    logger.error('❌ Error al buscar grupos', { error, filters, options });
    throw createGroupError(`Error al buscar grupos: ${error instanceof Error ? error.message : String(error)}`, GroupErrorCode.OPERATION_FAILED, error);
  }
};

/**
 * Crea un nuevo grupo
 */
export const createGroupService = async (data: GroupCreateInput): Promise<GroupComplete> => {
  try {
    logger.info('✨ Creando nuevo grupo', { name: data.name });

    // Verificar si ya existe un grupo con el mismo nombre
    if (data.name) {
      const existingGroup = await prisma.group.findFirst({
        where: { name: data.name }
      });      if (existingGroup) {
        throw createGroupError(
          `Ya existe un grupo con el nombre "${data.name}"`,
          GroupErrorCode.ALREADY_EXISTS
        );
      }
    }

    // Crear grupo usando el transformador
    const group = await createGroup(data);

    // Notificar creación
    await notifyGroupChange('create', group);    logger.info(`✅ Grupo creado: ${group.name}`, { groupId: group.id });
    return group;
  } catch (error) {
    logger.error('❌ Error al crear grupo', { error, data });

    if (error instanceof Error && error.name === 'GroupServiceError') {
      throw error;
    }

    throw createGroupError(`Error al crear grupo: ${error instanceof Error ? error.message : String(error)}`, GroupErrorCode.OPERATION_FAILED, error);
  }
};

/**
 * Actualiza un grupo existente
 */
export const updateGroupService = async (id: string, data: GroupUpdateInput): Promise<GroupComplete> => {
  try {
    logger.info(`📝 Actualizando grupo: ${id}`);

    // Verificar que el grupo existe
    const existingGroup = await prisma.group.findUnique({
      where: { id }
    });

    if (!existingGroup) {
      throw createGroupError(
        `No se encontró el grupo con ID: ${id}`,
        GroupErrorCode.NOT_FOUND
      );
    }

    // Verificar nombre único si se está actualizando
    if (data.name && data.name !== existingGroup.name) {
      const groupWithSameName = await prisma.group.findFirst({
        where: {
          name: data.name,
          id: { not: id }
        }
      });

      if (groupWithSameName) {
        throw createGroupError(
          `Ya existe un grupo con el nombre "${data.name}"`,
          GroupErrorCode.ALREADY_EXISTS
        );
      }
    }

    // Actualizar grupo usando el transformador
    const group = await updateGroup(id, data);

    // Notificar actualización
    await notifyGroupChange('update', group);

    logger.info(`✅ Grupo actualizado: ${group.name}`, { groupId: group.id });
    return group;
  } catch (error) {
    logger.error('❌ Error al actualizar grupo', { error, groupId: id, data });

    if (error instanceof Error && error.name === 'GroupServiceError') {
      throw error;
    }

    throw createGroupError(`Error al actualizar grupo: ${error instanceof Error ? error.message : String(error)}`, GroupErrorCode.OPERATION_FAILED, error);
  }
};

/**
 * Elimina un grupo
 */
export const deleteGroupService = async (id: string): Promise<void> => {
  try {
    logger.info(`🗑️ Eliminando grupo: ${id}`);

    // Verificar que el grupo existe
    const existingGroup = await prisma.group.findUnique({
      where: { id }
    });

    if (!existingGroup) {
      throw createGroupError(
        `No se encontró el grupo con ID: ${id}`,
        GroupErrorCode.NOT_FOUND
      );
    }

    // Notificar antes de eliminar
    await notifyGroupChange('delete', { id });

    // Eliminar usando el transformador
    await deleteGroup(id);

    logger.info(`✅ Grupo eliminado: ${id}`);
  } catch (error) {
    logger.error('❌ Error al eliminar grupo', { error, groupId: id });

    if (error instanceof Error && error.name === 'GroupServiceError') {
      throw error;
    }

    throw createGroupError(`Error al eliminar grupo: ${error instanceof Error ? error.message : String(error)}`, GroupErrorCode.OPERATION_FAILED, error);
  }
};

/**
 * Obtiene estadísticas de un grupo
 */
export const getGroupStatsService = async (id: string): Promise<GroupWithStats> => {
  try {
    logger.info(`📊 Obteniendo estadísticas del grupo: ${id}`);

    // Verificar que el grupo existe y obtener conteos usando _count
    const groupWithCounts = await prisma.group.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            images: true,
            videos: true,
            albums: true,
            tags: true,
            collections: true,
            characters: true,
            places: true,
            worldItems: true,
            concepts: true,
            prompts: true,
            notes: true,
            wildcards: true,
            properties: true
          }
        }
      }
    });

    if (!groupWithCounts) {
      throw createGroupError(
        `No se encontró el grupo con ID: ${id}`,
        GroupErrorCode.NOT_FOUND
      );
    }

    // Construir el objeto de estadísticas
    const stats: GroupWithStats = {
      ...groupWithCounts,
      _count: groupWithCounts._count,
      totalEntities: Object.values(groupWithCounts._count).reduce((total, count) => total + count, 0),
      lastUpdated: groupWithCounts.updatedAt
    };

    logger.info(`✅ Estadísticas obtenidas para grupo: ${id}`);
    return stats;
  } catch (error) {
    logger.error('❌ Error al obtener estadísticas del grupo', { error, groupId: id });
    throw createGroupError(`Error al obtener estadísticas: ${error instanceof Error ? error.message : String(error)}`, GroupErrorCode.OPERATION_FAILED, error);
  }
};

/**
 * Añade un elemento a un grupo
 */
export const addItemToGroupService = async (
  groupId: string,
  itemId: string,
  itemType: keyof GroupRelations
): Promise<void> => {
  try {
    logger.info('➕ Añadiendo elemento a grupo', { groupId, itemId, itemType });

    // Verificar que el grupo existe
    const existingGroup = await prisma.group.findUnique({
      where: { id: groupId }
    });

    if (!existingGroup) {
      throw createGroupError(
        `No se encontró el grupo con ID: ${groupId}`,
        GroupErrorCode.NOT_FOUND
      );
    }

    // Validar y crear la relación según el tipo usando connect
    switch (itemType) {
      case 'images':
        await prisma.group.update({
          where: { id: groupId },
          data: {
            images: {
              connect: { id: itemId }
            }
          }
        });
        break;
      case 'videos':
        await prisma.group.update({
          where: { id: groupId },
          data: {
            videos: {
              connect: { id: itemId }
            }
          }
        });
        break;
      case 'albums':
        await prisma.group.update({
          where: { id: groupId },
          data: {
            albums: {
              connect: { id: itemId }
            }
          }
        });
        break;
      case 'tags':
        await prisma.group.update({
          where: { id: groupId },
          data: {
            tags: {
              connect: { id: itemId }
            }
          }
        });
        break;
      default:
        throw createGroupError(
          `Tipo de elemento no soportado: ${itemType}`,
          GroupErrorCode.INVALID_DATA
        );
    }

    // Notificar cambio
    await notifyGroupChange('items:add', { id: groupId });

    logger.info('✅ Elemento añadido al grupo', { groupId, itemId, itemType });
  } catch (error) {
    logger.error('❌ Error al añadir elemento al grupo', { error, groupId, itemId, itemType });

    if (error instanceof Error && error.name === 'GroupServiceError') {
      throw error;
    }

    throw createGroupError(`Error al añadir elemento: ${error instanceof Error ? error.message : String(error)}`, GroupErrorCode.OPERATION_FAILED, error);
  }
};

/**
 * Elimina un elemento de un grupo
 */
export const removeItemFromGroupService = async (
  groupId: string,
  itemId: string,
  itemType: keyof GroupRelations
): Promise<void> => {
  try {
    logger.info('➖ Eliminando elemento del grupo', { groupId, itemId, itemType });

    // Verificar que el grupo existe
    const existingGroup = await prisma.group.findUnique({
      where: { id: groupId }
    });

    if (!existingGroup) {
      throw createGroupError(
        `No se encontró el grupo con ID: ${groupId}`,
        GroupErrorCode.NOT_FOUND
      );
    }

    // Validar y eliminar la relación según el tipo usando disconnect
    switch (itemType) {
      case 'images':
        await prisma.group.update({
          where: { id: groupId },
          data: {
            images: {
              disconnect: { id: itemId }
            }
          }
        });
        break;
      case 'videos':
        await prisma.group.update({
          where: { id: groupId },
          data: {
            videos: {
              disconnect: { id: itemId }
            }
          }
        });
        break;
      case 'albums':
        await prisma.group.update({
          where: { id: groupId },
          data: {
            albums: {
              disconnect: { id: itemId }
            }
          }
        });
        break;
      case 'tags':
        await prisma.group.update({
          where: { id: groupId },
          data: {
            tags: {
              disconnect: { id: itemId }
            }
          }
        });
        break;
      default:
        throw createGroupError(
          `Tipo de elemento no soportado: ${itemType}`,
          GroupErrorCode.INVALID_DATA
        );
    }

    // Notificar cambio
    await notifyGroupChange('items:remove', { id: groupId });

    logger.info('✅ Elemento eliminado del grupo', { groupId, itemId, itemType });
  } catch (error) {
    logger.error('❌ Error al eliminar elemento del grupo', { error, groupId, itemId, itemType });

    if (error instanceof Error && error.name === 'GroupServiceError') {
      throw error;
    }

    throw createGroupError(`Error al eliminar elemento: ${error instanceof Error ? error.message : String(error)}`, GroupErrorCode.OPERATION_FAILED, error);
  }
};

// Exportación de objetos agrupados para una interfaz más limpia
export const groupService = {
  // Operaciones principales
  get: getGroupService,
  getMany: getGroupsByIdsService,
  create: createGroupService,
  update: updateGroupService,
  delete: deleteGroupService,
  search: searchGroupsService,
  // Operaciones con elementos
  addItem: addItemToGroupService,
  removeItem: removeItemFromGroupService,
  // Operaciones adicionales
  getStats: getGroupStatsService
};

// Permitir el uso como importación predeterminada para mayor flexibilidad
export default groupService;
