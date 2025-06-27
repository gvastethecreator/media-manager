/**
 * @file Transformer optimizado para la entidad Video
 * @module transformers/video/transformer
 * @description Transforma videos de Prisma a VideoWithStats con análisis técnico avanzado
 * Última refactorización: 2025-01-27
 */

'use server';

import { serverLogger } from '@/lib/logger/server-logger';
import { formatFileSize } from '@/lib/utils/format.utils';
import type {
    PrismaVideoWithCounts,
    VideoComplete,
    VideoQuality,
    VideoStatistics,
    VideoWithStats
} from '@/types/entities/video/types';
import { TransformerError } from '@/utils/transformers/errors';
import type { Prisma } from '@prisma/client';

const logger = serverLogger.withContext('VideoTransformer');

// Tipo para compatibilidad legacy
type VideoFromPrisma = Prisma.VideoGetPayload<{
	include: {
		folder: true;
		tags: true;
		albums: true;
		collections: true;
		characters: true;
		places: true;
		worldItems: true;
		concepts: true;
		prompts: true;
		notes: true;
		wildcards: true;
		properties: true;
		groups: true;
		_count: {
			select: {
				albums: true;
				collections: true;
				tags: true;
				characters: true;
				places: true;
				worldItems: true;
				concepts: true;
				prompts: true;
				notes: true;
				wildcards: true;
				properties: true;
				groups: true;
			};
		};
	};
}>;

/**
 * 🎬 Transforma un objeto de video de Prisma a VideoWithStats,
 * calculando todas las estadísticas y análisis técnico.
 *
 * @param prismaVideo - El objeto de video obtenido de Prisma, con los conteos.
 * @returns Un objeto VideoWithStats completo y optimizado.
 */
export function fromPrismaVideoWithCounts(prismaVideo: PrismaVideoWithCounts): VideoWithStats {
	if (!prismaVideo) {
		throw new TransformerError('Video de Prisma es null o undefined');
	}

	try {
		const { _count, ...baseData } = prismaVideo;
		const counts = _count || {};

		// 📊 Calcular estadísticas de relaciones
		const albumsCount = counts.albums || 0;
		const collectionsCount = counts.collections || 0;
		const tagsCount = counts.tags || 0;
		const charactersCount = counts.characters || 0;
		const placesCount = counts.places || 0;
		const worldItemsCount = counts.worldItems || 0;
		const conceptsCount = counts.concepts || 0;
		const promptsCount = counts.prompts || 0;
		const notesCount = counts.notes || 0;
		const wildcardsCount = counts.wildcards || 0;
		const propertiesCount = counts.properties || 0;
		const groupsCount = counts.groups || 0;

		const totalRelations = albumsCount + collectionsCount + tagsCount + charactersCount +
			placesCount + worldItemsCount + conceptsCount + promptsCount + notesCount +
			wildcardsCount + propertiesCount + groupsCount;

		// 🎥 Calcular métricas técnicas de video
		const durationMinutes = Math.round((baseData.duration || 0) / 60 * 100) / 100;
		const durationHours = Math.round(durationMinutes / 60 * 100) / 100;
		const megabytes = Math.round((baseData.size || 0) / (1024 * 1024) * 100) / 100;
		const gigabytes = Math.round(megabytes / 1024 * 100) / 100;

		// 📐 Calcular aspectRatio y resolución
		const aspectRatio = calculateAspectRatio(baseData.width, baseData.height);
		const resolution = formatResolution(baseData.width, baseData.height);
		const qualityLevel = determineQualityLevel(baseData.width, baseData.height);

		// 🏆 Calcular quality score (0-100)
		const qualityScore = calculateQualityScore({
			width: baseData.width,
			height: baseData.height,
			duration: baseData.duration,
			size: baseData.size,
			hasMetadata: !!baseData.metadata,
			hasThumbnail: !!baseData.thumbnail,
			totalRelations
		});

		// 📈 Determinar technical grade
		const technicalGrade = determineTechnicalGrade(qualityScore, qualityLevel, megabytes);

		// 🤖 Análisis AI y metadatos
		const metadata = parseVideoMetadata(baseData.metadata);
		const hasAudio = metadata?.hasAudio ?? true; // Asumir que tiene audio por defecto
		const hasSubtitles = metadata?.subtitleLanguages?.length > 0 ?? false;
		const bitrate = metadata?.bitrate || null;
		const frameRate = metadata?.frameRate || null;

		// 🏷️ Auto-tagging inteligente
		const autoTags = generateAutoTags({
			qualityLevel,
			durationMinutes,
			hasAudio,
			hasSubtitles,
			aspectRatio,
			megabytes
		});

		// 🔍 Detección de duplicados (simulada por ahora)
		const duplicateStatus = 'unique' as const; // TODO: Implementar detección real

		// 📊 Estadísticas completas
		const statistics: VideoStatistics = {
			// Conteos de relaciones
			albumsCount,
			collectionsCount,
			tagsCount,
			charactersCount,
			placesCount,
			worldItemsCount,
			conceptsCount,
			promptsCount,
			notesCount,
			wildcardsCount,
			propertiesCount,
			groupsCount,
			totalRelations,

			// Métricas técnicas
			durationMinutes,
			durationHours,
			megabytes,
			gigabytes,
			aspectRatio,
			resolution,
			qualityLevel,

			// Métricas de uso (simuladas por ahora)
			views: 0,
			likes: 0,
			downloads: 0,
			shares: 0,
			lastViewed: null,

			// Análisis de calidad
			qualityScore,
			technicalGrade,
			hasAudio,
			hasSubtitles,
			bitrate,
			frameRate,

			// Metadatos AI
			aiConfidence: 0.85, // Simulado
			autoTags,
			duplicateStatus,

			// Campos derivados
			thumbnailUrl: baseData.thumbnail ? `/api/videos/${baseData.id}/thumbnail` : null,
			displayName: baseData.name || 'Video sin título',
			formattedSize: formatFileSize(baseData.size),
			formattedDuration: formatDuration(baseData.duration),
			qualityLabel: getQualityLabel(qualityLevel, technicalGrade)
		};

		return {
			...baseData,
			_count: {
				albums: albumsCount,
				collections: collectionsCount,
				tags: tagsCount,
				characters: charactersCount,
				places: placesCount,
				worldItems: worldItemsCount,
				concepts: conceptsCount,
				prompts: promptsCount,
				notes: notesCount,
				wildcards: wildcardsCount,
				properties: propertiesCount,
				groups: groupsCount,
			},
			statistics
		};

	} catch (error) {
		logger.error('❌ Error transformando video desde Prisma', {
			error,
			videoId: prismaVideo?.id,
		});
		throw new TransformerError(`No se pudo transformar el video: ${error.message}`);
	}
}

