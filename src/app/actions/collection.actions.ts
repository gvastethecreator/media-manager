"use server";

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { revalidatePath } from "next/cache";
import type { Collection } from "@prisma/client";
import { FileItem } from "@/types/file-item";
import { convertServerImageToFileItem, type ServerImage } from "@/services/image-converter.service";
import { collectionEventsService, COLLECTION_EVENTS } from "@/services/collection-events.service";
import { eventsService, type EventType } from '@/services/events.service';
import { statsEventEmitter, STATS_EVENTS } from '@/services/stats.service';

const collectionLogger = logger.withContext("CollectionActions");

const REVALIDATE_PATHS = [
  "/settings",
  "/collections",
  "/collections/[id]",
  "/images/[id]"
] as const;

const revalidateAllPaths = () => {
  REVALIDATE_PATHS.forEach(path => revalidatePath(path));
  collectionLogger.info("🔄 Rutas revalidadas");
};

class CollectionError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = "CollectionError";
  }
}

export interface CollectionStats {
  count: number;
  size: number;
  lastUpdated?: Date;
}

export interface CollectionWithStats extends Collection {
  _count: {
    images: number;
  };
  totalSize: number;
  lastUpdated: Date;
  distribution?: Array<{
    name: string;
    count: number;
  }>;
  featuredImage: string | null;
  recentImages: string[];
}

export interface CollectionWithImages extends Collection {
  images: FileItem[];
}

export interface CollectionCreate {
  name: string;
  emoji: string;
  color: string;
  description?: string | null;
  shortcut?: string | null;
  sortBy: string;
  filters: string;
  url?: string | null;
  alternativeUrl?: string | null;
  sourceImage?: string | null;
  platform?: string | null;
  price?: number | null;
  editions: string;
  featuredImage?: string | null;
  isFavorite?: boolean;
}

