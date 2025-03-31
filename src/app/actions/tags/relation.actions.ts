'use server';

/**
 * @file Acciones para relaciones de Tag con otras entidades
 * @module app/actions/tags/relation.actions
 */

import { notifyStatChange } from '@/lib/events';
import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

const tagLogger = serverLogger.withContext('TagRelationActions');

// Rutas para revalidar después de operaciones
const REVALIDATE_PATHS = [
  '/dashboard/tags',
  '/dashboard/images',
  '/dashboard/stats',
  '/api/tags',
];

// Manejo de errores - enfoque funcional
enum TagRelationErrorCode {
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  OPERATION_FAILED = 'OPERATION_FAILED',
}

const createRelationError = (message: string, code: TagRelationErrorCode = TagRelationErrorCode.OPERATION_FAILED, cause?: unknown) => {
  const error = new Error(message);
  error.name = 'TagRelationError';
  Object.assign(error, { code, cause });
  return error;
};

/**
 * Asigna un tag a una o varias imágenes
 */
export async function assignTagToImages(tagId: string, imageIds: string[]): Promise<void> {
  try {
    tagLogger.info('🔄 Asignando tag a imágenes:', { tagId, imageCount: imageIds.length });

    // Verificar que el tag existe
    const tag = await prisma.tag.findUnique({
      where: { id: tagId },
      select: { id: true, name: true },
    });

    if (!tag) {
      tagLogger.warn('⚠️ Tag no encontrado:', tagId);
      throw createRelationError(`Tag no encontrado: ${tagId}`, TagRelationErrorCode.NOT_FOUND);
    }

    // Verificar que las imágenes existen
    const imagesCount = await prisma.image.count({
      where: {
        id: {
          in: imageIds,
        },
      },
    });

    if (imagesCount !== imageIds.length) {
      tagLogger.warn('⚠️ Algunas imágenes no existen', {
        expected: imageIds.length,
        found: imagesCount,
      });
      throw createRelationError(
        `Algunas imágenes no existen (${imagesCount}/${imageIds.length})`,
        TagRelationErrorCode.NOT_FOUND
      );
    }

    // Crear las relaciones
    const operations = imageIds.map((imageId) =>
      prisma.image.update({
        where: { id: imageId },
        data: {
          tags: {
            connect: {
              id: tagId,
            },
          },
        },
      })
    );

    await prisma.$transaction(operations);

    // Revalidar rutas y notificar cambios
    for (const path of REVALIDATE_PATHS) {
      revalidatePath(path);
    }
    notifyStatChange('tags');

    tagLogger.info('✅ Tag asignado a imágenes:', {
      tagId,
      tagName: tag.name,
      imageCount: imageIds.length,
    });
  } catch (error) {
    tagLogger.error('❌ Error al asignar tag a imágenes:', { tagId, imageIds, error });

    // Manejar error específico de tag o imágenes no encontradas
    if ((error as any).code === TagRelationErrorCode.NOT_FOUND) {
      throw error;
    }

    throw createRelationError('No se pudo asignar el tag a las imágenes', TagRelationErrorCode.OPERATION_FAILED, error);
  }
}

/**
 * Desasigna un tag de una o varias imágenes
 */
export async function removeTagFromImages(tagId: string, imageIds: string[]): Promise<void> {
  try {
    tagLogger.info('🔄 Eliminando tag de imágenes:', { tagId, imageCount: imageIds.length });

    // Verificar que el tag existe
    const tag = await prisma.tag.findUnique({
      where: { id: tagId },
      select: { id: true, name: true },
    });

    if (!tag) {
      tagLogger.warn('⚠️ Tag no encontrado:', tagId);
      throw createRelationError(`Tag no encontrado: ${tagId}`, TagRelationErrorCode.NOT_FOUND);
    }

    // Crear las operaciones de desasignación
    const operations = imageIds.map((imageId) =>
      prisma.image.update({
        where: { id: imageId },
        data: {
          tags: {
            disconnect: {
              id: tagId,
            },
          },
        },
      })
    );

    await prisma.$transaction(operations);

    // Revalidar rutas y notificar cambios
    for (const path of REVALIDATE_PATHS) {
      revalidatePath(path);
    }
    notifyStatChange('tags');

    tagLogger.info('✅ Tag eliminado de imágenes:', {
      tagId,
      tagName: tag.name,
      imageCount: imageIds.length,
    });
  } catch (error) {
    tagLogger.error('❌ Error al eliminar tag de imágenes:', { tagId, imageIds, error });

    // Manejar error específico de tag no encontrado
    if ((error as any).code === TagRelationErrorCode.NOT_FOUND) {
      throw error;
    }

    throw createRelationError('No se pudo eliminar el tag de las imágenes', TagRelationErrorCode.OPERATION_FAILED, error);
  }
}

/**
 * Obtiene las sugerencias de tags basadas en el contenido y/o similitud de imagen
 */
