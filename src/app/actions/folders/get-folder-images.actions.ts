'use server';

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import type { FileItem, FileProcessingStatus, FileType } from '@/types/file-item';
import type { MediaMetadata } from '@/types/metadata.types';
import type { EntityId, JSONString } from '@/utils/types/utility-types';
import path from 'path';

const logger = serverLogger.withContext('get-folder-images');

/**
 * Obtiene todas las imágenes de una carpeta específica
 * @param folderId ID de la carpeta
 * @returns Array de objetos FileItem con la información de las imágenes
 */
export async function getFolderImages(folderId: string): Promise<FileItem[]> {
  try {
    logger.info(`🖼️ Obteniendo imágenes de la carpeta ${folderId}`);

    // Verificar que el ID es válido
    if (!folderId || folderId.trim() === '') {
      logger.warn('⚠️ ID de carpeta inválido');
      return [];
    }

    // Verificar si la carpeta existe
    const folderExists = await prisma.folder.findUnique({
      where: { id: folderId },
      select: { id: true, name: true, path: true }
    });

    if (!folderExists) {
      logger.warn(`⚠️ Carpeta con ID ${folderId} no encontrada`);
      return [];
    }

    logger.debug(`📂 Carpeta encontrada: ${folderExists.name} (${folderExists.path})`);

    // Obtener imágenes de la carpeta
    const images = await prisma.image.findMany({
      where: {
        folderId: folderId,
      },
      select: {
        id: true,
        name: true,
        path: true,
        size: true,
        width: true,
        height: true,
        metadata: true,
        thumbnail: true,
        thumbnailSize: true,
        thumbnailWidth: true,
        thumbnailHeight: true,
        createdAt: true,
        updatedAt: true,
        tags: {
          select: {
            id: true,
            name: true,
            color: true,
          }
        }
      },
      orderBy: {
        name: 'asc',
      },
    });

    logger.info(`✅ Encontradas ${images.length} imágenes en la carpeta ${folderId}`);

    if (images.length > 0) {
      // Mostrar información de la primera imagen para depuración
      const firstImage = images[0];
      logger.debug('📄 Primera imagen encontrada:', {
        id: firstImage.id,
        name: firstImage.name,
        path: firstImage.path,
        hasThumbnail: !!firstImage.thumbnail,
        size: firstImage.size,
        dimensions: `${firstImage.width}x${firstImage.height}`,
        tagsCount: firstImage.tags.length
      });
    } else {
      logger.debug('📄 No se encontraron imágenes en la carpeta');
    }

    // Transformar a FileItem
    const fileItems = await Promise.all(images.map(async (image) => {
      // Asegurarse de que el thumbnail tenga la ruta correcta
      let thumbnailUrl = null;

      // Si no hay thumbnail en la base de datos, intentar generarlo ahora
      if (!image.thumbnail) {
        logger.debug(`⚠️ Imagen ${image.id} no tiene thumbnail, generando URL directa`);
        thumbnailUrl = `/api/images/${image.id}/thumbnail`;
      } else {
        // Si hay thumbnail, usar la URL directa
        thumbnailUrl = `/api/images/${image.id}/thumbnail`;
        logger.debug(`✅ Imagen ${image.id} tiene thumbnail, usando URL: ${thumbnailUrl}`);
      }

      // Obtener el nombre del archivo si no está disponible
      const name = image.name || path.basename(image.path || 'sin-nombre');

      return {
        id: image.id as EntityId,
        name,
        path: image.path || '',
        type: 'image' as FileType,
        mimeType: 'image/jpeg', // Valor por defecto
        processingStatus: 'completed' as FileProcessingStatus,
        size: image.size || 0,
        width: image.width || 0,
        height: image.height || 0,
        metadata: (image.metadata || '{}') as JSONString<MediaMetadata>,
        thumbnail: thumbnailUrl,
        thumbnailSize: image.thumbnailSize || 0,
        thumbnailWidth: image.thumbnailWidth || 0,
        thumbnailHeight: image.thumbnailHeight || 0,
        createdAt: image.createdAt,
        updatedAt: image.updatedAt,
        tags: image.tags.map(tag => ({
          id: tag.id,
          name: tag.name,
          color: tag.color || '#000000'
        }))
      };
    }));

    // Verificar que todas las transformaciones fueron exitosas
    logger.info(`✅ Transformadas ${fileItems.length} imágenes a FileItem`);

    if (fileItems.length > 0) {
      // Mostrar información del primer FileItem para depuración
      const firstItem = fileItems[0];
      logger.debug('📄 Primer FileItem transformado:', {
        id: firstItem.id,
        name: firstItem.name,
        thumbnail: firstItem.thumbnail ? 'Disponible' : 'No disponible',
        thumbnailUrl: firstItem.thumbnail
      });
    }

    return fileItems;
  } catch (error) {
    logger.error(`❌ Error al obtener imágenes de la carpeta ${folderId}:`, error);
    // Registrar más detalles sobre el error
    if (error instanceof Error) {
      logger.error(`Detalles del error: ${error.name} - ${error.message}`);
      if (error.stack) {
        logger.error(`Stack trace: ${error.stack}`);
      }
    }
    return [];
  }
}
