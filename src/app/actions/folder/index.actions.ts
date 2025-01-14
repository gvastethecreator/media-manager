'use server';

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { existsSync } from 'fs';
import { readdir, stat } from 'fs/promises';
import { join, extname, sep } from 'path';
import { generateThumbnail } from '@/lib/thumbnail';
import { getImageMetadata } from '@/lib/metadata';
import { computeHash } from '@/lib/hash';
import { eventsService } from '@/services/events.service';
import { statsEventEmitter, STATS_EVENTS } from '@/services/stats.service';
import { FolderError } from './types';
import type { FolderResponse, FolderImagesResponse, SimplifiedFileResponse } from './types';

const folderLogger = logger.withContext('FolderIndexActions');

const SUPPORTED_FORMATS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];

export async function indexFolder(id: string): Promise<FolderResponse> {
  try {
    folderLogger.info('🔄 Iniciando indexación de carpeta:', id);

    const folder = await prisma.folder.findUnique({
      where: { id },
      select: {
        id: true,
        path: true,
        name: true,
      },
    });

    if (!folder) {
      throw new FolderError('FOLDER_NOT_FOUND');
    }

    if (!existsSync(folder.path)) {
      folderLogger.error('Carpeta no encontrada en el sistema:', folder.path);
      throw new FolderError('PATH_NOT_FOUND');
    }

    // Eliminar imágenes existentes
    await prisma.image.deleteMany({
      where: { folderId: folder.id }
    });

    const processDirectory = async (dirPath: string): Promise<{ processed: number; total: number }> => {
      try {
        const files = await readdir(dirPath);
        let processed = 0;
        let total = 0;

        // Contar archivos primero
        for (const file of files) {
          const filePath = join(dirPath, file);
          const stats = await stat(filePath);

          if (stats.isDirectory()) {
            const subDirStats = await processDirectory(filePath);
            total += subDirStats.total;
            continue;
          }

          const ext = extname(file).toLowerCase();
          if (SUPPORTED_FORMATS.includes(ext)) {
            total++;
          }
        }

        // Procesar archivos
        for (const file of files) {
          try {
            const filePath = join(dirPath, file);
            const stats = await stat(filePath);

            if (stats.isDirectory()) {
              const subDirStats = await processDirectory(filePath);
              processed += subDirStats.processed;
              continue;
            }

            const ext = extname(file).toLowerCase();
            if (!SUPPORTED_FORMATS.includes(ext)) {
              continue;
            }

            // Obtener metadata y hash
            const metadata = await getImageMetadata(filePath);
            const hash = await computeHash(filePath);

            // Asegurarnos de que tenemos las dimensiones
            if (!metadata.dimensions?.width || !metadata.dimensions?.height) {
              folderLogger.warn('No se pudieron obtener las dimensiones de la imagen:', {
                file: filePath,
                metadata
              });
              continue;
            }

            // Generar thumbnail
            let thumbnailData = null;
            try {
              const result = await generateThumbnail(filePath);
              if (result?.buffer) {
                thumbnailData = {
                  data: result.buffer,
                  size: result.buffer.length,
                  width: result.width,
                  height: result.height
                };
              }
            } catch (thumbnailError) {
              folderLogger.error('Error generando thumbnail:', {
                file: filePath,
                error: thumbnailError
              });
            }

            // Crear entrada en la base de datos
            await prisma.image.create({
              data: {
                path: filePath,
                name: file,
                size: metadata.fileSystem?.size || 0,
                hash,
                width: metadata.dimensions.width,
                height: metadata.dimensions.height,
                metadata: JSON.stringify(metadata),
                thumbnail: thumbnailData?.data,
                thumbnailSize: thumbnailData?.size,
                thumbnailWidth: thumbnailData?.width,
                thumbnailHeight: thumbnailData?.height,
                folderId: folder.id,
                createdAt: metadata.fileSystem?.created ? new Date(metadata.fileSystem.created) : new Date(),
                updatedAt: metadata.fileSystem?.modified ? new Date(metadata.fileSystem.modified) : new Date()
              }
            });

            processed++;
          } catch (fileError) {
            folderLogger.error('Error procesando archivo:', {
              file,
              path: dirPath,
              error: fileError instanceof Error ? fileError.message : 'Error desconocido'
            });
          }
        }

        return { processed, total };
      } catch (dirError) {
        folderLogger.error('Error procesando directorio:', {
          path: dirPath,
          error: dirError instanceof Error ? dirError.message : 'Error desconocido'
        });
        return { processed: 0, total: 0 };
      }
    };

    // Procesar la carpeta
    folderLogger.info('Iniciando procesamiento de directorio:', folder.path);
    const { processed, total } = await processDirectory(folder.path);

    // Actualizar estadísticas de la carpeta
    const stats = await prisma.image.aggregate({
      where: { folderId: folder.id },
      _sum: { size: true },
      _count: true
    });

    const updatedFolder = await prisma.folder.update({
      where: { id: folder.id },
      data: {
        totalFiles: stats._count,
        totalSize: stats._sum.size || 0,
        lastIndexed: new Date()
      }
    });

    // Emitir eventos
    eventsService.emit('files:modified');
    eventsService.emit('folders:modified');
    statsEventEmitter.emit(STATS_EVENTS.FOLDER_CHANGE);
    statsEventEmitter.emit(STATS_EVENTS.STATS_UPDATED);

    folderLogger.info('Procesamiento completado:', { processed, total });
    return {
      folder: {
        id: updatedFolder.id,
        name: updatedFolder.name,
        path: updatedFolder.path,
        totalFiles: updatedFolder.totalFiles,
        totalSize: updatedFolder.totalSize,
        lastIndexed: updatedFolder.lastIndexed?.toISOString() || null,
        createdAt: updatedFolder.createdAt.toISOString(),
        updatedAt: updatedFolder.updatedAt.toISOString()
      },
      stats: {
        processed,
        total,
        totalSize: stats._sum.size || 0
      },
      timestamp: Date.now()
    };
  } catch (error) {
    folderLogger.error('Error en indexación:', error);
    if (error instanceof FolderError) throw error;
    throw new FolderError('Error en la indexación', error);
  }
}

