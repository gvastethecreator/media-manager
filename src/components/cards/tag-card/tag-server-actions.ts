'use server';

import { getPrismaClient } from '@/lib/db';
import { serverLogger } from '@/lib/logger/server-logger';
import type { TagWithRelations } from '@/types/entities/tag/types';

// Logger específico para acciones de TagCard
const tagCardLogger = serverLogger.withContext('TagCardActions');

// Interfaz para las imágenes thumbnail
interface ThumbnailImage {
	id: string;
	name?: string | null;
	thumbnailUrl: string;
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
		const prisma = await getPrismaClient();

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
			},
			select: {
				id: true,
				name: true,
				thumbnail: true,
				thumbnailWidth: true,
				thumbnailHeight: true,
			},
			orderBy: [
				{ isFavorite: 'desc' },
				{ createdAt: 'desc' },
			],
			take: limit,
		});

		// Convertir a formato ThumbnailImage
		const thumbnails = images.map(image => ({
			id: image.id,
			name: image.name,
			thumbnailUrl: image.thumbnail ? (typeof image.thumbnail === 'string' ? image.thumbnail : '') : '',
		}));

		tagCardLogger.info('✅ Imágenes obtenidas para TagCard:', thumbnails.length);
		return thumbnails;
	} catch (error) {
		tagCardLogger.error('❌ Error obteniendo imágenes para TagCard:', error);
		throw new Error(`No se pudieron obtener las imágenes: ${error instanceof Error ? error.message : 'Error desconocido'}`);
	}
}

/**
 * Obtiene un tag completo con todas sus relaciones
 * @param tagId ID del tag
 * @returns Tag con relaciones o null si no existe
 */
export async function getTagWithRelations(tagId: string): Promise<TagWithRelations | null> {
	try {
		tagCardLogger.info('🏷️ Obteniendo tag con relaciones:', tagId);
		const prisma = await getPrismaClient();

		// Verificar que el ID es válido
		if (!tagId) {
			throw new Error('ID de tag no proporcionado');
		}

		// Primero obtener el ID de la imagen destacada
		const tagBasic = await prisma.tag.findUnique({
			where: { id: tagId },
			select: {
				featuredImage: true
			}
		});

		if (!tagBasic) {
			tagCardLogger.warn('⚠️ Tag no encontrado:', tagId);
			return null;
		}

		// Obtener tag con contadores de relaciones
		const tag = await prisma.tag.findUnique({
			where: { id: tagId },
			include: {
				_count: {
					select: {
						images: true,
						videos: true,
						albums: true,
						collections: true,
						characters: true,
						places: true,
						worldItems: true,
						concepts: true,
						prompts: true,
						notes: true,
						wildcards: true,
						properties: true,
						groups: true,
					}
				},
				// Incluir imagen destacada si existe
				images: tagBasic.featuredImage ? {
					where: {
						id: {
							equals: tagBasic.featuredImage
						}
					},
					take: 1,
					select: {
						id: true,
						name: true,
						thumbnail: true,
						thumbnailWidth: true,
						thumbnailHeight: true,
					}
				} : undefined
			}
		});

		if (!tag) {
			tagCardLogger.warn('⚠️ Tag no encontrado (segunda verificación):', tagId);
			return null;
		}

		// Procesar la imagen destacada si existe
		let featuredImageData = null;
		if (tag.images && tag.images.length > 0 && tag.images[0].thumbnail) {
			const image = tag.images[0];
			featuredImageData = {
				id: image.id,
				name: image.name,
				thumbnailUrl: image.thumbnail ? (typeof image.thumbnail === 'string' ?
					image.thumbnail :
					`data:image/jpeg;base64,${Buffer.from(image.thumbnail as unknown as Uint8Array).toString('base64')}`) : '',
				width: image.thumbnailWidth || 100,
				height: image.thumbnailHeight || 100,
			};
		}

		// Crear objeto TagWithRelations simplificado
		const tagWithRelations = {
			...tag,
			featuredImage: featuredImageData,
		} as unknown as TagWithRelations;

		tagCardLogger.info('✅ Tag obtenido con éxito:', tag.name);
		return tagWithRelations;
	} catch (error) {
		tagCardLogger.error('❌ Error obteniendo tag con relaciones:', error);
		throw new Error(`No se pudo obtener el tag: ${error instanceof Error ? error.message : 'Error desconocido'}`);
	}
}

/**
 * Busca tags con filtros
 * @param query Texto para buscar en nombres y descripción
 * @param limit Límite de resultados
 * @returns Array de tags
 */
export async function searchTags(query = '', limit = 100): Promise<TagWithRelations[]> {
	try {
		tagCardLogger.info('🔍 Buscando tags con query:', query);
		const prisma = await getPrismaClient();

		const tags = await prisma.tag.findMany({
			where: {
				OR: [
					{ name: { contains: query } },
					{ description: { contains: query } },
					{ category: { contains: query } },
				]
			},
			include: {
				_count: {
					select: {
						images: true,
						videos: true,
						albums: true,
						collections: true,
						characters: true,
						places: true,
						worldItems: true,
						concepts: true,
						prompts: true,
						notes: true,
						wildcards: true,
						properties: true,
						groups: true,
					}
				}
			},
			orderBy: [
				{ isFavorite: 'desc' },
				{ name: 'asc' },
			],
			take: limit,
		});

		const tagsWithRelations = tags as unknown as TagWithRelations[];

		tagCardLogger.info('✅ Tags encontrados:', tags.length);
		return tagsWithRelations;
	} catch (error) {
		tagCardLogger.error('❌ Error buscando tags:', error);
		throw new Error(`No se pudieron buscar tags: ${error instanceof Error ? error.message : 'Error desconocido'}`);
	}
}
