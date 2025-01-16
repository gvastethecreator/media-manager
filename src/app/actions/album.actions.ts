'use server'

import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { revalidatePath } from 'next/cache'
import type { Album as PrismaAlbum } from '@prisma/client'
import type { FileItem } from '@/types/file-item'
import { eventsService } from '@/services/events.service'
import { statsEventEmitter, STATS_EVENTS } from '@/services/stats.service'

const albumLogger = logger.withContext('AlbumActions')

export interface AlbumCreate {
  name: string
  emoji?: string
  description?: string | null
  color?: string
  shortcut?: string | null
  sortBy?: string
  filters?: string
}

export interface AlbumUpdate extends Partial<AlbumCreate> {
  id: string
}

export interface Album extends PrismaAlbum {
  count?: number
}

export interface AlbumWithStats extends PrismaAlbum {
  _count: {
    images: number
  }
  totalSize: number
  lastUpdated: Date
  distribution?: Array<{
    name: string
    count: number
  }>
}

export interface AlbumWithImages extends Album {
  images: FileItem[]
}

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

export async function getAlbums(): Promise<AlbumWithStats[]> {
  try {
    albumLogger.info("🎞️ Obteniendo álbumes con estadísticas");

    // Obtener álbumes con conteos y estadísticas
    const albums = await prisma.album.findMany({
      include: {
        _count: {
          select: { images: true },
        },
        images: {
          select: {
            size: true,
            updatedAt: true,
          },
          orderBy: {
            updatedAt: "desc",
          },
          take: 1,
        },
      },
      orderBy: [
        {
          images: {
            _count: "desc",
          },
        },
        {
          name: "asc",
        },
      ],
    });

    // Calcular estadísticas adicionales
    const albumsWithStats = await Promise.all(
      albums.map(async (album) => {
        // Calcular tamaño total
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

        // Obtener distribución por carpetas
        const distribution = await prisma.folder.findMany({
          where: {
            images: {
              some: {
                albums: {
                  some: {
                    id: album.id,
                  },
                },
              },
            },
          },
          select: {
            name: true,
            _count: {
              select: {
                images: true,
              },
            },
          },
          take: 5,
          orderBy: {
            images: {
              _count: "desc",
            },
          },
        });

        return {
          ...album,
          _count: album._count,
          totalSize: totalSize._sum.size || 0,
          lastUpdated: album.images[0]?.updatedAt || album.updatedAt,
          distribution: distribution.map((d) => ({
            name: d.name,
            count: d._count.images,
          })),
        };
      })
    );

    albumLogger.info("✅ Álbumes obtenidos", { count: albums.length });
    return albumsWithStats;
  } catch (error) {
    albumLogger.error("❌ Error al obtener álbumes", error);
    throw new AlbumError("No se pudieron obtener los álbumes");
  }
}

export async function getAlbum(id: string): Promise<Album> {
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

    albumLogger.info('✅ Álbum obtenido:', album.name);
    return {
      ...album,
      count: album._count.images,
    };
  } catch (error) {
    albumLogger.error("❌ Error al obtener álbum:", error);
    if (error instanceof AlbumError) throw error;
    throw new AlbumError("No se pudo obtener el álbum", error);
  }
}

export async function createAlbum(data: AlbumCreate): Promise<Album> {
  try {
    albumLogger.info('📝 Creando nuevo álbum:', data);
    const album = await prisma.album.create({
      data,
      include: {
        _count: {
          select: {
            images: true,
          },
        },
      },
    });

    // Emitir eventos
    eventsService.emit('albums:modified');
    statsEventEmitter.emit(STATS_EVENTS.ALBUM_CHANGE);

    albumLogger.info('✅ Álbum creado:', album.name);
    revalidateAllPaths();
    return {
      ...album,
      count: album._count.images,
    };
  } catch (error) {
    albumLogger.error("❌ Error al crear álbum:", error);
    throw new AlbumError("No se pudo crear el álbum", error);
  }
}

export async function updateAlbum(id: string, data: AlbumUpdate): Promise<Album> {
  try {
    albumLogger.info('📝 Actualizando álbum:', id);
    const album = await prisma.album.update({
      where: { id },
      data,
      include: {
        _count: {
          select: {
            images: true,
          },
        },
      },
    });

    // Emitir eventos
    eventsService.emit('albums:modified');
    statsEventEmitter.emit(STATS_EVENTS.ALBUM_CHANGE);

    albumLogger.info('✅ Álbum actualizado:', album.name);
    revalidateAllPaths();
    return {
      ...album,
      count: album._count.images,
    };
  } catch (error) {
    albumLogger.error("❌ Error al actualizar álbum:", error);
    throw new AlbumError("No se pudo actualizar el álbum", error);
  }
}

export async function deleteAlbum(id: string): Promise<void> {
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

export async function getAlbumImages(id: string): Promise<FileItem[]> {
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
      include: {
        tags: true,
        collections: true,
        albums: true,
        characters: true,
        places: true,
        objects: true,
        stats: true,
      },
    });

    albumLogger.info(`✅ ${images.length} imágenes obtenidas`);
    return images.map(image => ({
      ...image,
      type: 'image',
      metadata: image.metadata,
      modifiedAt: image.updatedAt,
      accessedAt: image.createdAt,
      tags: image.tags.map(t => ({ id: t.id, name: t.name, color: t.color })),
      collections: image.collections.map(c => ({ id: c.id, name: c.name })),
      albums: image.albums.map(a => ({ id: a.id, name: a.name })),
      characters: image.characters.map(c => ({ id: c.id, name: c.name })),
      places: image.places.map(p => ({ id: p.id, name: p.name })),
      objects: image.objects.map(o => ({ id: o.id, name: o.name })),
      thumbnail: image.thumbnail ? Buffer.from(image.thumbnail).toString('base64') : null,
    }));
  } catch (error) {
    albumLogger.error("❌ Error al obtener imágenes del álbum:", error);
    throw new AlbumError("No se pudieron obtener las imágenes del álbum", error);
  }
}

export async function addImageToAlbum(albumId: string, imageId: string): Promise<void> {
  try {
    await prisma.album.update({
      where: { id: albumId },
      data: {
        images: {
          connect: { id: imageId },
        },
      },
    });

    // Emitir eventos
    eventsService.emit('albums:modified');
    statsEventEmitter.emit(STATS_EVENTS.ALBUM_CHANGE);
    statsEventEmitter.emit(STATS_EVENTS.FILES_CHANGE);

    revalidateAllPaths();
  } catch (error) {
    albumLogger.error("❌ Error al agregar imagen al álbum:", error);
    throw new AlbumError("No se pudo agregar la imagen al álbum", error);
  }
}

export async function removeImageFromAlbum(albumId: string, imageId: string): Promise<void> {
  try {
    await prisma.album.update({
      where: { id: albumId },
      data: {
        images: {
          disconnect: { id: imageId },
        },
      },
    });

    // Emitir eventos
    eventsService.emit('albums:modified');
    statsEventEmitter.emit(STATS_EVENTS.ALBUM_CHANGE);
    statsEventEmitter.emit(STATS_EVENTS.FILES_CHANGE);

    revalidateAllPaths();
  } catch (error) {
    albumLogger.error("❌ Error al eliminar imagen del álbum:", error);
    throw new AlbumError("No se pudo eliminar la imagen del álbum", error);
  }
}