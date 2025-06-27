'use server';

import { getPrismaClient } from '@/lib/database/db';
import { serverLogger } from '@/lib/logger/server-logger';
import type { TagWithStats } from '@/types/entities/tag';

// Logger específico para acciones de TagCard
const tagCardLogger = serverLogger.withContext('TagCardActions');

// Interfaz para las imágenes thumbnail
interface ThumbnailImage {
	id: string;
	name?: string | null;
	thumbnailUrl: string;
}

/**
 * 🖼️ Obtiene imágenes thumbnail para un tag específico
 * @param tagId - ID del tag
 * @param limit - Número máximo de imágenes a obtener
 * @returns Array de imágenes thumbnail
 */
export async function getTagThumbnails(tagId: string, limit = 6): Promise<ThumbnailImage[]> {
	try {
		tagCardLogger.info('🔍 Obteniendo thumbnails para tag:', { tagId, limit });

		const prisma = getPrismaClient();

		// Obtener imágenes asociadas al tag con información mínima
		const images = await prisma.image.findMany({
			where: {
				tags: {
					some: { id: tagId },
				},
			},
			select: {
				id: true,
				name: true,
				thumbnailUrl: true,
			},
			orderBy: { createdAt: 'desc' },
			take: limit,
		});

		const thumbnails = images.map((image) => ({
			id: image.id,
			name: image.name,
			thumbnailUrl: image.thumbnailUrl,
		}));

		tagCardLogger.info('✅ Thumbnails obtenidos:', { tagId, count: thumbnails.length });
		return thumbnails;
	} catch (error) {
		tagCardLogger.error('❌ Error obteniendo thumbnails:', { tagId, error });
		return [];
	}
}

/**
 * 📊 Obtiene estadísticas detalladas de un tag
 * @param tagId - ID del tag
 * @returns Estadísticas del tag
 */
export async function getTagStats(tagId: string) {
	try {
		tagCardLogger.info('📊 Obteniendo estadísticas para tag:', tagId);

		const prisma = getPrismaClient();

		// Obtener conteos de todas las relaciones
		const stats = await prisma.tag.findUnique({
			where: { id: tagId },
			select: {
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
					},
				},
			},
		});

		if (!stats) {
			tagCardLogger.warn('⚠️ Tag no encontrado para estadísticas:', tagId);
			return null;
		}

		const totalAssociations = Object.values(stats._count).reduce((sum, count) => sum + count, 0);

		tagCardLogger.info('✅ Estadísticas obtenidas:', { tagId, totalAssociations });
		return {
			...stats._count,
			totalAssociations,
		};
	} catch (error) {
		tagCardLogger.error('❌ Error obteniendo estadísticas:', { tagId, error });
		return null;
	}
}

/**
 * 🏷️ Obtiene un tag con estadísticas calculadas
 * @param tagId - ID del tag
 * @returns Tag con estadísticas o null si no existe
 */
export async function getTagWithStats(tagId: string): Promise<TagWithStats | null> {
	try {
		tagCardLogger.info('🔍 Obteniendo tag con estadísticas:', tagId);

		const prisma = getPrismaClient();

		const tag = await prisma.tag.findUnique({
			where: { id: tagId },
			select: {
				id: true,
				name: true,
				emoji: true,
				color: true,
				description: true,
				shortcut: true,
				category: true,
				featuredImage: true,
				isFavorite: true,
				createdAt: true,
				updatedAt: true,
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
					},
				},
			},
		});

		if (!tag) {
			tagCardLogger.warn('⚠️ Tag no encontrado:', tagId);
			return null;
		}

		// Calcular estadísticas
		const totalImages = tag._count.images;
		const totalVideos = tag._count.videos;
		const totalAssociations = Object.values(tag._count).reduce((sum, count) => sum + count, 0);
		const totalEntities = totalAssociations - totalImages - totalVideos;

		// Crear objeto TagWithStats
		const tagWithStats: TagWithStats = {
			...tag,
			stats: {
				totalAssociations,
				totalImages,
				totalVideos,
				totalEntities,
				lastUpdated: tag.updatedAt,
			},
		};

		tagCardLogger.info('✅ Tag con estadísticas obtenido:', { tagId, totalAssociations });
		return tagWithStats;
	} catch (error) {
		tagCardLogger.error('❌ Error obteniendo tag con estadísticas:', { tagId, error });
		return null;
	}
}

/**
 * 🔍 Busca tags con estadísticas básicas
 * @param query - Término de búsqueda
 * @param limit - Número máximo de resultados
 * @returns Array de tags con estadísticas
 */
export async function searchTags(query = '', limit = 100): Promise<TagWithStats[]> {
	try {
		tagCardLogger.info('🔍 Buscando tags:', { query, limit });

		const prisma = getPrismaClient();

		const tags = await prisma.tag.findMany({
			where: query
				? {
						OR: [
							{ name: { contains: query, mode: 'insensitive' } },
							{ description: { contains: query, mode: 'insensitive' } },
						],
					}
				: {},
			select: {
				id: true,
				name: true,
				emoji: true,
				color: true,
				description: true,
				shortcut: true,
				category: true,
				featuredImage: true,
				isFavorite: true,
				createdAt: true,
				updatedAt: true,
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
					},
				},
			},
			orderBy: [{ isFavorite: 'desc' }, { name: 'asc' }],
			take: limit,
		});

		// Convertir a TagWithStats
		const tagsWithStats = tags.map((tag) => {
			const totalImages = tag._count.images;
			const totalVideos = tag._count.videos;
			const totalAssociations = Object.values(tag._count).reduce((sum, count) => sum + count, 0);
			const totalEntities = totalAssociations - totalImages - totalVideos;

			return {
				...tag,
				stats: {
					totalAssociations,
					totalImages,
					totalVideos,
					totalEntities,
					lastUpdated: tag.updatedAt,
				},
			} as TagWithStats;
		});

		tagCardLogger.info('✅ Tags encontrados:', { query, count: tagsWithStats.length });
		return tagsWithStats;
	} catch (error) {
		tagCardLogger.error('❌ Error buscando tags:', { query, error });
		return [];
	}
}
