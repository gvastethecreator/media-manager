"use server";

import { prisma } from "@/lib/prisma";
import type { CollectionCreate, CollectionUpdate } from "@/services/collection.service";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";

const collectionLogger = logger.withContext('CollectionActions');

const REVALIDATE_PATHS = [
  '/settings',
  '/collections',
  '/collections/[id]'
] as const;

const revalidateAllPaths = () => {
  REVALIDATE_PATHS.forEach(path => revalidatePath(path));
  collectionLogger.info('🔄 Rutas revalidadas');
};

class CollectionError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'CollectionError';
  }
}

export async function getCollections() {
  try {
    collectionLogger.info('📚 Obteniendo lista de colecciones');
    const collections = await prisma.collection.findMany({
      include: {
        _count: {
          select: {
            images: true,
          },
        },
      },
    });

    const collectionsWithStats = await Promise.all(
      collections.map(async (collection) => {
        const totalSize = await prisma.image.aggregate({
          where: {
            collections: {
              some: {
                id: collection.id,
              },
            },
          },
          _sum: {
            size: true,
          },
        });

        return {
          ...collection,
          totalSize: totalSize._sum.size || 0,
        };
      })
    );

    collectionLogger.info(`✅ ${collections.length} colecciones obtenidas`);
    return collectionsWithStats;
  } catch (error) {
    collectionLogger.error("❌ Error al obtener colecciones:", error);
    throw new CollectionError("No se pudieron obtener las colecciones", error);
  }
}

export async function getCollection(id: string) {
  try {
    collectionLogger.info('🔍 Obteniendo colección:', id);
    const collection = await prisma.collection.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            images: true,
          },
        },
      },
    });

    if (!collection) {
      throw new CollectionError("Colección no encontrada");
    }

    const totalSize = await prisma.image.aggregate({
      where: {
        collections: {
          some: {
            id: collection.id,
          },
        },
      },
      _sum: {
        size: true,
      },
    });

    const result = {
      ...collection,
      totalSize: totalSize._sum.size || 0,
    };

    collectionLogger.info('✅ Colección obtenida:', collection.name);
    return result;
  } catch (error) {
    collectionLogger.error("❌ Error al obtener colección:", error);
    if (error instanceof CollectionError) throw error;
    throw new CollectionError("No se pudo obtener la colección", error);
  }
}

export async function createCollection(data: CollectionCreate) {
  try {
    collectionLogger.info('📝 Creando nueva colección:', data.name);
    const collection = await prisma.collection.create({
      data: {
        ...data,
        filters: data.filters ? JSON.stringify(data.filters) : '[]',
      },
    });
    collectionLogger.info('✅ Colección creada:', collection.name);
    revalidateAllPaths();
    return collection;
  } catch (error) {
    collectionLogger.error("❌ Error al crear colección:", error);
    throw new CollectionError("No se pudo crear la colección", error);
  }
}

export async function updateCollection(id: string, data: CollectionUpdate) {
  try {
    collectionLogger.info('📝 Actualizando colección:', id);
    const collection = await prisma.collection.update({
      where: { id },
      data: {
        ...data,
        filters: data.filters ? JSON.stringify(data.filters) : undefined,
      },
    });
    collectionLogger.info('✅ Colección actualizada:', collection.name);
    revalidateAllPaths();
    return collection;
  } catch (error) {
    collectionLogger.error("❌ Error al actualizar colección:", error);
    throw new CollectionError("No se pudo actualizar la colección", error);
  }
}

export async function deleteCollection(id: string) {
  try {
    collectionLogger.info('🗑️ Eliminando colección:', id);
    await prisma.collection.delete({
      where: { id },
    });
    collectionLogger.info('✅ Colección eliminada');
    revalidateAllPaths();
  } catch (error) {
    collectionLogger.error("❌ Error al eliminar colección:", error);
    throw new CollectionError("No se pudo eliminar la colección", error);
  }
}

export async function getCollectionImages(id: string) {
  try {
    collectionLogger.info('🖼️ Obteniendo imágenes de la colección:', id);
    const images = await prisma.image.findMany({
      where: {
        collections: {
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

    collectionLogger.info(`✅ ${images.length} imágenes obtenidas`);
    return images.map(image => ({
      ...image,
      type: 'image',
    }));
  } catch (error) {
    collectionLogger.error("❌ Error al obtener imágenes de la colección:", error);
    throw new CollectionError("No se pudieron obtener las imágenes de la colección", error);
  }
}

export async function addImageToCollection(collectionId: string, imageId: string) {
  try {
    collectionLogger.info('➕ Agregando imagen a colección:', { collectionId, imageId });
    await prisma.collection.update({
      where: { id: collectionId },
      data: {
        images: {
          connect: {
            id: imageId,
          },
        },
      },
    });
    collectionLogger.info('✅ Imagen agregada a la colección');
    revalidateAllPaths();
  } catch (error) {
    collectionLogger.error("❌ Error al agregar imagen a la colección:", error);
    throw new CollectionError("No se pudo agregar la imagen a la colección", error);
  }
}

export async function removeImageFromCollection(collectionId: string, imageId: string) {
  try {
    collectionLogger.info('➖ Removiendo imagen de colección:', { collectionId, imageId });
    await prisma.collection.update({
      where: { id: collectionId },
      data: {
        images: {
          disconnect: {
            id: imageId,
          },
        },
      },
    });
    collectionLogger.info('✅ Imagen removida de la colección');
    revalidateAllPaths();
  } catch (error) {
    collectionLogger.error("❌ Error al eliminar imagen de la colección:", error);
    throw new CollectionError("No se pudo eliminar la imagen de la colección", error);
  }
}