/**
 * 🎬 Función legacy para compatibilidad con otros transformers
 * @deprecated Usar fromPrismaVideoWithCounts para mejor rendimiento
 */
export function fromPrismaVideo(videoFromPrisma: VideoFromPrisma | null): VideoComplete | null {
	if (!videoFromPrisma) return null;

	try {
		const { _count, ...baseData } = videoFromPrisma;

		return {
			...baseData,
			metadata: baseData.metadata || null,
			thumbnail: baseData.thumbnail ? Buffer.from(baseData.thumbnail) : null,
			tags: baseData.tags ?? [],
			albums: baseData.albums ?? [],
			collections: baseData.collections ?? [],
			characters: baseData.characters ?? [],
			places: baseData.places ?? [],
			worldItems: baseData.worldItems ?? [],
			concepts: baseData.concepts ?? [],
			prompts: baseData.prompts ?? [],
			notes: baseData.notes ?? [],
			wildcards: baseData.wildcards ?? [],
			properties: baseData.properties ?? [],
			groups: baseData.groups ?? [],
			_count: {
				albums: _count?.albums ?? 0,
				collections: _count?.collections ?? 0,
				tags: _count?.tags ?? 0,
				characters: _count?.characters ?? 0,
				places: _count?.places ?? 0,
				worldItems: _count?.worldItems ?? 0,
				concepts: _count?.concepts ?? 0,
				prompts: _count?.prompts ?? 0,
				notes: _count?.notes ?? 0,
				wildcards: _count?.wildcards ?? 0,
				properties: _count?.properties ?? 0,
				groups: _count?.groups ?? 0,
			},
		};
	} catch (error) {
		logger.error(`Error transformando video desde Prisma: ${videoFromPrisma.id}`, {
			error,
			videoId: videoFromPrisma.id,
		});
		return null;
	}
}

