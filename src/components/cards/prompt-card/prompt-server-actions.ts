'use server';

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';

// Logger específico para acciones de PromptCard
const promptCardLogger = serverLogger.withContext('PromptCardActions');

// Interfaz para las imágenes thumbnail
interface ThumbnailImage {
	id: string;
	name?: string | null;
	thumbnailUrl: string;
	url?: string;
}

/**
 * Obtiene las imágenes recientes de un prompt para mostrar en la tarjeta
 * @param promptId ID del prompt
 * @param limit Número máximo de imágenes a obtener (por defecto 6)
 * @returns Array de imágenes con sus thumbnails
 */
export async function getRecentPromptImages(promptId: string, limit = 6): Promise<ThumbnailImage[]> {
	try {
		promptCardLogger.info('🖼️ Obteniendo imágenes recientes para PromptCard:', promptId);

		// Verificar que el ID es válido
		if (!promptId) {
			throw new Error('ID de prompt no proporcionado');
		}

		// Obtener imágenes recientes del prompt
		const images = await prisma.image.findMany({
			where: {
				prompts: {
					some: {
						id: promptId,
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

		promptCardLogger.info('✅ Imágenes obtenidas para PromptCard:', thumbnails.length);
		return thumbnails;
	} catch (error) {
		promptCardLogger.error('❌ Error obteniendo imágenes para PromptCard:', error);
		throw new Error(`No se pudieron obtener las imágenes: ${error instanceof Error ? error.message : 'Error desconocido'}`);
	}
}

/**
 * Obtiene el recuento de elementos relacionados con un prompt
 */
export async function getPromptCounts(promptId: string): Promise<{
	characters: number;
	places: number;
	worldItems: number;
	concepts: number;
	notes: number;
	images: number;
}> {
	try {
		promptCardLogger.info('🔢 Obteniendo recuentos para PromptCard:', promptId);

		// Verificar que el ID es válido
		if (!promptId) {
			throw new Error('ID de prompt no proporcionado');
		}

		// Obtener recuentos del prompt
		const counts = await prisma.prompt.findUnique({
			where: { id: promptId },
			select: {
				_count: {
					select: {
						characters: true,
						places: true,
						worldItems: true,
						concepts: true,
						notes: true,
						images: true,
					}
				}
			}
		});

		if (!counts) {
			throw new Error('Prompt no encontrado');
		}

		const result = {
			characters: counts._count.characters,
			places: counts._count.places,
			worldItems: counts._count.worldItems,
			concepts: counts._count.concepts,
			notes: counts._count.notes,
			images: counts._count.images,
		};

		promptCardLogger.info('✅ Recuentos obtenidos para PromptCard');
		return result;
	} catch (error) {
		promptCardLogger.error('❌ Error obteniendo recuentos para PromptCard:', error);
		return {
			characters: 0,
			places: 0,
			worldItems: 0,
			concepts: 0,
			notes: 0,
			images: 0,
		};
	}
}