"use server";

import { prisma } from "@/lib/prisma";
import type { CollectionCreate, CollectionUpdate } from "@/services/collection.service";
import { revalidatePath } from "next/cache";

export async function getCollections() {
  try {
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

    return collectionsWithStats;
  } catch (error) {
    console.error("Error al obtener colecciones:", error);
    throw new Error("No se pudieron obtener las colecciones");
  }
}

export async function getCollection(id: string) {
  try {
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
      throw new Error("Colección no encontrada");
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

    return {
      ...collection,
      totalSize: totalSize._sum.size || 0,
    };
  } catch (error) {
    console.error("Error al obtener colección:", error);
    throw new Error("No se pudo obtener la colección");
  }
}

export async function createCollection(data: CollectionCreate) {
  try {
    await prisma.collection.create({
      data,
    });
    revalidatePath("/settings");
  } catch (error) {
    console.error("Error al crear colección:", error);
    throw new Error("No se pudo crear la colección");
  }
}

export async function updateCollection(id: string, data: CollectionUpdate) {
  try {
    await prisma.collection.update({
      where: { id },
      data,
    });
    revalidatePath("/settings");
  } catch (error) {
    console.error("Error al actualizar colección:", error);
    throw new Error("No se pudo actualizar la colección");
  }
}

export async function deleteCollection(id: string) {
  try {
    await prisma.collection.delete({
      where: { id },
    });
    revalidatePath("/settings");
  } catch (error) {
    console.error("Error al eliminar colección:", error);
    throw new Error("No se pudo eliminar la colección");
  }
}

export async function getCollectionImages(id: string) {
  try {
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
        type: true,
        folderId: true,
      },
    });
    return images.map(image => ({
      ...image,
      type: "image" as const
    }));
  } catch (error) {
    console.error("Error al obtener imágenes de la colección:", error);
    throw new Error("No se pudieron obtener las imágenes de la colección");
  }
}

export async function addImageToCollection(collectionId: string, imageId: string) {
  try {
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
    revalidatePath("/settings");
  } catch (error) {
    console.error("Error al agregar imagen a la colección:", error);
    throw new Error("No se pudo agregar la imagen a la colección");
  }
}

export async function removeImageFromCollection(collectionId: string, imageId: string) {
  try {
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
    revalidatePath("/settings");
  } catch (error) {
    console.error("Error al eliminar imagen de la colección:", error);
    throw new Error("No se pudo eliminar la imagen de la colección");
  }
}