"use server";

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { revalidatePath } from "next/cache";
import { existsSync } from 'fs';
import { readdir, stat } from 'fs/promises';
import { join, extname } from 'path';
import { generateThumbnail } from '@/lib/thumbnail';
import { extractMetadata } from '@/app/actions/metadata.actions';
import { computeHash } from '@/lib/hash';
import { fsService } from '@/services/fs.server';
import { eventsService } from '@/services/events.service';
import { statsEventEmitter, STATS_EVENTS } from '@/services/stats.service';
import type { Folder } from '@prisma/client';
import type { FileItem } from '@/types/file-item'

const folderLogger = logger.withContext('FolderActions');

const REVALIDATE_PATHS = [
  '/settings',
  '/folders',
  '/folders/[id]'
] as const;

const revalidateAllPaths = () => {
  REVALIDATE_PATHS.forEach(path => revalidatePath(path));
  folderLogger.info('🔄 Rutas revalidadas');
};

class FolderError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'FolderError';
  }
}

export interface FolderCreate {
  name: string;
  path: string;
  totalFiles?: number;
  totalSize?: number;
  lastIndexed?: Date;
}

export interface FolderUpdate extends Partial<Omit<FolderCreate, 'path'>> {
  id: string;
  path?: string;
}

export interface ProcessStatus {
  status?: string;
  current?: number;
  total?: number;
  progress?: number;
  currentFile?: string;
  timestamp?: number;
  folderId?: string;
  phase?: 'scanning' | 'indexing' | 'thumbnails' | 'metadata';
  filesProcessed?: number;
  totalFiles?: number;
  fileDetails?: {
    name: string;
    size: number;
    type: string;
    dimensions?: {
      width: number;
      height: number;
    };
  };
  extendedStats?: {
    fileTypes: { [key: string]: number };
    averageSize: number;
    processingSpeed: number;
    errorsByType: { [key: string]: number };
    healthScore: number;
  };
  errors?: Array<{
    file: string;
    error: string;
    timestamp: number;
  }>;
  globalProgress?: {
    current: number;
    total: number;
    progress: number;
  };
}

export interface FolderResponse {
  folder: {
    id: string;
    name: string;
    path: string;
    totalFiles?: number;
    totalSize?: number;
    lastIndexed?: string | null;
    createdAt?: string;
    updatedAt?: string;
  };
  stats?: {
    processed: number;
    total: number;
    totalSize?: number;
  };
  timestamp?: number;
}

const SUPPORTED_FORMATS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];

export async function getFolders() {
  try {
    folderLogger.info('📁 Iniciando obtención de carpetas');
    const folders = await prisma.folder.findMany({
      include: {
        _count: {
          select: { images: true },
        },
        images: {
          take: 9,
          orderBy: [
            { isFavorite: 'desc' },
            { createdAt: 'desc' }
          ],
          select: {
            id: true,
            name: true,
            path: true,
            size: true,
            width: true,
            height: true,
            metadata: true,
            thumbnail: true,
            thumbnailWidth: true,
            thumbnailHeight: true,
            thumbnailSize: true,
            isPublic: true,
            isFavorite: true,
            folderId: true,
            createdAt: true,
            updatedAt: true
          }
        }
      },
      orderBy: { name: 'asc' },
    });

    folderLogger.info('✅ Carpetas obtenidas', { count: folders.length });
    return folders.map(folder => ({
      ...folder,
      recentImages: Array(9).fill(null).map((_, index) => {
        const img = folder.images[index];
        if (img?.thumbnail && img.thumbnailSize && img.thumbnailSize < 100000) {
          try {
            return `data:image/jpeg;base64,${Buffer.from(img.thumbnail).toString('base64')}`;
          } catch (error) {
            folderLogger.error('❌ Error convirtiendo thumbnail a base64:', error);
            return null;
          }
        }
        return null;
      }),
      images: undefined // Removemos las imágenes completas para no enviar datos innecesarios
    }));
  } catch (error) {
    folderLogger.error('❌ Error al obtener carpetas', error);
    throw new FolderError('No se pudieron obtener las carpetas', { cause: error });
  }
}

