"use server";

import { prisma } from "@/lib/prisma";
import type { TagCreate, TagUpdate } from "@/services/tag.service";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";

const tagLogger = logger.withContext('TagActions');

const REVALIDATE_PATHS = [
  '/settings',
  '/tags',
  '/tags/[id]'
] as const;

const revalidateAllPaths = () => {
  REVALIDATE_PATHS.forEach(path => revalidatePath(path));
  tagLogger.info('🔄 Rutas revalidadas');
};

class TagError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'TagError';
  }
}

export async function getTags() {
  try {
    tagLogger.info('🏷️ Obteniendo lista de etiquetas');
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

    tagLogger.info(`✅ ${tags.length} etiquetas obtenidas`);
    return tagsWithStats;
  } catch (error) {
    tagLogger.error("❌ Error al obtener etiquetas:", error);
    throw new TagError("No se pudieron obtener las etiquetas", error);
  }
}

export async function getTag(id: string) {
  try {
    tagLogger.info('🔍 Obteniendo etiqueta:', id);
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
      throw new TagError("Etiqueta no encontrada");
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

    const result = {
      ...tag,
      totalSize: totalSize._sum.size || 0,
    };

    tagLogger.info('✅ Etiqueta obtenida:', tag.name);
    return result;
  } catch (error) {
    tagLogger.error("❌ Error al obtener etiqueta:", error);
    if (error instanceof TagError) throw error;
    throw new TagError("No se pudo obtener la etiqueta", error);
  }
}

export async function createTag(data: TagCreate) {
  try {
    tagLogger.info('📝 Creando nueva etiqueta:', data.name);
    const tag = await prisma.tag.create({
      data,
    });
    tagLogger.info('✅ Etiqueta creada:', tag.name);
    revalidateAllPaths();
    return tag;
  } catch (error) {
    tagLogger.error("❌ Error al crear etiqueta:", error);
    throw new TagError("No se pudo crear la etiqueta", error);
  }
}

export async function updateTag(id: string, data: TagUpdate) {
  try {
    tagLogger.info('📝 Actualizando etiqueta:', id);
    const tag = await prisma.tag.update({
      where: { id },
      data,
    });
    tagLogger.info('✅ Etiqueta actualizada:', tag.name);
    revalidateAllPaths();
    return tag;
  } catch (error) {
    tagLogger.error("❌ Error al actualizar etiqueta:", error);
    throw new TagError("No se pudo actualizar la etiqueta", error);
  }
}

export async function deleteTag(id: string) {
  try {
    tagLogger.info('🗑️ Eliminando etiqueta:', id);
    await prisma.tag.delete({
      where: { id },
    });
    tagLogger.info('✅ Etiqueta eliminada');
    revalidateAllPaths();
  } catch (error) {
    tagLogger.error("❌ Error al eliminar etiqueta:", error);
    throw new TagError("No se pudo eliminar la etiqueta", error);
  }
}

export async function getTagImages(id: string) {
  try {
    tagLogger.info('🖼️ Obteniendo imágenes de la etiqueta:', id);
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
        thumbnailSize: true,
        thumbnailWidth: true,
        thumbnailHeight: true,
        folderId: true,
        isPublic: true,
        isFavorite: true,
      },
    });

    tagLogger.info(`✅ ${images.length} imágenes obtenidas`);
    return images.map(image => ({
      ...image,
      type: 'image',
    }));
  } catch (error) {
    tagLogger.error("❌ Error al obtener imágenes de la etiqueta:", error);
    throw new TagError("No se pudieron obtener las imágenes de la etiqueta", error);
  }
}

export async function addImageToTag(tagId: string, imageId: string) {
  try {
    tagLogger.info('➕ Agregando imagen a etiqueta:', { tagId, imageId });
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
    tagLogger.info('✅ Imagen agregada a la etiqueta');
    revalidateAllPaths();
  } catch (error) {
    tagLogger.error("❌ Error al agregar imagen a la etiqueta:", error);
    throw new TagError("No se pudo agregar la imagen a la etiqueta", error);
  }
}

export async function removeImageFromTag(tagId: string, imageId: string) {
  try {
    tagLogger.info('➖ Removiendo imagen de etiqueta:', { tagId, imageId });
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
    tagLogger.info('✅ Imagen removida de la etiqueta');
    revalidateAllPaths();
  } catch (error) {
    tagLogger.error("❌ Error al eliminar imagen de la etiqueta:", error);
    throw new TagError("No se pudo eliminar la imagen de la etiqueta", error);
  }
}