'use server';

/**
 * @file Acciones específicas CRUD para carpetas
 * @module app/actions/folders/folder-crud.actions
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { transformFolder } from '@/transformers/folder';
import { type FolderComplete } from '@/types/entities/folder';
import { revalidatePath } from 'next/cache';
import { CreateFolderOptions, FOLDER_ERROR_CODES, UpdateFolderOptions, createFolderError } from './folder-types';

// Logger específico para el archivo
const crudLogger = serverLogger.withContext('FolderCrudActions');

// Rutas que deben ser revalidadas cuando cambian las carpetas
const REVALIDATE_PATHS = [
  '/folders',
  '/dashboard',
  '/images',
  '/api/folders',
];

/**
 * Revalida todas las rutas relevantes
 */
async function revalidatePaths() {
  for (const path of REVALIDATE_PATHS) {
    revalidatePath(path);
  }
  crudLogger.info('🔄 Rutas revalidadas');
}

/**
 * Crea una nueva carpeta en la base de datos
 * @param path Ruta de la carpeta en el sistema de archivos
 * @param options Opciones adicionales para la creación
 * @returns Datos de la carpeta creada
 */
export async function createFolder(path: string, options: CreateFolderOptions = {}): Promise<FolderComplete> {
  try {
    crudLogger.info('📁 Creando nueva carpeta:', { path, ...options });

    // Verificar que la carpeta no exista ya en la base de datos
    const existingFolder = await prisma.folder.findFirst({
      where: { path },
    });

    if (existingFolder) {
      throw createFolderError(
        `Ya existe una carpeta con la ruta ${path}`,
        FOLDER_ERROR_CODES.ALREADY_EXISTS
      );
    }

    // Extraer nombre de la carpeta de la ruta
    const folderName = options.name || path.split('/').pop() || path.split('\\').pop() || 'Nueva carpeta';

    // Crear la carpeta en la base de datos
    const folder = await prisma.folder.create({
      data: {
        name: folderName,
        path,
        description: options.description || '',
        emoji: options.emoji || '📁',
        color: options.color || '',
        autoReindex: options.autoReindex || false,
        parentId: options.parentId || null,
        isPublic: options.isPublic || false,
        status: 'PENDING',
      },
      include: {
        parent: true,
        _count: {
          select: {
            images: true,
            videos: true,
            children: true,
          },
        },
      },
    });

    // Revalidar rutas
    await revalidatePaths();

    // Transformar y devolver resultado
    const transformedFolder = transformFolder(folder);
    crudLogger.info('✅ Carpeta creada correctamente:', {
      id: transformedFolder.id,
      name: transformedFolder.name
    });
    return transformedFolder;
  } catch (error) {
    crudLogger.error('❌ Error creando carpeta:', error);
    throw createFolderError(
      'Error al crear carpeta',
      FOLDER_ERROR_CODES.CREATE_FAILED,
      error instanceof Error ? error.stack : undefined,
      undefined,
      error
    );
  }
}

/**
 * Actualiza una carpeta existente
 * @param id ID de la carpeta a actualizar
 * @param data Datos a actualizar
 * @returns Datos de la carpeta actualizada
 */
export async function updateFolder(id: string, data: UpdateFolderOptions): Promise<FolderComplete> {
  try {
    crudLogger.info('📝 Actualizando carpeta:', { id, data });

    // Buscar la carpeta
    const folder = await prisma.folder.findUnique({
      where: { id },
    });

    if (!folder) {
      throw createFolderError(
        `No se encontró ninguna carpeta con ID ${id}`,
        FOLDER_ERROR_CODES.NOT_FOUND
      );
    }

    // Actualizar la carpeta
    const updatedFolder = await prisma.folder.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        emoji: data.emoji,
        color: data.color,
        autoReindex: data.autoReindex,
        parentId: data.parentId,
        isPublic: data.isPublic,
      },
      include: {
        parent: true,
        _count: {
          select: {
            images: true,
            videos: true,
            children: true,
          },
        },
      },
    });

    // Revalidar rutas
    await revalidatePaths();

    // Transformar y devolver resultado
    const transformedFolder = transformFolder(updatedFolder);
    crudLogger.info('✅ Carpeta actualizada correctamente:', {
      id: transformedFolder.id,
      name: transformedFolder.name
    });
    return transformedFolder;
  } catch (error) {
    crudLogger.error('❌ Error actualizando carpeta:', error);
    throw createFolderError(
      'Error al actualizar carpeta',
      FOLDER_ERROR_CODES.UPDATE_FAILED,
      error instanceof Error ? error.stack : undefined,
      undefined,
      error
    );
  }
}

/**
 * Elimina una carpeta y todo su contenido
 * @param id ID de la carpeta a eliminar
 * @returns Confirmación de eliminación
 */
export async function deleteFolder(id: string): Promise<{ success: boolean; id: string }> {
  try {
    crudLogger.info('🗑️ Eliminando carpeta:', id);

    // Buscar la carpeta
    const folder = await prisma.folder.findUnique({
      where: { id },
    });

    if (!folder) {
      throw createFolderError(
        `No se encontró ninguna carpeta con ID ${id}`,
        FOLDER_ERROR_CODES.NOT_FOUND
      );
    }

    // Eliminar la carpeta (Prisma se encargará de las relaciones con cascada)
    await prisma.folder.delete({
      where: { id },
    });

    // Revalidar rutas
    await revalidatePaths();

    crudLogger.info('✅ Carpeta eliminada correctamente:', {
      id,
      name: folder.name
    });
    return { success: true, id };
  } catch (error) {
    crudLogger.error('❌ Error eliminando carpeta:', error);
    throw createFolderError(
      'Error al eliminar carpeta',
      FOLDER_ERROR_CODES.DELETE_FAILED,
      error instanceof Error ? error.stack : undefined,
      undefined,
      error
    );
  }
}