export interface CollectionUpdate extends Partial<CollectionCreate> {
  id: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export async function getCollections(): Promise<CollectionWithStats[]> {
  try {
    collectionLogger.info('🎯 Obteniendo colecciones');
    const collections = await prisma.collection.findMany({
      include: {
        _count: {
          select: { images: true },
        },
        images: {
          take: 9,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            thumbnail: true,
            thumbnailWidth: true,
            thumbnailHeight: true,
            thumbnailSize: true,
            isFavorite: true,
            createdAt: true,
            folder: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' },
    });

    const collectionsWithStats = await Promise.all(
      collections.map(async (collection) => {
        const totalSize = await prisma.image.aggregate({
          where: {
            collections: {
              some: {
                id: collection.id
              }
            }
          },
          _sum: {
            size: true
          }
        });

        const lastImage = collection.images?.[0];
        const lastUpdated = lastImage?.createdAt || collection.updatedAt;

        const folderDistribution = collection.images?.reduce((acc, img) => {
          const folderName = img.folder?.name || 'Sin carpeta';
          acc[folderName] = (acc[folderName] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const distribution = Object.entries(folderDistribution || {}).map(([name, count]) => ({
          name,
          count
        })).sort((a, b) => b.count - a.count);

        const featuredImage = collection.images?.find(img => img.isFavorite)?.thumbnail;
        const recentImages = collection.images
          ?.filter(img => img.thumbnail && img.thumbnailSize && img.thumbnailSize < 100000)
          .map(img => {
            if (img.thumbnail) {
              return `data:image/jpeg;base64,${Buffer.from(img.thumbnail).toString('base64')}`;
            }
            return '';
          }).filter(Boolean);

        const result: CollectionWithStats = {
          ...collection,
          _count: {
            images: collection._count?.images || 0
          },
          totalSize: totalSize._sum.size || 0,
          lastUpdated,
          distribution,
          featuredImage: featuredImage ?
            `data:image/jpeg;base64,${Buffer.from(featuredImage).toString('base64')}` :
            null,
          recentImages: recentImages || []
        };

        return result;
      })
    );

    collectionLogger.info('✅ Colecciones obtenidas', { count: collections.length });
    return collectionsWithStats;
  } catch (error) {
    collectionLogger.error('❌ Error al obtener colecciones', error);
    throw new CollectionError('No se pudieron obtener las colecciones', { cause: error });
  }
}

export async function getCollection(id: string): Promise<CollectionWithStats> {
  try {
    collectionLogger.info("🔍 Obteniendo colección:", id);
    const collection = await prisma.collection.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            images: true
          }
        },
        images: {
          take: 9,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            thumbnail: true,
            thumbnailWidth: true,
            thumbnailHeight: true,
            thumbnailSize: true,
            isFavorite: true,
            createdAt: true,
            folder: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    if (!collection) {
      throw new CollectionError("Colección no encontrada");
    }

    const totalSize = await prisma.image.aggregate({
      where: {
        collections: {
          some: {
            id: collection.id
          }
        }
      },
      _sum: {
        size: true
      }
    });

    const lastImage = collection.images?.[0];
    const lastUpdated = lastImage?.createdAt || collection.updatedAt;

    const folderDistribution = collection.images?.reduce((acc, img) => {
      const folderName = img.folder?.name || 'Sin carpeta';
      acc[folderName] = (acc[folderName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const distribution = Object.entries(folderDistribution || {}).map(([name, count]) => ({
      name,
      count
    })).sort((a, b) => b.count - a.count);

    const featuredImage = collection.images?.find(img => img.isFavorite)?.thumbnail;
    const recentImages = collection.images
      ?.filter(img => img.thumbnail && img.thumbnailSize && img.thumbnailSize < 100000)
      .map(img => {
        if (img.thumbnail) {
          return `data:image/jpeg;base64,${Buffer.from(img.thumbnail).toString('base64')}`;
        }
        return '';
      }).filter(Boolean);

    const result: CollectionWithStats = {
      ...collection,
      _count: {
        images: collection._count?.images || 0
      },
      totalSize: totalSize._sum.size || 0,
      lastUpdated,
      distribution,
      featuredImage: featuredImage ?
        `data:image/jpeg;base64,${Buffer.from(featuredImage).toString('base64')}` :
        null,
      recentImages: recentImages || []
    };

    collectionLogger.info("✅ Colección obtenida:", collection.name);
    return result;
  } catch (error) {
    collectionLogger.error("❌ Error al obtener colección:", error);
    if (error instanceof CollectionError) throw error;
    throw new CollectionError("No se pudo obtener la colección", error);
  }
}

export async function createCollection(data: CollectionCreate): Promise<Collection> {
  try {
    collectionLogger.info("📝 Creando colección:", data.name);
    const collection = await prisma.collection.create({
      data: {
        name: data.name,
        emoji: data.emoji,
        color: data.color,
        description: data.description || null,
        shortcut: data.shortcut || null,
        sortBy: data.sortBy,
        filters: data.filters,
        url: data.url || null,
        alternativeUrl: data.alternativeUrl || null,
        sourceImage: data.sourceImage || null,
        platform: data.platform || null,
        price: data.price || null,
        editions: data.editions,
        featuredImage: data.featuredImage || null,
        isFavorite: data.isFavorite || false,
      },
    });

    collectionEventsService.emit(COLLECTION_EVENTS.COLLECTION_CREATED, { collection });
    eventsService.emit('collections:modified' as EventType);
    statsEventEmitter.emit(STATS_EVENTS.COLLECTION_CHANGE);

    revalidateAllPaths();

    collectionLogger.info("✅ Colección creada:", collection.id);
    return collection;
  } catch (error) {
    collectionLogger.error("❌ Error al crear colección:", error);
    throw new CollectionError("No se pudo crear la colección", { cause: error });
  }
}

export async function updateCollection(id: string, data: CollectionUpdate): Promise<Collection> {
  try {
    collectionLogger.info("📝 Actualizando colección:", id);
    const collection = await prisma.collection.update({
      where: { id },
      data: {
        name: data.name,
        emoji: data.emoji,
        color: data.color,
        description: data.description || null,
        shortcut: data.shortcut || null,
        sortBy: data.sortBy,
        filters: data.filters,
        url: data.url || null,
        alternativeUrl: data.alternativeUrl || null,
        sourceImage: data.sourceImage || null,
        platform: data.platform || null,
        price: data.price || null,
        editions: data.editions,
        featuredImage: data.featuredImage || null,
        isFavorite: data.isFavorite || false,
      },
    });

    collectionEventsService.emit(COLLECTION_EVENTS.COLLECTION_UPDATED, { collection });
    revalidateAllPaths();

    collectionLogger.info("✅ Colección actualizada:", id);
    return collection;
  } catch (error) {
    collectionLogger.error("❌ Error al actualizar colección:", error);
    throw new CollectionError("No se pudo actualizar la colección", {
      cause: error,
    });
  }
}

export async function deleteCollection(id: string): Promise<void> {
  try {
    collectionLogger.info("🗑️ Eliminando colección:", id);
    const collection = await prisma.collection.delete({
      where: { id }
    });

    collectionEventsService.emit(COLLECTION_EVENTS.COLLECTION_DELETED, { collection });
    eventsService.emit('collections:modified' as EventType);
    statsEventEmitter.emit(STATS_EVENTS.COLLECTION_CHANGE);

    revalidateAllPaths();

    collectionLogger.info("✅ Colección eliminada:", collection.name);
  } catch (error) {
    collectionLogger.error("❌ Error al eliminar colección:", error);
    throw new CollectionError("No se pudo eliminar la colección", error);
  }
}

export async function getCollectionImages(id: string): Promise<FileItem[]> {
  try {
    collectionLogger.info("🖼️ Obteniendo imágenes de la colección:", id);
    const collection = await prisma.collection.findUnique({
      where: { id },
      include: {
        images: {
          include: {
            tags: true,
            collections: true,
            albums: true,
            stats: true,
          }
        }
      }
    });

    if (!collection) {
      throw new CollectionError("Colección no encontrada");
    }

    const images = collection.images.map(img => convertServerImageToFileItem(img as ServerImage));

    collectionLogger.info(`✅ ${images.length} imágenes obtenidas`);
    return images;
  } catch (error) {
    collectionLogger.error("❌ Error al obtener imágenes de la colección:", error);
    throw new CollectionError("No se pudieron obtener las imágenes de la colección", error);
  }
}

export async function addImageToCollection(collectionId: string, imageId: string): Promise<void> {
  try {
    collectionLogger.info("➕ Agregando imagen a colección:", { collectionId, imageId });
    await prisma.image.update({
      where: { id: imageId },
      data: {
        collections: {
          connect: { id: collectionId }
        }
      }
    });

    collectionEventsService.emit(COLLECTION_EVENTS.IMAGE_ADDED, { collectionId, imageId });
    eventsService.emit('collections:modified' as EventType);
    statsEventEmitter.emit(STATS_EVENTS.COLLECTION_CHANGE);
    statsEventEmitter.emit(STATS_EVENTS.FILES_CHANGE);

    revalidateAllPaths();

    collectionLogger.info("✅ Imagen agregada a la colección");
  } catch (error) {
    collectionLogger.error("❌ Error al agregar imagen a la colección:", error);
    throw new CollectionError("No se pudo agregar la imagen a la colección", error);
  }
}

export async function removeImageFromCollection(collectionId: string, imageId: string): Promise<void> {
  try {
    collectionLogger.info("➖ Removiendo imagen de colección:", { collectionId, imageId });
    await prisma.image.update({
      where: { id: imageId },
      data: {
        collections: {
          disconnect: { id: collectionId }
        }
      }
    });

    collectionEventsService.emit(COLLECTION_EVENTS.IMAGE_REMOVED, { collectionId, imageId });
    eventsService.emit('collections:modified' as EventType);
    statsEventEmitter.emit(STATS_EVENTS.COLLECTION_CHANGE);
    statsEventEmitter.emit(STATS_EVENTS.FILES_CHANGE);

    revalidateAllPaths();

    collectionLogger.info("✅ Imagen removida de la colección");
  } catch (error) {
    collectionLogger.error("❌ Error al remover imagen de la colección:", error);
    throw new CollectionError("No se pudo remover la imagen de la colección", error);
  }
}

export async function getCollectionStats(id: string): Promise<CollectionStats> {
  try {
    collectionLogger.info('📊 Obteniendo estadísticas de colección:', id);
    const collection = await prisma.collection.findUnique({
      where: { id },
      include: {
        _count: {
          select: { images: true }
        },
        images: {
          select: { size: true }
        }
      }
    });

    if (!collection) {
      throw new CollectionError("Colección no encontrada");
    }

    const totalSize = collection.images.reduce((acc, img) => acc + img.size, 0);
    const stats = {
      count: collection._count.images,
      size: totalSize,
      lastUpdated: new Date()
    };

    collectionLogger.info('✅ Estadísticas obtenidas:', stats);
    return stats;
  } catch (error) {
    collectionLogger.error('❌ Error al obtener estadísticas:', error);
    throw new CollectionError("No se pudieron obtener las estadísticas", error);
  }
}

export async function updateCollectionStats(id: string, stats: Partial<CollectionStats>): Promise<CollectionStats> {
  try {
    collectionLogger.info('📝 Actualizando estadísticas de colección:', { id, stats });
    const collection = await prisma.collection.findUnique({
      where: { id },
      include: {
        _count: {
          select: { images: true }
        },
        images: {
          select: { size: true }
        }
      }
    });

    if (!collection) {
      throw new CollectionError("Colección no encontrada");
    }

    const totalSize = collection.images.reduce((acc, img) => acc + img.size, 0);
    const updatedStats = {
      count: collection._count.images,
      size: totalSize,
      lastUpdated: new Date(),
      ...stats
    };

    collectionLogger.info('✅ Estadísticas actualizadas:', updatedStats);
    return updatedStats;
  } catch (error) {
    collectionLogger.error('❌ Error al actualizar estadísticas:', error);
    throw new CollectionError("No se pudieron actualizar las estadísticas", error);
  }
}