export async function reindexFolder(id: string): Promise<FolderResponse> {
  try {
    folderLogger.info('🔄 Reindexando carpeta:', id);

    const folder = await prisma.folder.findUnique({
      where: { id },
      select: {
        id: true,
        path: true,
        name: true,
      },
    });

    if (!folder) {
      throw new FolderError('FOLDER_NOT_FOUND');
    }

    if (!existsSync(folder.path)) {
      folderLogger.error('Carpeta no encontrada en el sistema:', folder.path);
      throw new FolderError('PATH_NOT_FOUND');
    }

    const processDirectory = async (dirPath: string): Promise<{ processed: number; total: number }> => {
      try {
        const files = await readdir(dirPath);
        let processed = 0;
        let total = 0;

        // Contar archivos primero
        for (const file of files) {
          const filePath = join(dirPath, file);
          const stats = await stat(filePath);

          if (stats.isDirectory()) {
            const subDirStats = await processDirectory(filePath);
            total += subDirStats.total;
            continue;
          }

          const ext = extname(file).toLowerCase();
          if (SUPPORTED_FORMATS.includes(ext)) {
            total++;
          }
        }

        // Procesar archivos
        for (const file of files) {
          try {
            const filePath = join(dirPath, file);
            const stats = await stat(filePath);

            if (stats.isDirectory()) {
              const subDirStats = await processDirectory(filePath);
              processed += subDirStats.processed;
              continue;
            }

            const ext = extname(file).toLowerCase();
            if (!SUPPORTED_FORMATS.includes(ext)) {
              continue;
            }

            // Verificar si la imagen ya existe
            const existingImage = await prisma.image.findFirst({
              where: { path: filePath }
            });

            if (!existingImage) {
              // Procesar nueva imagen
              const hash = await computeHash(filePath);
              const metadata = await getImageMetadata(filePath);

              if (!metadata.dimensions?.width || !metadata.dimensions?.height) {
                folderLogger.warn('No se pudieron obtener las dimensiones de la imagen:', {
                  file: filePath,
                  metadata
                });
                continue;
              }

              await prisma.image.create({
                data: {
                  name: file,
                  path: filePath,
                  hash,
                  size: stats.size,
                  width: metadata.dimensions.width,
                  height: metadata.dimensions.height,
                  metadata: JSON.stringify(metadata),
                  folderId: folder.id,
                  isPublic: false
                }
              });

              // Generar thumbnail
              await generateThumbnail(filePath);
              processed++;
            } else {
              // Actualizar metadata si es necesario
              const metadata = await getImageMetadata(filePath);
              await prisma.image.update({
                where: { id: existingImage.id },
                data: {
                  size: stats.size,
                  metadata: JSON.stringify(metadata),
                  updatedAt: new Date()
                }
              });
              processed++;
            }
          } catch (fileError) {
            folderLogger.error('Error procesando archivo:', {
              path: file,
              error: fileError instanceof Error ? fileError.message : 'Error desconocido'
            });
            continue;
          }
        }

        return { processed, total };
      } catch (dirError) {
        folderLogger.error('Error procesando directorio:', {
          path: dirPath,
          error: dirError instanceof Error ? dirError.message : 'Error desconocido'
        });
        return { processed: 0, total: 0 };
      }
    };

    // Procesar la carpeta
    folderLogger.info('Iniciando procesamiento de directorio:', folder.path);
    const { processed, total } = await processDirectory(folder.path);

    // Actualizar estadísticas de la carpeta
    const stats = await prisma.image.aggregate({
      where: { folderId: folder.id },
      _sum: { size: true },
      _count: true
    });

    const updatedFolder = await prisma.folder.update({
      where: { id: folder.id },
      data: {
        totalFiles: stats._count,
        totalSize: stats._sum.size || 0,
        lastIndexed: new Date()
      }
    });

    // Emitir eventos
    eventsService.emit('files:modified');
    eventsService.emit('folders:modified');
    statsEventEmitter.emit(STATS_EVENTS.FOLDER_CHANGE);
    statsEventEmitter.emit(STATS_EVENTS.STATS_UPDATED);

    folderLogger.info('Procesamiento completado:', { processed, total });
    return {
      folder: {
        id: updatedFolder.id,
        name: updatedFolder.name,
        path: updatedFolder.path,
        totalFiles: updatedFolder.totalFiles,
        totalSize: updatedFolder.totalSize,
        lastIndexed: updatedFolder.lastIndexed?.toISOString() || null,
        createdAt: updatedFolder.createdAt.toISOString(),
        updatedAt: updatedFolder.updatedAt.toISOString()
      },
      stats: {
        processed,
        total,
        totalSize: stats._sum.size || 0
      },
      timestamp: Date.now()
    };
  } catch (error) {
    folderLogger.error('Error en reindexación:', error);
    if (error instanceof FolderError) throw error;
    throw new FolderError('Error en la reindexación', error);
  }
}

