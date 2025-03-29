'use server';

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { emit } from '@/lib/server/events.server';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats.service';
import type { FileItem } from '@/types/file-item';
import { revalidatePath } from 'next/cache';
// Importaciones de tipos y transformers
import { convertServerImageToFileItem } from '@/services/image-converter.service';
import { mapCreateGroupDataToPrisma, mapGroupFiltersToPrisma, mapUpdateGroupDataToPrisma } from '@/transformers/group';
import type { CreateGroupData, GroupBase, GroupFilters, GroupWithRelations, UpdateGroupData } from '@/types/entities/group';

// Utilidades y logging
const groupLogger = serverLogger.withContext('GroupActions');

const REVALIDATE_PATHS = ['/settings', '/groups', '/groups/[id]'] as const;

const revalidateAllPaths = async () => {
  for (const path of REVALIDATE_PATHS) {
    revalidatePath(path);
  }
  groupLogger.info('🔄 Rutas revalidadas');
};

// Notificar cambios en grupos
const notifyGroupChange = async (action: 'create' | 'update' | 'delete', group: GroupBase | { id: string }) => {
  // Emitir eventos usando el sistema del servidor
  await emit({
    type: 'groups:modified',
    data: { action, group },
  });
  statsEventEmitter.emit(STATS_EVENTS.GROUP_CHANGE);
};

// Manejo de errores - enfoque funcional
enum GroupErrorCode {
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  OPERATION_FAILED = 'OPERATION_FAILED',
}

const createGroupError = (message: string, code: GroupErrorCode = GroupErrorCode.OPERATION_FAILED, cause?: unknown) => {
  const error = new Error(message);
  error.name = 'GroupError';
  Object.assign(error, { code, cause });
  return error;
};

// Interfaces para resultados
export interface GroupWithStats {
  id: string;
  name: string;
  emoji: string;
  color: string;
  description: string | null;
  shortcut: string | null;
  category: string | null;
  sortBy: string;
  filters: string;
  featuredImage: string | null;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    images: number;
    videos: number;
    albums: number;
    collections: number;
    tags: number;
    characters: number;
    places: number;
    worldItems: number;
    concepts: number;
    prompts: number;
    notes: number;
    wildcards: number;
    properties: number;
  };
  totalEntities: number;
  lastUpdated: Date;
}

export interface GroupWithImages extends GroupBase {
  images: FileItem[];
}

// Acciones del servidor
export async function getGroups(filters?: GroupFilters): Promise<GroupWithStats[]> {
  try {
    groupLogger.info('📂 Obteniendo grupos con estadísticas');

    // Aplicar filtros si se proporcionan
    const where = filters ? mapGroupFiltersToPrisma(filters).where : {};

    // Obtener grupos con conteos
    const groups = await prisma.group.findMany({
      where,
      include: {
        _count: {
          select: {
            images: true,
            videos: true,
            albums: true,
            collections: true,
            tags: true,
            characters: true,
            places: true,
            worldItems: true,
            concepts: true,
            prompts: true,
            notes: true,
            wildcards: true,
            properties: true,
          },
        },
      },
      orderBy: [
        {
          name: 'asc',
        },
      ],
    });

    // Calcular estadísticas adicionales
    const groupsWithStats = groups.map((group) => {
      // Calcular total de entidades
      const totalEntities =
        (group._count.images || 0) +
        (group._count.videos || 0) +
        (group._count.albums || 0) +
        (group._count.collections || 0) +
        (group._count.tags || 0) +
        (group._count.characters || 0) +
        (group._count.places || 0) +
        (group._count.worldItems || 0) +
        (group._count.concepts || 0) +
        (group._count.prompts || 0) +
        (group._count.notes || 0) +
        (group._count.wildcards || 0) +
        (group._count.properties || 0);

      return {
        ...group,
        totalEntities,
        lastUpdated: group.updatedAt,
      };
    });

    groupLogger.info('✅ Grupos obtenidos:', groupsWithStats.length);
    return groupsWithStats;
  } catch (error) {
    groupLogger.error('❌ Error al obtener grupos:', error);
    throw createGroupError('No se pudieron obtener los grupos', GroupErrorCode.OPERATION_FAILED, error);
  }
}

