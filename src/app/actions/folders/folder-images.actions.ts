'use server';

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';

const logger = serverLogger.withContext('folder-images.actions');

/**
 * Obtiene las imágenes más recientes de una carpeta para mostrar en las tarjetas.
 * @param folderId ID de la carpeta
 * @param limit Número máximo de imágenes a devolver (por defecto 6)
 * @returns Lista de imágenes con ID y URL de miniatura
 */
export async function getRecentFolderImages(folderId: string, limit = 6) {
	try {
		logger.info(`Obteniendo ${limit} imágenes recientes para la carpeta ${folderId}`);

		// Buscar imágenes de la carpeta
		const images = await prisma.image.findMany({
			where: {
				folderId: folderId,
			},
			select: {
				id: true,
				name: true,
				path: true,
				thumbnail: true,
				thumbnailSize: true,
			},
			orderBy: {
				createdAt: 'desc',
			},
			take: limit,
		});

		// Transformar los datos para devolverlos
		const imageData = images.map(image => {
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

		logger.info(`Se encontraron ${imageData.length} imágenes recientes`);
		return imageData;
	} catch (error) {
		logger.error('Error al obtener imágenes recientes:', error);
		// Devolver un array vacío en caso de error
		return [];
	}
}