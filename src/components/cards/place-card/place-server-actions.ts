'use server';

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';

// Logger específico para acciones de PlaceCard
const placeCardLogger = serverLogger.withContext('PlaceCardActions');

// Interfaz para las imágenes thumbnail
interface ThumbnailImage {
	id: string;
	name?: string | null;
	thumbnailUrl: string;
	url?: string;
}

/**
 * Obtiene las imágenes recientes de un lugar para mostrar en la tarjeta
 * @param placeId ID del lugar
 * @param limit Número máximo de imágenes a obtener (por defecto 6)
 * @returns Array de imágenes con sus thumbnails
 */
export async function getRecentPlaceImages(placeId: string, limit = 6): Promise<ThumbnailImage[]> {
	try {
		placeCardLogger.info('🖼️ Obteniendo imágenes recientes para PlaceCard:', placeId);

		// Verificar que el ID es válido
		if (!placeId) {
			throw new Error('ID de lugar no proporcionado');
		}

		// Obtener imágenes recientes del lugar
		const images = await prisma.image.findMany({
			where: {
				places: {
					some: {
						id: placeId,
					},
				},
				thumbnail: { not: null }, // Solo imágenes con thumbnail
			},
			select: {
				id: true,
				name: true,
				thumbnail: true,
				thumbnailWidth: true,
				thumbnailHeight: true,
				thumbnailSize: true,
			},
			orderBy: [
				{ isFavorite: 'desc' },
				{ createdAt: 'desc' },
			],
			take: limit,
		});

		// Convertir los thumbnails a URLs de datos
		const thumbnails: ThumbnailImage[] = images.map(image => {
			let thumbnailUrl = '';

			// Verificar si tenemos un thumbnail válido
			if (image.thumbnail && image.thumbnailSize && image.thumbnailSize < 100000) {
				thumbnailUrl = `data:image/jpeg;base64,${Buffer.from(image.thumbnail).toString('base64')}`;
			}

			return {
				id: image.id,
				name: image.name,
				thumbnailUrl,
				url: `/image/${image.id}`,
			};
		});

		placeCardLogger.info('✅ Imágenes obtenidas para PlaceCard:', thumbnails.length);
		return thumbnails;
	} catch (error) {
		placeCardLogger.error('❌ Error obteniendo imágenes para PlaceCard:', error);
		throw new Error(`No se pudieron obtener las imágenes: ${error instanceof Error ? error.message : 'Error desconocido'}`);
	}
}