/**
 * 🎬 Función legacy para múltiples videos
 * @deprecated Usar fromPrismaVideosWithCounts para mejor rendimiento
 */
export function fromPrismaVideos(videos: VideoFromPrisma[]): VideoComplete[] {
	if (!Array.isArray(videos)) {
		logger.error('⚠️ Intentando transformar un array de videos inválido:', videos);
		return [];
	}

	try {
		return videos.map(fromPrismaVideo).filter((video): video is VideoComplete => video !== null);
	} catch (error) {
		logger.error('❌ Error transformando lista de videos:', error);
		return [];
	}
}

/**
 * 🎬 Transforma múltiples videos de Prisma.
 *
 * @param videos Array de videos de Prisma.
 * @returns Array de videos transformados a VideoWithStats.
 */
export function fromPrismaVideosWithCounts(videos: PrismaVideoWithCounts[]): VideoWithStats[] {
	if (!Array.isArray(videos)) {
		logger.error('⚠️ Intentando transformar un array de videos inválido:', videos);
		throw new TransformerError('Error transformando videos: no es un array');
	}

	try {
		return videos.map(fromPrismaVideoWithCounts);
	} catch (error) {
		logger.error('❌ Error transformando lista de videos:', error);
		throw new TransformerError('Error transformando lista de videos');
	}
}

/**
 * 🔄 Convierte array de VideoWithStats a Record para store optimizado
 */
export function videosToRecord(videos: VideoWithStats[]): Record<string, VideoWithStats> {
	return videos.reduce((acc, video) => {
		acc[video.id] = video;
		return acc;
	}, {} as Record<string, VideoWithStats>);
}

/**
 * 🔍 Obtiene video por ID desde Record (acceso O(1))
 */
export function getVideoById(videos: Record<string, VideoWithStats>, id: string): VideoWithStats | undefined {
	return videos[id];
}

/**
 * 📋 Convierte Record a array para iteración
 */
export function getAllVideos(videos: Record<string, VideoWithStats>): VideoWithStats[] {
	return Object.values(videos);
}

// === FUNCIONES AUXILIARES ===

/**
 * 📐 Calcula la relación de aspecto del video
 */
function calculateAspectRatio(width: number | null, height: number | null): string {
	if (!width || !height) return 'unknown';

	const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
	const divisor = gcd(width, height);
	const ratioWidth = width / divisor;
	const ratioHeight = height / divisor;

	// Ratios comunes
	if (ratioWidth === 16 && ratioHeight === 9) return '16:9';
	if (ratioWidth === 4 && ratioHeight === 3) return '4:3';
	if (ratioWidth === 21 && ratioHeight === 9) return '21:9';
	if (ratioWidth === 1 && ratioHeight === 1) return '1:1';

	return `${ratioWidth}:${ratioHeight}`;
}

/**
 * 📺 Formatea la resolución del video
 */
function formatResolution(width: number | null, height: number | null): string {
	if (!width || !height) return 'unknown';
	return `${width}x${height}`;
}

/**
 * 🎯 Determina el nivel de calidad basado en resolución
 */
function determineQualityLevel(width: number | null, height: number | null): VideoQuality {
	if (!width || !height) return VideoQuality.UNKNOWN;

	const pixels = width * height;

	if (pixels >= 2073600) return VideoQuality.ULTRA; // 1920x1080 o superior
	if (pixels >= 921600) return VideoQuality.HIGH;   // 1280x720
	if (pixels >= 307200) return VideoQuality.MEDIUM; // 640x480
	return VideoQuality.LOW;
}

/**
 * 🏆 Calcula el quality score del video (0-100)
 */
