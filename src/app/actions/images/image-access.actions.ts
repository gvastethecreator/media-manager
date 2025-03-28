'use server';

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { imageService } from '@/services/image.service';

const imageLogger = serverLogger.withContext('ImageAccess');

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
			return urlCache.get(imageId)!;
		}

		const image = await prisma.image.findUnique({
			where: { id: imageId },
			select: { path: true },
		});

		if (!image) {
			throw new Error('Imagen no encontrada');
		}

		// Generar URL para el endpoint de imágenes
		const imageUrl = `/api/images/${imageId}/content`;

		// Guardar en caché
		urlCache.set(imageId, imageUrl);

		return imageUrl;
	} catch (error) {
		imageLogger.error('Error getting image URL:', error);
		throw new Error('No se pudo obtener la URL de la imagen');
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
			throw new Error('Imagen no encontrada');
		}

		const metadata = image.metadata ? JSON.parse(image.metadata as string) : {};
		const buffer = await imageService.getOriginalImage(imageId);

		return {
			buffer,
			mimeType: metadata.mimeType || 'image/jpeg',
		};
	} catch (error) {
		imageLogger.error('Error obteniendo imagen original', { imageId, error });
		throw new Error('Error al obtener la imagen original');
	}
}
