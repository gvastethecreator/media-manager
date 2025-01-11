"use server";

import { prisma } from "@/lib/prisma";
import type { TagCreate, TagUpdate } from "@/services/tag.service";
import { revalidatePath } from "next/cache";

export async function getTags() {
  try {
    const tags = await prisma.tag.findMany({
      include: {
        _count: {
          select: {
            images: true,
          },
        },
      },
    });

    const tagsWithStats = await Promise.all(
      tags.map(async (tag) => {
        const totalSize = await prisma.image.aggregate({
          where: {
            tags: {
              some: {
                id: tag.id,
              },
            },
          },
          _sum: {
            size: true,
          },
        });

        return {
          ...tag,
          totalSize: totalSize._sum.size || 0,
        };
      })
    );

    return tagsWithStats;
  } catch (error) {
    console.error("Error al obtener etiquetas:", error);
    throw new Error("No se pudieron obtener las etiquetas");
  }
}

export async function getTag(id: string) {
  try {
    const tag = await prisma.tag.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            images: true,
          },
        },
      },
    });

    if (!tag) {
      throw new Error("Etiqueta no encontrada");
    }

    const totalSize = await prisma.image.aggregate({
      where: {
        tags: {
          some: {
            id: tag.id,
          },
        },
      },
      _sum: {
        size: true,
      },
    });

    return {
      ...tag,
      totalSize: totalSize._sum.size || 0,
    };
  } catch (error) {
    console.error("Error al obtener etiqueta:", error);
    throw new Error("No se pudo obtener la etiqueta");
  }
}

export async function createTag(data: TagCreate) {
  try {
    await prisma.tag.create({
      data,
    });
    revalidatePath("/settings");
  } catch (error) {
    console.error("Error al crear etiqueta:", error);
    throw new Error("No se pudo crear la etiqueta");
  }
}

export async function updateTag(id: string, data: TagUpdate) {
  try {
    await prisma.tag.update({
      where: { id },
      data,
    });
    revalidatePath("/settings");
  } catch (error) {
    console.error("Error al actualizar etiqueta:", error);
    throw new Error("No se pudo actualizar la etiqueta");
  }
}

export async function deleteTag(id: string) {
  try {
    await prisma.tag.delete({
      where: { id },
    });
    revalidatePath("/settings");
  } catch (error) {
    console.error("Error al eliminar etiqueta:", error);
    throw new Error("No se pudo eliminar la etiqueta");
  }
}

export async function getTagImages(id: string) {
  try {
    const images = await prisma.image.findMany({
      where: {
        tags: {
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
    console.error("Error al obtener imágenes de la etiqueta:", error);
    throw new Error("No se pudieron obtener las imágenes de la etiqueta");
  }
}

export async function addImageToTag(tagId: string, imageId: string) {
  try {
    await prisma.tag.update({
      where: { id: tagId },
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
    console.error("Error al agregar imagen a la etiqueta:", error);
    throw new Error("No se pudo agregar la imagen a la etiqueta");
  }
}

export async function removeImageFromTag(tagId: string, imageId: string) {
  try {
    await prisma.tag.update({
      where: { id: tagId },
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
    console.error("Error al eliminar imagen de la etiqueta:", error);
    throw new Error("No se pudo eliminar la imagen de la etiqueta");
  }
}