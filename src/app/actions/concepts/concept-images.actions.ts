'use server';

import { getPrismaClient } from '@/lib/database/db';
import { createEntityErrorObject, EntityErrorCode, handlePrismaError, handlePrismaNotFoundError } from '@/lib/errors';
import { serverLogger } from '@/lib/logger/server-logger';
import { fromPrismaConcept } from '@/transformers/concept';
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
		const prisma = await getPrismaClient();

		// Verificar que ambos existan
		const concept = await prisma.concept.findUnique({ where: { id: conceptId } });
		if (!concept) {
			return handlePrismaNotFoundError(`Concepto con id ${conceptId} no encontrado.`);
		}
		const image = await prisma.image.findUnique({ where: { id: imageId } });
		if (!image) {
			return handlePrismaNotFoundError(`Imagen con id ${imageId} no encontrada.`);
		}

		const updatedConcept = await prisma.concept.update({
			where: { id: conceptId },
			data: { images: { connect: { id: imageId } } },
			include: { images: true },
		});

		// Revalidar rutas relevantes
		for (const path of REVALIDATE_PATHS) {
			revalidatePath(path);
		}

		conceptImagesLogger.info(`✅ Imagen ${imageId} añadida al concepto ${conceptId}`);
		return fromPrismaConcept(updatedConcept);
	} catch (error) {
		return handlePrismaError(error, `Error al añadir imagen ${imageId} a concepto ${conceptId}`);
	}
}

/**
 * Elimina una imagen de un concepto
 */
export async function removeConceptImage(conceptId: string, imageId: string): Promise<ConceptComplete> {
	try {
		conceptImagesLogger.info(`🗑️ Eliminando imagen ${imageId} del concepto ${conceptId}`);
		const prisma = await getPrismaClient();

		// Verificar que el concepto exista
		const concept = await prisma.concept.findUnique({ where: { id: conceptId } });
		if (!concept) {
			return handlePrismaNotFoundError(`Concepto con id ${conceptId} no encontrado.`);
		}
		const image = await prisma.image.findUnique({ where: { id: imageId } });
		if (!image) {
			return handlePrismaNotFoundError(`Imagen con id ${imageId} no encontrada.`);
		}

		const updatedConcept = await prisma.concept.update({
			where: { id: conceptId },
			data: { images: { disconnect: { id: imageId } } },
			include: { images: true },
		});

		// Revalidar rutas relevantes
		for (const path of REVALIDATE_PATHS) {
			revalidatePath(path);
		}

		conceptImagesLogger.info(`✅ Imagen ${imageId} eliminada del concepto ${conceptId}`);
		return fromPrismaConcept(updatedConcept);
	} catch (error) {
		return handlePrismaError(error, `Error al eliminar imagen ${imageId} del concepto ${conceptId}`);
	}
}

/**
 * Obtiene todas las imágenes asociadas a un concepto
 */
export async function getConceptImages(conceptId: string) {
	try {
		conceptImagesLogger.info(`🔍 Obteniendo imágenes del concepto ${conceptId}`);
		const prisma = await getPrismaClient();

		const concept = await prisma.concept.findUnique({
			where: { id: conceptId },
			include: { images: { orderBy: { createdAt: 'desc' } } },
		});

		if (!concept) {
			return handlePrismaNotFoundError(`Concepto con id ${conceptId} no encontrado.`);
		}

		const transformedConcept = fromPrismaConcept(concept);
		if (!transformedConcept) {
			// Esto no debería ocurrir si el concepto existe, pero es un chequeo de seguridad
			throw new Error('Error al transformar el concepto.');
		}

		return transformedConcept.images ?? [];
	} catch (error) {
		return handlePrismaError(error, `Error al obtener imágenes para el concepto ${conceptId}`);
	}
}
