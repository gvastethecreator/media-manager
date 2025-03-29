'use server';

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { emit } from '@/lib/server/events.server';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats.service';
import type { FileItem } from '@/types/file-item';
import { revalidatePath } from 'next/cache';
// Importaciones de tipos y transformers
import { convertServerImageToFileItem } from '@/services/image-converter.service';
import { mapCreateWildcardDataToPrisma, mapUpdateWildcardDataToPrisma, mapWildcardFiltersToPrisma } from '@/transformers/wildcard';
import type { CreateWildcardData, UpdateWildcardData, WildcardBase, WildcardFilters, WildcardWithRelations } from '@/types/entities/wildcard';

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
const notifyWildcardChange = async (action: 'create' | 'update' | 'delete', wildcard: WildcardBase | { id: string }) => {
  // Emitir eventos usando el sistema del servidor
  await emit({
    type: 'wildcards:modified',
    data: { action, wildcard },
  });
  statsEventEmitter.emit(STATS_EVENTS.WILDCARD_CHANGE);
};

// Manejo de errores - enfoque funcional
enum WildcardErrorCode {
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  OPERATION_FAILED = 'OPERATION_FAILED',
}

const createWildcardError = (message: string, code: WildcardErrorCode = WildcardErrorCode.OPERATION_FAILED, cause?: unknown) => {
  const error = new Error(message);
  error.name = 'WildcardError';
  Object.assign(error, { code, cause });
  return error;
};

// Interfaces para resultados
export interface WildcardWithStats {
  id: string;
  name: string;
  emoji: string;
  color: string;
  description: string | null;
  shortcut: string | null;
  category: string | null;
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
    properties: number;
    groups: number;
  };
  totalEntities: number;
  lastUpdated: Date;
}

export interface WildcardWithImages extends WildcardBase {
  images: FileItem[];
}

// Acciones del servidor
export async function getWildcards(filters?: WildcardFilters): Promise<WildcardWithStats[]> {
  try {
    wildcardLogger.info('🔍 Obteniendo wildcards con estadísticas');

    // Aplicar filtros si se proporcionan
    const where = filters ? mapWildcardFiltersToPrisma(filters).where : {};

    // Obtener wildcards con conteos
    const wildcards = await prisma.wildcard.findMany({
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
            properties: true,
            groups: true,
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
    const wildcardsWithStats = wildcards.map((wildcard) => {
      // Calcular total de entidades
      const totalEntities =
        (wildcard._count.images || 0) +
        (wildcard._count.videos || 0) +
        (wildcard._count.albums || 0) +
        (wildcard._count.collections || 0) +
        (wildcard._count.tags || 0) +
        (wildcard._count.characters || 0) +
        (wildcard._count.places || 0) +
        (wildcard._count.worldItems || 0) +
        (wildcard._count.concepts || 0) +
        (wildcard._count.prompts || 0) +
        (wildcard._count.notes || 0) +
        (wildcard._count.properties || 0) +
        (wildcard._count.groups || 0);

      return {
        ...wildcard,
        totalEntities,
        lastUpdated: wildcard.updatedAt,
      };
    });

    wildcardLogger.info('✅ Wildcards obtenidos:', wildcardsWithStats.length);
    return wildcardsWithStats;
  } catch (error) {
    wildcardLogger.error('❌ Error al obtener wildcards:', error);
    throw createWildcardError('No se pudieron obtener los wildcards', WildcardErrorCode.OPERATION_FAILED, error);
  }
}

export async function getWildcard(id: string): Promise<WildcardWithRelations> {
  try {
    wildcardLogger.info('🔍 Obteniendo wildcard:', id);

    const wildcard = await prisma.wildcard.findUnique({
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
            properties: true,
            groups: true,
          },
        },
      },
    });

    if (!wildcard) {
      throw createWildcardError(`Wildcard con id ${id} no encontrado`, WildcardErrorCode.NOT_FOUND);
    }

    wildcardLogger.info('✅ Wildcard obtenido:', wildcard.name);
    return wildcard as unknown as WildcardWithRelations;
  } catch (error) {
    wildcardLogger.error('❌ Error al obtener wildcard:', error);
    if ((error as any).code === WildcardErrorCode.NOT_FOUND) {
      throw error;
    }
    throw createWildcardError(`No se pudo obtener el wildcard con id ${id}`, WildcardErrorCode.OPERATION_FAILED, error);
  }
}

export async function createWildcard(data: CreateWildcardData): Promise<WildcardBase> {
  try {
    wildcardLogger.info('📝 Creando wildcard:', data.name);

    // Mapear datos para Prisma
    const wildcardData = mapCreateWildcardDataToPrisma(data);

    // Crear wildcard
    const wildcard = await prisma.wildcard.create({
      data: wildcardData,
    });

    // Notificar cambio
    await notifyWildcardChange('create', wildcard);

    // Revalidar rutas
    await revalidateAllPaths();

    wildcardLogger.info('✅ Wildcard creado:', wildcard.name);
    return wildcard;
  } catch (error) {
    wildcardLogger.error('❌ Error al crear wildcard:', error);
    throw createWildcardError('No se pudo crear el wildcard', WildcardErrorCode.OPERATION_FAILED, error);
  }
}

export async function updateWildcard(id: string, data: UpdateWildcardData): Promise<WildcardBase> {
  try {
    wildcardLogger.info('🔄 Actualizando wildcard:', id);

    // Verificar que el wildcard exista
    const existingWildcard = await prisma.wildcard.findUnique({
      where: { id },
    });

    if (!existingWildcard) {
      throw createWildcardError(`Wildcard con id ${id} no encontrado`, WildcardErrorCode.NOT_FOUND);
    }

    // Mapear datos para Prisma
    const wildcardData = mapUpdateWildcardDataToPrisma(data);

    // Actualizar wildcard
    const updatedWildcard = await prisma.wildcard.update({
      where: { id },
      data: wildcardData,
    });

    // Notificar cambio
    await notifyWildcardChange('update', updatedWildcard);

    // Revalidar rutas
    await revalidateAllPaths();

    wildcardLogger.info('✅ Wildcard actualizado:', updatedWildcard.name);
    return updatedWildcard;
  } catch (error) {
    wildcardLogger.error('❌ Error al actualizar wildcard:', error);
    if ((error as any).code === WildcardErrorCode.NOT_FOUND) {
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
    });

    if (!existingWildcard) {
      throw createWildcardError(`Wildcard con id ${id} no encontrado`, WildcardErrorCode.NOT_FOUND);
    }

    // Eliminar wildcard
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

    // Desconectar imagen de wildcard
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