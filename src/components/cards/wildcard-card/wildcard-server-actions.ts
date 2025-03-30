'use server';

import { db } from '@/lib/db';
import type { Wildcard } from '@/types/prisma';

export interface WildcardCardData extends Wildcard {
  _count: {
    images: number;
    videos: number;
    childWildcards: number;
  };
  recentImages?: string[];
  children?: any[]; // Representación JSON de children
}

/**
 * Obtiene los datos de un comodín para mostrar en una tarjeta
 */
export async function getWildcardCardData(
  wildcardId: string
): Promise<WildcardCardData> {
  const prisma = db.getClient();

  const wildcard = await prisma.wildcard.findUnique({
    where: {
      id: wildcardId,
    },
    include: {
      _count: {
        select: {
          images: true,
          videos: true,
          childWildcards: true,
        },
      },
    },
  });

  if (!wildcard) {
    throw new Error(`Comodín no encontrado: ${wildcardId}`);
  }

  // Obtener imágenes recientes relacionadas con este comodín
  const recentImages = await prisma.image.findMany({
    where: {
      wildcards: {
        some: {
          id: wildcardId,
        },
      },
    },
    select: {
      id: true,
      path: true,
      thumbnailWidth: true,
      thumbnailHeight: true,
    },
    orderBy: {
      updatedAt: 'desc',
    },
    take: 4,
  });

  const recentImagePaths = recentImages.map((img: { id: string }) => {
    // Convertir la ruta del sistema a una URL para el navegador
    const imagePath = `/api/thumbnails/${img.id}`;
    return imagePath;
  });

  // Intentar parsear el campo children si existe
  let children = [];
  if (typeof wildcard.children === 'string' && wildcard.children !== 'empty_array') {
    try {
      children = JSON.parse(wildcard.children);
    } catch (e) {
      console.error('Error parsing wildcard children:', e);
    }
  }

  return {
    ...wildcard,
    recentImages: recentImagePaths,
    children
  };
}

/**
 * Obtiene una lista de comodines para mostrar en una galería de tarjetas
 */
export async function getWildcardsForCards(options: {
  limit?: number;
  category?: string;
  parentId?: string | null;
  searchTerm?: string;
  orderBy?: 'name' | 'updatedAt' | 'createdAt';
  orderDir?: 'asc' | 'desc';
}) {
  const {
    limit = 20,
    category,
    parentId,
    searchTerm,
    orderBy = 'updatedAt',
    orderDir = 'desc',
  } = options;

  const prisma = db.getClient();

  const wildcards = await prisma.wildcard.findMany({
    where: {
      ...(category ? { category } : {}),
      ...(parentId !== undefined ? { parentId } : {}),
      ...(searchTerm
        ? {
            OR: [
              { name: { contains: searchTerm } },
              { description: { contains: searchTerm } },
            ],
          }
        : {}),
    },
    include: {
      _count: {
        select: {
          images: true,
          videos: true,
          childWildcards: true,
        },
      },
    },
    orderBy: {
      [orderBy]: orderDir,
    },
    take: limit,
  });

  return wildcards;
}