'use server';

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

const logger = serverLogger.withContext('collection-images.actions');

/**
 * Obtiene las imágenes más recientes de una colección para mostrar en las tarjetas.
 * @param collectionId ID de la colección
 * @param limit Número máximo de imágenes a devolver (por defecto 6)
 * @returns Lista de imágenes con ID y URL de miniatura
 */
export async function getRecentCollectionImages(collectionId: string, limit = 6) {
  try {
    logger.info(`Obteniendo ${limit} imágenes recientes para la colección ${collectionId}`);

    // Buscar imágenes de la colección a través de la relación many-to-many
    const collectionWithImages = await prisma.collection.findUnique({
      where: {
        id: collectionId,
      },
      include: {
        images: {
          take: limit,
          select: {
            id: true,
            name: true,
            path: true,
            thumbnail: true,
            thumbnailSize: true,
          },
          orderBy: {
            updatedAt: 'desc',
          },
        },
      },
    });

    if (!collectionWithImages) {
      logger.warn(`No se encontró la colección con ID ${collectionId}`);
      return [];
    }

    // Transformar los datos para devolverlos
    const imageData = collectionWithImages.images.map((image) => {
      // Verificar si hay thumbnail
      let thumbnailUrl = '';
      if (image.thumbnail) {
        // Si hay una miniatura en la base de datos, crear una URL para ella
        thumbnailUrl = `/api/images/${image.id}/thumbnail`;
      } else {
        // Si no hay miniatura, usar una imagen de marcador de posición
        thumbnailUrl = `/api/images/${image.id}/placeholder`;
      }

      return {
        id: image.id,
        name: image.name,
        thumbnailUrl,
      };
    });

    logger.info(`Se encontraron ${imageData.length} imágenes recientes en la colección ${collectionId}`);
    return imageData;
  } catch (error) {
    logger.error('Error al obtener imágenes recientes de la colección:', error);
    // Devolver un array vacío en caso de error
    return [];
  }
}

/**
 * Añade una imagen a una colección
 * @param imageId ID de la imagen
 * @param collectionId ID de la colección
 */
export async function addImageToCollection(imageId: string, collectionId: string) {
  try {
    logger.info(`Añadiendo imagen ${imageId} a la colección ${collectionId}`);

    // Verificar que tanto la colección como la imagen existen
    const collection = await prisma.collection.findUnique({
      where: { id: collectionId }
    });

    const image = await prisma.image.findUnique({
      where: { id: imageId }
    });

    if (!collection) {
      throw new Error(`La colección con ID ${collectionId} no existe`);
    }

    if (!image) {
      throw new Error(`La imagen con ID ${imageId} no existe`);
    }

    // Añadir la imagen a la colección
    await prisma.collection.update({
      where: { id: collectionId },
      data: {
        images: {
          connect: { id: imageId }
        }
      }
    });

    // Revalidar rutas relacionadas
    revalidatePath(`/collections/${collectionId}`);
    revalidatePath(`/images/${imageId}`);

    logger.info(`Imagen ${imageId} añadida correctamente a la colección ${collectionId}`);
  } catch (error) {
    logger.error('Error al añadir imagen a la colección:', error);
    throw new Error(`No se pudo añadir la imagen a la colección: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Elimina una imagen de una colección
 * @param imageId ID de la imagen
 * @param collectionId ID de la colección
 */
export async function removeImageFromCollection(imageId: string, collectionId: string) {
  try {
    logger.info(`Eliminando imagen ${imageId} de la colección ${collectionId}`);

    // Verificar que tanto la colección como la imagen existen
    const collection = await prisma.collection.findUnique({
      where: { id: collectionId }
    });

    const image = await prisma.image.findUnique({
      where: { id: imageId }
    });

    if (!collection) {
      throw new Error(`La colección con ID ${collectionId} no existe`);
    }

    if (!image) {
      throw new Error(`La imagen con ID ${imageId} no existe`);
    }

    // Eliminar la imagen de la colección
    await prisma.collection.update({
      where: { id: collectionId },
      data: {
        images: {
          disconnect: { id: imageId }
        }
      }
    });

    // Revalidar rutas relacionadas
    revalidatePath(`/collections/${collectionId}`);
    revalidatePath(`/images/${imageId}`);

    logger.info(`Imagen ${imageId} eliminada correctamente de la colección ${collectionId}`);
  } catch (error) {
    logger.error('Error al eliminar imagen de la colección:', error);
    throw new Error(`No se pudo eliminar la imagen de la colección: ${error instanceof Error ? error.message : String(error)}`);
  }
}