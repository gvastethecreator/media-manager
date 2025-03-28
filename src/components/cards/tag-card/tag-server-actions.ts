'use server';

import { prisma } from '@/lib/prisma';
import { serverLogger } from '@/lib/logger/server-logger';

// Logger específico para acciones de TagCard
const tagCardLogger = serverLogger.withContext('TagCardActions');

// Interfaz para las imágenes thumbnail
interface ThumbnailImage {
	id: string;
	name?: string | null;
	thumbnailUrl: string;
	url?: string;
}

/**
 * Obtiene las imágenes recientes de un tag para mostrar en la tarjeta
 * @param tagId ID del tag
 * @param limit Número máximo de imágenes a obtener (por defecto 6)
 * @returns Array de imágenes con sus thumbnails
 */
export async function getRecentTagImages(tagId: string, limit = 6): Promise<ThumbnailImage[]> {
	try {
		tagCardLogger.info('🖼️ Obteniendo imágenes recientes para TagCard:', tagId);

		// Verificar que el ID es válido
		if (!tagId) {
			throw new Error('ID de tag no proporcionado');
		}

		// Obtener imágenes recientes del tag
		const images = await prisma.image.findMany({
			where: {
				tags: {
					some: {
						id: tagId,
					},
				},
				status: 'READY', // Solo imágenes procesadas y listas
			},
			select: {
				id: true,
				name: true,
				thumbnailUrl: true,
				url: true,
			},
			orderBy: [
				{ isFavorite: 'desc' },
				{ createdAt: 'desc' },
			],
			take: limit,
		});

		// Convertir a formato ThumbnailImage
		const thumbnails: ThumbnailImage[] = images.map(image => ({
			id: image.id,
			name: image.name,
			thumbnailUrl: image.thumbnailUrl ?? '',
			url: image.url,
		}));

		tagCardLogger.info('✅ Imágenes obtenidas para TagCard:', thumbnails.length);
		return thumbnails;
	} catch (error) {
		tagCardLogger.error('❌ Error obteniendo imágenes para TagCard:', error);
		throw new Error(`No se pudieron obtener las imágenes: ${error instanceof Error ? error.message : 'Error desconocido'}`);
	}
}
