'use server';

import { EntityErrorCode, createEntityErrorObject } from '@/lib/errors';
import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { toConceptComplete } from '@/transformers/concept';
import type { ConceptComplete } from '@/types/entities/concept';
import { revalidatePath } from 'next/cache';

// Logger dedicado
const conceptImagesLogger = serverLogger.withContext('ConceptImagesActions');

// Función creadora de errores
const createConceptImageError = (
    message: string,
    code: EntityErrorCode = EntityErrorCode.OPERATION_FAILED,
    cause?: unknown
) => {
    return createEntityErrorObject('ConceptImageError', message, code, cause);
};

// Rutas para revalidar
const REVALIDATE_PATHS = ['/concepts', '/concepts/[id]', '/gallery'] as const;

// Acciones para la relación concepto-imagen
/**
 * Agrega una imagen a un concepto
 */
export async function addConceptImage(conceptId: string, imageId: string): Promise<ConceptComplete> {
    try {
        conceptImagesLogger.info(`🖼️ Añadiendo imagen ${imageId} al concepto ${conceptId}`);

        // Verificar que ambos existan
        const concept = await prisma.concept.findUnique({
            where: { id: conceptId },
            select: { id: true }
        });

        if (!concept) {
            throw createConceptImageError('Concepto no encontrado', EntityErrorCode.NOT_FOUND);
        }

        const image = await prisma.image.findUnique({
            where: { id: imageId },
            select: { id: true }
        });

        if (!image) {
            throw createConceptImageError('Imagen no encontrada', EntityErrorCode.NOT_FOUND);
        }

        // Añadir relación
        const updatedConcept = await prisma.concept.update({
            where: { id: conceptId },
            data: {
                images: {
                    connect: { id: imageId }
                }
            }
        });

        // Revalidar rutas relevantes
        for (const path of REVALIDATE_PATHS) {
            revalidatePath(path);
        }

        conceptImagesLogger.info(`✅ Imagen ${imageId} añadida al concepto ${conceptId}`);
        return toConceptComplete(updatedConcept);

    } catch (error) {
        conceptImagesLogger.error('❌ Error al añadir imagen al concepto:', error);
        if (error instanceof Error && error.name === 'ConceptImageError') {
            throw error;
        }
        throw createConceptImageError('No se pudo añadir la imagen al concepto', EntityErrorCode.OPERATION_FAILED, error);
    }
}

/**
 * Elimina una imagen de un concepto
 */
export async function removeConceptImage(conceptId: string, imageId: string): Promise<ConceptComplete> {
    try {
        conceptImagesLogger.info(`🗑️ Eliminando imagen ${imageId} del concepto ${conceptId}`);

        // Verificar que el concepto exista
        const concept = await prisma.concept.findUnique({
            where: { id: conceptId },
            select: { id: true }
        });

        if (!concept) {
            throw createConceptImageError('Concepto no encontrado', EntityErrorCode.NOT_FOUND);
        }

        // Eliminar relación
        const updatedConcept = await prisma.concept.update({
            where: { id: conceptId },
            data: {
                images: {
                    disconnect: { id: imageId }
                }
            }
        });

        // Revalidar rutas relevantes
        for (const path of REVALIDATE_PATHS) {
            revalidatePath(path);
        }

        conceptImagesLogger.info(`✅ Imagen ${imageId} eliminada del concepto ${conceptId}`);
        return toConceptComplete(updatedConcept);

    } catch (error) {
        conceptImagesLogger.error('❌ Error al eliminar imagen del concepto:', error);
        if (error instanceof Error && error.name === 'ConceptImageError') {
            throw error;
        }
        throw createConceptImageError('No se pudo eliminar la imagen del concepto', EntityErrorCode.OPERATION_FAILED, error);
    }
}

/**
 * Obtiene todas las imágenes asociadas a un concepto
 */
export async function getConceptImages(conceptId: string) {
    try {
        conceptImagesLogger.info(`🔍 Obteniendo imágenes del concepto ${conceptId}`);

        const concept = await prisma.concept.findUnique({
            where: { id: conceptId },
            select: {
                images: {
                    select: {
                        id: true,
                        name: true,
                        url: true,
                        thumbnailUrl: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                }
            }
        });

        if (!concept) {
            throw createConceptImageError('Concepto no encontrado', EntityErrorCode.NOT_FOUND);
        }

        conceptImagesLogger.info(`✅ Obtenidas ${concept.images.length} imágenes del concepto ${conceptId}`);
        return concept.images;

    } catch (error) {
        conceptImagesLogger.error('❌ Error al obtener imágenes del concepto:', error);
        if (error instanceof Error && error.name === 'ConceptImageError') {
            throw error;
        }
        throw createConceptImageError('No se pudieron obtener las imágenes del concepto', EntityErrorCode.OPERATION_FAILED, error);
    }
}