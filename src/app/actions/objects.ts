"use server";

import { prisma } from "@/lib/prisma";
import type { ObjectCreate, ObjectUpdate } from "@/services/object.service";
import { revalidatePath } from "next/cache";

export async function getObjects() {
  try {
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

    return objectsWithStats;
  } catch (error) {
    console.error("Error al obtener objetos:", error);
    throw new Error("No se pudieron obtener los objetos");
  }
}

export async function getObject(id: string) {
  try {
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
      throw new Error("Objeto no encontrado");
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

    return {
      ...object,
      totalSize: totalSize._sum.size || 0,
    };
  } catch (error) {
    console.error("Error al obtener objeto:", error);
    throw new Error("No se pudo obtener el objeto");
  }
}

export async function createObject(data: ObjectCreate) {
  try {
    await prisma.object.create({
      data,
    });
    revalidatePath("/settings");
  } catch (error) {
    console.error("Error al crear objeto:", error);
    throw new Error("No se pudo crear el objeto");
  }
}

export async function updateObject(id: string, data: ObjectUpdate) {
  try {
    await prisma.object.update({
      where: { id },
      data,
    });
    revalidatePath("/settings");
  } catch (error) {
    console.error("Error al actualizar objeto:", error);
    throw new Error("No se pudo actualizar el objeto");
  }
}

export async function deleteObject(id: string) {
  try {
    await prisma.object.delete({
      where: { id },
    });
    revalidatePath("/settings");
  } catch (error) {
    console.error("Error al eliminar objeto:", error);
    throw new Error("No se pudo eliminar el objeto");
  }
}

export async function getObjectImages(id: string) {
  try {
    const images = await prisma.image.findMany({
      where: {
        objects: {
          some: {
            id,
          },
        },
      },
    });
    return images;
  } catch (error) {
    console.error("Error al obtener imágenes del objeto:", error);
    throw new Error("No se pudieron obtener las imágenes del objeto");
  }
}

export async function addImageToObject(objectId: string, imageId: string) {
  try {
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
    revalidatePath("/settings");
  } catch (error) {
    console.error("Error al agregar imagen al objeto:", error);
    throw new Error("No se pudo agregar la imagen al objeto");
  }
}

export async function removeImageFromObject(objectId: string, imageId: string) {
  try {
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
    revalidatePath("/settings");
  } catch (error) {
    console.error("Error al eliminar imagen del objeto:", error);
    throw new Error("No se pudo eliminar la imagen del objeto");
  }
}