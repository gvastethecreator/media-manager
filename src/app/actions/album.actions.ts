'use server'

import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { revalidatePath } from 'next/cache'
import type { Album } from '@prisma/client'
import { eventsService } from '@/services/events.service'
import { statsEventEmitter, STATS_EVENTS } from '@/services/stats.service'

const albumLogger = logger.withContext('AlbumActions')

const REVALIDATE_PATHS = [
  '/settings',
  '/albums',
  '/albums/[id]'
] as const;

const revalidateAllPaths = () => {
  REVALIDATE_PATHS.forEach(path => revalidatePath(path));
  albumLogger.info('🔄 Rutas revalidadas');
};

class AlbumError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'AlbumError';
  }
}

export interface AlbumWithStats extends Album {
  _count: {
    images: number
  }
  totalSize: number
}

export interface AlbumCreate {
  name: string;
  emoji: string;
  color: string;
  description?: string | null;
  shortcut?: string | null;
  sortBy: string;
  filters: string;
}

export interface AlbumUpdate extends Partial<AlbumCreate> {
  id: string;
}

export async function getAlbums() {
  try {
    albumLogger.info('📚 Obteniendo lista de álbumes');
    const albums = await prisma.album.findMany({
      include: {
        _count: {
          select: {
            images: true,
          },
        },
      },
    });

    const albumsWithStats = await Promise.all(
      albums.map(async (album) => {
        const totalSize = await prisma.image.aggregate({
          where: {
            albums: {
              some: {
                id: album.id,
              },
            },
          },
          _sum: {
            size: true,
          },
        });

        return {
          ...album,
          totalSize: totalSize._sum.size || 0,
        };
      })
    );

    albumLogger.info(`✅ ${albums.length} álbumes obtenidos`);
    return albumsWithStats;
  } catch (error) {
    albumLogger.error("❌ Error al obtener álbumes:", error);
    throw new AlbumError("No se pudieron obtener los álbumes", error);
  }
}

export async function getAlbum(id: string) {
  try {
    albumLogger.info('🔍 Obteniendo álbum:', id);
    const album = await prisma.album.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            images: true,
          },
        },
      },
    });

    if (!album) {
      throw new AlbumError("Álbum no encontrado");
    }

    const totalSize = await prisma.image.aggregate({
      where: {
        albums: {
          some: {
            id: album.id,
          },
        },
      },
      _sum: {
        size: true,
      },
    });

    const result = {
      ...album,
      totalSize: totalSize._sum.size || 0,
    };

    albumLogger.info('✅ Álbum obtenido:', album.name);
    return result;
  } catch (error) {
    albumLogger.error("❌ Error al obtener álbum:", error);
    if (error instanceof AlbumError) throw error;
    throw new AlbumError("No se pudo obtener el álbum", error);
  }
}

export async function createAlbum(data: AlbumCreate) {
  try {
    albumLogger.info('📝 Creando nuevo álbum:', data.name);
    const album = await prisma.album.create({
      data: {
        ...data,
        filters: data.filters || '[]',
      },
    });

    // Emitir eventos
    eventsService.emit('albums:modified');
    statsEventEmitter.emit(STATS_EVENTS.ALBUM_CHANGE);

    albumLogger.info('✅ Álbum creado:', album.name);
    revalidateAllPaths();
    return album;
  } catch (error) {
    albumLogger.error("❌ Error al crear álbum:", error);
    throw new AlbumError("No se pudo crear el álbum", error);
  }
}

export async function updateAlbum(id: string, data: AlbumUpdate) {
  try {
    albumLogger.info('📝 Actualizando álbum:', id);
    const album = await prisma.album.update({
      where: { id },
      data: {
        ...data,
        filters: data.filters || undefined,
      },
    });
    albumLogger.info('✅ Álbum actualizado:', album.name);
    revalidateAllPaths();
    return album;
  } catch (error) {
    albumLogger.error("❌ Error al actualizar álbum:", error);
    throw new AlbumError("No se pudo actualizar el álbum", error);
  }
}

export async function deleteAlbum(id: string) {
  try {
    albumLogger.info('🗑️ Eliminando álbum:', id);
    await prisma.album.delete({
      where: { id },
    });

    // Emitir eventos
    eventsService.emit('albums:modified');
    statsEventEmitter.emit(STATS_EVENTS.ALBUM_CHANGE);

    albumLogger.info('✅ Álbum eliminado');
    revalidateAllPaths();
  } catch (error) {
    albumLogger.error("❌ Error al eliminar álbum:", error);
    throw new AlbumError("No se pudo eliminar el álbum", error);
  }
}

export async function getAlbumImages(id: string) {
  try {
    albumLogger.info('🖼️ Obteniendo imágenes del álbum:', id);
    const images = await prisma.image.findMany({
      where: {
        albums: {
          some: {
            id,
          },
        },
      },
      select: {
        id: true,
        name: true,
        path: true,
        size: true,
        createdAt: true,
        updatedAt: true,
        hash: true,
        width: true,
        height: true,
        metadata: true,
        thumbnail: true,
        thumbnailSize: true,
        thumbnailWidth: true,
        thumbnailHeight: true,
        folderId: true,
        isPublic: true,
        isFavorite: true,
      },
    });

    albumLogger.info(`✅ ${images.length} imágenes obtenidas`);
    return images.map(image => ({
      ...image,
      type: 'image',
    }));
  } catch (error) {
    albumLogger.error("❌ Error al obtener imágenes del álbum:", error);
    throw new AlbumError("No se pudieron obtener las imágenes del álbum", error);
  }
}

export async function addImageToAlbum(albumId: string, imageId: string) {
  try {
    albumLogger.info('➕ Agregando imagen a álbum:', { albumId, imageId });
    await prisma.image.update({
      where: { id: imageId },
      data: {
        albums: {
          connect: { id: albumId }
        }
      }
    });

    // Emitir eventos
    eventsService.emit('albums:modified');
    statsEventEmitter.emit(STATS_EVENTS.ALBUM_CHANGE);
    statsEventEmitter.emit(STATS_EVENTS.FILES_CHANGE);

    albumLogger.info('✅ Imagen agregada al álbum');
    revalidateAllPaths();
  } catch (error) {
    albumLogger.error("❌ Error al agregar imagen al álbum:", error);
    throw new AlbumError("No se pudo agregar la imagen al álbum", error);
  }
}

export async function removeImageFromAlbum(albumId: string, imageId: string) {
  try {
    albumLogger.info('➖ Removiendo imagen de álbum:', { albumId, imageId });
    await prisma.image.update({
      where: { id: imageId },
      data: {
        albums: {
          disconnect: { id: albumId }
        }
      }
    });

    // Emitir eventos
    eventsService.emit('albums:modified');
    statsEventEmitter.emit(STATS_EVENTS.ALBUM_CHANGE);
    statsEventEmitter.emit(STATS_EVENTS.FILES_CHANGE);

    albumLogger.info('✅ Imagen removida del álbum');
    revalidateAllPaths();
  } catch (error) {
    albumLogger.error("❌ Error al eliminar imagen del álbum:", error);
    throw new AlbumError("No se pudo eliminar la imagen del álbum", error);
  }
}