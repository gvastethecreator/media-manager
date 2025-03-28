'use server';

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';

// Logger específico para acciones de ConceptCard
const conceptCardLogger = serverLogger.withContext('ConceptCardActions');

// Interfaz para las imágenes thumbnail
interface ThumbnailImage {
	id: string;
	name?: string | null;
	thumbnailUrl: string;
	url?: string;
}

/**
 * Obtiene las imágenes recientes de un concepto para mostrar en la tarjeta
 * @param conceptId ID del concepto
 * @param limit Número máximo de imágenes a obtener (por defecto 6)
 * @returns Array de imágenes con sus thumbnails
 */
export async function getRecentConceptImages(conceptId: string, limit = 6): Promise<ThumbnailImage[]> {
	try {
		conceptCardLogger.info('🖼️ Obteniendo imágenes recientes para ConceptCard:', conceptId);

		// Verificar que el ID es válido
		if (!conceptId) {
			throw new Error('ID de concepto no proporcionado');
		}

		// Obtener imágenes recientes del concepto
		const images = await prisma.image.findMany({
			where: {
				concepts: {
					some: {
						id: conceptId,
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

		conceptCardLogger.info('✅ Imágenes obtenidas para ConceptCard:', thumbnails.length);
		return thumbnails;
	} catch (error) {
		conceptCardLogger.error('❌ Error obteniendo imágenes para ConceptCard:', error);
		throw new Error(`No se pudieron obtener las imágenes: ${error instanceof Error ? error.message : 'Error desconocido'}`);
	}
}

/**
 * Obtiene el recuento de elementos relacionados con un concepto
 */
export async function getConceptCounts(conceptId: string): Promise<{
	characters: number;
	places: number;
	worldItems: number;
	notes: number;
	prompts: number;
	images: number;
}> {
	try {
		conceptCardLogger.info('🔢 Obteniendo recuentos para ConceptCard:', conceptId);

		// Verificar que el ID es válido
		if (!conceptId) {
			throw new Error('ID de concepto no proporcionado');
		}

		// Obtener recuentos del concepto
		const counts = await prisma.concept.findUnique({
			where: { id: conceptId },
			select: {
				_count: {
					select: {
						characters: true,
						places: true,
						worldItems: true,
						notes: true,
						prompts: true,
						images: true,
					}
				}
			}
		});

		if (!counts) {
			throw new Error('Concepto no encontrado');
		}

		const result = {
			characters: counts._count.characters,
			places: counts._count.places,
			worldItems: counts._count.worldItems,
			notes: counts._count.notes,
			prompts: counts._count.prompts,
			images: counts._count.images,
		};

		conceptCardLogger.info('✅ Recuentos obtenidos para ConceptCard');
		return result;
	} catch (error) {
		conceptCardLogger.error('❌ Error obteniendo recuentos para ConceptCard:', error);
		return {
			characters: 0,
			places: 0,
			worldItems: 0,
			notes: 0,
			prompts: 0,
			images: 0,
		};
	}
}