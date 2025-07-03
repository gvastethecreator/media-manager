/**
 * @file Funciones de mapeo para la entidad Video.
 * @module transformers/video/mappers
 * @description Mapea los tipos de datos de la aplicación a los tipos de datos de Prisma para la entidad Video.
 */

import type { Prisma } from '@prisma/client';
import { serverLogger } from '@/lib/logger/server-logger';
import { TransformerError } from '@/lib/utils/transformers/errors';
import type { VideoCreateInput, VideoFilters, VideoUpdateInput } from '@/types/entities/video/types';

const logger = serverLogger.withContext('VideoMapper');

/**
 * 🔄 Mapea un `VideoCreateInput` a un `Prisma.VideoCreateInput`.
 */
export function mapCreateVideoDataToPrisma(input: VideoCreateInput): Prisma.VideoCreateInput {
	try {
		const {
			albumIds,
			collectionIds,
			tagIds,
			characterIds,
			placeIds,
			worldItemIds,
			conceptIds,
			promptIds,
			noteIds,
			wildcardIds,
			propertyIds,
			groupIds,
			...rest
		} = input;

		const prismaData: Prisma.VideoCreateInput = {
			...rest,
			metadata: rest.metadata || null,
			thumbnail: rest.thumbnail || null,
			thumbnailSize: rest.thumbnailSize || null,
			thumbnailWidth: rest.thumbnailWidth || null,
			thumbnailHeight: rest.thumbnailHeight || null,
			isPublic: rest.isPublic || false,
			isFavorite: rest.isFavorite || false,
			folder: { connect: { id: input.folderId } },
		};

		if (albumIds) prismaData.albums = { connect: albumIds.map((id) => ({ id })) };
		if (collectionIds) prismaData.collections = { connect: collectionIds.map((id) => ({ id })) };
		if (tagIds) prismaData.tags = { connect: tagIds.map((id) => ({ id })) };
		if (characterIds) prismaData.characters = { connect: characterIds.map((id) => ({ id })) };
		if (placeIds) prismaData.places = { connect: placeIds.map((id) => ({ id })) };
		if (worldItemIds) prismaData.worldItems = { connect: worldItemIds.map((id) => ({ id })) };
		if (conceptIds) prismaData.concepts = { connect: conceptIds.map((id) => ({ id })) };
		if (promptIds) prismaData.prompts = { connect: promptIds.map((id) => ({ id })) };
		if (noteIds) prismaData.notes = { connect: noteIds.map((id) => ({ id })) };
		if (wildcardIds) prismaData.wildcards = { connect: wildcardIds.map((id) => ({ id })) };
		if (propertyIds) prismaData.properties = { connect: propertyIds.map((id) => ({ id })) };
		if (groupIds) prismaData.groups = { connect: groupIds.map((id) => ({ id })) };

		return prismaData;
	} catch (error) {
		logger.error('Error mapeando datos de creación de video', { error, input });
		throw new TransformerError('Error al mapear datos de creación de video.');
	}
}

/**
 * 🔄 Mapea un `VideoUpdateInput` a un `Prisma.VideoUpdateInput`.
 */