export async function getGroup(id: string): Promise<GroupWithRelations> {
  try {
    groupLogger.info('🔍 Obteniendo grupo:', id);

    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            images: true,
            videos: true,
            albums: true,
            collections: true,
            tags: true,
            characters: true,
            places: true,
            worldItems: true,
            concepts: true,
            prompts: true,
            notes: true,
            wildcards: true,
            properties: true,
          },
        },
      },
    });

    if (!group) {
      throw createGroupError(`Grupo con id ${id} no encontrado`, GroupErrorCode.NOT_FOUND);
    }

    groupLogger.info('✅ Grupo obtenido:', group.name);
    return group as unknown as GroupWithRelations;
  } catch (error) {
    groupLogger.error('❌ Error al obtener grupo:', error);
    if ((error as any).code === GroupErrorCode.NOT_FOUND) {
      throw error;
    }
    throw createGroupError(`No se pudo obtener el grupo con id ${id}`, GroupErrorCode.OPERATION_FAILED, error);
  }
}

export async function createGroup(data: CreateGroupData): Promise<GroupBase> {
  try {
    groupLogger.info('📝 Creando grupo:', data.name);

    // Mapear datos para Prisma
    const groupData = mapCreateGroupDataToPrisma(data);

    // Crear grupo
    const group = await prisma.group.create({
      data: groupData,
    });

    // Notificar cambio
    await notifyGroupChange('create', group);

    // Revalidar rutas
    await revalidateAllPaths();

    groupLogger.info('✅ Grupo creado:', group.name);
    return group;
  } catch (error) {
    groupLogger.error('❌ Error al crear grupo:', error);
    throw createGroupError('No se pudo crear el grupo', GroupErrorCode.OPERATION_FAILED, error);
  }
}

export async function updateGroup(id: string, data: UpdateGroupData): Promise<GroupBase> {
  try {
    groupLogger.info('🔄 Actualizando grupo:', id);

    // Verificar que el grupo exista
    const existingGroup = await prisma.group.findUnique({
      where: { id },
    });

    if (!existingGroup) {
      throw createGroupError(`Grupo con id ${id} no encontrado`, GroupErrorCode.NOT_FOUND);
    }

    // Mapear datos para Prisma
    const groupData = mapUpdateGroupDataToPrisma(data);

    // Actualizar grupo
    const updatedGroup = await prisma.group.update({
      where: { id },
      data: groupData,
    });

    // Notificar cambio
    await notifyGroupChange('update', updatedGroup);

    // Revalidar rutas
    await revalidateAllPaths();

    groupLogger.info('✅ Grupo actualizado:', updatedGroup.name);
    return updatedGroup;
  } catch (error) {
    groupLogger.error('❌ Error al actualizar grupo:', error);
    if ((error as any).code === GroupErrorCode.NOT_FOUND) {
      throw error;
    }
    throw createGroupError(`No se pudo actualizar el grupo con id ${id}`, GroupErrorCode.OPERATION_FAILED, error);
  }
}

export async function deleteGroup(id: string): Promise<void> {
  try {
    groupLogger.info('🗑️ Eliminando grupo:', id);

    // Verificar que el grupo exista
    const existingGroup = await prisma.group.findUnique({
      where: { id },
    });

    if (!existingGroup) {
      throw createGroupError(`Grupo con id ${id} no encontrado`, GroupErrorCode.NOT_FOUND);
    }

    // Eliminar grupo
    await prisma.group.delete({
      where: { id },
    });

    // Notificar cambio
    await notifyGroupChange('delete', { id });

    // Revalidar rutas
    await revalidateAllPaths();

    groupLogger.info('✅ Grupo eliminado:', id);
  } catch (error) {
    groupLogger.error('❌ Error al eliminar grupo:', error);
    if ((error as any).code === GroupErrorCode.NOT_FOUND) {
      throw error;
    }
    throw createGroupError(`No se pudo eliminar el grupo con id ${id}`, GroupErrorCode.OPERATION_FAILED, error);
  }
}

