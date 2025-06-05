/**
 * @file Punto de entrada para transformadores de video
 * @module transformers/video
 * @description Proporciona funciones para transformar y validar datos de videos
 */

export * from './mappers';
export * from './serializers';

// Alias para funciones comunes
import {
	mapCreateVideoDataToPrisma,
	mapUpdateVideoDataToPrisma,
	mapVideoFiltersToPrisma,
	mapVideoSearchOptionsToPrisma,
	mapVideoToRelatedVideo,
} from './mappers';
import {
	extendVideo,
	extendVideos,
	fromPrismaVideo,
	handleTransformerError,
	toPrismaVideo,
	validateVideo,
} from './serializers';

/**
 * 🎬 Transforma un video con estadísticas adicionales
 * @param video Video base a transformar
 * @param options Opciones de transformación opcionales
 * @returns Video con estadísticas adicionales
 */
export function transformVideoWithStats(
	video: Record<string, any>,
	options: { safe?: boolean; defaultValue?: any } = {}
): any {
	try {
		if (!video) {
			throw new Error('Video no válido para transformación con estadísticas');
		}

		// Transformar el video básico primero
		const transformedVideo = extendVideo(video);

		// Añadir estadísticas calculadas
		const videoWithStats = {
			...transformedVideo,
			stats: {
				// Aquí calcularíamos estadísticas reales basadas en los datos del video
				aspectRatio: calculateAspectRatio(transformedVideo.width, transformedVideo.height),
				resolution: calculateResolution(transformedVideo.width, transformedVideo.height),
				durationFormatted: formatDuration(transformedVideo.duration),
				sizeFormatted: formatSize(transformedVideo.size),
				bitrate: calculateBitrate(transformedVideo.size, transformedVideo.duration),
				thumbnailAvailable: !!transformedVideo.thumbnail || !!transformedVideo.thumbnailUrl,
				ageInDays: calculateAgeInDays(transformedVideo.createdAt),
				viewCount: transformedVideo._count?.views || 0,
			},
		};

		return videoWithStats;
	} catch (error) {
		return handleTransformerError(
			error,
			'Error transformando video con estadísticas',
			options.defaultValue,
			options.safe ?? false
		);
	}
}

/**
 * 🎬 Transforma múltiples videos con estadísticas
 * @param videos Array de videos a transformar
 * @param options Opciones de transformación
 * @returns Array de videos con estadísticas o array vacío en caso de error
 */
export function transformVideosWithStats(
	videos: Record<string, any>[],
	options: { safe?: boolean; defaultValue?: any[] } = {}
): any[] {
	try {
		if (!Array.isArray(videos)) {
			throw new Error('Se esperaba un array de videos para transformación');
		}

		return videos.map((video) => transformVideoWithStats(video, { safe: true, defaultValue: null })).filter(Boolean);
	} catch (error) {
		return handleTransformerError(
			error,
			'Error transformando múltiples videos con estadísticas',
			options.defaultValue || [],
			options.safe ?? false
		);
	}
}

// Funciones auxiliares para cálculos estadísticos
function calculateAspectRatio(width: number, height: number): string {
	if (!width || !height) return 'Desconocido';

	const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
	const divisor = gcd(width, height);
	return `${width / divisor}:${height / divisor}`;
}

function calculateResolution(width: number, height: number): string {
	if (!width || !height) return 'Desconocido';

	if (width >= 7680) return '8K';
	if (width >= 3840) return '4K';
	if (width >= 1920) return 'FullHD';
	if (width >= 1280) return 'HD';
	if (width >= 720) return 'HD Ready';
	return 'SD';
}

function formatDuration(seconds: number): string {
	if (!seconds) return '00:00';

	const hrs = Math.floor(seconds / 3600);
	const mins = Math.floor((seconds % 3600) / 60);
	const secs = Math.floor(seconds % 60);

	return [hrs > 0 ? String(hrs).padStart(2, '0') : null, String(mins).padStart(2, '0'), String(secs).padStart(2, '0')]
		.filter(Boolean)
		.join(':');
}

function formatSize(bytes: number): string {
	if (!bytes) return '0 B';

	const k = 1024;
	const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

function calculateBitrate(bytes: number, seconds: number): string {
	if (!bytes || !seconds) return 'Desconocido';

	const bitsPerSecond = (bytes * 8) / seconds;

	if (bitsPerSecond >= 1000000) {
		return `${(bitsPerSecond / 1000000).toFixed(2)} Mbps`;
	}

	if (bitsPerSecond >= 1000) {
		return `${(bitsPerSecond / 1000).toFixed(2)} Kbps`;
	}

	return `${Math.round(bitsPerSecond)} bps`;
}

function calculateAgeInDays(createdAt: Date): number {
	if (!createdAt) return 0;

	const created = new Date(createdAt);
	const now = new Date();
	const diffTime = Math.abs(now.getTime() - created.getTime());
	return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * 🎬 Transforma un video desde cualquier formato a formato interno
 * @param video Video a transformar
 * @param options Opciones de transformación
 * @returns Video transformado o valor por defecto en caso de error
 */
export function transformVideo(
	video: Record<string, any> | null | undefined,
	options: { safe?: boolean; defaultValue?: any } = {}
): any {
	try {
		if (!video) {
			throw new Error('Video no válido para transformación');
		}
		return fromPrismaVideo(video);
	} catch (error) {
		return handleTransformerError(error, 'Error transformando video', options.defaultValue, options.safe ?? false);
	}
}

/**
 * 🎬 Transforma múltiples videos
 * @param videos Array de videos a transformar
 * @param options Opciones de transformación
 * @returns Array de videos transformados o array vacío en caso de error
 */
export function transformVideos(
	videos: Record<string, any>[] | null | undefined,
	options: { safe?: boolean; defaultValue?: any[] } = {}
): any[] {
	try {
		if (!videos || !Array.isArray(videos)) {
			throw new Error('Se esperaba un array de videos para transformación');
		}

		return extendVideos(videos);
	} catch (error) {
		return handleTransformerError(
			error,
			'Error transformando múltiples videos',
			options.defaultValue || [],
			options.safe ?? false
		);
	}
}

// Exportaciones por defecto
export default {
	// Serializers
	fromPrisma: fromPrismaVideo,
	toPrisma: toPrismaVideo,
	validate: validateVideo,
	extend: extendVideo,
	extendMany: extendVideos,
	withStats: transformVideoWithStats,
	transformMany: transformVideos,
	transformManyWithStats: transformVideosWithStats,

	// Mappers
	mapCreateData: mapCreateVideoDataToPrisma,
	mapUpdateData: mapUpdateVideoDataToPrisma,
	mapSearchOptions: mapVideoSearchOptionsToPrisma,
	mapFilters: mapVideoFiltersToPrisma,
	mapToRelated: mapVideoToRelatedVideo,

	// Error handling
	handleError: handleTransformerError,
};

// Re-exportar funciones para uso directo
export {
	extendVideo,
	extendVideos,
	fromPrismaVideo,
	handleTransformerError,
	mapCreateVideoDataToPrisma,
	mapUpdateVideoDataToPrisma,
	mapVideoFiltersToPrisma,
	mapVideoSearchOptionsToPrisma,
	mapVideoToRelatedVideo,
	toPrismaVideo,
	validateVideo,
};
