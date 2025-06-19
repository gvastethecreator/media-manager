/**
 * @file Transformadores para la entidad Thumbnail
 * @module transformers/thumbnail/transformer
 */

import {
    ThumbnailComplete,
    ThumbnailExtended,
    ThumbnailQuality,
    ThumbnailStats,
    ThumbnailWithStats,
} from '@/types/entities/thumbnail';
import { formatBytes, formatDate } from '@/utils/formatters';

interface TransformThumbnailOptions {
	includeMetadata?: boolean;
	baseUrl?: string;
}

/**
 * Transforma un objeto de thumbnail en su versión completa
 */
export function transformThumbnail<T extends Record<string, any>>(
	thumbnail: T,
	options: TransformThumbnailOptions = {}
): ThumbnailComplete {
	// Valores por defecto para las opciones
	const { includeMetadata = true, baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000' } = options;

	// Normalización básica de propiedades
	const id = thumbnail.id || '';
	const sourceId = thumbnail.sourceId || thumbnail.source_id || '';
	const sourceType = thumbnail.sourceType || thumbnail.source_type || '';
	const path = thumbnail.path || '';
	const size = typeof thumbnail.size === 'number' ? thumbnail.size : 0;
	const width = typeof thumbnail.width === 'number' ? thumbnail.width : 0;
	const height = typeof thumbnail.height === 'number' ? thumbnail.height : 0;
	const format = thumbnail.format || '';
	const quality = thumbnail.quality || ThumbnailQuality.MEDIUM;

	// Fechas
	const createdAt =
		thumbnail.createdAt instanceof Date
			? thumbnail.createdAt
			: new Date(thumbnail.createdAt || thumbnail.created_at || Date.now());

	const updatedAt =
		thumbnail.updatedAt instanceof Date
			? thumbnail.updatedAt
			: new Date(thumbnail.updatedAt || thumbnail.updated_at || Date.now());

	// Propiedades opcionales
	const errorMessage = thumbnail.errorMessage || thumbnail.error_message || null;
	const errorTimestamp =
		thumbnail.errorTimestamp instanceof Date
			? thumbnail.errorTimestamp
			: thumbnail.errorTimestamp
				? new Date(thumbnail.errorTimestamp)
				: null;

	const optimizedAt =
		thumbnail.optimizedAt instanceof Date
			? thumbnail.optimizedAt
			: thumbnail.optimizedAt
				? new Date(thumbnail.optimizedAt)
				: null;

	// Metadatos
	let metadata = null;
	if (includeMetadata && thumbnail.metadata) {
		try {
			metadata = typeof thumbnail.metadata === 'string' ? JSON.parse(thumbnail.metadata) : thumbnail.metadata;
		} catch (error) {
			console.error('Error parsing thumbnail metadata:', error);
		}
	}

	// Construir URL
	const url = thumbnail.url || `${baseUrl}/api/thumbnails/${id}`;

	// Conteos
	const _count = thumbnail._count || {};

	return {
		id,
		sourceId,
		sourceType,
		path,
		size,
		width,
		height,
		format,
		quality,
		createdAt,
		updatedAt,
		url,
		metadata,
		errorMessage,
		errorTimestamp,
		optimizedAt,
		_count,
	};
}

/**
 * Transforma un array de thumbnails
 */
export function transformThumbnails<T extends Record<string, any>>(
	thumbnails: T[],
	options?: TransformThumbnailOptions
): ThumbnailComplete[] {
	return thumbnails.map((thumbnail) => transformThumbnail(thumbnail, options));
}

/**
 * Calcula estadísticas para un conjunto de thumbnails
 */
export function calculateThumbnailStats(thumbnails: ThumbnailComplete[]): ThumbnailStats {
	const count = thumbnails.length;

	if (count === 0) {
		return {
			totalSize: 0,
			averageSize: 0,
			averageWidth: 0,
			averageHeight: 0,
			formatsDistribution: {},
			qualityDistribution: {},
			lastGenerated: null,
			optimizationRate: 0,
			errorRate: 0,
		};
	}

	let totalSize = 0;
	let totalWidth = 0;
	let totalHeight = 0;
	const formatsDistribution: Record<string, number> = {};
	const qualityDistribution: Record<string, number> = {};
	let lastGenerated: Date | null = null;
	let optimizedCount = 0;
	let errorCount = 0;

	for (const thumbnail of thumbnails) {
		totalSize += thumbnail.size;
		totalWidth += thumbnail.width;
		totalHeight += thumbnail.height;

		// Formato
		formatsDistribution[thumbnail.format] = (formatsDistribution[thumbnail.format] || 0) + 1;

		// Calidad
		qualityDistribution[thumbnail.quality] = (qualityDistribution[thumbnail.quality] || 0) + 1;

		// Última generación
		if (!lastGenerated || (thumbnail.createdAt && thumbnail.createdAt > lastGenerated)) {
			lastGenerated = thumbnail.createdAt;
		}

		// Optimización y errores
		if (thumbnail.optimizedAt) {
			optimizedCount++;
		}

		if (thumbnail.errorMessage) {
			errorCount++;
		}
	}

	return {
		totalSize,
		averageSize: totalSize / count,
		averageWidth: totalWidth / count,
		averageHeight: totalHeight / count,
		formatsDistribution,
		qualityDistribution,
		lastGenerated,
		optimizationRate: optimizedCount / count,
		errorRate: errorCount / count,
	};
}

/**
 * Transforma un thumbnail en su versión con estadísticas
 */
export function transformThumbnailToWithStats(
	thumbnail: ThumbnailComplete,
	allThumbnails: ThumbnailComplete[]
): ThumbnailWithStats {
	const stats = calculateThumbnailStats(allThumbnails);

	return {
		...thumbnail,
		stats,
	};
}

/**
 * Transforma un thumbnail en su versión extendida para UI
 */
export function transformThumbnailToExtended(thumbnail: ThumbnailComplete): ThumbnailExtended {
	// Formateo para UI
	const formattedSize = formatBytes(thumbnail.size);
	const formattedCreatedAt = formatDate(thumbnail.createdAt);
	const formattedUpdatedAt = formatDate(thumbnail.updatedAt);
	const formattedDimensions = `${thumbnail.width}×${thumbnail.height}`;

	// Estados
	const hasFailed = !!thumbnail.errorMessage;
	const optimizationStatus = hasFailed ? 'error' : thumbnail.optimizedAt ? 'optimized' : 'not-optimized';

	// URLs
	const viewUrl = thumbnail.url;
	const downloadUrl = `${thumbnail.url}?download=true`;

	return {
		...thumbnail,
		formattedSize,
		formattedCreatedAt,
		formattedUpdatedAt,
		formattedDimensions,
		optimizationStatus,
		hasFailed,
		viewUrl,
		downloadUrl,
	};
}
