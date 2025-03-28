'use server';

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';

interface ThumbnailImage {
	id: string;
	name?: string | null;
	thumbnailUrl: string;
	url?: string;
}

/**
 * Obtiene las imágenes más recientes de una colección para mostrar en la tarjeta
 * @param collectionId ID de la colección
 * @returns Array de imágenes recientes (máximo 6)
 */
export async function getRecentCollectionImages(collectionId: string): Promise<ThumbnailImage[]> {
	try {
		serverLogger.info(`Fetching recent images for collection ${collectionId}`);

		// Consultar imágenes de la colección ordenadas por fecha de creación descendente
		const images = await prisma.image.findMany({
			where: {
				collections: {
					some: {
						id: collectionId,
					},
				},
			},
			orderBy: {
				createdAt: 'desc',
			},
			take: 6, // Tomar sólo las 6 más recientes para mostrar en la tarjeta
			select: {
				id: true,
				name: true,
				thumbnailUrl: true,
				thumbnail: true,
				path: true,
			},
		});

		// Transformar los datos para asegurar que las URLs de miniaturas sean correctas
		const imageData = images.map(image => {
			// Verificar y construir la URL correcta para la miniatura
			let thumbnailUrl = '';

			// Prioridad: 1. thumbnailUrl si existe
			if (image.thumbnailUrl) {
				thumbnailUrl = image.thumbnailUrl;
			}
			// 2. Construir URL de API basada en thumbnail si existe
			else if (image.thumbnail) {
				thumbnailUrl = `/api/images/${image.id}/thumbnail`;
			}
			// 3. Usar URL completa de la imagen si existe
			else if (image.url) {
				thumbnailUrl = image.url;
			}
			// 4. Placeholder como último recurso
			else {
				thumbnailUrl = `/api/images/${image.id}/placeholder`;
			}

			return {
				id: image.id,
				name: image.name,
				thumbnailUrl,
			};
		});

		serverLogger.info(`Found ${imageData.length} recent images for collection ${collectionId}`);
		return imageData;
	} catch (error) {
		serverLogger.error(`Error fetching recent images for collection ${collectionId}:`, error);
		// Devolvemos array vacío en caso de error en lugar de lanzar una excepción
		return [];
	}
}