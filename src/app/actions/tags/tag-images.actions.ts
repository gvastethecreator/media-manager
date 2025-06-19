'use server';

/**
 * @file Acciones específicas para la relación entre Tags e imágenes
 * @module app/actions/tags/tag-images.actions
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

const logger = serverLogger.withContext('tag-images.actions');

// Rutas que deben ser revalidadas cuando cambian las relaciones entre etiquetas e imágenes
const REVALIDATE_PATHS = ['/tags', '/images'];

// Manejo de errores - enfoque funcional
enum TagRelationErrorCode {
	NOT_FOUND = 'NOT_FOUND',
	VALIDATION_ERROR = 'VALIDATION_ERROR',
	OPERATION_FAILED = 'OPERATION_FAILED',
}

const _createRelationError = (
	message: string,
	code: TagRelationErrorCode = TagRelationErrorCode.OPERATION_FAILED,
	cause?: unknown
) => {
	const error = new Error(message);
	error.name = 'TagRelationError';
	Object.assign(error, { code, cause });
	return error;
};

/**
 * Añade una etiqueta a una imagen
 * @param imageId ID de la imagen
 * @param tagId ID de la etiqueta
 */
export async function addTagToImage(imageId: string, tagId: string) {
	try {
		logger.info(`Añadiendo etiqueta ${tagId} a la imagen ${imageId}`);

		// Verificar que tanto la etiqueta como la imagen existen
		const tag = await prisma.tag.findUnique({
			where: { id: tagId },
		});

		const image = await prisma.image.findUnique({
			where: { id: imageId },
		});

		if (!tag) {
			throw new Error(`La etiqueta con ID ${tagId} no existe`);
		}

		if (!image) {
			throw new Error(`La imagen con ID ${imageId} no existe`);
		}

		// Añadir la etiqueta a la imagen
		await prisma.image.update({
			where: { id: imageId },
			data: {
				tags: {
					connect: { id: tagId },
				},
			},
		});

		// Revalidar rutas relacionadas
		for (const path of REVALIDATE_PATHS) {
			revalidatePath(path);
		}
		revalidatePath(`/tags/${tagId}`);
		revalidatePath(`/images/${imageId}`);

		logger.info(`Etiqueta ${tagId} añadida correctamente a la imagen ${imageId}`);
	} catch (error) {
		logger.error('Error al añadir etiqueta a la imagen:', error);
		throw new Error(
			`No se pudo añadir la etiqueta a la imagen: ${error instanceof Error ? error.message : String(error)}`
		);
	}
}

/**
 * Elimina una etiqueta de una imagen
 * @param imageId ID de la imagen
 * @param tagId ID de la etiqueta
 */
export async function removeTagFromImage(imageId: string, tagId: string) {
	try {
		logger.info(`Eliminando etiqueta ${tagId} de la imagen ${imageId}`);

		// Verificar que tanto la etiqueta como la imagen existen
		const tag = await prisma.tag.findUnique({
			where: { id: tagId },
		});

		const image = await prisma.image.findUnique({
			where: { id: imageId },
		});

		if (!tag) {
			throw new Error(`La etiqueta con ID ${tagId} no existe`);
		}

		if (!image) {
			throw new Error(`La imagen con ID ${imageId} no existe`);
		}

		// Eliminar la etiqueta de la imagen
		await prisma.image.update({
			where: { id: imageId },
			data: {
				tags: {
					disconnect: { id: tagId },
				},
			},
		});

		// Revalidar rutas relacionadas
		for (const path of REVALIDATE_PATHS) {
			revalidatePath(path);
		}
		revalidatePath(`/tags/${tagId}`);
		revalidatePath(`/images/${imageId}`);

		logger.info(`Etiqueta ${tagId} eliminada correctamente de la imagen ${imageId}`);
	} catch (error) {
		logger.error('Error al eliminar etiqueta de la imagen:', error);
		throw new Error(
			`No se pudo eliminar la etiqueta de la imagen: ${error instanceof Error ? error.message : String(error)}`
		);
	}
}

/**
 * Obtiene todas las etiquetas asociadas a una imagen
 * @param imageId ID de la imagen
 * @returns Lista de etiquetas asociadas a la imagen
 */
export async function getImageTags(imageId: string) {
	try {
		logger.info(`Obteniendo etiquetas para la imagen ${imageId}`);

		// Verificar que la imagen existe
		const image = await prisma.image.findUnique({
			where: { id: imageId },
			include: {
				tags: true,
			},
		});

		if (!image) {
			logger.warn(`No se encontró la imagen con ID ${imageId}`);
			return [];
		}

		// Transformar los datos para devolverlos
		const tagData = image.tags.map((tag) => ({
			id: tag.id,
			name: tag.name,
			color: tag.color || '#888888',
			emoji: tag.emoji || '🏷️',
		}));

		logger.info(`Se encontraron ${tagData.length} etiquetas para la imagen ${imageId}`);
		return tagData;
	} catch (error) {
		logger.error('Error al obtener etiquetas de la imagen:', error);
		// Devolver un array vacío en caso de error
		return [];
	}
}

/**
 * Obtiene todas las imágenes asociadas a una etiqueta
 * @param tagId ID de la etiqueta
 * @returns Lista de imágenes asociadas a la etiqueta
 */
export async function getTagImages(tagId: string) {
	try {
		logger.info(`Obteniendo imágenes para la etiqueta ${tagId}`);

		// Verificar que la etiqueta existe
		const tag = await prisma.tag.findUnique({
			where: { id: tagId },
			include: {
				images: {
					orderBy: { createdAt: 'desc' },
				},
			},
		});

		if (!tag) {
			logger.warn(`No se encontró la etiqueta con ID ${tagId}`);
			return [];
		}

		logger.info(`Se encontraron ${tag.images.length} imágenes para la etiqueta ${tagId}`);
		return tag.images;
	} catch (error) {
		logger.error('Error al obtener imágenes de la etiqueta:', error);
		// Devolver un array vacío en caso de error
		return [];
	}
}
