'use server';

/**
 * @file Acciones específicas para indexación de carpetas
 * @module app/actions/folders/folder-indexing.actions
 */

import { scanFolder } from '@/lib/folder-scanner';
import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import {
    FOLDER_ERROR_CODES,
    FolderResponse,
    IndexOptions,
    ReindexOptions,
    createFolderError
} from './folder-types';

// Logger específico para el archivo
const indexingLogger = serverLogger.withContext('FolderIndexingActions');

// Rutas que deben ser revalidadas cuando cambian las carpetas
const REVALIDATE_PATHS = [
  '/folders',
  '/images',
  '/dashboard',
  '/api/folders',
  '/api/images',
];

/**
 * Revalida todas las rutas relevantes
 */
async function revalidatePaths() {
  for (const path of REVALIDATE_PATHS) {
    revalidatePath(path);
  }
  indexingLogger.info('🔄 Rutas revalidadas');
}

/**
 * Indexa una carpeta y actualiza su contenido en la base de datos
 * @param id ID de la carpeta
 * @param options Opciones de indexación
 */
export async function indexFolder(id: string, options?: IndexOptions): Promise<FolderResponse> {
  try {
    indexingLogger.info('📂 Iniciando indexación de carpeta:', id);

    // Obtener la carpeta de la base de datos
    const folder = await prisma.folder.findUnique({
      where: { id },
    });

    if (!folder) {
      throw createFolderError('Carpeta no encontrada', FOLDER_ERROR_CODES.NOT_FOUND);
    }

    // Actualizar el estado de la carpeta a "indexando"
    await prisma.folder.update({
      where: { id },
      data: {
        status: 'INDEXING',
      },
    });

    // Escanear la carpeta
    indexingLogger.info('🔍 Escaneando carpeta:', folder.path);
    const scanResult = await scanFolder(folder.path, {
      recursive: options?.recursive ?? true,
      includeHidden: options?.includeHidden ?? false
    });

    // Actualizar la carpeta con los resultados del escaneo
    const updatedFolder = await prisma.folder.update({
      where: { id },
      data: {
        totalFiles: scanResult.totalFiles,
        totalSize: scanResult.totalSize,
        lastIndexed: new Date(),
        status: 'INDEXED',
      },
    });

    // Revalidar rutas
    await revalidatePaths();

    // Crear la respuesta
    const response: FolderResponse = {
      id: updatedFolder.id,
      name: updatedFolder.name,
      path: updatedFolder.path,
      totalFiles: updatedFolder.totalFiles,
      totalSize: updatedFolder.totalSize,
      lastIndexed: updatedFolder.lastIndexed,
      createdAt: updatedFolder.createdAt,
      updatedAt: updatedFolder.updatedAt,
      autoReindex: updatedFolder.autoReindex,
      isWatched: updatedFolder.isWatched,
      status: updatedFolder.status,
      parentId: updatedFolder.parentId,
      stats: {
        totalImages: scanResult.images.length,
        totalVideos: scanResult.videos.length,
        totalOthers: scanResult.others.length,
        averageFileSize: scanResult.totalFiles > 0 ? scanResult.totalSize / scanResult.totalFiles : 0,
      }
    };

    indexingLogger.info('✅ Carpeta indexada correctamente:', {
      id: response.id,
      totalFiles: response.totalFiles
    });

    return response;
  } catch (error) {
    indexingLogger.error('❌ Error indexando carpeta:', error);
    throw createFolderError(
      'Error al indexar carpeta',
      FOLDER_ERROR_CODES.INDEXING_ERROR,
      error instanceof Error ? error.stack : undefined,
      undefined,
      error
    );
  }
}

/**
 * Reindexar una carpeta existente
 */
export async function reindexFolder(id: string, options?: ReindexOptions): Promise<FolderResponse> {
  try {
    indexingLogger.info('🔄 Iniciando reindexación de carpeta:', id);

    // Reutilizar lógica de indexación
    const result = await indexFolder(id, options);

    indexingLogger.info('✅ Carpeta reindexada correctamente:', {
      id: result.id,
      totalFiles: result.totalFiles
    });

    return result;
  } catch (error) {
    indexingLogger.error('❌ Error reindexando carpeta:', error);
    throw createFolderError(
      'Error al reindexar carpeta',
      FOLDER_ERROR_CODES.INDEXING_ERROR,
      error instanceof Error ? error.stack : undefined,
      undefined,
      error
    );
  }
}