export async function getFolderImages(id: string): Promise<FolderImagesResponse> {
  try {
    folderLogger.info('🖼️ Obteniendo imágenes de carpeta:', id);

    const folder = await prisma.folder.findUnique({
      where: { id },
      include: {
        images: {
          orderBy: {
            name: 'asc'
          },
          include: {
            stats: true,
            tags: {
              select: {
                id: true,
                name: true,
                color: true
              }
            },
            collections: {
              select: {
                id: true,
                name: true,
                color: true
              }
            },
            albums: {
              select: {
                id: true,
                name: true,
                color: true
              }
            },
            characters: {
              select: {
                id: true,
                name: true,
                color: true
              }
            },
            places: {
              select: {
                id: true,
                name: true,
                color: true
              }
            },
            objects: {
              select: {
                id: true,
                name: true,
                color: true
              }
            }
          }
        }
      }
    });

    if (!folder) {
      throw new FolderError('Carpeta no encontrada');
    }

    folderLogger.info(`✅ ${folder.images.length} imágenes encontradas`);

    const files = folder.images.map((image) => {
      // Construir metadata
      const metadata = {
        mimeType: image.metadata ? JSON.parse(image.metadata).mimeType : undefined,
        size: image.size,
        dimensions: image.width && image.height
          ? { width: image.width, height: image.height }
          : undefined,
        fileSystem: {
          size: image.size,
          created: image.createdAt.toISOString(),
          modified: image.updatedAt.toISOString(),
          accessed: image.updatedAt.toISOString()
        },
        extension: image.path ? extname(image.path).slice(1) : undefined,
        exif: image.metadata ? JSON.parse(image.metadata).exif : undefined,
        generation: image.metadata ? JSON.parse(image.metadata).generation : undefined
      };

      return {
        id: image.id,
        name: image.name,
        path: image.path,
        type: 'image',
        size: image.size,
        width: image.width,
        height: image.height,
        metadata: JSON.stringify(metadata),
        thumbnail: image.thumbnail
          ? `data:${metadata.mimeType || 'image/webp'};base64,${Buffer.from(image.thumbnail).toString('base64')}`
          : null,
        thumbnailSize: image.thumbnailSize,
        thumbnailWidth: image.thumbnailWidth,
        thumbnailHeight: image.thumbnailHeight,
        isPublic: image.isPublic || false,
        isFavorite: image.isFavorite || false,
        folderId: folder.id,
        createdAt: image.createdAt,
        updatedAt: image.updatedAt,
        collections: image.collections.map(c => ({
          id: c.id,
          name: c.name,
          color: c.color
        })),
        tags: image.tags.map(t => ({
          id: t.id,
          name: t.name,
          color: t.color
        })),
        albums: image.albums.map(a => ({
          id: a.id,
          name: a.name,
          color: a.color
        })),
        characters: image.characters.map(c => ({
          id: c.id,
          name: c.name,
          color: c.color
        })),
        places: image.places.map(p => ({
          id: p.id,
          name: p.name,
          color: p.color
        })),
        objects: image.objects.map(o => ({
          id: o.id,
          name: o.name,
          color: o.color
        }))
      };
    });

    return {
      items: files,
      folder: {
        id: folder.id,
        name: folder.name,
        path: folder.path,
        totalFiles: folder.totalFiles,
        totalSize: folder.totalSize
      }
    };
  } catch (error) {
    folderLogger.error('❌ Error al obtener imágenes:', error);
    throw new FolderError('No se pudieron obtener las imágenes', error);
  }
}

