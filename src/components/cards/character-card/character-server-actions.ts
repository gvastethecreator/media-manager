'use server';

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';

// Logger específico para acciones de CharacterCard
const characterCardLogger = serverLogger.withContext('CharacterCardActions');

// Interfaz para las imágenes thumbnail
interface ThumbnailImage {
	id: string;
	name?: string | null;
	thumbnailUrl: string;
	url?: string;
}

/**
 * Obtiene las imágenes recientes de un personaje para mostrar en la tarjeta
 * @param characterId ID del personaje
 * @param limit Número máximo de imágenes a obtener (por defecto 6)
 * @returns Array de imágenes con sus thumbnails
 */
export async function getRecentCharacterImages(characterId: string, limit = 6): Promise<ThumbnailImage[]> {
	try {
		characterCardLogger.info('🖼️ Obteniendo imágenes recientes para CharacterCard:', characterId);

		// Verificar que el ID es válido
		if (!characterId) {
			throw new Error('ID de personaje no proporcionado');
		}

		// Obtener imágenes recientes del personaje
		const images = await prisma.image.findMany({
			where: {
				characters: {
					some: {
						id: characterId,
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

		characterCardLogger.info('✅ Imágenes obtenidas para CharacterCard:', thumbnails.length);
		return thumbnails;
	} catch (error) {
		characterCardLogger.error('❌ Error obteniendo imágenes para CharacterCard:', error);
		throw new Error(`No se pudieron obtener las imágenes: ${error instanceof Error ? error.message : 'Error desconocido'}`);
	}
}