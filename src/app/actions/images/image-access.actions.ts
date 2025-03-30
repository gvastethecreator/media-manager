'use server';

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { imageService } from '@/services/image.service';
import {
    createEntityNotFoundError,
    toServiceError,
} from '@/utils/errors/service-errors';

const SERVER_ACTION_NAME = 'ImageAccess';
const imageLogger = serverLogger.withContext(SERVER_ACTION_NAME);

// Caché de URLs para evitar llamadas redundantes
const urlCache = new Map<string, string>();

/**
 * Obtiene la URL para acceder a una imagen
 * No usamos AbortSignal como parámetro directo ya que causa problemas en server actions
 */
export async function getImageUrl(imageId: string): Promise<string> {
	try {
		// Verificar si ya tenemos la URL en caché
		if (urlCache.has(imageId)) {
			const cachedUrl = urlCache.get(imageId);
			if (cachedUrl) {
				return cachedUrl;
			}
		}

		const image = await prisma.image.findUnique({
			where: { id: imageId },
			select: { path: true },
		});

		if (!image) {
			throw createEntityNotFoundError('Imagen', imageId, SERVER_ACTION_NAME);
		}

		// Generar URL para el endpoint de imágenes
		const imageUrl = `/api/images/${imageId}/content`;

		// Guardar en caché
		urlCache.set(imageId, imageUrl);

		return imageUrl;
	} catch (error) {
		throw toServiceError(error, {
			serviceName: SERVER_ACTION_NAME,
			message: 'No se pudo obtener la URL de la imagen',
		});
	}
}

/**
 * Obtiene el buffer original de una imagen
 */
export async function getOriginalImage(imageId: string): Promise<{ buffer: Buffer; mimeType: string }> {
	try {
		const image = await prisma.image.findUnique({
			where: { id: imageId },
			select: {
				path: true,
				metadata: true,
			},
		});

		if (!image) {
			throw createEntityNotFoundError('Imagen', imageId, SERVER_ACTION_NAME);
		}

		const metadata = image.metadata ? JSON.parse(image.metadata as string) : {};

		try {
			const buffer = await imageService.getOriginalImage(imageId);

			return {
				buffer,
				mimeType: metadata.mimeType || 'image/jpeg',
			};
		} catch (serviceError) {
			// Transformar error del servicio y lanzarlo
			throw toServiceError(serviceError, {
				serviceName: SERVER_ACTION_NAME,
				message: 'Error al procesar la imagen original',
			});
		}
	} catch (error) {
		throw toServiceError(error, {
			serviceName: SERVER_ACTION_NAME,
			message: 'Error al obtener la imagen original',
		});
	}
}
