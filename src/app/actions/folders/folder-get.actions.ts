'use server';

/**
 * @file Acciones específicas para obtener carpetas
 * @module app/actions/folders/folder-get.actions
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { transformFolderToExtended } from '@/transformers/folder';

// Logger específico para el archivo
const folderLogger = serverLogger.withContext('FolderGetActions');

/**
 * Obtiene todas las carpetas
 * @returns Lista de carpetas extendidas
 */
export async function getFolders() {
  try {
    folderLogger.info('📂 Obteniendo todas las carpetas');

    const folders = await prisma.folder.findMany({
      include: {
        _count: {
          select: {
            images: true,
            videos: true,
            children: true,
          }
        },
        parent: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transformar a modelo extendido con transformador
    const transformedFolders = folders.map(folder => transformFolderToExtended(folder));

    folderLogger.info(`✅ Obtenidas ${transformedFolders.length} carpetas`);

    return transformedFolders;
  } catch (error) {
    folderLogger.error('❌ Error obteniendo carpetas:', error);
    throw new Error(`Error al obtener carpetas: ${error instanceof Error ? error.message : String(error)}`);
  }
}