/**
 * @file Funciones para datos de tarjetas de grupos (card data)
 * @module services/group/group-card
 */

import { count, eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { groupAlbums, groupImages, groups, groupTags, groupVideos } from '@/lib/drizzle/schema/index';
import { serverLogger } from '@/lib/logger/server-logger';
import { createGroupError, GroupErrorCode } from './group-errors';
import {
	calculateFlexibilityScore,
	calculateGroupPower,
	calculateHealth,
	calculateMana,
	calculateOrganizationLevel,
	calculateRarityLevel,
	determineOrganizationType,
} from './tcg-calculations';

const logger = serverLogger.withContext('GroupCardService');

/**
 * Obtiene las imágenes y videos recientes de un grupo para mostrar en la tarjeta
 */
export async function getRecentGroupMediaService(groupId: string, limit = 6) {
	try {
		// Cargar imágenes recientes (A = groupId, B = imageId)
		const recentImages = await db
			.select()
			.from(groupImages)
			.where(eq(groupImages.A, groupId))
			.limit(Math.ceil(limit / 2));

		// Cargar videos recientes (A = groupId, B = videoId)
		const recentVideos = await db
			.select()
			.from(groupVideos)
			.where(eq(groupVideos.A, groupId))
			.limit(Math.floor(limit / 2));

		// Combinar y formatear los resultados
		const imageResults = recentImages.map((img: (typeof recentImages)[0]) => ({
			id: img.B,
			name: `Image ${img.B}`,
			thumbnailUrl: `/api/images/${img.B}/thumbnail`,
			url: `/api/images/${img.B}/content`,
			isVideo: false,
		}));

		const videoResults = recentVideos.map((video: (typeof recentVideos)[0]) => ({
			id: video.B,
			name: `Video ${video.B}`,
			thumbnailUrl: `/api/videos/${video.B}/thumbnail`,
			url: `/api/videos/${video.B}/content`,
			isVideo: true,
		}));

		// Combinar y ordenar por ID (como proxy de fecha)
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
		const [
			imageCount,
			videoCount,
			albumCount,
			collectionCount,
			tagCount,
			characterCount,
			placeCount,
			worldItemCount,
			conceptCount,
			promptCount,
			noteCount,
			wildcardCount,
			propertyCount,
		] = await Promise.all([
			db
				.select({ count: count() })
				.from(groupImages)
				.where(eq(groupImages.A, groupId))
				.then((res: Array<{ count: number }>) => res[0].count),
			db
				.select({ count: count() })
				.from(groupVideos)
				.where(eq(groupVideos.A, groupId))
				.then((res: Array<{ count: number }>) => res[0].count),
			db
				.select({ count: count() })
				.from(groupAlbums)
				.where(eq(groupAlbums.A, groupId))
				.then((res: Array<{ count: number }>) => res[0].count),
			db
				.select({ count: count() })
				.from(groupTags)
				.where(eq(groupTags.A, groupId))
				.then((res: Array<{ count: number }>) => res[0].count),
			// TODO: Add counts for other relations if they exist in Drizzle schema
			Promise.resolve(0), // Placeholder for collections
			Promise.resolve(0), // Placeholder for characters
			Promise.resolve(0), // Placeholder for places
			Promise.resolve(0), // Placeholder for worldItems
			Promise.resolve(0), // Placeholder for concepts
			Promise.resolve(0), // Placeholder for prompts
			Promise.resolve(0), // Placeholder for notes
			Promise.resolve(0), // Placeholder for wildcards
			Promise.resolve(0), // Placeholder for properties
		]);

		const counts = {
			images: imageCount,
			videos: videoCount,
			albums: albumCount,
			collections: collectionCount,
			tags: tagCount,
			characters: characterCount,
			places: placeCount,
			worldItems: worldItemCount,
			concepts: conceptCount,
			prompts: promptCount,
			notes: noteCount,
			wildcards: wildcardCount,
			properties: propertyCount,
		};

		// Intentar parsear el campo filters si existe
		let filters = [];
		if (typeof groupData.filters === 'string' && groupData.filters !== 'empty_array') {
			try {
				filters = JSON.parse(groupData.filters);
			} catch (e) {
				console.error('Error parsing group filters:', e);
			}
		}

		// Calcular metadatos TCG
		const totalEntities =
			counts.images +
			counts.videos +
			counts.albums +
			counts.collections +
			counts.tags +
			counts.characters +
			counts.places +
			counts.worldItems +
			counts.concepts +
			counts.prompts +
			counts.notes +
			counts.wildcards +
			counts.properties;

		// Determinar nivel de rareza basado en el número de entidades y filtros
		const rarityLevel = calculateRarityLevel(totalEntities, filters.length);

		// Calcular puntos de poder
		const power = calculateGroupPower(groupData, totalEntities, filters.length);

		// Calcular puntos de salud basados en la diversidad de entidades
		const hp = calculateHealth(counts);

		// Calcular puntos de maná (MP) basados en filtros y flexibilidad
		const mp = calculateMana(filters.length, groupData.category);

		// Calcular nivel de organización
		const organizationLevel = calculateOrganizationLevel(counts);

		// Calcular puntaje de flexibilidad
		const flexibilityScore = calculateFlexibilityScore(filters);

		// Determinar tipo de organización
		const organizationType = determineOrganizationType(counts);

		return {
			...groupData,
			recentImages: recentImagePaths,
			recentVideos: recentVideoPaths,
			filters,
			power,
			rarityLevel,
			hp,
			mp,
			organizationLevel,
			flexibilityScore,
			organizationType,
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
