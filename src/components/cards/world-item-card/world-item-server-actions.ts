'use server';

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';

// Logger específico para acciones de WorldItemCard
const worldItemCardLogger = serverLogger.withContext('WorldItemCardActions');

// Interfaz para las imágenes thumbnail
interface ThumbnailImage {
	id: string;
	name?: string | null;
	thumbnailUrl: string;
	url?: string;
}

/**
 * Obtiene las imágenes recientes de un objeto del mundo para mostrar en la tarjeta
 * @param worldItemId ID del objeto del mundo
 * @param limit Número máximo de imágenes a obtener (por defecto 6)
 * @returns Array de imágenes con sus thumbnails
 */
export async function getRecentWorldItemImages(worldItemId: string, limit = 6): Promise<ThumbnailImage[]> {
	try {
		worldItemCardLogger.info('🖼️ Obteniendo imágenes recientes para WorldItemCard:', worldItemId);

		// Verificar que el ID es válido
		if (!worldItemId) {
			throw new Error('ID de objeto no proporcionado');
		}

		// Obtener imágenes recientes del objeto
		const images = await prisma.image.findMany({
			where: {
				worldItems: {
					some: {
						id: worldItemId,
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

		worldItemCardLogger.info('✅ Imágenes obtenidas para WorldItemCard:', thumbnails.length);
		return thumbnails;
	} catch (error) {
		worldItemCardLogger.error('❌ Error obteniendo imágenes para WorldItemCard:', error);
		throw new Error(`No se pudieron obtener las imágenes: ${error instanceof Error ? error.message : 'Error desconocido'}`);
	}
}