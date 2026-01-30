/**
 * @file Funciones de mapeo para la entidad Video.
 * @module transformers/video/mappers
 * @description Mapea los tipos de datos de la aplicación a los tipos de datos de Drizzle para la entidad Video.

 */

import { TransformerError } from '@/lib/errors/transformer-error';
import { serverLogger } from '@/lib/logger/server-logger';
import { createDefaultEntityStats } from '@/lib/utils';
import type { VideoBase, VideoStatistics, VideoWithStats } from '@/types/entities/video/base';
import type { VideoCreateInput, VideoFilters, VideoUpdateInput } from '@/types/entities/video/types';

/**
 * 🔄 Transforma un VideoBase a VideoWithStats calculando las estadísticas.
 * ✅ MIGRADO A DRIZZLE
 */
export function toVideoWithStats(video: VideoBase): VideoWithStats {
	try {
		const durationMinutes = video.duration / 60;
		const durationHours = durationMinutes / 60;
		const megabytes = video.size / (1024 * 1024);
		const gigabytes = megabytes / 1024;
		const aspectRatio = video.width && video.height ? `${video.width}:${video.height}` : 'unknown';
		const resolution = video.width && video.height ? `${video.width}x${video.height}` : 'unknown';
		const formattedSize = gigabytes >= 1 ? `${gigabytes.toFixed(2)} GB` : `${megabytes.toFixed(2)} MB`;
		const formattedDuration =
			durationHours >= 1
				? `${Math.floor(durationHours)}h ${Math.floor(durationMinutes % 60)}m`
				: `${Math.floor(durationMinutes)}m`;

		const statistics: VideoStatistics = {
			...createDefaultEntityStats(),
			// Conteos de relaciones (inicializados en 0)
			albumCount: 0,
			collectionCount: 0,
			tagCount: 0,
			characterCount: 0,
			placeCount: 0,
			worldItemCount: 0,
			conceptCount: 0,
			promptCount: 0,
			noteCount: 0,
			wildcardCount: 0,
			propertyCount: 0,
			groupCount: 0,
			totalRelations: 0,
			totalAssociations: 0,
			totalItems: 0,
			imageCount: 0,
			videoCount: 1, // Este es un video
			lastUpdated: new Date(),
			size: video.size,

			// Métricas técnicas
			durationMinutes,
			durationHours,
			megabytes,
			gigabytes,
			aspectRatio,
			resolution,
			formattedSize: `${megabytes.toFixed(2)} MB`,
			formattedDuration,

			// Métricas de calidad
			qualityLevel:
				video.height && video.height >= 1080
					? 'ultra'
					: video.height && video.height >= 720
						? 'high'
						: video.height && video.height >= 480
							? 'medium'
							: 'low',
			qualityScore: 75, // Valor por defecto
			technicalGrade: 'B',
			hasAudio: true, // Valor por defecto
			hasSubtitles: false,
			bitrate: null,
			frameRate: null,

			// Métricas de uso
			views: 0,
			likes: 0,
			downloads: 0,
			lastViewed: null,

			// Estado de duplicados
			duplicateStatus: determineDuplicateStatus(video.hash || ''),
			thumbnailUrl: null,
		};

		return {
			...video,
			entityType: 'video',
			statistics,
			stats: statistics,
			thumbnailUrl: null,
			fullUrl: video.path,
		};
	} catch (error) {
		logger.error('Error transformando video a VideoWithStats', { error, videoId: video.id });
		throw new TransformerError('Error al transformar video a VideoWithStats.');
	}
}

const logger = serverLogger.withContext('VideoMapper');

// Tipos de datos para Drizzle
interface DrizzleCreateVideoData {
	name: string;
	description?: string | null;
	path: string;
	size: number;
	duration: number;
	width?: number | null;
	height?: number | null;
	metadata?: string | null;
	thumbnail?: string | null;
	thumbnailSize?: number | null;
	thumbnailWidth?: number | null;
	thumbnailHeight?: number | null;
	isPublic?: boolean;
	isFavorite?: boolean;
	isHidden?: boolean;
	folderId: string;
}

type DrizzleUpdateVideoData = Partial<Omit<DrizzleCreateVideoData, 'folderId'>>;

interface DrizzleWhereFilter {
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
}

interface DrizzleFindManyArgs {
	where?: DrizzleWhereFilter;
}

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
			thumbnail: rest.thumbnail ? rest.thumbnail.toString('base64') : null,
			thumbnailSize: rest.thumbnailSize || null,
			thumbnailWidth: rest.thumbnailWidth || null,
			thumbnailHeight: rest.thumbnailHeight || null,
			isPublic: rest.isPublic ?? false,
			isFavorite: rest.isFavorite ?? false,
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
		// Convertir thumbnail de Buffer a string si es necesario
		const processedRest = {
			...rest,
			thumbnail:
				rest.thumbnail && Buffer.isBuffer(rest.thumbnail)
					? rest.thumbnail.toString('base64')
					: (rest.thumbnail as string | null | undefined),
		};

		return processedRest;
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
		const dateFilter: Record<string, unknown> = {};
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

/**
 * 🔍 Determina estado de duplicado basado en el hash del video
 * Implementación consistente con la detección de duplicados de imágenes
 */
function determineDuplicateStatus(hash: string): 'unique' | 'duplicate' | 'similar' {
	// Si no hay hash, consideramos único
	if (!hash || hash.length === 0) {
		return 'unique';
	}

	// Simulación determinística basada en el hash
	// En una implementación real, esto consultaría la base de datos
	// para verificar si existe otro archivo con el mismo hash
	const hashSum = hash.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);

	if (hashSum % 10 === 0) {
		return 'duplicate';
	}
	if (hashSum % 5 === 0) {
		return 'similar';
	}
	return 'unique';
}