export async function getFolderFiles(id: string): Promise<SimplifiedFileResponse> {
  try {
    folderLogger.info('📂 Obteniendo archivos de carpeta:', id);

    const folder = await prisma.folder.findUnique({
      where: { id },
      include: {
        images: {
          orderBy: {
            name: 'asc'
          }
        }
      }
    });

    if (!folder) {
      throw new FolderError('Carpeta no encontrada');
    }

    folderLogger.info(`✅ ${folder.images.length} archivos encontrados`);

    // Convertir las imágenes al formato esperado por VirtualizedView
    const files = folder.images.map((image) => {
      const metadata = image.metadata ? JSON.parse(image.metadata) : null;
      const mimeType = metadata?.mimeType || `image/${extname(image.path).slice(1)}`;

      return {
        id: image.id,
        name: image.name,
        path: image.path,
        size: image.size,
        type: 'image',
        mimeType,
        lastModified: image.updatedAt,
        isDirectory: false,
        metadata,
        thumbnailUrl: `/api/thumbnails/${image.id}?quality=medium`,
        previewUrl: image.path ? `/local-files/${image.path.split(sep).join('/')}` : null,
        downloadUrl: `/api/images/${image.id}/download`
      };
    });

    return {
      items: files,
      folder: {
        id: folder.id,
        name: folder.name,
        path: folder.path,
        totalFiles: folder.totalFiles,
        totalSize: folder.totalSize
      }
    };
  } catch (error) {
    folderLogger.error('❌ Error al obtener archivos:', error);
    throw new FolderError('No se pudieron obtener los archivos', error);
  }
}