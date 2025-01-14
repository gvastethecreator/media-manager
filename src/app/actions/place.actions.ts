'use server'

import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { revalidatePath } from 'next/cache'
import type { Place } from '@prisma/client'
import { eventsService } from '@/services/events.service'
import { statsEventEmitter, STATS_EVENTS } from '@/services/stats.service'

const placeLogger = logger.withContext('PlaceActions')

const REVALIDATE_PATHS = [
  '/settings',
  '/places',
  '/places/[id]'
] as const;

const revalidateAllPaths = () => {
  REVALIDATE_PATHS.forEach(path => revalidatePath(path));
  placeLogger.info('🔄 Rutas revalidadas');
};

class PlaceError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'PlaceError';
  }
}

export interface PlaceWithStats extends Place {
  _count: {
    images: number
  }
  totalSize: number
}

export interface PlaceCreate {
  name: string;
  emoji: string;
  color: string;
  description?: string | null;
  shortcut?: string | null;
  region: string;
  type: string;
  climate: string;
  population: number;
  government: string;
  dangers: string;
  resources: string;
  lore: string;
  history: string;
  stats: string;
  sortBy: string;
  filters: string;
}

export interface PlaceUpdate extends Partial<PlaceCreate> {
  id: string;
}

export async function getPlaces() {
  try {
    placeLogger.info('🗺️ Obteniendo lista de lugares');
    const places = await prisma.place.findMany({
      include: {
        _count: {
          select: {
            images: true,
          },
        },
      },
    });

    const placesWithStats = await Promise.all(
      places.map(async (place) => {
        const totalSize = await prisma.image.aggregate({
          where: {
            places: {
              some: {
                id: place.id,
              },
            },
          },
          _sum: {
            size: true,
          },
        });

        return {
          ...place,
          totalSize: totalSize._sum.size || 0,
        };
      })
    );

    placeLogger.info(`✅ ${places.length} lugares obtenidos`);
    return placesWithStats;
  } catch (error) {
    placeLogger.error("❌ Error al obtener lugares:", error);
    throw new PlaceError("No se pudieron obtener los lugares", error);
  }
}

export async function getPlace(id: string) {
  try {
    placeLogger.info('🔍 Obteniendo lugar:', id);
    const place = await prisma.place.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            images: true,
          },
        },
      },
    });

    if (!place) {
      throw new PlaceError("Lugar no encontrado");
    }

    const totalSize = await prisma.image.aggregate({
      where: {
        places: {
          some: {
            id: place.id,
          },
        },
      },
      _sum: {
        size: true,
      },
    });

    const result = {
      ...place,
      totalSize: totalSize._sum.size || 0,
    };

    placeLogger.info('✅ Lugar obtenido:', place.name);
    return result;
  } catch (error) {
    placeLogger.error("❌ Error al obtener lugar:", error);
    if (error instanceof PlaceError) throw error;
    throw new PlaceError("No se pudo obtener el lugar", error);
  }
}

export async function createPlace(data: PlaceCreate) {
  try {
    placeLogger.info('📝 Creando nuevo lugar:', data.name);
    const place = await prisma.place.create({
      data: {
        ...data,
        dangers: data.dangers || '[]',
        resources: data.resources || '[]',
        stats: data.stats || '{}',
        filters: data.filters || '[]',
      },
    });

    // Emitir eventos
    eventsService.emit('places:modified');
    statsEventEmitter.emit(STATS_EVENTS.PLACE_CHANGE);

    placeLogger.info('✅ Lugar creado:', place.name);
    revalidateAllPaths();
    return place;
  } catch (error) {
    placeLogger.error("❌ Error al crear lugar:", error);
    throw new PlaceError("No se pudo crear el lugar", error);
  }
}

export async function updatePlace(id: string, data: PlaceUpdate) {
  try {
    placeLogger.info('📝 Actualizando lugar:', id);
    const place = await prisma.place.update({
      where: { id },
      data: {
        ...data,
        dangers: data.dangers || undefined,
        resources: data.resources || undefined,
        stats: data.stats || undefined,
        filters: data.filters || undefined,
      },
    });
    placeLogger.info('✅ Lugar actualizado:', place.name);
    revalidateAllPaths();
    return place;
  } catch (error) {
    placeLogger.error("❌ Error al actualizar lugar:", error);
    throw new PlaceError("No se pudo actualizar el lugar", error);
  }
}

