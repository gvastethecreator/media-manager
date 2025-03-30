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

		// Obtener imágenes recientes del concepto con optimización de consulta
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
				isFavorite: true,
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
 * @param conceptId ID del concepto
 * @returns Objeto con los recuentos de todas las relaciones
 */
export async function getConceptCounts(conceptId: string): Promise<{
	images: number;
	videos: number;
	albums: number;
	collections: number;
	tags: number;
	characters: number;
	places: number;
	worldItems: number;
	prompts: number;
	notes: number;
	wildcards: number;
	properties: number;
	groups: number;
}> {
	try {
		conceptCardLogger.info('🔢 Obteniendo recuentos para ConceptCard:', conceptId);

		// Verificar que el ID es válido
		if (!conceptId) {
			throw new Error('ID de concepto no proporcionado');
		}

		// Obtener recuentos del concepto con todas las relaciones usando una consulta optimizada
		const counts = await prisma.concept.findUnique({
			where: { id: conceptId },
			select: {
				_count: {
					select: {
						// Contenido multimedia
						images: true,
						videos: true,

						// Entidades organizativas
						albums: true,
						collections: true,
						tags: true,

						// Entidades de mundo
						characters: true,
						places: true,
						worldItems: true,

						// Entidades utilitarias
						prompts: true,
						notes: true,
						wildcards: true,
						properties: true,
						groups: true,
					}
				}
			}
		});

		if (!counts) {
			throw new Error('Concepto no encontrado');
		}

		// Devolver resultado estructurado
		const result = {
			// Contenido multimedia
			images: counts._count.images,
			videos: counts._count.videos,

			// Entidades organizativas
			albums: counts._count.albums,
			collections: counts._count.collections,
			tags: counts._count.tags,

			// Entidades de mundo
			characters: counts._count.characters,
			places: counts._count.places,
			worldItems: counts._count.worldItems,

			// Entidades utilitarias
			prompts: counts._count.prompts,
			notes: counts._count.notes,
			wildcards: counts._count.wildcards,
			properties: counts._count.properties,
			groups: counts._count.groups,
		};

		conceptCardLogger.info('✅ Recuentos obtenidos para ConceptCard');
		return result;
	} catch (error) {
		conceptCardLogger.error('❌ Error obteniendo recuentos para ConceptCard:', error);
		// Devolver objeto con valores por defecto en caso de error
		return {
			images: 0,
			videos: 0,
			albums: 0,
			collections: 0,
			tags: 0,
			characters: 0,
			places: 0,
			worldItems: 0,
			prompts: 0,
			notes: 0,
			wildcards: 0,
			properties: 0,
			groups: 0,
		};
	}
}

/**
 * Obtiene un concepto con todas sus relaciones y contadores para mostrar en la tarjeta
 * @param conceptId ID del concepto a obtener
 * @returns Concepto completo con contadores de relaciones
 */
export async function getConceptWithRelations(conceptId: string) {
	try {
		conceptCardLogger.info('📚 Obteniendo concepto con relaciones:', conceptId);

		// Verificar que el ID es válido
		if (!conceptId) {
			throw new Error('ID de concepto no proporcionado');
		}

		// Obtener el concepto con contadores de relaciones
		const concept = await prisma.concept.findUnique({
			where: { id: conceptId },
			include: {
				_count: {
					select: {
						images: true,
						videos: true,
						albums: true,
						collections: true,
						tags: true,
						characters: true,
						places: true,
						worldItems: true,
						prompts: true,
						notes: true,
						wildcards: true,
						properties: true,
						groups: true,
					}
				}
			}
		});

		if (!concept) {
			throw new Error('Concepto no encontrado');
		}

		// Procesar cualquier campo JSON si es necesario
		const parsedConcept = {
			...concept,
			// Deserializar tags si están almacenados como string JSON
			tags: typeof concept.tags === 'string' && concept.tags
				? JSON.parse(concept.tags)
				: concept.tags || []
		};

		conceptCardLogger.info('✅ Concepto obtenido correctamente');
		return parsedConcept;
	} catch (error) {
		conceptCardLogger.error('❌ Error obteniendo concepto con relaciones:', error);
		throw new Error(`No se pudo obtener el concepto: ${error instanceof Error ? error.message : 'Error desconocido'}`);
	}
}