export async function getSuggestedTags(imageId: string, limit = 10): Promise<string[]> {
  try {
    tagLogger.info('🧠 Obteniendo sugerencias de tags para imagen:', imageId);

    // Verificar que la imagen existe
    const image = await prisma.image.findUnique({
      where: { id: imageId },
      select: { id: true, path: true },
    });

    if (!image) {
      tagLogger.warn('⚠️ Imagen no encontrada:', imageId);
      throw createRelationError(`Imagen no encontrada: ${imageId}`, TagRelationErrorCode.NOT_FOUND);
    }

    // Buscar tags que se usan frecuentemente con tags similares
    // En una implementación real, aquí iría lógica de machine learning
    // o consultas de similitud

    // Por ahora, simplemente devolvemos los tags más populares
    const popularTags = await prisma.tag.findMany({
      take: limit,
      orderBy: {
        images: {
          _count: 'desc',
        },
      },
      select: {
        name: true,
      },
    });

    const suggestions = popularTags.map((tag) => tag.name);

    tagLogger.info('✅ Sugerencias de tags obtenidas:', {
      imageId,
      count: suggestions.length,
    });

    return suggestions;
  } catch (error) {
    tagLogger.error('❌ Error al obtener sugerencias de tags:', { imageId, error });

    // Manejar error específico de imagen no encontrada
    if ((error as any).code === TagRelationErrorCode.NOT_FOUND) {
      throw error;
    }

    throw createRelationError('No se pudieron obtener sugerencias de tags', TagRelationErrorCode.OPERATION_FAILED, error);
  }
}

/**
 * Actualiza los tags de una imagen (reemplaza todos)
 */
export async function updateImageTags(imageId: string, tagIds: string[]): Promise<void> {
  try {
    tagLogger.info('🔄 Actualizando tags de imagen:', { imageId, tagCount: tagIds.length });

    // Verificar que la imagen existe
    const image = await prisma.image.findUnique({
      where: { id: imageId },
      select: { id: true },
    });

    if (!image) {
      tagLogger.warn('⚠️ Imagen no encontrada:', imageId);
      throw createRelationError(`Imagen no encontrada: ${imageId}`, TagRelationErrorCode.NOT_FOUND);
    }

    // Actualizar la imagen con los nuevos tags (reemplaza todos los anteriores)
    await prisma.image.update({
      where: { id: imageId },
      data: {
        tags: {
          set: tagIds.map((id) => ({ id })),
        },
      },
    });

    // Revalidar rutas y notificar cambios
    for (const path of REVALIDATE_PATHS) {
      revalidatePath(path);
    }
    notifyStatChange('tags');

    tagLogger.info('✅ Tags de imagen actualizados:', {
      imageId,
      tagCount: tagIds.length,
    });
  } catch (error) {
    tagLogger.error('❌ Error al actualizar tags de imagen:', { imageId, tagIds, error });

    // Manejar error específico de imagen no encontrada
    if ((error as any).code === TagRelationErrorCode.NOT_FOUND) {
      throw error;
    }

    throw createRelationError('No se pudieron actualizar los tags de la imagen', TagRelationErrorCode.OPERATION_FAILED, error);
  }
}

/**
 * Añade una imagen a un tag específico
 */
export async function addImageToTag(tagId: string, imageId: string): Promise<void> {
  try {
    tagLogger.info('➕ Añadiendo imagen a tag:', { tagId, imageId });

    // Verificar si el tag y la imagen existen
    const [tag, image] = await Promise.all([
      prisma.tag.findUnique({ where: { id: tagId } }),
      prisma.image.findUnique({ where: { id: imageId } }),
    ]);

    if (!tag) {
      tagLogger.warn('⚠️ Tag no encontrado:', tagId);
      throw createRelationError(`Tag no encontrado: ${tagId}`, TagRelationErrorCode.NOT_FOUND);
    }

    if (!image) {
      tagLogger.warn('⚠️ Imagen no encontrada:', imageId);
      throw createRelationError(`Imagen no encontrada: ${imageId}`, TagRelationErrorCode.NOT_FOUND);
    }

    // Conectar la imagen al tag
    await prisma.tag.update({
      where: { id: tagId },
      data: {
        images: {
          connect: { id: imageId },
        },
      },
    });

    // Revalidar rutas y notificar cambios
    for (const path of REVALIDATE_PATHS) {
      revalidatePath(path);
    }
    notifyStatChange('tags');

    tagLogger.info('✅ Imagen añadida al tag:', {
      tagId,
      tagName: tag.name,
      imageId,
    });
  } catch (error) {
    tagLogger.error('❌ Error al añadir imagen al tag:', { tagId, imageId, error });

    // Manejar error específico de tag o imagen no encontrados
    if ((error as any).code === TagRelationErrorCode.NOT_FOUND) {
      throw error;
    }

    throw createRelationError('No se pudo añadir la imagen al tag', TagRelationErrorCode.OPERATION_FAILED, error);
  }
}