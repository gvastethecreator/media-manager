/**
 * @file Funciones para gestionar medios (imágenes/videos) de grupos
 * @module services/group/media
 */

import { count, eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { groupAlbums, groupImages, groups, groupTags, groupVideos } from '@/lib/drizzle/schema/index';
import { serverLogger } from '@/lib/logger/server-logger';
import { GroupErrorCode, createGroupError } from '../types/group-service.types';

const logger = serverLogger.withContext('GroupService');

/**
 * 📸 Obtiene todas las imágenes de un grupo con filtros
 */
export async function getGroupImages(
	groupId: string,
	filters: {
		limit: number;
		offset: number;
		sortBy: 'name' | 'createdAt' | 'updatedAt';
		sortOrder: 'asc' | 'desc';
	}
) {
	try {
		const { limit, offset } = filters;

		// Obtener imágenes del grupo
		const imageRelations = await db
			.select({ imageId: groupImages.B })
			.from(groupImages)
			.where(eq(groupImages.A, groupId))
			.limit(limit)
			.offset(offset);

		// Contar total de imágenes
		const totalResult = await db.select({ count: count() }).from(groupImages).where(eq(groupImages.A, groupId));

		const total = totalResult[0]?.count || 0;

		logger.info('Imágenes de grupo obtenidas', {
			groupId,
			count: imageRelations.length,
			total,
			filters,
		});

		return {
			images: imageRelations.map((rel: { imageId: string }) => ({ id: rel.imageId })),
			total,
		};
	} catch (error) {
		logger.error('Error obteniendo imágenes de grupo', {
			groupId,
			filters,
			error,
		});
		throw createGroupError(`Error al obtener imágenes del grupo: ${(error as Error).message}`);
	}
}

/**
 * Obtiene las imágenes y videos recientes de un grupo para mostrar en la tarjeta
 */
export async function getRecentGroupMediaService(groupId: string, limit = 6) {
	try {
		const recentImages = await db
			.select()
			.from(groupImages)
			.where(eq(groupImages.A, groupId))
			.limit(Math.ceil(limit / 2));

		const recentVideos = await db
			.select()
			.from(groupVideos)
			.where(eq(groupVideos.A, groupId))
			.limit(Math.floor(limit / 2));

		const imageResults = recentImages.map((img: (typeof recentImages)[0]) => ({
			id: img.B, // B es el imageId
			name: `Image ${img.B}`,
			thumbnailUrl: `/api/images/${img.B}/thumbnail`,
			url: `/api/images/${img.B}/content`,
			isVideo: false,
		}));

		const videoResults = recentVideos.map((video: (typeof recentVideos)[0]) => ({
			id: video.B, // B es el videoId
			name: `Video ${video.B}`,
			thumbnailUrl: `/api/videos/${video.B}/thumbnail`,
			url: `/api/videos/${video.B}/content`,
			isVideo: true,
		}));

		return [...imageResults, ...videoResults].sort((a, b) => (a.id > b.id ? -1 : 1)).slice(0, limit);
	} catch (error) {
		logger.error('Error al obtener medios recientes del grupo', { error, groupId });
		throw createGroupError(
			`Error al obtener medios recientes: ${error instanceof Error ? error.message : String(error)}`,
			GroupErrorCode.OPERATION_FAILED,
			error
		);
	}
}

/**
 * Obtiene los datos de un grupo para mostrar en una tarjeta
 */
export async function getGroupCardDataService(groupId: string) {
	try {
		const group = await db.select().from(groups).where(eq(groups.id, groupId)).limit(1);

		if (group.length === 0) {
			throw createGroupError(`Grupo no encontrado: ${groupId}`, GroupErrorCode.NOT_FOUND);
		}

		const groupData = group[0];

		// Obtener imágenes y videos recientes
		const recentMedia = await getRecentGroupMediaService(groupData.id, 6);
		const recentImagePaths = recentMedia
			.filter((media: (typeof recentMedia)[0]) => !media.isVideo)
			.map((media: (typeof recentMedia)[0]) => media.thumbnailUrl);
		const recentVideoPaths = recentMedia
			.filter((media: (typeof recentMedia)[0]) => media.isVideo)
			.map((media: (typeof recentMedia)[0]) => media.thumbnailUrl);

		// Contar entidades relacionadas (usando Drizzle)
		const [imageCount, videoCount, albumCount, tagCount] = await Promise.all([
			db
				.select({ c: count() })
				.from(groupImages)
				.where(eq(groupImages.A, groupId))
				.then((r: { c: number }[]) => r[0]?.c || 0),
			db
				.select({ c: count() })
				.from(groupVideos)
				.where(eq(groupVideos.A, groupId))
				.then((r: { c: number }[]) => r[0]?.c || 0),
			db
				.select({ c: count() })
				.from(groupAlbums)
				.where(eq(groupAlbums.A, groupId))
				.then((r: { c: number }[]) => r[0]?.c || 0),
			db
				.select({ c: count() })
				.from(groupTags)
				.where(eq(groupTags.A, groupId))
				.then((r: { c: number }[]) => r[0]?.c || 0),
		]);

		const counts = {
			images: imageCount,
			videos: videoCount,
			albums: albumCount,
			collections: 0,
			tags: tagCount,
			characters: 0,
			places: 0,
			worldItems: 0,
			concepts: 0,
			prompts: 0,
			notes: 0,
			wildcards: 0,
			properties: 0,
		};

		// Parse filters (placeholder - en schema es string JSON)
		let parsedFilters: unknown[] = [];
		if (typeof groupData.filters === 'string' && groupData.filters && groupData.filters !== 'empty_array') {
			try {
				parsedFilters = JSON.parse(groupData.filters);
			} catch {
				parsedFilters = [];
			}
		}

		return {
			...groupData,
			recentImages: recentImagePaths,
			recentVideos: recentVideoPaths,
			counts,
			filters: parsedFilters,
			cardId: `G-${groupData.id.substring(0, 8)}`,
		};
	} catch (error) {
		logger.error('Error al obtener datos de la tarjeta del grupo', { error, groupId });
		throw createGroupError(
			`Error al obtener datos de la tarjeta: ${error instanceof Error ? error.message : String(error)}`,
			GroupErrorCode.OPERATION_FAILED,
			error
		);
	}
}
