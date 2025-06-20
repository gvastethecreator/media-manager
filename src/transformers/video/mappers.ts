/**
 * @file Funciones de mapeo para la entidad Video.
 * @module transformers/video/mappers
 * @description Mapea los tipos de datos de la aplicación a un formato compatible con la base de datos para la entidad Video.
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type {
  CreateVideoData,
  UpdateVideoData,
  VideoFilters,
} from '@/types/entities/video';
import { TransformerError } from '@/utils/transformers/errors';

const logger = serverLogger.withContext('VideoMapper');

/**
 * 🔄 Mapea `CreateVideoData` a un objeto compatible con la BD.
 */
export function mapCreateVideoDataToPrisma(input: CreateVideoData): Record<string, any> {
	try {
		return {
			name: input.name,
			path: input.path,
			hash: input.hash,
			size: input.size,
			duration: input.duration,
			width: input.width || null,
			height: input.height || null,
			description: input.description || null,
			metadata: input.metadata || null,
			thumbnail: null,
			thumbnailSize: null,
			thumbnailWidth: null,
			thumbnailHeight: null,
			isPublic: false,
			isFavorite: false,
			folder: { connect: { id: input.folderId } },
		};
	} catch (error) {
		logger.error('Error mapeando datos de creación de video', { error, input });
		throw new TransformerError('Error al mapear datos de creación de video.');
	}
}

/**
 * 🔄 Mapea `UpdateVideoData` para actualizar en la BD.
 */
export function mapUpdateVideoDataToPrisma(input: UpdateVideoData): Record<string, any> {
        try {
                const updateData: Record<string, any> = {};

		if (input.name !== undefined) updateData.name = input.name;
		if (input.description !== undefined) updateData.description = input.description;
		if (input.isFavorite !== undefined) updateData.isFavorite = input.isFavorite;
		if (input.isPublic !== undefined) updateData.isPublic = input.isPublic;

		return updateData;
	} catch (error) {
		logger.error('Error mapeando datos de actualización de video', { error, input });
		throw new TransformerError('Error al mapear datos de actualización de video.');
	}
}

/**
 * 🔄 Mapea filtros de video a argumentos de búsqueda genéricos.
 */
export function mapVideoFiltersToPrismaArgs(filters: VideoFilters): Record<string, any> {
	return {
		where: mapVideoFiltersToPrisma(filters),
	};
}

/**
 * 🔄 Convierte `VideoFilters` en condiciones de búsqueda.
 */
function mapVideoFiltersToPrisma(filters: VideoFilters): Record<string, any> {
        const where: Record<string, any> = {};

	if (filters.search) {
		where.OR = [
			{ name: { contains: filters.search } },
			{ description: { contains: filters.search } },
		];
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