export async function getGroupImages(id: string): Promise<FileItem[]> {
  try {
    groupLogger.info('🖼️ Obteniendo imágenes del grupo:', id);

    // Verificar que el grupo exista
    const existingGroup = await prisma.group.findUnique({
      where: { id },
    });

    if (!existingGroup) {
      throw createGroupError(`Grupo con id ${id} no encontrado`, GroupErrorCode.NOT_FOUND);
    }

    // Obtener imágenes relacionadas
    const images = await prisma.image.findMany({
      where: {
        groups: {
          some: {
            id,
          },
        },
      },
      include: {
        folder: true,
        tags: true,
      },
    });

    // Convertir a FileItem
    const fileItems = images.map((image) => convertServerImageToFileItem(image as any));

    groupLogger.info('✅ Imágenes del grupo obtenidas:', fileItems.length);
    return fileItems;
  } catch (error) {
    groupLogger.error('❌ Error al obtener imágenes del grupo:', error);
    if ((error as any).code === GroupErrorCode.NOT_FOUND) {
      throw error;
    }
    throw createGroupError(`No se pudieron obtener las imágenes del grupo con id ${id}`, GroupErrorCode.OPERATION_FAILED, error);
  }
}

export async function addImageToGroup(groupId: string, imageId: string): Promise<void> {
  try {
    groupLogger.info('➕ Añadiendo imagen al grupo:', { groupId, imageId });

    // Verificar que el grupo exista
    const existingGroup = await prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!existingGroup) {
      throw createGroupError(`Grupo con id ${groupId} no encontrado`, GroupErrorCode.NOT_FOUND);
    }

    // Verificar que la imagen exista
    const existingImage = await prisma.image.findUnique({
      where: { id: imageId },
    });

    if (!existingImage) {
      throw createGroupError(`Imagen con id ${imageId} no encontrada`, GroupErrorCode.NOT_FOUND);
    }

    // Conectar imagen con grupo
    await prisma.group.update({
      where: { id: groupId },
      data: {
        images: {
          connect: { id: imageId },
        },
      },
    });

    // Notificar cambio
    await notifyGroupChange('update', { id: groupId });

    // Revalidar rutas
    await revalidateAllPaths();

    groupLogger.info('✅ Imagen añadida al grupo');
  } catch (error) {
    groupLogger.error('❌ Error al añadir imagen al grupo:', error);
    if ((error as any).code === GroupErrorCode.NOT_FOUND) {
      throw error;
    }
    throw createGroupError(`No se pudo añadir la imagen ${imageId} al grupo ${groupId}`, GroupErrorCode.OPERATION_FAILED, error);
  }
}

export async function removeImageFromGroup(groupId: string, imageId: string): Promise<void> {
  try {
    groupLogger.info('➖ Quitando imagen del grupo:', { groupId, imageId });

    // Verificar que el grupo exista
    const existingGroup = await prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!existingGroup) {
      throw createGroupError(`Grupo con id ${groupId} no encontrado`, GroupErrorCode.NOT_FOUND);
    }

    // Verificar que la imagen exista
    const existingImage = await prisma.image.findUnique({
      where: { id: imageId },
    });

    if (!existingImage) {
      throw createGroupError(`Imagen con id ${imageId} no encontrada`, GroupErrorCode.NOT_FOUND);
    }

    // Desconectar imagen de grupo
    await prisma.group.update({
      where: { id: groupId },
      data: {
        images: {
          disconnect: { id: imageId },
        },
      },
    });

    // Notificar cambio
    await notifyGroupChange('update', { id: groupId });

    // Revalidar rutas
    await revalidateAllPaths();

    groupLogger.info('✅ Imagen quitada del grupo');
  } catch (error) {
    groupLogger.error('❌ Error al quitar imagen del grupo:', error);
    if ((error as any).code === GroupErrorCode.NOT_FOUND) {
      throw error;
    }
    throw createGroupError(`No se pudo quitar la imagen ${imageId} del grupo ${groupId}`, GroupErrorCode.OPERATION_FAILED, error);
  }
}