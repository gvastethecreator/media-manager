/**
 * @file Funciones de servicio para la entidad Folder
 * @module transformers/folder/service
 */

import { Logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import type {
    Folder,
    FolderComplete,
    FolderCreateInput,
    FolderSearchOptions,
    FolderUpdateInput,
    FolderWithStats
} from '@/types/entities/folder/types';
import {
    mapCreateFolderDataToPrisma,
    mapFolderSearchOptionsToPrisma,
    mapUpdateFolderDataToPrisma
} from './mappers';
import { transformFolder } from './transformer';

const logger = new Logger('FolderService');

/**
 * 🔍 Obtiene una carpeta por su ID
 *
 * @param id ID de la carpeta
 * @returns La carpeta encontrada o null
 */
export async function getFolderById(id: string): Promise<FolderComplete | null> {
  try {
    logger.info(`🔍 Buscando carpeta con ID: ${id}`);

    const folder = await prisma.folder.findUnique({
      where: { id },
      include: {
        children: true,
        parent: true,
        _count: {
          select: {
            children: true,
            images: true,
            uploadedImages: true,
            tags: true
          }
        }
      }
    });

    if (!folder) {
      logger.warn(`⚠️ No se encontró carpeta con ID: ${id}`);
      return null;
    }

    return transformFolder(folder);
  } catch (error) {
    logger.error(`❌ Error al obtener carpeta por ID: ${id}`, error);
    throw error;
  }
}

/**
 * 📂 Obtiene una carpeta con estadísticas
 *
 * @param id ID de la carpeta
 * @returns La carpeta con estadísticas o null
 */
export async function getFolderWithStats(id: string): Promise<FolderWithStats | null> {
  try {
    logger.info(`📊 Obteniendo carpeta con estadísticas, ID: ${id}`);

    const folder = await prisma.folder.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            children: true,
            images: true,
            uploadedImages: true,
            tags: true
          }
        }
      }
    });

    if (!folder) {
      logger.warn(`⚠️ No se encontró carpeta con ID: ${id}`);
      return null;
    }

    // transformFolder ya incluye las estadísticas
    return transformFolder(folder) as FolderWithStats;
  } catch (error) {
    logger.error(`❌ Error al obtener carpeta con estadísticas, ID: ${id}`, error);
    throw error;
  }
}

/**
 * 🔍 Busca carpetas con filtros y opciones
 *
 * @param options Opciones de búsqueda
 * @returns Resultado con carpetas y conteo
 */
export async function searchFolders(options: FolderSearchOptions = {}): Promise<{
  items: FolderComplete[];
  total: number;
  hasMore: boolean;
}> {
  try {
    logger.info('🔍 Buscando carpetas con opciones:', options);

    // Convertir opciones a formato Prisma
    const prismaOptions = mapFolderSearchOptionsToPrisma(options);

    // Ejecutar consulta con conteo
    const [folders, total] = await Promise.all([
      prisma.folder.findMany({
        ...prismaOptions,
        include: {
          ...(prismaOptions.include || {}),
          _count: {
            select: {
              children: true,
              images: true,
              uploadedImages: true,
              tags: true
            }
          }
        }
      }),
      prisma.folder.count({ where: prismaOptions.where })
    ]);

    // Transformar resultados
    const transformedFolders = folders.map(folder => transformFolder(folder));

    // Calcular si hay más resultados
    const skip = options.skip || 0;
    const take = options.take || 50;
    const hasMore = skip + transformedFolders.length < total;

    logger.info(`✅ Búsqueda completada, encontradas ${transformedFolders.length} carpetas`);

    return {
      items: transformedFolders,
      total,
      hasMore
    };
  } catch (error) {
    logger.error('❌ Error al buscar carpetas:', error);
    throw error;
  }
}

/**
 * ➕ Crea una nueva carpeta
 *
 * @param data Datos para crear la carpeta
 * @returns La carpeta creada
 */
export async function createFolder(data: FolderCreateInput): Promise<FolderComplete> {
  try {
    logger.info('➕ Creando nueva carpeta:', data);

    // Mapear datos a formato Prisma
    const prismaData = mapCreateFolderDataToPrisma(data);

    // Crear la carpeta
    const folder = await prisma.folder.create({
      data: prismaData,
      include: {
        _count: {
          select: {
            children: true,
            images: true,
            uploadedImages: true,
            tags: true
          }
        }
      }
    });

    logger.info(`✅ Carpeta creada correctamente con ID: ${folder.id}`);

    return transformFolder(folder);
  } catch (error) {
    logger.error('❌ Error al crear carpeta:', error);
    throw error;
  }
}

/**
 * 🔄 Actualiza una carpeta existente
 *
 * @param id ID de la carpeta a actualizar
 * @param data Datos para actualizar
 * @returns La carpeta actualizada
 */
export async function updateFolder(id: string, data: FolderUpdateInput): Promise<FolderComplete> {
  try {
    logger.info(`🔄 Actualizando carpeta con ID: ${id}`, data);

    // Verificar que la carpeta existe
    const existingFolder = await prisma.folder.findUnique({
      where: { id }
    });

    if (!existingFolder) {
      logger.error(`❌ No se encontró carpeta con ID: ${id}`);
      throw new Error(`No se encontró carpeta con ID: ${id}`);
    }

    // Mapear datos a formato Prisma
    const prismaData = mapUpdateFolderDataToPrisma(data);

    // Actualizar la carpeta
    const folder = await prisma.folder.update({
      where: { id },
      data: prismaData,
      include: {
        _count: {
          select: {
            children: true,
            images: true,
            uploadedImages: true,
            tags: true
          }
        }
      }
    });

    logger.info(`✅ Carpeta actualizada correctamente con ID: ${folder.id}`);

    return transformFolder(folder);
  } catch (error) {
    logger.error(`❌ Error al actualizar carpeta con ID: ${id}:`, error);
    throw error;
  }
}

/**
 * 🗑️ Elimina una carpeta por su ID
 *
 * @param id ID de la carpeta a eliminar
 * @returns La carpeta eliminada
 */
export async function deleteFolder(id: string): Promise<Folder> {
  try {
    logger.info(`🗑️ Eliminando carpeta con ID: ${id}`);

    // Verificar que la carpeta existe
    const existingFolder = await prisma.folder.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            children: true,
            images: true
          }
        }
      }
    });

    if (!existingFolder) {
      logger.error(`❌ No se encontró carpeta con ID: ${id}`);
      throw new Error(`No se encontró carpeta con ID: ${id}`);
    }

    // Verificar si tiene hijos o imágenes
    if ((existingFolder._count?.children || 0) > 0 || (existingFolder._count?.images || 0) > 0) {
      logger.warn(`⚠️ La carpeta con ID: ${id} tiene hijos o imágenes`);
      throw new Error('No se puede eliminar una carpeta con elementos');
    }

    // Eliminar la carpeta
    const folder = await prisma.folder.delete({
      where: { id },
    });

    logger.info(`✅ Carpeta eliminada correctamente con ID: ${folder.id}`);

    return folder;
  } catch (error) {
    logger.error(`❌ Error al eliminar carpeta con ID: ${id}:`, error);
    throw error;
  }
}