export async function deletePlace(id: string) {
  try {
    placeLogger.info('🗑️ Eliminando lugar:', id);
    await prisma.place.delete({
      where: { id },
    });

    // Emitir eventos
    eventsService.emit('places:modified');
    statsEventEmitter.emit(STATS_EVENTS.PLACE_CHANGE);

    placeLogger.info('✅ Lugar eliminado');
    revalidateAllPaths();
  } catch (error) {
    placeLogger.error("❌ Error al eliminar lugar:", error);
    throw new PlaceError("No se pudo eliminar el lugar", error);
  }
}

export async function getPlaceImages(id: string) {
  try {
    placeLogger.info('🖼️ Obteniendo imágenes del lugar:', id);
    const images = await prisma.image.findMany({
      where: {
        places: {
          some: {
            id,
          },
        },
      },
      include: {
        tags: {
          select: { id: true },
        },
        collections: {
          select: { id: true },
        },
        albums: {
          select: { id: true },
        },
        characters: {
          select: { id: true },
        },
        places: {
          select: { id: true },
        },
        objects: {
          select: { id: true },
        },
        stats: true,
      },
    });

    placeLogger.info(`✅ ${images.length} imágenes obtenidas`);
    return images.map(image => {
      let parsedMetadata = undefined;
      if (image.metadata) {
        try {
          const meta = JSON.parse(image.metadata);
          parsedMetadata = {
            dimensions: {
              width: image.width,
              height: image.height,
            },
            mimeType: meta.mimeType,
          };
        } catch (e) {
          placeLogger.error("Error parsing metadata:", e);
        }
      }

      return {
        ...image,
        type: 'image',
        metadata: parsedMetadata,
        tags: image.tags.map(t => t.id),
        collections: image.collections.map(c => c.id),
        albums: image.albums.map(a => a.id),
        characters: image.characters.map(c => c.id),
        places: image.places.map(p => p.id),
        objects: image.objects.map(o => o.id),
        favorite: image.isFavorite,
        views: image.stats?.views || 0,
        downloads: image.stats?.downloads || 0,
        count: 0,
      };
    });
  } catch (error) {
    placeLogger.error("❌ Error al obtener imágenes del lugar:", error);
    throw new PlaceError("No se pudieron obtener las imágenes del lugar", error);
  }
}

export async function addImageToPlace(placeId: string, imageId: string) {
  try {
    placeLogger.info('➕ Agregando imagen a lugar:', { placeId, imageId });
    await prisma.image.update({
      where: { id: imageId },
      data: {
        places: {
          connect: { id: placeId }
        }
      }
    });

    // Emitir eventos
    eventsService.emit('places:modified');
    statsEventEmitter.emit(STATS_EVENTS.PLACE_CHANGE);
    statsEventEmitter.emit(STATS_EVENTS.IMAGE_CHANGE);

    placeLogger.info('✅ Imagen agregada al lugar');
    revalidateAllPaths();
  } catch (error) {
    placeLogger.error("❌ Error al agregar imagen al lugar:", error);
    throw new PlaceError("No se pudo agregar la imagen al lugar", error);
  }
}

export async function removeImageFromPlace(placeId: string, imageId: string) {
  try {
    placeLogger.info('➖ Removiendo imagen de lugar:', { placeId, imageId });
    await prisma.image.update({
      where: { id: imageId },
      data: {
        places: {
          disconnect: { id: placeId }
        }
      }
    });

    // Emitir eventos
    eventsService.emit('places:modified');
    statsEventEmitter.emit(STATS_EVENTS.PLACE_CHANGE);
    statsEventEmitter.emit(STATS_EVENTS.IMAGE_CHANGE);

    placeLogger.info('✅ Imagen removida del lugar');
    revalidateAllPaths();
  } catch (error) {
    placeLogger.error("❌ Error al eliminar imagen del lugar:", error);
    throw new PlaceError("No se pudo eliminar la imagen del lugar", error);
  }
}