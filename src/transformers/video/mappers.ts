/**
 * @file Funciones de mapeo para la entidad Video.
 * @module transformers/video/mappers
 * @description Mapea los tipos de datos de la aplicación a los tipos de datos de Prisma para la entidad Video.
 */

import type { Prisma } from '@prisma/client';
import { serverLogger } from '@/lib/logger/server-logger';
import type { VideoCreateInput, VideoFilters, VideoSearchOptions, VideoUpdateInput } from '@/types/entities/video';
import { TransformerError } from '@/utils/transformers/errors';

const logger = serverLogger.withContext('VideoMapper');

/**
 * 🔄 Mapea un `VideoCreateInput` a un `Prisma.VideoCreateInput`.
 */
export function mapCreateVideoDataToPrisma(input: VideoCreateInput): Prisma.VideoCreateInput {
	try {
		const { folderId, albumIds, collectionIds, tagIds, ...rest } = input;
		return {
			...rest,
			folder: { connect: { id: folderId } },
			albums: albumIds ? { connect: albumIds.map((id) => ({ id })) } : undefined,
			collections: collectionIds ? { connect: collectionIds.map((id) => ({ id })) } : undefined,
			tags: tagIds ? { connect: tagIds.map((id) => ({ id })) } : undefined,
		};
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
		const { folderId, albumIds, collectionIds, tagIds, ...rest } = input;
		return {
			...rest,
			folder: folderId ? { connect: { id: folderId } } : undefined,
			albums: albumIds ? { set: albumIds.map((id) => ({ id })) } : undefined,
			collections: collectionIds ? { set: collectionIds.map((id) => ({ id })) } : undefined,
			tags: tagIds ? { set: tagIds.map((id) => ({ id })) } : undefined,
		};
	} catch (error) {
		logger.error('Error mapeando datos de actualización de video', { error, input });
		throw new TransformerError('Error al mapear datos de actualización de video.');
	}
}

/**
 * 🔄 Mapea `VideoSearchOptions` a `Prisma.VideoFindManyArgs`.
 */
export function mapVideoSearchOptionsToPrisma(options: VideoSearchOptions): Prisma.VideoFindManyArgs {
	const { filters, ...rest } = options;
	return {
		...rest,
		where: filters ? mapVideoFiltersToPrisma(filters) : undefined,
	};
}

/**
 * 🔄 Mapea `VideoFilters` a `Prisma.VideoWhereInput`.
 */
function mapVideoFiltersToPrisma(filters: VideoFilters): Prisma.VideoWhereInput {
	const where: Prisma.VideoWhereInput = {};

	if (filters.search) {
		where.OR = [
			{ name: { contains: filters.search } },
			{ description: { contains: filters.search } },
		];
	}
	if (filters.isFavorite !== undefined) {
		where.isFavorite = filters.isFavorite;
	}
	if (filters.folderId) {
		where.folderId = filters.folderId;
	}
	if (filters.tagIds?.length) {
		where.tags = { some: { id: { in: filters.tagIds } } };
	}
	if (filters.albumIds?.length) {
		where.albums = { some: { id: { in: filters.albumIds } } };
	}
	if (filters.collectionIds?.length) {
		where.collections = { some: { id: { in: filters.collectionIds } } };
	}
	if (filters.duration) {
		where.duration = {
			gte: filters.duration.min,
			lte: filters.duration.max,
		};
	}
	if (filters.size) {
		where.size = {
			gte: filters.size.min,
			lte: filters.size.max,
		};
	}

	return where;
}