export function mapUpdateVideoDataToPrisma(input: VideoUpdateInput): Prisma.VideoUpdateInput {
	try {
		const {
			albumIds,
			collectionIds,
			tagIds,
			characterIds,
			placeIds,
			worldItemIds,
			conceptIds,
			promptIds,
			noteIds,
			wildcardIds,
			propertyIds,
			groupIds,
			...rest
		} = input;
		const updateData: Prisma.VideoUpdateInput = rest;

		if (albumIds) updateData.albums = { set: albumIds.map((id) => ({ id })) };
		if (collectionIds) updateData.collections = { set: collectionIds.map((id) => ({ id })) };
		if (tagIds) updateData.tags = { set: tagIds.map((id) => ({ id })) };
		if (characterIds) updateData.characters = { set: characterIds.map((id) => ({ id })) };
		if (placeIds) updateData.places = { set: placeIds.map((id) => ({ id })) };
		if (worldItemIds) updateData.worldItems = { set: worldItemIds.map((id) => ({ id })) };
		if (conceptIds) updateData.concepts = { set: conceptIds.map((id) => ({ id })) };
		if (promptIds) updateData.prompts = { set: promptIds.map((id) => ({ id })) };
		if (noteIds) updateData.notes = { set: noteIds.map((id) => ({ id })) };
		if (wildcardIds) updateData.wildcards = { set: wildcardIds.map((id) => ({ id })) };
		if (propertyIds) updateData.properties = { set: propertyIds.map((id) => ({ id })) };
		if (groupIds) updateData.groups = { set: groupIds.map((id) => ({ id })) };

		return updateData;
	} catch (error) {
		logger.error('Error mapeando datos de actualización de video', { error, input });
		throw new TransformerError('Error al mapear datos de actualización de video.');
	}
}

/**
 * 🔄 Mapea filtros de video a argumentos de búsqueda de Prisma.
 */
export function mapVideoFiltersToPrismaArgs(filters: VideoFilters): Prisma.VideoFindManyArgs {
	return {
		where: mapVideoFiltersToPrisma(filters),
	};
}

/**
 * 🔄 Mapea `VideoFilters` a `Prisma.VideoWhereInput`.
 */
function mapVideoFiltersToPrisma(filters: VideoFilters): Prisma.VideoWhereInput {
	const where: Prisma.VideoWhereInput = {};

	if (filters.search) {
		where.OR = [{ name: { contains: filters.search } }, { description: { contains: filters.search } }];
	}

	if (filters.isFavorite !== undefined) {
		where.isFavorite = filters.isFavorite;
	}

	if (filters.folders?.length) {
		where.folderId = { in: filters.folders };
	}

	if (filters.tags?.length) {
		where.tags = { some: { id: { in: filters.tags } } };
	}

	if (filters.dateRange) {
		const dateFilter: any = {};
		if (filters.dateRange.start) {
			dateFilter.gte = filters.dateRange.start;
		}
		if (filters.dateRange.end) {
			dateFilter.lte = filters.dateRange.end;
		}
		if (Object.keys(dateFilter).length > 0) {
			where.createdAt = dateFilter;
		}
	}

	if (filters.minDuration !== undefined || filters.maxDuration !== undefined) {
		where.duration = {};
		if (filters.minDuration !== undefined) {
			where.duration.gte = filters.minDuration;
		}
		if (filters.maxDuration !== undefined) {
			where.duration.lte = filters.maxDuration;
		}
	}

	if (filters.minWidth !== undefined || filters.maxWidth !== undefined) {
		where.width = {};
		if (filters.minWidth !== undefined) {
			where.width.gte = filters.minWidth;
		}
		if (filters.maxWidth !== undefined) {
			where.width.lte = filters.maxWidth;
		}
	}

	if (filters.minHeight !== undefined || filters.maxHeight !== undefined) {
		where.height = {};
		if (filters.minHeight !== undefined) {
			where.height.gte = filters.minHeight;
		}
		if (filters.maxHeight !== undefined) {
			where.height.lte = filters.maxHeight;
		}
	}

	if (filters.minSize !== undefined || filters.maxSize !== undefined) {
		where.size = {};
		if (filters.minSize !== undefined) {
			where.size.gte = filters.minSize;
		}
		if (filters.maxSize !== undefined) {
			where.size.lte = filters.maxSize;
		}
	}

	if (filters.hasMetadata !== undefined) {
		where.metadata = filters.hasMetadata ? { not: null } : null;
	}

	if (filters.hasThumbnail !== undefined) {
		where.thumbnail = filters.hasThumbnail ? { not: null } : null;
	}

	return where;
}
