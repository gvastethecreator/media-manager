'use server';

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';

const logger = serverLogger.withContext('album-images.actions');

/**
 * Obtiene las imágenes más recientes de un álbum para mostrar en las tarjetas.
 * @param albumId ID del álbum
 * @param limit Número máximo de imágenes a devolver (por defecto 6)
 * @returns Lista de imágenes con ID y URL de miniatura
 */
export async function getRecentAlbumImages(albumId: string, limit = 6) {
	try {
		logger.info(`Obteniendo ${limit} imágenes recientes para el álbum ${albumId}`);

		// Buscar imágenes del álbum a través de la relación many-to-many
		const albumWithImages = await prisma.album.findUnique({
			where: {
				id: albumId,
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

		if (!albumWithImages) {
			logger.warn(`No se encontró el álbum con ID ${albumId}`);
			return [];
		}

		// Transformar los datos para devolverlos
		const imageData = albumWithImages.images.map(image => {
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

		logger.info(`Se encontraron ${imageData.length} imágenes recientes en el álbum ${albumId}`);
		return imageData;
	} catch (error) {
		logger.error('Error al obtener imágenes recientes del álbum:', error);
		// Devolver un array vacío en caso de error
		return [];
	}
}