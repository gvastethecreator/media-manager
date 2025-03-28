'use server';

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';

// Logger específico para acciones de AlbumCard
const albumCardLogger = serverLogger.withContext('AlbumCardActions');

// Interfaz para las imágenes thumbnail
interface ThumbnailImage {
	id: string;
	name?: string | null;
	thumbnailUrl: string;
	url?: string;
}

/**
 * Obtiene las imágenes recientes de un álbum para mostrar en la tarjeta
 * @param albumId ID del álbum
 * @param limit Número máximo de imágenes a obtener (por defecto 6)
 * @returns Array de imágenes con sus thumbnails
 */
export async function getRecentAlbumImages(albumId: string, limit = 6): Promise<ThumbnailImage[]> {
	try {
		albumCardLogger.info('🖼️ Obteniendo imágenes recientes para AlbumCard:', albumId);

		// Verificar que el ID es válido
		if (!albumId) {
			throw new Error('ID de álbum no proporcionado');
		}

		// Obtener imágenes recientes del álbum
		const images = await prisma.image.findMany({
			where: {
				albums: {
					some: {
						id: albumId,
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

		albumCardLogger.info('✅ Imágenes obtenidas para AlbumCard:', thumbnails.length);
		return thumbnails;
	} catch (error) {
		albumCardLogger.error('❌ Error obteniendo imágenes para AlbumCard:', error);
		throw new Error(`No se pudieron obtener las imágenes: ${error instanceof Error ? error.message : 'Error desconocido'}`);
	}
}

/**
 * Obtiene las estadísticas de un álbum
 * @param albumId ID del álbum
 * @returns Estadísticas del álbum
 */
export async function getAlbumStats(albumId: string): Promise<{ imageCount: number; totalSize: number }> {
	try {
		albumCardLogger.info('📊 Obteniendo estadísticas para AlbumCard:', albumId);

		// Verificar que el ID es válido
		if (!albumId) {
			throw new Error('ID de álbum no proporcionado');
		}

		// Contar las imágenes del álbum
		const imageCount = await prisma.image.count({
			where: {
				albums: {
					some: {
						id: albumId,
					},
				},
			},
		});

		// Obtener el tamaño total de las imágenes del álbum
		const images = await prisma.image.findMany({
			where: {
				albums: {
					some: {
						id: albumId,
					},
				},
			},
			select: {
				size: true,
			},
		});

		const totalSize = images.reduce((total, image) => total + (image.size || 0), 0);

		albumCardLogger.info('✅ Estadísticas obtenidas para AlbumCard');
		return { imageCount, totalSize };
	} catch (error) {
		albumCardLogger.error('❌ Error obteniendo estadísticas para AlbumCard:', error);
		throw new Error(`No se pudieron obtener las estadísticas: ${error instanceof Error ? error.message : 'Error desconocido'}`);
	}
}