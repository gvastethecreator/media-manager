'use server';

import { db } from '@/lib/db';
import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { emit } from '@/lib/server/events.server';
import { validateName } from '@/lib/validations';
import { convertServerImageToFileItem } from '@/services/image-converter.service';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats.service';
import type { FileItem } from '@/types/file-item';
import { Wildcard } from '@prisma/client';
import { revalidatePath } from 'next/cache';

// Utilidades y logging
const wildcardLogger = serverLogger.withContext('WildcardActions');

const REVALIDATE_PATHS = ['/settings', '/wildcards', '/wildcards/[id]'] as const;

const revalidateAllPaths = async () => {
  for (const path of REVALIDATE_PATHS) {
    revalidatePath(path);
  }
  wildcardLogger.info('🔄 Rutas revalidadas');
};

// Notificar cambios en wildcards
const notifyWildcardChange = async (action: 'create' | 'update' | 'delete', wildcard: { id: string }) => {
  await emit({
    type: 'wildcards:modified',
    data: { action, wildcard },
  });
  statsEventEmitter.emit(STATS_EVENTS.WILDCARD_CHANGE);
};

// Manejo de errores
enum WildcardErrorCode {
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  OPERATION_FAILED = 'OPERATION_FAILED',
  CIRCULAR_REFERENCE = 'CIRCULAR_REFERENCE',
}

const createWildcardError = (message: string, code: WildcardErrorCode = WildcardErrorCode.OPERATION_FAILED, cause?: unknown) => {
  const error = new Error(message);
  error.name = 'WildcardError';
  Object.assign(error, { code, cause });
  return error;
};

// Interfaces
export interface WildcardFormInput {
  name: string;
  description?: string | null;
  emoji?: string;
  color?: string;
  category?: string | null;
  shortcut?: string | null;
  isFavorite?: boolean;
  children?: string[];
  parentId?: string | null;
}

export interface WildcardWithStats {
  id: string;
  name: string;
  description: string | null;
  emoji: string;
  color: string;
  category: string | null;
  shortcut: string | null;
  isFavorite: boolean;
  children: string;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    images: number;
    videos: number;
    childWildcards: number;
  };
  totalEntities: number;
  lastUpdated: Date;
}

// Función auxiliar para verificar referencias circulares
async function checkCircularReference(wildcardId: string, newParentId: string): Promise<boolean> {
  let currentId = newParentId;
  const visited = new Set<string>();

  while (currentId) {
    if (currentId === wildcardId) return true;
    if (visited.has(currentId)) return true;
    visited.add(currentId);

    const parent = await prisma.wildcard.findUnique({
      where: { id: currentId },
      select: { parentId: true },
    });

    if (!parent || !parent.parentId) break;
    currentId = parent.parentId;
  }

  return false;
}

// Acciones del servidor
export async function getWildcards(): Promise<WildcardWithStats[]> {
  try {
    wildcardLogger.info('🔍 Obteniendo wildcards con estadísticas');

    const wildcards = await prisma.wildcard.findMany({
      include: {
        _count: {
          select: {
            images: true,
            videos: true,
            childWildcards: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    const wildcardsWithStats = wildcards.map((wildcard) => {
      const totalEntities =
        (wildcard._count.images || 0) +
        (wildcard._count.videos || 0) +
        (wildcard._count.childWildcards || 0);

      return {
        ...wildcard,
        totalEntities,
        lastUpdated: wildcard.updatedAt,
      };
    });

    wildcardLogger.info('✅ Wildcards obtenidos:', wildcards.length);
    return wildcardsWithStats;
  } catch (error) {
    wildcardLogger.error('❌ Error al obtener wildcards:', error);
    throw createWildcardError('No se pudieron obtener los wildcards', WildcardErrorCode.OPERATION_FAILED, error);
  }
}

export async function getWildcard(id: string): Promise<WildcardWithStats | null> {
  try {
    wildcardLogger.info('🔍 Obteniendo wildcard:', id);

    const wildcard = await prisma.wildcard.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            images: true,
            videos: true,
            childWildcards: true,
          },
        },
      },
    });

    if (!wildcard) {
      throw createWildcardError(`Wildcard con id ${id} no encontrado`, WildcardErrorCode.NOT_FOUND);
    }

    wildcardLogger.info('✅ Wildcard obtenido:', wildcard.name);
    return {
      ...wildcard,
      totalEntities:
        (wildcard._count.images || 0) +
        (wildcard._count.videos || 0) +
        (wildcard._count.childWildcards || 0),
      lastUpdated: wildcard.updatedAt,
    };
  } catch (error) {
    wildcardLogger.error('❌ Error al obtener wildcard:', error);
    if ((error as any).code === WildcardErrorCode.NOT_FOUND) {
      throw error;
    }
    throw createWildcardError(`No se pudo obtener el wildcard con id ${id}`, WildcardErrorCode.OPERATION_FAILED, error);
  }
}

