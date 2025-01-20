"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";
import type { Tag as PrismaTag } from "@prisma/client";
import type { FileItem } from '@/types/file-item'
import { eventsService } from '@/services/events.service';
import { statsEventEmitter, STATS_EVENTS } from '@/services/stats.service';

const tagLogger = logger.withContext("TagActions");

export interface TagCreate {
  name: string;
  color?: string;
  description?: string | null;
  shortcut?: string | null;
}

export interface TagUpdate {
  id: string;
  name?: string;
  color?: string;
  description?: string | null;
  shortcut?: string | null;
  emoji?: string;
}

export interface Tag extends PrismaTag {
  count?: number;
}

export interface TagWithStats extends PrismaTag {
  _count: {
    images: number;
  };
  totalSize: number;
  lastUpdated: Date;
  emoji?: string;
  isFavorite?: boolean;
  isArchived?: boolean;
  distribution?: Array<{
    name: string;
    count: number;
  }>;
}

export interface TagWithImages extends Tag {
  images: FileItem[]
}

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

export async function getTags(): Promise<TagWithStats[]> {
  try {
    tagLogger.info("🏷️ Obteniendo etiquetas con estadísticas");

    // Obtener etiquetas con conteos y estadísticas
    const tags = await prisma.tag.findMany({
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
    const tagsWithStats = await Promise.all(
      tags.map(async (tag) => {
        // Calcular tamaño total
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

        // Obtener distribución por carpetas
        const distribution = await prisma.folder.findMany({
          where: {
            images: {
              some: {
                tags: {
                  some: {
                    id: tag.id,
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
          ...tag,
          _count: tag._count,
          totalSize: totalSize._sum.size || 0,
          lastUpdated: tag.images[0]?.updatedAt || tag.updatedAt,
          distribution: distribution.map((d) => ({
            name: d.name,
            count: d._count.images,
          })),
        };
      })
    );

    tagLogger.info("✅ Etiquetas obtenidas", { count: tags.length });
    return tagsWithStats;
  } catch (error) {
    tagLogger.error("❌ Error al obtener etiquetas", error);
    throw new Error("No se pudieron obtener las etiquetas");
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
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
        images: {
          select: { size: true }
        }
      },
    });

    if (!tag) {
      throw new TagError("Etiqueta no encontrada");
    }

    const totalSize = tag.images.reduce((acc, img) => acc + img.size, 0);
    const result = {
      ...tag,
      count: tag._count.images,
      size: formatBytes(totalSize),
      images: undefined
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

    // Emitir eventos
    eventsService.emit('tags:modified');
    statsEventEmitter.emit(STATS_EVENTS.TAG_CHANGE);

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

    // Emitir eventos
    eventsService.emit('tags:modified');
    statsEventEmitter.emit(STATS_EVENTS.TAG_CHANGE);

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

    tagLogger.info(`✅ ${images.length} imágenes obtenidas`);
    return images.map(image => ({
      ...image,
      type: 'image',
      metadata: image.metadata,
      tags: image.tags.map(t => ({ id: t.id, name: t.name })),
      collections: image.collections.map(c => ({ id: c.id, name: c.name })),
      albums: image.albums.map(a => ({ id: a.id, name: a.name })),
      characters: image.characters.map(c => ({ id: c.id, name: c.name })),
      places: image.places.map(p => ({ id: p.id, name: p.name })),
      objects: image.objects.map(o => ({ id: o.id, name: o.name })),
      thumbnail: image.thumbnail ? Buffer.from(image.thumbnail).toString('base64') : null,
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

export async function addTagToImage(tagId: string, imageId: string) {
  try {
    await prisma.image.update({
      where: { id: imageId },
      data: {
        tags: {
          connect: { id: tagId }
        }
      }
    });

    // Emitir eventos
    eventsService.emit('tags:modified');
    statsEventEmitter.emit(STATS_EVENTS.TAG_CHANGE);
    statsEventEmitter.emit(STATS_EVENTS.FILES_CHANGE);

    revalidateAllPaths();
  } catch (error) {
    tagLogger.error("❌ Error al agregar etiqueta a la imagen:", error);
    throw new TagError("No se pudo agregar la etiqueta a la imagen", error);
  }
}

export async function removeTagFromImage(tagId: string, imageId: string) {
  try {
    await prisma.image.update({
      where: { id: imageId },
      data: {
        tags: {
          disconnect: { id: tagId }
        }
      }
    });

    // Emitir eventos
    eventsService.emit('tags:modified');
    statsEventEmitter.emit(STATS_EVENTS.TAG_CHANGE);
    statsEventEmitter.emit(STATS_EVENTS.FILES_CHANGE);

    revalidateAllPaths();
  } catch (error) {
    tagLogger.error("❌ Error al eliminar etiqueta de la imagen:", error);
    throw new TagError("No se pudo eliminar la etiqueta de la imagen", error);
  }
}