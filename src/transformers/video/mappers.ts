/**
 * @file Funciones de mapeo para la entidad Video.
 * @module transformers/video/mappers
 * @description Mapea los tipos de datos de la aplicación a los tipos de datos de Drizzle para la entidad Video.
 
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { TransformerError } from '@/lib/utils/transformers/errors';
import type { VideoCreateInput, VideoFilters, VideoUpdateInput } from '@/types/entities/video/types';

const logger = serverLogger.withContext('VideoMapper');

// Tipos locales equivalentes a Prisma (migración a Drizzle)
type DrizzleCreateVideoData = {
	name: string;
	description?: string | null;
	path: string;
	size: number;
	duration: number;
	width: number;
	height: number;
	metadata?: string | null;
	thumbnail?: string | null;
	thumbnailSize?: number | null;
	thumbnailWidth?: number | null;
	thumbnailHeight?: number | null;
	isPublic: boolean;
	isFavorite: boolean;
	folderId: string;
};

type DrizzleUpdateVideoData = Partial<Omit<DrizzleCreateVideoData, 'folderId'>>;

type DrizzleWhereFilter = {
	AND?: DrizzleWhereFilter[];
	OR?: DrizzleWhereFilter[];
	name?: { contains?: string; equals?: string };
	description?: { contains?: string; equals?: string };
	isFavorite?: boolean;
	folderId?: { in?: string[] };
	createdAt?: { gte?: Date; lte?: Date };
	duration?: { gte?: number; lte?: number };
	width?: { gte?: number; lte?: number };
	height?: { gte?: number; lte?: number };
	size?: { gte?: number; lte?: number };
	metadata?: { not?: null } | null;
	thumbnail?: { not?: null } | null;
};

type DrizzleFindManyArgs = {
	where?: DrizzleWhereFilter;
};

/**
 * 🔄 Mapea un `VideoCreateInput` a datos de creación de Drizzle.
 * ✅ MIGRADO A DRIZZLE
 */
export function mapCreateVideoDataToDrizzle(input: VideoCreateInput): DrizzleCreateVideoData {
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

		const drizzleData: DrizzleCreateVideoData = {
			...rest,
			metadata: rest.metadata || null,
			thumbnail: rest.thumbnail || null,
			thumbnailSize: rest.thumbnailSize || null,
			thumbnailWidth: rest.thumbnailWidth || null,
			thumbnailHeight: rest.thumbnailHeight || null,
			isPublic: rest.isPublic || false,
			isFavorite: rest.isFavorite || false,
			folderId: input.folderId,
		};

		// Las relaciones se manejan por separado en Drizzle con junction tables
		return drizzleData;
	} catch (error) {
		logger.error('Error mapeando datos de creación de video', { error, input });
		throw new TransformerError('Error al mapear datos de creación de video.');
	}
}

/**
 * 🔄 Mapea un `VideoUpdateInput` a datos de actualización de Drizzle.
 * ✅ MIGRADO A DRIZZLE
 */
export function mapUpdateVideoDataToDrizzle(input: VideoUpdateInput): DrizzleUpdateVideoData {
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

		// Las relaciones se manejan por separado en Drizzle con junction tables
		return rest;
	} catch (error) {
		logger.error('Error mapeando datos de actualización de video', { error, input });
		throw new TransformerError('Error al mapear datos de actualización de video.');
	}
}

/**
 * 🔄 Mapea filtros de video a argumentos de búsqueda de Drizzle.
 * ✅ MIGRADO A DRIZZLE
 */
export function mapVideoFiltersToDrizzleArgs(filters: VideoFilters): DrizzleFindManyArgs {
	return {
		where: mapVideoFiltersToDrizzle(filters),
	};
}

/**
 * 🔄 Mapea `VideoFilters` a filtros de Drizzle.
 * ✅ MIGRADO A DRIZZLE
 */
function mapVideoFiltersToDrizzle(filters: VideoFilters): DrizzleWhereFilter {
	const where: DrizzleWhereFilter = {};

	if (filters.search) {
		where.OR = [{ name: { contains: filters.search } }, { description: { contains: filters.search } }];
	}

	if (filters.isFavorite !== undefined) {
		where.isFavorite = filters.isFavorite;
	}

	if (filters.folders?.length) {
		where.folderId = { in: filters.folders };
	}

	// Las relaciones con tags se manejan con joins separados en Drizzle

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

// Mantener funciones legacy para compatibilidad (DEPRECATED)
/**
 * @deprecated Usar mapCreateVideoDataToDrizzle
 */
export const mapCreateVideoDataToPrisma = mapCreateVideoDataToDrizzle;

/**
 * @deprecated Usar mapUpdateVideoDataToDrizzle
 */
export const mapUpdateVideoDataToPrisma = mapUpdateVideoDataToDrizzle;

/**
 * @deprecated Usar mapVideoFiltersToDrizzleArgs
 */