export async function createWildcard(data: WildcardFormInput): Promise<WildcardWithStats> {
  try {
    wildcardLogger.info('📝 Creando wildcard:', data.name);

    // Verificar referencia circular si se proporciona parentId
    if (data.parentId) {
      // No necesitamos verificar aquí ya que es una creación nueva
      // pero podríamos verificar que el padre exista
      const parent = await prisma.wildcard.findUnique({
        where: { id: data.parentId },
      });

      if (!parent) {
        throw createWildcardError('El wildcard padre no existe', WildcardErrorCode.NOT_FOUND);
      }
    }

    // Crear wildcard
    const wildcard = await prisma.wildcard.create({
      data: {
        name: data.name,
        description: data.description || null,
        emoji: data.emoji || '🎭',
        color: data.color || '#3b82f6',
        category: data.category || null,
        shortcut: data.shortcut || null,
        isFavorite: data.isFavorite || false,
        children: JSON.stringify(data.children || []),
        parentId: data.parentId || null,
      },
      include: {
        _count: {
          select: {
            images: true,
            videos: true,
            childWildcards: true,
          },
        },
      },
    });

    // Notificar cambio
    await notifyWildcardChange('create', wildcard);

    // Revalidar rutas
    await revalidateAllPaths();

    wildcardLogger.info('✅ Wildcard creado:', wildcard.name);
    return {
      ...wildcard,
      totalEntities: 0,
      lastUpdated: wildcard.updatedAt,
    };
  } catch (error) {
    wildcardLogger.error('❌ Error al crear wildcard:', error);
    throw createWildcardError('No se pudo crear el wildcard', WildcardErrorCode.OPERATION_FAILED, error);
  }
}

export async function updateWildcard(id: string, data: Partial<WildcardFormInput>): Promise<WildcardWithStats> {
  try {
    wildcardLogger.info('🔄 Actualizando wildcard:', id);

    // Verificar que el wildcard exista
    const existingWildcard = await prisma.wildcard.findUnique({
      where: { id },
    });

    if (!existingWildcard) {
      throw createWildcardError(`Wildcard con id ${id} no encontrado`, WildcardErrorCode.NOT_FOUND);
    }

    // Verificar referencia circular si se está cambiando el parentId
    if (data.parentId && data.parentId !== existingWildcard.parentId) {
      const hasCircularRef = await checkCircularReference(id, data.parentId);
      if (hasCircularRef) {
        throw createWildcardError(
          'No se puede establecer esta relación padre-hijo porque crearía una referencia circular',
          WildcardErrorCode.CIRCULAR_REFERENCE
        );
      }
    }

    // Actualizar wildcard
    const updatedWildcard = await prisma.wildcard.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        emoji: data.emoji,
        color: data.color,
        category: data.category,
        shortcut: data.shortcut,
        isFavorite: data.isFavorite,
        children: data.children ? JSON.stringify(data.children) : undefined,
        parentId: data.parentId,
      },
      include: {
        _count: {
          select: {
            images: true,
            videos: true,
            childWildcards: true,
          },
        },
      },
    });

    // Notificar cambio
    await notifyWildcardChange('update', updatedWildcard);

    // Revalidar rutas
    await revalidateAllPaths();

    wildcardLogger.info('✅ Wildcard actualizado:', updatedWildcard.name);
    return {
      ...updatedWildcard,
      totalEntities:
        (updatedWildcard._count.images || 0) +
        (updatedWildcard._count.videos || 0) +
        (updatedWildcard._count.childWildcards || 0),
      lastUpdated: updatedWildcard.updatedAt,
    };
  } catch (error) {
    wildcardLogger.error('❌ Error al actualizar wildcard:', error);
    if (
      (error as any).code === WildcardErrorCode.NOT_FOUND ||
      (error as any).code === WildcardErrorCode.CIRCULAR_REFERENCE
    ) {
      throw error;
    }
    throw createWildcardError(`No se pudo actualizar el wildcard con id ${id}`, WildcardErrorCode.OPERATION_FAILED, error);
  }
}