function calculateQualityScore(params: {
	width: number | null;
	height: number | null;
	duration: number;
	size: number;
	hasMetadata: boolean;
	hasThumbnail: boolean;
	totalRelations: number;
}): number {
	let score = 0;

	// Resolución (30 puntos)
	const pixels = (params.width || 0) * (params.height || 0);
	if (pixels >= 2073600) score += 30; // 1080p+
	else if (pixels >= 921600) score += 25; // 720p
	else if (pixels >= 307200) score += 15; // 480p
	else if (pixels > 0) score += 5; // Cualquier resolución

	// Duración (20 puntos)
	const minutes = params.duration / 60;
	if (minutes >= 1 && minutes <= 120) score += 20; // Duración razonable
	else if (minutes > 0) score += 10; // Cualquier duración

	// Tamaño vs duración (15 puntos)
	const mbPerMinute = (params.size / (1024 * 1024)) / minutes;
	if (mbPerMinute >= 5 && mbPerMinute <= 50) score += 15; // Bitrate razonable
	else if (mbPerMinute > 0) score += 5;

	// Metadatos (15 puntos)
	if (params.hasMetadata) score += 10;
	if (params.hasThumbnail) score += 5;

	// Asociaciones (20 puntos)
	if (params.totalRelations >= 10) score += 20;
	else if (params.totalRelations >= 5) score += 15;
	else if (params.totalRelations >= 1) score += 10;
	else score += 5; // Bonus base

	return Math.min(100, Math.max(0, score));
}

/**
 * 📈 Determina el technical grade
 */
function determineTechnicalGrade(
	qualityScore: number,
	qualityLevel: VideoQuality,
	megabytes: number
): 'A' | 'B' | 'C' | 'D' {
	if (qualityScore >= 85 && qualityLevel === VideoQuality.ULTRA && megabytes >= 100) return 'A';
	if (qualityScore >= 70 && qualityLevel >= VideoQuality.HIGH && megabytes >= 50) return 'B';
	if (qualityScore >= 50 && qualityLevel >= VideoQuality.MEDIUM) return 'C';
	return 'D';
}

/**
 * 🔍 Parsea metadatos del video
 */
function parseVideoMetadata(metadataStr: string | null): any {
	if (!metadataStr) return null;

	try {
		return JSON.parse(metadataStr);
	} catch (error) {
		logger.warn('⚠️ JSON inválido para metadatos de video:', metadataStr);
		return null;
	}
}

/**
 * 🏷️ Genera tags automáticos basados en características del video
 */
function generateAutoTags(params: {
	qualityLevel: VideoQuality;
	durationMinutes: number;
	hasAudio: boolean;
	hasSubtitles: boolean;
	aspectRatio: string;
	megabytes: number;
}): string[] {
	const tags: string[] = [];

	// Tags de calidad
	if (params.qualityLevel === VideoQuality.ULTRA) tags.push('ultra-hd', '4k');
	else if (params.qualityLevel === VideoQuality.HIGH) tags.push('hd', '1080p');
	else if (params.qualityLevel === VideoQuality.MEDIUM) tags.push('sd', '720p');

	// Tags de duración
	if (params.durationMinutes < 1) tags.push('corto', 'clip');
	else if (params.durationMinutes < 10) tags.push('breve');
	else if (params.durationMinutes < 60) tags.push('medio');
	else tags.push('largo', 'película');

	// Tags técnicos
	if (params.hasAudio) tags.push('con-audio');
	else tags.push('sin-audio', 'mudo');

	if (params.hasSubtitles) tags.push('subtitulado');

	// Tags de formato
	if (params.aspectRatio === '16:9') tags.push('widescreen');
	else if (params.aspectRatio === '4:3') tags.push('formato-clásico');
	else if (params.aspectRatio === '21:9') tags.push('ultra-wide');

	// Tags de tamaño
	if (params.megabytes >= 1000) tags.push('archivo-grande');
	else if (params.megabytes < 50) tags.push('archivo-pequeño');

	return tags;
}

// formatFileSize se ha movido a @/lib/utils/format.utils.ts para evitar duplicación

/**
 * ⏱️ Formatea la duración del video
 */
function formatDuration(seconds: number): string {
	if (seconds < 60) return `${Math.round(seconds)}s`;

	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = Math.round(seconds % 60);

	if (minutes < 60) {
		return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
	}

	const hours = Math.floor(minutes / 60);
	const remainingMinutes = minutes % 60;

	return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

/**
 * 🏷️ Obtiene etiqueta de calidad combinada
 */
function getQualityLabel(qualityLevel: VideoQuality, technicalGrade: string): string {
	const qualityMap = {
		[VideoQuality.ULTRA]: 'Ultra HD',
		[VideoQuality.HIGH]: 'HD',
		[VideoQuality.MEDIUM]: 'SD',
		[VideoQuality.LOW]: 'Baja',
		[VideoQuality.UNKNOWN]: 'Desconocida'
	};

	return `${qualityMap[qualityLevel]} (${technicalGrade})`;
}
