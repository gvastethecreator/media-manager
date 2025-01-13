'use server'

import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { revalidatePath } from 'next/cache'
import type { Object } from '@prisma/client'

const objectLogger = logger.withContext('ObjectActions')

const REVALIDATE_PATHS = [
  '/settings',
  '/objects',
  '/objects/[id]'
] as const;

const revalidateAllPaths = () => {
  REVALIDATE_PATHS.forEach(path => revalidatePath(path));
  objectLogger.info('🔄 Rutas revalidadas');
};

class ObjectError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'ObjectError';
  }
}

export interface ObjectWithStats extends Object {
  _count: {
    images: number
  }
  totalSize: number
}

export interface ObjectCreate {
  name: string;
  emoji: string;
  color: string;
  description?: string | null;
  shortcut?: string | null;
  type: string;
  rarity: string;
  properties: string;
  requirements: string;
  origin: string;
  stats: string;
  sortBy: string;
  filters: string;
}

export interface ObjectUpdate extends Partial<ObjectCreate> {
  id: string;
}

export async function getObjects() {
  try {
    objectLogger.info('🎯 Obteniendo lista de objetos');
    const objects = await prisma.object.findMany({
      include: {
        _count: {
          select: {
            images: true,
          },
        },
      },
    });

    const objectsWithStats = await Promise.all(
      objects.map(async (object) => {
        const totalSize = await prisma.image.aggregate({
          where: {
            objects: {
              some: {
                id: object.id,
              },
            },
          },
          _sum: {
            size: true,
          },
        });

        return {
          ...object,
          totalSize: totalSize._sum.size || 0,
        };
      })
    );

    objectLogger.info(`✅ ${objects.length} objetos obtenidos`);
    return objectsWithStats;
  } catch (error) {
    objectLogger.error("❌ Error al obtener objetos:", error);
    throw new ObjectError("No se pudieron obtener los objetos", error);
  }
}

export async function getObject(id: string) {
  try {
    objectLogger.info('🔍 Obteniendo objeto:', id);
    const object = await prisma.object.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            images: true,
          },
        },
      },
    });

    if (!object) {
      throw new ObjectError("Objeto no encontrado");
    }

    const totalSize = await prisma.image.aggregate({
      where: {
        objects: {
          some: {
            id: object.id,
          },
        },
      },
      _sum: {
        size: true,
      },
    });

    const result = {
      ...object,
      totalSize: totalSize._sum.size || 0,
    };

    objectLogger.info('✅ Objeto obtenido:', object.name);
    return result;
  } catch (error) {
    objectLogger.error("❌ Error al obtener objeto:", error);
    if (error instanceof ObjectError) throw error;
    throw new ObjectError("No se pudo obtener el objeto", error);
  }
}

export async function createObject(data: ObjectCreate) {
  try {
    objectLogger.info('📝 Creando nuevo objeto:', data.name);
    const object = await prisma.object.create({
      data: {
        ...data,
        properties: data.properties || '[]',
        requirements: data.requirements || '{}',
        stats: data.stats || '{}',
        filters: data.filters || '[]',
      },
    });
    objectLogger.info('✅ Objeto creado:', object.name);
    revalidateAllPaths();
    return object;
  } catch (error) {
    objectLogger.error("❌ Error al crear objeto:", error);
    throw new ObjectError("No se pudo crear el objeto", error);
  }
}

export async function updateObject(id: string, data: ObjectUpdate) {
  try {
    objectLogger.info('📝 Actualizando objeto:', id);
    const object = await prisma.object.update({
      where: { id },
      data: {
        ...data,
        properties: data.properties || undefined,
        requirements: data.requirements || undefined,
        stats: data.stats || undefined,
        filters: data.filters || undefined,
      },
    });
    objectLogger.info('✅ Objeto actualizado:', object.name);
    revalidateAllPaths();
    return object;
  } catch (error) {
    objectLogger.error("❌ Error al actualizar objeto:", error);
    throw new ObjectError("No se pudo actualizar el objeto", error);
  }
}

export async function deleteObject(id: string) {
  try {
    objectLogger.info('🗑️ Eliminando objeto:', id);
    await prisma.object.delete({
      where: { id },
    });
    objectLogger.info('✅ Objeto eliminado');
    revalidateAllPaths();
  } catch (error) {
    objectLogger.error("❌ Error al eliminar objeto:", error);
    throw new ObjectError("No se pudo eliminar el objeto", error);
  }
}

export async function getObjectImages(id: string) {
  try {
    objectLogger.info('🖼️ Obteniendo imágenes del objeto:', id);
    const images = await prisma.image.findMany({
      where: {
        objects: {
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

    objectLogger.info(`✅ ${images.length} imágenes obtenidas`);
    return images.map(image => ({
      ...image,
      type: 'image',
    }));
  } catch (error) {
    objectLogger.error("❌ Error al obtener imágenes del objeto:", error);
    throw new ObjectError("No se pudieron obtener las imágenes del objeto", error);
  }
}

export async function addImageToObject(objectId: string, imageId: string) {
  try {
    objectLogger.info('➕ Agregando imagen a objeto:', { objectId, imageId });
    await prisma.object.update({
      where: { id: objectId },
      data: {
        images: {
          connect: {
            id: imageId,
          },
        },
      },
    });
    objectLogger.info('✅ Imagen agregada al objeto');
    revalidateAllPaths();
  } catch (error) {
    objectLogger.error("❌ Error al agregar imagen al objeto:", error);
    throw new ObjectError("No se pudo agregar la imagen al objeto", error);
  }
}

export async function removeImageFromObject(objectId: string, imageId: string) {
  try {
    objectLogger.info('➖ Removiendo imagen de objeto:', { objectId, imageId });
    await prisma.object.update({
      where: { id: objectId },
      data: {
        images: {
          disconnect: {
            id: imageId,
          },
        },
      },
    });
    objectLogger.info('✅ Imagen removida del objeto');
    revalidateAllPaths();
  } catch (error) {
    objectLogger.error("❌ Error al eliminar imagen del objeto:", error);
    throw new ObjectError("No se pudo eliminar la imagen del objeto", error);
  }
}