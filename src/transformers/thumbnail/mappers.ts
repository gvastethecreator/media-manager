/**
 * 🖼️ THUMBNAIL MAPPERS
 *
 * Funciones para mapear y convertir tipos de Thumbnail.
 *
 * @updated 2025-01-27
 */

import { createDefaultEntityStats } from '@/lib/utils';
import type { ThumbnailBase, ThumbnailStatistics, ThumbnailWithStats } from '../../types/entities/thumbnail';

/**
 * Convierte ThumbnailBase a ThumbnailWithStats calculando estadísticas
 */
export function toThumbnailWithStats(thumbnail: ThumbnailBase, usageCount = 0): ThumbnailWithStats {
	const aspectRatio = thumbnail.width > 0 && thumbnail.height > 0 ? thumbnail.width / thumbnail.height : 0;
	const compressionRatio = thumbnail.size > 0 ? (thumbnail.width * thumbnail.height) / thumbnail.size : 0;
	const qualityScore = calculateQualityScore(thumbnail);
	const storageEfficiency = calculateStorageEfficiency(thumbnail);

	const stats: ThumbnailStatistics = {
		...createDefaultEntityStats({
			size: thumbnail.size,
			type: 'image',
		}),
		aspectRatio,
		compressionRatio,
		qualityScore,
		usageCount,
		storageEfficiency,
		isDirectory: false,
		isFile: true,
	};

	return {
		...thumbnail,
		stats,
	};
}

/**
 * Calcula un score de calidad basado en las propiedades del thumbnail
 */
function calculateQualityScore(thumbnail: ThumbnailBase): number {
	let score = 50; // Base score

	// Bonus por resolución
	if (thumbnail.width >= 300 && thumbnail.height >= 300) {
		score += 20;
	} else if (thumbnail.width >= 150 && thumbnail.height >= 150) {
		score += 10;
	}

	// Bonus por formato
	if (thumbnail.format === 'webp') {
		score += 15;
	} else if (thumbnail.format === 'png') {
		score += 10;
	} else if (thumbnail.format === 'jpg' || thumbnail.format === 'jpeg') {
		score += 5;
	}

	return Math.min(100, Math.max(0, score));
}

/**
 * Calcula la eficiencia de almacenamiento
 */
function calculateStorageEfficiency(thumbnail: ThumbnailBase): number {
	if (thumbnail.size <= 0 || thumbnail.width <= 0 || thumbnail.height <= 0) {
		return 0;
	}

	const pixels = thumbnail.width * thumbnail.height;
	const bytesPerPixel = thumbnail.size / pixels;

	// Eficiencia basada en bytes por pixel (menor es mejor)
	if (bytesPerPixel < 1) {
		return 100;
	}
	if (bytesPerPixel < 2) {
		return 80;
	}
	if (bytesPerPixel < 3) {
		return 60;
	}
	if (bytesPerPixel < 4) {
		return 40;
	}
	return 20;
}
