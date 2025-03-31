'use server';

/**
 * @file Acciones CRUD para carpetas
 * @module app/actions/folders/crud.actions
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { transformFolder } from '@/transformers/folder';
import { type FolderCreate, type FolderExtended, type FolderUpdate } from '@/types/entities/folder';
import { revalidatePath } from 'next/cache';

// Logger específico para acciones de carpetas
const folderLogger = serverLogger.withContext('FolderCrudActions');

// Rutas que deben ser revalidadas cuando cambian las carpetas
const REVALIDATE_PATHS = ['/folders', '/settings', '/dashboard'] as const;

/**
 * Revalida todas las rutas relevantes cuando cambian las carpetas
 */
const revalidateFolderPaths = async () => {
  for (const path of REVALIDATE_PATHS) {
    revalidatePath(path);
  }
  folderLogger.info('🔄 Rutas de carpetas revalidadas');
};

/**
 * Error personalizado para acciones de carpetas
 */
class FolderError extends Error {
  constructor(
    message: string,
    public code?: string,
    public cause?: unknown
  ) {
    super(message);
    this.name = 'FolderError';
  }
}

/**
 * Crea una nueva carpeta
 */
export async function createFolder(data: FolderCreate): Promise<FolderExtended> {
  try {
    folderLogger.info('📁 Creando nueva carpeta:', data);

    // Verificar si ya existe una carpeta con la misma ruta
    const existingFolder = await prisma.folder.findFirst({
      where: { path: data.path },
    });

    if (existingFolder) {
      throw new FolderError('Ya existe una carpeta con esta ruta', 'DUPLICATE_PATH');
    }

    // Crear la carpeta en la base de datos
    const folder = await prisma.folder.create({
      data: {
        name: data.name,
        path: data.path,
        totalFiles: data.totalFiles || 0,
        totalSize: data.totalSize || 0,
        lastIndexed: data.lastIndexed,
      },
      include: {
        images: true,
        _count: {
          select: {
            images: true,
          },
        },
      },
    });

    // Transformar la carpeta para la respuesta
    const transformedFolder = transformFolder(folder);

    // Revalidar rutas
    await revalidateFolderPaths();

    folderLogger.info('✅ Carpeta creada:', { id: folder.id, name: folder.name });
    return transformedFolder;
  } catch (error) {
    folderLogger.error('❌ Error al crear carpeta:', error);
    throw new FolderError('No se pudo crear la carpeta', 'CREATE_FAILED', error);
  }
}

/**
 * Actualiza una carpeta existente
 */
export async function updateFolder(data: FolderUpdate): Promise<FolderExtended> {
  try {
    folderLogger.info('📝 Actualizando carpeta:', data);

    // Si se está actualizando la ruta, verificar que no exista otra carpeta con la misma ruta
    if (data.path) {
      const existingFolder = await prisma.folder.findFirst({
        where: {
          path: data.path,
          NOT: {
            id: data.id,
          },
        },
      });

      if (existingFolder) {
        throw new FolderError('Ya existe una carpeta con esta ruta', 'DUPLICATE_PATH');
      }
    }

    // Actualizar la carpeta
    const folder = await prisma.folder.update({
      where: { id: data.id },
      data: {
        name: data.name,
        path: data.path,
        totalFiles: data.totalFiles,
        totalSize: data.totalSize,
        lastIndexed: data.lastIndexed,
        autoReindex: data.autoReindex,
      },
      include: {
        images: true,
        _count: {
          select: {
            images: true,
          },
        },
      },
    });

    // Transformar la carpeta para la respuesta
    const transformedFolder = transformFolder(folder);

    // Revalidar rutas
    await revalidateFolderPaths();

    folderLogger.info('✅ Carpeta actualizada:', { id: folder.id, name: folder.name });
    return transformedFolder;
  } catch (error) {
    folderLogger.error('❌ Error al actualizar carpeta:', error);
    throw new FolderError('No se pudo actualizar la carpeta', 'UPDATE_FAILED', error);
  }
}

/**
 * Elimina una carpeta
 */
export async function deleteFolder(id: string): Promise<boolean> {
  try {
    folderLogger.info('🗑️ Eliminando carpeta:', id);

    // Verificar que la carpeta existe
    const folder = await prisma.folder.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            images: true,
          },
        },
      },
    });

    if (!folder) {
      throw new FolderError('Carpeta no encontrada', 'NOT_FOUND');
    }

    // Verificar si la carpeta tiene imágenes
    if (folder._count.images > 0) {
      throw new FolderError(
        'No se puede eliminar una carpeta que contiene imágenes',
        'HAS_IMAGES'
      );
    }

    // Eliminar la carpeta
    await prisma.folder.delete({
      where: { id },
    });

    // Revalidar rutas
    await revalidateFolderPaths();

    folderLogger.info('✅ Carpeta eliminada:', { id });
    return true;
  } catch (error) {
    folderLogger.error('❌ Error al eliminar carpeta:', error);
    throw new FolderError('No se pudo eliminar la carpeta', 'DELETE_FAILED', error);
  }
}