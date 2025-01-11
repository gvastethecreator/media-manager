"use server";

import { prisma } from "@/lib/prisma";
import type { PlaceCreate, PlaceUpdate } from "@/services/place.service";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";

const placeLogger = logger.withContext('PlaceActions');

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
        dangers: data.dangers ? JSON.stringify(data.dangers) : '[]',
        resources: data.resources ? JSON.stringify(data.resources) : '[]',
        stats: data.stats ? JSON.stringify(data.stats) : '{}',
        filters: data.filters ? JSON.stringify(data.filters) : '[]',
      },
    });
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
        dangers: data.dangers ? JSON.stringify(data.dangers) : undefined,
        resources: data.resources ? JSON.stringify(data.resources) : undefined,
        stats: data.stats ? JSON.stringify(data.stats) : undefined,
        filters: data.filters ? JSON.stringify(data.filters) : undefined,
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

    placeLogger.info(`✅ ${images.length} imágenes obtenidas`);
    return images.map(image => ({
      ...image,
      type: 'image',
    }));
  } catch (error) {
    placeLogger.error("❌ Error al obtener imágenes del lugar:", error);
    throw new PlaceError("No se pudieron obtener las imágenes del lugar", error);
  }
}

export async function addImageToPlace(placeId: string, imageId: string) {
  try {
    placeLogger.info('➕ Agregando imagen a lugar:', { placeId, imageId });
    await prisma.place.update({
      where: { id: placeId },
      data: {
        images: {
          connect: {
            id: imageId,
          },
        },
      },
    });
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
    await prisma.place.update({
      where: { id: placeId },
      data: {
        images: {
          disconnect: {
            id: imageId,
          },
        },
      },
    });
    placeLogger.info('✅ Imagen removida del lugar');
    revalidateAllPaths();
  } catch (error) {
    placeLogger.error("❌ Error al eliminar imagen del lugar:", error);
    throw new PlaceError("No se pudo eliminar la imagen del lugar", error);
  }
}