export async function getFolder(id: string) {
  try {
    folderLogger.info('🔍 Obteniendo carpeta:', id);
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
      folderLogger.warn('❌ Carpeta no encontrada:', id);
      throw new FolderError("Carpeta no encontrada");
    }

    folderLogger.info('✅ Carpeta obtenida:', folder.name);
    return folder;
  } catch (error) {
    folderLogger.error("❌ Error al obtener carpeta:", error);
    if (error instanceof FolderError) throw error;
    throw new FolderError("No se pudo obtener la carpeta", error);
  }
}

export async function createFolder(path: string) {
  try {
    folderLogger.info('📁 Agregando nueva carpeta:', path);

    if (!path) {
      throw new FolderError('PATH_REQUIRED');
    }

    // Validar y normalizar la ruta
    const normalizedPath = fsService.normalizePath(path);
    folderLogger.info('Path normalizado:', { original: path, normalized: normalizedPath });

    if (!existsSync(normalizedPath)) {
      throw new FolderError('PATH_NOT_FOUND');
    }

    // Verificar si la carpeta ya existe
    const existingFolder = await prisma.folder.findFirst({
      where: { path: normalizedPath }
    });

    if (existingFolder) {
      throw new FolderError('FOLDER_EXISTS');
    }

    // Crear carpeta en la base de datos
    const folder = await prisma.folder.create({
      data: {
        path: normalizedPath,
        name: normalizedPath.split('\\').pop() || normalizedPath,
        lastIndexed: new Date()
      }
    });

    folderLogger.info('✅ Carpeta creada:', folder);

    // Emitir eventos
    eventsService.emit('folders:modified');
    statsEventEmitter.emit(STATS_EVENTS.FOLDER_CHANGE);

    revalidateAllPaths();

    return folder;
  } catch (error) {
    folderLogger.error("❌ Error al crear carpeta:", error);
    if (error instanceof FolderError) throw error;
    throw new FolderError("No se pudo crear la carpeta", error);
  }
}

export async function updateFolder(id: string, data: FolderUpdate) {
  try {
    folderLogger.info('📝 Actualizando carpeta:', id);
    const folder = await prisma.folder.update({
      where: { id },
      data,
    });
    folderLogger.info('✅ Carpeta actualizada:', folder.name);
    revalidateAllPaths();
    return folder;
  } catch (error) {
    folderLogger.error("❌ Error al actualizar carpeta:", error);
    throw new FolderError("No se pudo actualizar la carpeta", error);
  }
}

export async function deleteFolder(id: string) {
  try {
    folderLogger.info('🗑️ Eliminando carpeta:', id);
    await prisma.folder.delete({
      where: { id },
    });
    folderLogger.info('✅ Carpeta eliminada');

    // Emitir eventos
    eventsService.emit('folders:modified');
    eventsService.emit('files:modified');
    statsEventEmitter.emit(STATS_EVENTS.FOLDER_CHANGE);
    statsEventEmitter.emit(STATS_EVENTS.FILES_CHANGE);

    revalidateAllPaths();
  } catch (error) {
    folderLogger.error("❌ Error al eliminar carpeta:", error);
    throw new FolderError("No se pudo eliminar la carpeta", error);
  }
}

