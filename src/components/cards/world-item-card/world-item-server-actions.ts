'use server';

import { getPrismaClient } from '@/lib/db';
import { serverLogger } from '@/lib/logger/server-logger';
import type { WorldItemWithRelations } from '@/types/entities/world-item/types';

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
		const prisma = await getPrismaClient();

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
			orderBy: [{ isFavorite: 'desc' }, { createdAt: 'desc' }],
			take: limit,
		});

		// Convertir los thumbnails a URLs de datos
		const thumbnails: ThumbnailImage[] = images.map((image) => {
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
		throw new Error(
			`No se pudieron obtener las imágenes: ${error instanceof Error ? error.message : 'Error desconocido'}`
		);
	}
}

/**
 * Obtiene un objeto del mundo completo con todas sus relaciones y contadores
 * @param worldItemId ID del objeto del mundo
 * @returns Objeto del mundo con relaciones o null si no existe
 */
export async function getWorldItemWithRelations(worldItemId: string): Promise<WorldItemWithRelations | null> {
	try {
		worldItemCardLogger.info('🎯 Obteniendo objeto del mundo con relaciones:', worldItemId);
		const prisma = await getPrismaClient();

		// Verificar que el ID es válido
		if (!worldItemId) {
			throw new Error('ID de objeto no proporcionado');
		}

		// Primero obtener el ID de la imagen destacada
		const worldItemBasic = await prisma.worldItem.findUnique({
			where: { id: worldItemId },
			select: {
				featuredImage: true,
			},
		});

		if (!worldItemBasic) {
			worldItemCardLogger.warn('⚠️ Objeto del mundo no encontrado:', worldItemId);
			return null;
		}

		// Obtener objeto con contadores de relaciones
		const worldItem = await prisma.worldItem.findUnique({
			where: { id: worldItemId },
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
						concepts: true,
						prompts: true,
						notes: true,
						wildcards: true,
						properties: true,
						groups: true,
					},
				},
				// Incluir imagen destacada si existe
				images: worldItemBasic.featuredImage
					? {
							where: {
								id: {
									equals: worldItemBasic.featuredImage,
								},
							},
							take: 1,
							select: {
								id: true,
								name: true,
								thumbnail: true,
								thumbnailWidth: true,
								thumbnailHeight: true,
							},
						}
					: undefined,
			},
		});

		if (!worldItem) {
			worldItemCardLogger.warn('⚠️ Objeto del mundo no encontrado (segunda verificación):', worldItemId);
			return null;
		}

		// Procesar la imagen destacada si existe
		let featuredImageData = null;
		if (worldItem.images && worldItem.images.length > 0) {
			const image = worldItem.images[0];
			if (image.thumbnail) {
				featuredImageData = {
					id: image.id,
					name: image.name,
					thumbnailUrl: `data:image/jpeg;base64,${Buffer.from(image.thumbnail).toString('base64')}`,
					width: image.thumbnailWidth || 100,
					height: image.thumbnailHeight || 100,
				};
			}
		}

		// Convertir y extender el objeto con datos adicionales
		const worldItemWithRelations = {
			...worldItem,
			featuredImage: featuredImageData,
			// Parsear campos JSON si existen como strings
			attributes:
				typeof worldItem.attributes === 'string' && worldItem.attributes
					? JSON.parse(worldItem.attributes)
					: worldItem.attributes,
			effects:
				typeof worldItem.effects === 'string' && worldItem.effects ? JSON.parse(worldItem.effects) : worldItem.effects,
			requirements:
				typeof worldItem.requirements === 'string' && worldItem.requirements
					? JSON.parse(worldItem.requirements)
					: worldItem.requirements,
			stats: typeof worldItem.stats === 'string' && worldItem.stats ? JSON.parse(worldItem.stats) : worldItem.stats,
		} as unknown as WorldItemWithRelations;

		worldItemCardLogger.info('✅ Objeto del mundo obtenido con éxito:', worldItem.name);
		return worldItemWithRelations;
	} catch (error) {
		worldItemCardLogger.error('❌ Error obteniendo objeto del mundo con relaciones:', error);
		throw new Error(
			`No se pudo obtener el objeto del mundo: ${error instanceof Error ? error.message : 'Error desconocido'}`
		);
	}
}

/**
 * Busca objetos del mundo con filtros
 * @param query Texto para buscar en nombres y descripción
 * @param limit Límite de resultados
 * @returns Array de objetos del mundo
 */
export async function searchWorldItems(query = '', limit = 100): Promise<WorldItemWithRelations[]> {
	try {
		worldItemCardLogger.info('🔍 Buscando objetos del mundo con query:', query);
		const prisma = await getPrismaClient();

		const worldItems = await prisma.worldItem.findMany({
			where: {
				OR: [
					{ name: { contains: query } },
					{ description: { contains: query } },
					{ type: { contains: query } },
					{ category: { contains: query } },
				],
			},
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
						concepts: true,
						prompts: true,
						notes: true,
						wildcards: true,
						properties: true,
						groups: true,
					},
				},
			},
			orderBy: [{ isFavorite: 'desc' }, { name: 'asc' }],
			take: limit,
		});

		// Procesar cada objeto para manejar campos JSON
		const worldItemsWithRelations = worldItems.map((item) => ({
			...item,
			attributes:
				typeof item.attributes === 'string' && item.attributes ? JSON.parse(item.attributes) : item.attributes,
			effects: typeof item.effects === 'string' && item.effects ? JSON.parse(item.effects) : item.effects,
			requirements:
				typeof item.requirements === 'string' && item.requirements ? JSON.parse(item.requirements) : item.requirements,
			stats: typeof item.stats === 'string' && item.stats ? JSON.parse(item.stats) : item.stats,
		})) as unknown as WorldItemWithRelations[];

		worldItemCardLogger.info('✅ Objetos del mundo encontrados:', worldItems.length);
		return worldItemsWithRelations;
	} catch (error) {
		worldItemCardLogger.error('❌ Error buscando objetos del mundo:', error);
		throw new Error(
			`No se pudieron buscar objetos del mundo: ${error instanceof Error ? error.message : 'Error desconocido'}`
		);
	}
}