export async function deleteWildcard(id: string): Promise<void> {
  try {
    wildcardLogger.info('🗑️ Eliminando wildcard:', id);

    // Verificar que el wildcard exista
    const existingWildcard = await prisma.wildcard.findUnique({
      where: { id },
      include: {
        childWildcards: true,
      },
    });

    if (!existingWildcard) {
      throw createWildcardError(`Wildcard con id ${id} no encontrado`, WildcardErrorCode.NOT_FOUND);
    }

    // Si tiene hijos, actualizar sus parentId a null
    if (existingWildcard.childWildcards.length > 0) {
      await prisma.wildcard.updateMany({
        where: {
          parentId: id,
        },
        data: {
          parentId: null,
        },
      });
    }

    // Eliminar el wildcard
    await prisma.wildcard.delete({
      where: { id },
    });

    // Notificar cambio
    await notifyWildcardChange('delete', { id });

    // Revalidar rutas
    await revalidateAllPaths();

    wildcardLogger.info('✅ Wildcard eliminado:', id);
  } catch (error) {
    wildcardLogger.error('❌ Error al eliminar wildcard:', error);
    if ((error as any).code === WildcardErrorCode.NOT_FOUND) {
      throw error;
    }
    throw createWildcardError(`No se pudo eliminar el wildcard con id ${id}`, WildcardErrorCode.OPERATION_FAILED, error);
  }
}