const processDirectory = async (
  dirPath: string,
  folderId: string,
  emitProgress: (status: ProcessStatus) => void
): Promise<{ processed: number; total: number; totalSize: number }> => {
  try {
    const files = await readdir(dirPath);
    let processed = 0;
    let total = 0;
    let totalSize = 0;

    // Contar archivos primero
    for (const file of files) {
      const filePath = join(dirPath, file);
      const stats = await stat(filePath);

      if (stats.isDirectory()) {
        const subDirStats = await processDirectory(filePath, folderId, emitProgress);
        total += subDirStats.total;
        totalSize += subDirStats.totalSize;
        continue;
      }

      const ext = extname(file).toLowerCase();
      if (SUPPORTED_FORMATS.includes(ext)) {
        total++;
        totalSize += stats.size;
      }
    }

    // Emitir progreso inicial
    emitProgress({
      status: 'Escaneando archivos...',
      phase: 'scanning' as const,
      current: 0,
      total,
      progress: 0,
      folderId,
      filesProcessed: 0,
      totalFiles: total,
      timestamp: Date.now()
    });

    // Procesar archivos
    for (const file of files) {
      try {
        const filePath = join(dirPath, file);
        const stats = await stat(filePath);

        if (stats.isDirectory()) {
          const subDirStats = await processDirectory(filePath, folderId, emitProgress);
          processed += subDirStats.processed;
          continue;
        }

        const ext = extname(file).toLowerCase();
        if (!SUPPORTED_FORMATS.includes(ext)) {
          continue;
        }

        // Emitir progreso del archivo actual
        emitProgress({
          status: `Procesando ${file}...`,
          phase: 'indexing' as const,
          current: processed,
          total,
          progress: (processed / total) * 100,
          currentFile: file,
          folderId,
          filesProcessed: processed,
          totalFiles: total,
          timestamp: Date.now()
        });

        // Obtener metadata y hash
        const metadata = await extractMetadata(filePath);
        const hash = await computeHash(filePath);

        // Asegurarnos de que tenemos las dimensiones
        if (!metadata.dimensions?.width || !metadata.dimensions?.height) {
          folderLogger.warn('No se pudieron obtener las dimensiones de la imagen:', {
            file: filePath,
            metadata
          });
          continue;
        }

        // Emitir progreso de generación de thumbnail
        emitProgress({
          status: `Generando miniatura para ${file}...`,
          phase: 'thumbnails' as const,
          current: processed,
          total,
          progress: (processed / total) * 100,
          currentFile: file,
          folderId,
          filesProcessed: processed,
          totalFiles: total,
          timestamp: Date.now()
        });

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

        // Emitir progreso de metadata
        emitProgress({
          status: `Extrayendo metadata de ${file}...`,
          phase: 'metadata' as const,
          current: processed,
          total,
          progress: (processed / total) * 100,
          currentFile: file,
          folderId,
          filesProcessed: processed,
          totalFiles: total,
          timestamp: Date.now()
        });

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
            folderId,
            createdAt: metadata.fileSystem?.created ? new Date(metadata.fileSystem.created) : new Date(),
            updatedAt: metadata.fileSystem?.modified ? new Date(metadata.fileSystem.modified) : new Date()
          }
        });

        processed++;

        // Emitir progreso después de cada archivo
        emitProgress({
          status: `Procesados ${processed} de ${total} archivos...`,
          phase: 'indexing' as const,
          current: processed,
          total,
          progress: (processed / total) * 100,
          folderId,
          filesProcessed: processed,
          totalFiles: total,
          timestamp: Date.now()
        });
      } catch (fileError) {
        folderLogger.error('Error procesando archivo:', {
          file,
          path: dirPath,
          error: fileError instanceof Error ? fileError.message : 'Error desconocido'
        });
      }
    }

    return { processed, total, totalSize };
  } catch (dirError) {
    folderLogger.error('Error procesando directorio:', {
      path: dirPath,
      error: dirError instanceof Error ? dirError.message : 'Error desconocido'
    });
    return { processed: 0, total: 0, totalSize: 0 };
  }
};

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

    // Procesar la carpeta con eventos de progreso
    const { processed, total, totalSize } = await processDirectory(
      folder.path,
      folder.id,
      (status) => {
        eventsService.emitProgress(status);
      }
    );

    // Actualizar estadísticas de la carpeta
    const updatedFolder = await prisma.folder.update({
      where: { id: folder.id },
      data: {
        totalFiles: total,
        totalSize: totalSize,
        lastIndexed: new Date()
      }
    });

    // Emitir eventos
    eventsService.emit('files:modified');
    eventsService.emit('folders:modified');
    statsEventEmitter.emit(STATS_EVENTS.FOLDER_CHANGE);
    statsEventEmitter.emit(STATS_EVENTS.FILES_CHANGE);

    revalidateAllPaths();

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
        totalSize
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
        images: {
          select: {
            id: true,
            path: true,
            hash: true,
            size: true,
            updatedAt: true
          }
        }
      },
    });

    if (!folder) {
      throw new FolderError('FOLDER_NOT_FOUND');
    }

    if (!existsSync(folder.path)) {
      folderLogger.error('Carpeta no encontrada en el sistema:', folder.path);
      throw new FolderError('PATH_NOT_FOUND');
    }

    const processDirectory = async (dirPath: string): Promise<{ processed: number; total: number; totalSize: number }> => {
      try {
        const files = await readdir(dirPath);
        let processed = 0;
        let total = 0;
        let totalSize = 0;
        let fileTypes: { [key: string]: number } = {};
        let errorsByType: { [key: string]: number } = {};
        let processedFiles = 0;
        let startTime = Date.now();

        // Crear mapa de archivos existentes
        const existingFiles = new Map(
          folder.images.map(img => [img.path, img])
        );

        // Contar archivos primero
        for (const file of files) {
          const filePath = join(dirPath, file);
          const stats = await stat(filePath);

          if (stats.isDirectory()) {
            const subDirStats = await processDirectory(filePath);
            total += subDirStats.total;
            totalSize += subDirStats.totalSize;
            continue;
          }

          const ext = extname(file).toLowerCase();
          if (SUPPORTED_FORMATS.includes(ext)) {
            total++;
            totalSize += stats.size;
            fileTypes[ext] = (fileTypes[ext] || 0) + 1;
          }
        }

        // Emitir progreso inicial
        eventsService.emitProgress({
          status: 'Escaneando archivos...',
          phase: 'scanning',
          current: 0,
          total,
          progress: 0,
          folderId: id,
          filesProcessed: 0,
          totalFiles: total,
          timestamp: Date.now(),
          extendedStats: {
            fileTypes,
            averageSize: totalSize / total,
            processingSpeed: 0,
            errorsByType,
            healthScore: 100
          }
        });

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

            const existingFile = existingFiles.get(filePath);
            const fileStats = await stat(filePath);
            const needsUpdate = !existingFile ||
              existingFile.size !== fileStats.size ||
              new Date(existingFile.updatedAt) < fileStats.mtime;

            if (!needsUpdate) {
              processed++;
              processedFiles++;
              continue;
            }

            // Emitir progreso del archivo actual
            const elapsedTime = (Date.now() - startTime) / 1000;
            const speed = processedFiles / (elapsedTime || 1);

            eventsService.emitProgress({
              status: `Procesando ${file}...`,
              phase: 'indexing',
              current: processed,
              total,
              progress: (processed / total) * 100,
              currentFile: file,
              folderId: id,
              filesProcessed: processedFiles,
              totalFiles: total,
              timestamp: Date.now(),
              fileDetails: {
                name: file,
                size: stats.size,
                type: ext,
              },
              extendedStats: {
                fileTypes,
                averageSize: totalSize / total,
                processingSpeed: speed,
                errorsByType,
                healthScore: 100 - (Object.keys(errorsByType).length * 10)
              }
            });

            // Obtener metadata y hash
            const metadata = await extractMetadata(filePath);
            const hash = await computeHash(filePath);

            if (!metadata.dimensions?.width || !metadata.dimensions?.height) {
              errorsByType['dimensions'] = (errorsByType['dimensions'] || 0) + 1;
              continue;
            }

            // Emitir progreso de generación de thumbnail
            eventsService.emitProgress({
              status: `Generando miniatura para ${file}...`,
              phase: 'thumbnails',
              current: processed,
              total,
              progress: (processed / total) * 100,
              currentFile: file,
              folderId: id,
              filesProcessed: processedFiles,
              totalFiles: total,
              timestamp: Date.now(),
              fileDetails: {
                name: file,
                size: stats.size,
                type: ext,
                dimensions: metadata.dimensions
              },
              extendedStats: {
                fileTypes,
                averageSize: totalSize / total,
                processingSpeed: speed,
                errorsByType,
                healthScore: 100 - (Object.keys(errorsByType).length * 10)
              }
            });

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
              errorsByType['thumbnail'] = (errorsByType['thumbnail'] || 0) + 1;
              folderLogger.error('Error generando thumbnail:', {
                file: filePath,
                error: thumbnailError
              });
            }

            // Actualizar o crear imagen
            if (existingFile) {
              await prisma.image.update({
                where: { id: existingFile.id },
                data: {
                  size: stats.size,
                  hash,
                  width: metadata.dimensions.width,
                  height: metadata.dimensions.height,
                  metadata: JSON.stringify(metadata),
                  thumbnail: thumbnailData?.data,
                  thumbnailSize: thumbnailData?.size,
                  thumbnailWidth: thumbnailData?.width,
                  thumbnailHeight: thumbnailData?.height,
                  updatedAt: new Date()
                }
              });
            } else {
              await prisma.image.create({
                data: {
                  path: filePath,
                  name: file,
                  size: stats.size,
                  hash,
                  width: metadata.dimensions.width,
                  height: metadata.dimensions.height,
                  metadata: JSON.stringify(metadata),
                  thumbnail: thumbnailData?.data,
                  thumbnailSize: thumbnailData?.size,
                  thumbnailWidth: thumbnailData?.width,
                  thumbnailHeight: thumbnailData?.height,
                  folderId: id,
                  createdAt: metadata.fileSystem?.created ? new Date(metadata.fileSystem.created) : new Date(),
                  updatedAt: metadata.fileSystem?.modified ? new Date(metadata.fileSystem.modified) : new Date()
                }
              });
            }

            processed++;
            processedFiles++;

            // Emitir progreso después de cada archivo
            eventsService.emitProgress({
              status: `Procesados ${processed} de ${total} archivos...`,
              phase: 'indexing',
              current: processed,
              total,
              progress: (processed / total) * 100,
              folderId: id,
              filesProcessed: processedFiles,
              totalFiles: total,
              timestamp: Date.now(),
              extendedStats: {
                fileTypes,
                averageSize: totalSize / total,
                processingSpeed: speed,
                errorsByType,
                healthScore: 100 - (Object.keys(errorsByType).length * 10)
              }
            });
          } catch (fileError) {
            errorsByType['processing'] = (errorsByType['processing'] || 0) + 1;
            folderLogger.error('Error procesando archivo:', {
              file,
              path: dirPath,
              error: fileError instanceof Error ? fileError.message : 'Error desconocido'
            });
          }
        }

        return { processed, total, totalSize };
      } catch (dirError) {
        folderLogger.error('Error procesando directorio:', {
          path: dirPath,
          error: dirError instanceof Error ? dirError.message : 'Error desconocido'
        });
        return { processed: 0, total: 0, totalSize: 0 };
      }
    };

    // Procesar la carpeta
    folderLogger.info('Iniciando procesamiento de directorio:', folder.path);
    const { processed, total, totalSize } = await processDirectory(folder.path);

    // Actualizar estadísticas de la carpeta
    const updatedFolder = await prisma.folder.update({
      where: { id: folder.id },
      data: {
        totalFiles: total,
        totalSize: totalSize,
        lastIndexed: new Date()
      }
    });

    // Emitir eventos
    eventsService.emit('files:modified');
    eventsService.emit('folders:modified');
    statsEventEmitter.emit(STATS_EVENTS.FOLDER_CHANGE);
    statsEventEmitter.emit(STATS_EVENTS.FILES_CHANGE);

    revalidateAllPaths();

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
        totalSize
      },
      timestamp: Date.now()
    };
  } catch (error) {
    folderLogger.error('Error en reindexación:', error);
    if (error instanceof FolderError) throw error;
    throw new FolderError('Error en la reindexación', error);
  }
}

