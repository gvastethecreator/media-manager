'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { FileItem } from "@/types/files";
import type { Collection, Tag, Folder, SortMode } from "@/types/settings";

/**
 * Transforma los datos de la imagen de Prisma al formato FileItem
 */
const transformImageToFileItem = (img: any): FileItem => ({
  id: img.id,
  name: img.name,
  path: img.path,
  type: "image" as const,
  size: img.size,
  width: img.width,
  height: img.height,
  src: `file://${img.path}`,
  metadata: img.metadata ? JSON.parse(img.metadata) : null,
  thumbnail: img.thumbnail
    ? `data:image/jpeg;base64,${Buffer.from(img.thumbnail).toString("base64")}`
    : undefined,
  thumbnailSize: img.thumbnailSize || 0,
  thumbnailWidth: img.thumbnailWidth || 0,
  thumbnailHeight: img.thumbnailHeight || 0,
  isPublic: img.isPublic,
  isFavorite: img.isFavorite,
  tags: img.tags.map((tag: any) => ({
    id: tag.id,
    name: tag.name,
    color: tag.color,
  })),
  collections: img.collections.map((collection: any) => ({
    id: collection.id,
    name: collection.name,
    emoji: collection.emoji,
    color: collection.color,
  })),
  stats: img.stats
    ? {
      views: img.stats.views,
      downloads: img.stats.downloads,
      lastViewed: img.stats.lastViewed,
    }
    : undefined,
  createdAt: img.createdAt,
  updatedAt: img.updatedAt,
});

/**
 * Obtiene todas las imágenes con sus relaciones
 */
export async function getAllImages() {
  const images = await prisma.image.findMany({
    include: {
      folder: true,
      collections: true,
      tags: true,
      favorites: true,
      stats: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return images.map(transformImageToFileItem);
}

/**
 * Obtiene las imágenes de una colección específica
 */
export async function getCollectionImages(id: string) {
  const collection = await prisma.collection.findUnique({
    where: { id },
    include: {
      images: {
        include: {
          folder: true,
          collections: true,
          tags: true,
          favorites: true,
          stats: true,
        },
      },
    },
  });

  if (!collection) {
    throw new Error("Colección no encontrada");
  }

  return collection.images.map(transformImageToFileItem);
}

/**
 * Obtiene las imágenes de una carpeta específica
 */
export async function getFolderImages(id: string) {
  const folder = await prisma.folder.findUnique({
    where: { id },
    include: {
      images: {
        include: {
          folder: true,
          collections: true,
          tags: true,
          favorites: true,
          stats: true,
        },
      },
    },
  });

  if (!folder) {
    throw new Error("Carpeta no encontrada");
  }

  return folder.images.map(transformImageToFileItem);
}

/**
 * Obtiene las imágenes de una etiqueta específica
 */
export async function getTagImages(name: string) {
  const tag = await prisma.tag.findUnique({
    where: { name },
    include: {
      images: {
        include: {
          folder: true,
          collections: true,
          tags: true,
          favorites: true,
          stats: true,
        },
      },
    },
  });

  if (!tag) {
    throw new Error("Etiqueta no encontrada");
  }

  return tag.images.map(transformImageToFileItem);
}

/**
 * Alterna el estado de favorito de una imagen
 */
export async function toggleFavorite(id: string) {
  const image = await prisma.image.findUnique({
    where: { id },
    include: { favorites: true },
  });

  if (!image) {
    throw new Error("Imagen no encontrada");
  }

  const isFavorite = image.favorites.length > 0;

  if (isFavorite) {
    await prisma.favorite.deleteMany({
      where: { imageId: id },
    });
  } else {
    await prisma.favorite.create({
      data: { imageId: id },
    });
  }

  revalidatePath("/");
  return !isFavorite;
}

/**
 * Obtiene los datos del sistema (carpetas, colecciones, etiquetas)
 */
export async function getSystemData(): Promise<{
  folders: Folder[];
  collections: Collection[];
  tags: Tag[];
}> {
  const [folders, collections, tags] = await Promise.all([
    prisma.folder.findMany({
      orderBy: { name: "asc" },
    }),
    prisma.collection.findMany({
      orderBy: { name: "asc" },
    }),
    prisma.tag.findMany({
      orderBy: { name: "asc" },
    }),
  ]);

  return {
    folders: folders.map(folder => ({
      ...folder,
      isIndexed: true,
      lastIndexed: folder.lastIndexed?.toISOString() || null,
    })),
    collections: collections.map(collection => ({
      ...collection,
      sortDirection: "asc" as const,
      filters: JSON.parse(collection.filters),
      count: 0,
      description: collection.description || undefined,
      shortcut: collection.shortcut || undefined,
      sortBy: collection.sortBy as SortMode,
    })),
    tags: tags.map(tag => ({
      ...tag,
      count: 0,
    })),
  };
}