export async function getWildcardImages(id: string): Promise<FileItem[]> {
  try {
    wildcardLogger.info('🖼️ Obteniendo imágenes del wildcard:', id);

    // Verificar que el wildcard exista
    const existingWildcard = await prisma.wildcard.findUnique({
      where: { id },
    });

    if (!existingWildcard) {
      throw createWildcardError(`Wildcard con id ${id} no encontrado`, WildcardErrorCode.NOT_FOUND);
    }

    // Obtener imágenes relacionadas
    const images = await prisma.image.findMany({
      where: {
        wildcards: {
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

    wildcardLogger.info('✅ Imágenes del wildcard obtenidas:', fileItems.length);
    return fileItems;
  } catch (error) {
    wildcardLogger.error('❌ Error al obtener imágenes del wildcard:', error);
    if ((error as any).code === WildcardErrorCode.NOT_FOUND) {
      throw error;
    }
    throw createWildcardError(`No se pudieron obtener las imágenes del wildcard con id ${id}`, WildcardErrorCode.OPERATION_FAILED, error);
  }
}

export async function addImageToWildcard(wildcardId: string, imageId: string): Promise<void> {
  try {
    wildcardLogger.info('➕ Añadiendo imagen al wildcard:', { wildcardId, imageId });

    // Verificar que el wildcard exista
    const existingWildcard = await prisma.wildcard.findUnique({
      where: { id: wildcardId },
    });

    if (!existingWildcard) {
      throw createWildcardError(`Wildcard con id ${wildcardId} no encontrado`, WildcardErrorCode.NOT_FOUND);
    }

    // Verificar que la imagen exista
    const existingImage = await prisma.image.findUnique({
      where: { id: imageId },
    });

    if (!existingImage) {
      throw createWildcardError(`Imagen con id ${imageId} no encontrada`, WildcardErrorCode.NOT_FOUND);
    }

    // Conectar imagen con wildcard
    await prisma.wildcard.update({
      where: { id: wildcardId },
      data: {
        images: {
          connect: { id: imageId },
        },
      },
    });

    // Notificar cambio
    await notifyWildcardChange('update', { id: wildcardId });

    // Revalidar rutas
    await revalidateAllPaths();

    wildcardLogger.info('✅ Imagen añadida al wildcard');
  } catch (error) {
    wildcardLogger.error('❌ Error al añadir imagen al wildcard:', error);
    if ((error as any).code === WildcardErrorCode.NOT_FOUND) {
      throw error;
    }
    throw createWildcardError(`No se pudo añadir la imagen ${imageId} al wildcard ${wildcardId}`, WildcardErrorCode.OPERATION_FAILED, error);
  }
}

export async function removeImageFromWildcard(wildcardId: string, imageId: string): Promise<void> {
  try {
    wildcardLogger.info('➖ Quitando imagen del wildcard:', { wildcardId, imageId });

    // Verificar que el wildcard exista
    const existingWildcard = await prisma.wildcard.findUnique({
      where: { id: wildcardId },
    });

    if (!existingWildcard) {
      throw createWildcardError(`Wildcard con id ${wildcardId} no encontrado`, WildcardErrorCode.NOT_FOUND);
    }

    // Verificar que la imagen exista
    const existingImage = await prisma.image.findUnique({
      where: { id: imageId },
    });

    if (!existingImage) {
      throw createWildcardError(`Imagen con id ${imageId} no encontrada`, WildcardErrorCode.NOT_FOUND);
    }

    // Desconectar imagen del wildcard
    await prisma.wildcard.update({
      where: { id: wildcardId },
      data: {
        images: {
          disconnect: { id: imageId },
        },
      },
    });

    // Notificar cambio
    await notifyWildcardChange('update', { id: wildcardId });

    // Revalidar rutas
    await revalidateAllPaths();

    wildcardLogger.info('✅ Imagen quitada del wildcard');
  } catch (error) {
    wildcardLogger.error('❌ Error al quitar imagen del wildcard:', error);
    if ((error as any).code === WildcardErrorCode.NOT_FOUND) {
      throw error;
    }
    throw createWildcardError(`No se pudo quitar la imagen ${imageId} del wildcard ${wildcardId}`, WildcardErrorCode.OPERATION_FAILED, error);
  }
}

/**
 * Obtiene comodines raíz (sin padre) para la selección en formularios
 */
export async function getRootWildcards() {
  try {
    return await db.wildcard.findMany({
      where: {
        parentId: null,
      },
      orderBy: {
        name: 'asc',
      },
    });
  } catch (error) {
    console.error('Error al obtener comodines raíz:', error);
    throw new Error('No se pudieron obtener los comodines raíz');
  }
}

/**
 * Crea un nuevo comodín
 */
export async function createWildcard(data: Partial<Wildcard>) {
  try {
    // Validar nombre único
    await validateName('wildcard', data.name);

    // Validar que no se cree un ciclo en la jerarquía
    if (data.parentId) {
      await validateParentHierarchy(null, data.parentId);
    }

    const wildcard = await db.wildcard.create({
      data: {
        name: data.name!,
        emoji: data.emoji || '✨',
        color: data.color || '#ec4899',
        description: data.description,
        shortcut: data.shortcut,
        category: data.category || 'general',
        parentId: data.parentId || null,
        children: data.children || 'empty_array',
        featuredImage: data.featuredImage,
        isFavorite: data.isFavorite || false,
      },
    });

    revalidatePath('/settings');
    return wildcard;
  } catch (error) {
    console.error('Error al crear comodín:', error);
    throw error;
  }
}

/**
 * Actualiza un comodín existente
 */
export async function updateWildcard(id: string, data: Partial<Wildcard>) {
  try {
    // Si el nombre cambió, validar que sea único
    const current = await db.wildcard.findUnique({ where: { id } });
    if (!current) throw new Error('Comodín no encontrado');

    if (data.name && current.name !== data.name) {
      await validateName('wildcard', data.name);
    }

    // Validar que no se cree un ciclo en la jerarquía
    if (data.parentId && data.parentId !== current.parentId) {
      await validateParentHierarchy(id, data.parentId);
    }

    const wildcard = await db.wildcard.update({
      where: { id },
      data: {
        name: data.name,
        emoji: data.emoji,
        color: data.color,
        description: data.description,
        shortcut: data.shortcut,
        category: data.category,
        parentId: data.parentId,
        children: data.children,
        featuredImage: data.featuredImage,
        isFavorite: data.isFavorite,
      },
    });

    revalidatePath('/settings');
    return wildcard;
  } catch (error) {
    console.error('Error al actualizar comodín:', error);
    throw error;
  }
}

/**
 * Elimina un comodín
 */
export async function deleteWildcard(id: string) {
  try {
    // Verificar si tiene hijos y actualizarlos para eliminar su relación
    const childWildcards = await db.wildcard.findMany({
      where: { parentId: id },
    });

    if (childWildcards.length > 0) {
      await db.wildcard.updateMany({
        where: { parentId: id },
        data: { parentId: null },
      });
    }

    await db.wildcard.delete({
      where: { id },
    });

    revalidatePath('/settings');
    return true;
  } catch (error) {
    console.error('Error al eliminar comodín:', error);
    throw new Error('No se pudo eliminar el comodín');
  }
}

/**
 * Actualiza el estado de favorito de un comodín
 */
export async function toggleWildcardFavorite(id: string) {
  try {
    const wildcard = await db.wildcard.findUnique({ where: { id } });
    if (!wildcard) throw new Error('Comodín no encontrado');

    const updated = await db.wildcard.update({
      where: { id },
      data: {
        isFavorite: !wildcard.isFavorite,
      },
    });

    revalidatePath('/settings');
    return updated;
  } catch (error) {
    console.error('Error al actualizar favorito:', error);
    throw error;
  }
}

/**
 * Función auxiliar para validar que no se cree un ciclo en la jerarquía
 */
async function validateParentHierarchy(wildcardId: string | null, parentId: string) {
  // No se puede asignar un comodín como su propio padre
  if (wildcardId === parentId) {
    throw new Error('Un comodín no puede ser su propio padre');
  }

  // Verificar que no se cree un ciclo en la jerarquía
  let currentParent = parentId;
  while (currentParent) {
    const parent = await db.wildcard.findUnique({
      where: { id: currentParent },
      select: { id: true, parentId: true },
    });

    if (!parent) break;

    // Si encontramos el ID del comodín actual, hay un ciclo
    if (parent.parentId === wildcardId) {
      throw new Error('No se puede crear un ciclo en la jerarquía de comodines');
    }

    currentParent = parent.parentId || '';
  }
}