function transformImageToFileItem(image: any): FileItem {
  try {
    if (!image || typeof image !== 'object') {
      throw new Error('Invalid image object');
    }

    return {
      id: image.id || '',
      name: image.name || '',
      path: image.path || '',
      type: 'image',
      size: Number(image.size) || 0,
      width: Number(image.width) || 0,
      height: Number(image.height) || 0,
      metadata: image.metadata || null,
      thumbnail: image.thumbnail ? Buffer.from(image.thumbnail).toString('base64') : null,
      thumbnailSize: Number(image.thumbnailSize) || 0,
      thumbnailWidth: Number(image.thumbnailWidth) || 0,
      thumbnailHeight: Number(image.thumbnailHeight) || 0,
      isPublic: Boolean(image.isPublic),
      isFavorite: Boolean(image.isFavorite),
      folderId: image.folderId || '',
      createdAt: image.createdAt instanceof Date ? image.createdAt : new Date(image.createdAt || Date.now()),
      updatedAt: image.updatedAt instanceof Date ? image.updatedAt : new Date(image.updatedAt || Date.now()),
      modifiedAt: image.updatedAt instanceof Date ? image.updatedAt : new Date(image.updatedAt || Date.now()),
      accessedAt: image.updatedAt instanceof Date ? image.updatedAt : new Date(image.updatedAt || Date.now()),
      collections: Array.isArray(image.collections) ? image.collections.map((c: any) => ({
        id: c?.id || '',
        name: c?.name || ''
      })) : [],
      tags: Array.isArray(image.tags) ? image.tags.map((t: any) => ({
        id: t?.id || '',
        name: t?.name || ''
      })) : [],
      albums: Array.isArray(image.albums) ? image.albums.map((a: any) => ({
        id: a?.id || '',
        name: a?.name || ''
      })) : [],
      characters: Array.isArray(image.characters) ? image.characters.map((c: any) => ({
        id: c?.id || '',
        name: c?.name || ''
      })) : [],
      places: Array.isArray(image.places) ? image.places.map((p: any) => ({
        id: p?.id || '',
        name: p?.name || ''
      })) : [],
      objects: Array.isArray(image.objects) ? image.objects.map((o: any) => ({
        id: o?.id || '',
        name: o?.name || ''
      })) : []
    };
  } catch (error) {
    folderLogger.error('❌ Error transformando imagen:', error);
    throw new Error(`Error transformando imagen: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

export async function getFolderImages(id: string) {
  try {
    folderLogger.info('🔍 Buscando imágenes de la carpeta:', id)

    const folder = await prisma.folder.findUnique({
      where: { id },
      include: {
        images: {
          orderBy: [
            { isFavorite: 'desc' },
            { createdAt: 'desc' }
          ],
          include: {
            collections: {
              select: { id: true, name: true }
            },
            tags: {
              select: { id: true, name: true }
            },
            albums: {
              select: { id: true, name: true }
            },
            characters: {
              select: { id: true, name: true }
            },
            places: {
              select: { id: true, name: true }
            },
            objects: {
              select: { id: true, name: true }
            }
          }
        }
      }
    })

    if (!folder) {
      throw new FolderError('Carpeta no encontrada')
    }

    const transformedImages = folder.images.map(image => transformImageToFileItem(image))
    folderLogger.info('✅ Imágenes obtenidas:', transformedImages.length)
    return transformedImages
  } catch (error) {
    folderLogger.error('Error obteniendo imágenes:', error)
    if (error instanceof FolderError) throw error
    throw new FolderError('Error al obtener las imágenes', error)
  }
}