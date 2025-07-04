/**
 * 🖼️ THUMBNAIL MAPPERS
 *
 * Funciones para mapear y convertir tipos de Thumbnail.
 *
 * @updated 2025-01-27
 */

import { ThumbnailBase, ThumbnailQuality, ThumbnailStatistics, ThumbnailWithStats } from '@/types/entities/thumbnail';

/**
 * Convierte ThumbnailBase a ThumbnailWithStats calculando estadísticas
 */
export function toThumbnailWithStats(thumbnail: ThumbnailBase, usageCount = 0): ThumbnailWithStats {
	const stats: ThumbnailStatistics = {
		aspectRatio: thumbnail.width > 0 ? thumbnail.width / thumbnail.height : 0,
		compressionRatio: calculateCompressionRatio(thumbnail),
		qualityScore: calculateQualityScore(thumbnail),
		usageCount,
		storageEfficiency: calculateStorageEfficiency(thumbnail),
	};

	return {
		...thumbnail,
		stats,
	};
}

/**
 * Calcula el ratio de compresión estimado
 */
function calculateCompressionRatio(thumbnail: ThumbnailBase): number {
	const uncompressedSize = thumbnail.width * thumbnail.height * 4; // RGBA
	return thumbnail.size > 0 ? uncompressedSize / thumbnail.size : 0;
}

/**
 * Calcula un score de calidad basado en resolución y formato
 */
function calculateQualityScore(thumbnail: ThumbnailBase): number {
	const pixelCount = thumbnail.width * thumbnail.height;
	const formatMultiplier = getFormatMultiplier(thumbnail.format);
	const qualityMultiplier = getQualityMultiplier(thumbnail.quality);

	// Normalizar a un score de 0-100
	const baseScore = Math.min(100, (pixelCount / 10000) * 10); // Base en resolución
	return Math.round(baseScore * formatMultiplier * qualityMultiplier);
}

/**
 * Calcula la eficiencia de almacenamiento
 */
function calculateStorageEfficiency(thumbnail: ThumbnailBase): number {
	const qualityScore = calculateQualityScore(thumbnail);
	const sizeKB = thumbnail.size / 1024;

	if (sizeKB === 0) return 0;

	// Ratio calidad/tamaño, normalizado a 0-100
	const efficiency = (qualityScore / sizeKB) * 10;
	return Math.min(100, Math.max(0, efficiency));
}

/**
 * Multiplicador por formato de imagen
 */
function getFormatMultiplier(format: string): number {
	const formatMap: Record<string, number> = {
		webp: 1.2,
		avif: 1.3,
		png: 1.0,
		jpeg: 0.9,
		jpg: 0.9,
		gif: 0.7,
	};

	return formatMap[format.toLowerCase()] || 1.0;
}

/**
 * Multiplicador por calidad
 */
function getQualityMultiplier(quality: ThumbnailQuality): number {
	const qualityMap: Record<ThumbnailQuality, number> = {
		[ThumbnailQuality.LOW]: 0.6,
		[ThumbnailQuality.MEDIUM]: 0.8,
		[ThumbnailQuality.HIGH]: 1.0,
		[ThumbnailQuality.ULTRA]: 1.2,
	};

	return qualityMap[quality] || 0.8;
}
