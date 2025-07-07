/**
 * @file Transformer optimizado para la entidad Video
 * @module transformers/video/transformer
 * @description Transforma videos de Drizzle a VideoWithStats con análisis técnico avanzado
 * Última refactorización: 2025-01-27
 
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { formatFileSize } from '@/lib/utils/format.utils';
import { TransformerError } from '@/lib/utils/transformers/errors';
import type { VideoComplete, VideoStatistics, VideoWithStats } from '@/types/entities/video/types';
import { VideoQuality } from '@/types/entities/video/types';

// Tipos locales equivalentes a Drizzle (migración a Drizzle)
type DrizzleVideoWithCounts = {
	id: string;
	name: string | null;
	path: string;
	size: number;
	width: number | null;
	height: number | null;
	duration: number;
	metadata: string | null;
	thumbnail: Buffer | null;
	thumbnailSize: number | null;
	thumbnailWidth: number | null;
	thumbnailHeight: number | null;
	thumbnailError: string | null;
	thumbnailErrorAt: Date | null;
	thumbnailOptimizedAt: Date | null;
	isFavorite: boolean;
	folderId: string | null;
	addedAt: Date;
	createdAt: Date;
	updatedAt: Date;
	_count?: {
		albums?: number;
		collections?: number;
		tags?: number;
		characters?: number;
		places?: number;
		worldItems?: number;
		concepts?: number;
		prompts?: number;
		notes?: number;
		wildcards?: number;
		properties?: number;
		groups?: number;
	};
};

type DrizzleVideoFromDrizzle = DrizzleVideoWithCounts & {
	folder?: any;
	tags?: any[];
	albums?: any[];
	collections?: any[];
	characters?: any[];
	places?: any[];
	worldItems?: any[];
	concepts?: any[];
	prompts?: any[];
	notes?: any[];
	wildcards?: any[];
	properties?: any[];
	groups?: any[];
};

const logger = serverLogger.withContext('VideoTransformer');

/**
 * 🎬 Transforma un objeto de video de Drizzle a VideoWithStats,
 * calculando todas las estadísticas y análisis técnico.
 * ✅ MIGRADO A DRIZZLE
 *
 * @param drizzleVideo - El objeto de video obtenido de Drizzle, con los conteos.
 * @returns Un objeto VideoWithStats completo y optimizado.
 */
export function fromDrizzleVideoWithCounts(drizzleVideo: DrizzleVideoWithCounts): VideoWithStats {
	if (!drizzleVideo) {
		throw new TransformerError('Video de Drizzle es null o undefined');
	}

	try {
		const { _count, ...baseData } = drizzleVideo;
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

		const totalRelations =
			albumsCount +
			collectionsCount +
			tagsCount +
			charactersCount +
			placesCount +
			worldItemsCount +
			conceptsCount +
			promptsCount +
			notesCount +
			wildcardsCount +
			propertiesCount +
			groupsCount;

		// 🎥 Calcular métricas técnicas de video
		const durationMinutes = Math.round(((baseData.duration || 0) / 60) * 100) / 100;
		const durationHours = Math.round((durationMinutes / 60) * 100) / 100;
		const megabytes = Math.round(((baseData.size || 0) / (1024 * 1024)) * 100) / 100;
		const gigabytes = Math.round((megabytes / 1024) * 100) / 100;

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
			totalRelations,
		});

		// 📈 Determinar technical grade
		const technicalGrade = determineTechnicalGrade(qualityScore, qualityLevel, megabytes);

		// 🤖 Análisis AI y metadatos
		const metadata = parseVideoMetadata(baseData.metadata);
		const hasAudio = metadata?.hasAudio ?? true; // Asumir que tiene audio por defecto
		const hasSubtitles = (metadata?.subtitleLanguages?.length ?? 0) > 0;
		const bitrate = metadata?.bitrate || null;
		const frameRate = metadata?.frameRate || null;

		// 🏷️ Auto-tagging inteligente
		const autoTags = generateAutoTags({
			qualityLevel,
			durationMinutes,
			hasAudio,
			hasSubtitles,
			aspectRatio,
			megabytes,
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
			qualityLabel: getQualityLabel(qualityLevel, technicalGrade),
		};

		return {
			...baseData,
			statistics,
		};
	} catch (error) {
		logger.error('Error al transformar video de Drizzle:', { error, videoId: drizzleVideo?.id });
		throw new TransformerError(`Error al transformar video: ${error}`);
	}
}

/**
 * 🎬 Transforma un video de Drizzle a VideoComplete (sin estadísticas avanzadas)
 * ✅ MIGRADO A DRIZZLE
 *
 * @param videoFromDrizzle Video con relaciones de Drizzle
 * @returns VideoComplete o null si hay error
 */
export function fromDrizzleVideo(videoFromDrizzle: DrizzleVideoFromDrizzle | null): VideoComplete | null {
	if (!videoFromDrizzle) {
		return null;
	}

	try {
		// Transformación básica sin estadísticas complejas
		return {
			...videoFromDrizzle,
			// Simplificar relaciones para evitar dependencias circulares
			folder: videoFromDrizzle.folder || null,
			tags: videoFromDrizzle.tags || [],
			albums: videoFromDrizzle.albums || [],
			collections: videoFromDrizzle.collections || [],
			characters: videoFromDrizzle.characters || [],
			places: videoFromDrizzle.places || [],
			worldItems: videoFromDrizzle.worldItems || [],
			concepts: videoFromDrizzle.concepts || [],
			prompts: videoFromDrizzle.prompts || [],
			notes: videoFromDrizzle.notes || [],
			wildcards: videoFromDrizzle.wildcards || [],
			properties: videoFromDrizzle.properties || [],
			groups: videoFromDrizzle.groups || [],
		};
	} catch (error) {
		logger.error('Error al transformar video simple de Drizzle:', { error, videoId: videoFromDrizzle?.id });
		return null;
	}
}

/**
 * 🎬 Transforma una lista de videos de Drizzle a VideoComplete
 * ✅ MIGRADO A DRIZZLE
 */
export function fromDrizzleVideos(videos: DrizzleVideoFromDrizzle[]): VideoComplete[] {
	return videos.map(fromDrizzleVideo).filter((v): v is VideoComplete => v !== null);
}

/**
 * 🎬 Transforma una lista de videos con conteos de Drizzle a VideoWithStats
 * ✅ MIGRADO A DRIZZLE
 */
export function fromDrizzleVideosWithCounts(videos: DrizzleVideoWithCounts[]): VideoWithStats[] {
	return videos.map(fromDrizzleVideoWithCounts);
}

/**
 * 🗂️ Convierte un array de videos a un Record indexado por ID
 * ✅ MIGRADO A DRIZZLE
 */
export function videosToRecord(videos: VideoWithStats[]): Record<string, VideoWithStats> {
	return videos.reduce(
		(acc, video) => {
			acc[video.id] = video;
			return acc;
		},
		{} as Record<string, VideoWithStats>
	);
}

/**
 * 🔍 Obtiene un video por ID del Record
 * ✅ MIGRADO A DRIZZLE
 */
export function getVideoById(videos: Record<string, VideoWithStats>, id: string): VideoWithStats | undefined {
	return videos[id];
}

/**
 * 📋 Obtiene todos los videos del Record como array
 * ✅ MIGRADO A DRIZZLE
 */
export function getAllVideos(videos: Record<string, VideoWithStats>): VideoWithStats[] {
	return Object.values(videos);
}

// === FUNCIONES DE UTILIDAD ===

/**
 * 📐 Calcula la relación de aspecto de un video
 */
function calculateAspectRatio(width: number | null, height: number | null): string {
	if (!width || !height) return 'unknown';
	const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
	const divisor = gcd(width, height);
	const aspectWidth = width / divisor;
	const aspectHeight = height / divisor;

	// Casos comunes
	if (aspectWidth === 16 && aspectHeight === 9) return '16:9';
	if (aspectWidth === 4 && aspectHeight === 3) return '4:3';
	if (aspectWidth === 1 && aspectHeight === 1) return '1:1';
	if (aspectWidth === 21 && aspectHeight === 9) return '21:9';
	if (aspectWidth === 3 && aspectHeight === 2) return '3:2';

	return `${aspectWidth}:${aspectHeight}`;
}

/**
 * 📏 Formatea la resolución del video
 */
function formatResolution(width: number | null, height: number | null): string {
	if (!width || !height) return 'unknown';
	return `${width}x${height}`;
}

/**
 * 🏆 Determina el nivel de calidad basado en resolución
 */
function determineQualityLevel(width: number | null, height: number | null): VideoQuality {
	if (!width || !height) return VideoQuality.UNKNOWN;

	const pixels = width * height;

	if (pixels >= 8294400) return VideoQuality.UHD_4K; // 3840x2160
	if (pixels >= 2073600) return VideoQuality.QHD_2K; // 1920x1080
	if (pixels >= 921600) return VideoQuality.HD; // 1280x720
	if (pixels >= 307200) return VideoQuality.SD; // 640x480

	return VideoQuality.LOW;
}

/**
 * 📊 Calcula un score de calidad general (0-100)
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

	// Resolución (40 puntos máximo)
	const pixels = (params.width || 0) * (params.height || 0);
	if (pixels >= 8294400)
		score += 40; // 4K
	else if (pixels >= 2073600)
		score += 35; // 2K
	else if (pixels >= 921600)
		score += 30; // HD
	else if (pixels >= 307200)
		score += 20; // SD
	else score += 10; // Low

	// Duración (20 puntos máximo)
	const minutes = params.duration / 60;
	if (minutes >= 60)
		score += 20; // Película
	else if (minutes >= 30)
		score += 18; // Episodio largo
	else if (minutes >= 10)
		score += 15; // Episodio corto
	else if (minutes >= 3)
		score += 12; // Clip largo
	else if (minutes >= 1)
		score += 8; // Clip corto
	else score += 3; // Muy corto

	// Tamaño vs calidad (15 puntos máximo)
	const mbPerMinute = params.size / (1024 * 1024) / Math.max(minutes, 0.1);
	if (mbPerMinute >= 50)
		score += 15; // Alta calidad
	else if (mbPerMinute >= 20)
		score += 12; // Buena calidad
	else if (mbPerMinute >= 10)
		score += 8; // Calidad media
	else if (mbPerMinute >= 5)
		score += 5; // Baja calidad
	else score += 2; // Muy baja calidad

	// Metadatos (10 puntos máximo)
	if (params.hasMetadata) score += 5;
	if (params.hasThumbnail) score += 5;

	// Relaciones (15 puntos máximo)
	score += Math.min(params.totalRelations, 15);

	return Math.min(score, 100);
}

/**
 * 📈 Determina el grado técnico basado en métricas
 */
function determineTechnicalGrade(
	qualityScore: number,
	qualityLevel: VideoQuality,
	_megabytes: number
): 'A' | 'B' | 'C' | 'D' {
	if (qualityScore >= 80 && qualityLevel >= VideoQuality.QHD_2K) return 'A';
	if (qualityScore >= 60 && qualityLevel >= VideoQuality.HD) return 'B';
	if (qualityScore >= 40 && qualityLevel >= VideoQuality.SD) return 'C';
	return 'D';
}

/**
 * 🤖 Parsea metadatos del video
 */
function parseVideoMetadata(metadataStr: string | null): any {
	if (!metadataStr) return null;

	try {
		return JSON.parse(metadataStr);
	} catch {
		return null;
	}
}

/**
 * 🏷️ Genera tags automáticos basados en características
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
	if (params.qualityLevel >= VideoQuality.UHD_4K) tags.push('4K', 'Ultra HD');
	else if (params.qualityLevel >= VideoQuality.QHD_2K) tags.push('2K', 'Full HD');
	else if (params.qualityLevel >= VideoQuality.HD) tags.push('HD');
	else if (params.qualityLevel >= VideoQuality.SD) tags.push('SD');

	// Tags de duración
	if (params.durationMinutes >= 90) tags.push('Película', 'Largo');
	else if (params.durationMinutes >= 45) tags.push('Episodio');
	else if (params.durationMinutes >= 10) tags.push('Corto');
	else if (params.durationMinutes >= 1) tags.push('Clip');
	else tags.push('Micro');

	// Tags de características
	if (!params.hasAudio) tags.push('Sin Audio');
	if (params.hasSubtitles) tags.push('Subtítulos');

	// Tags de aspecto
	if (params.aspectRatio === '16:9') tags.push('Widescreen');
	else if (params.aspectRatio === '4:3') tags.push('Clásico');
	else if (params.aspectRatio === '1:1') tags.push('Cuadrado');
	else if (params.aspectRatio === '21:9') tags.push('Ultrawide');

	// Tags de tamaño
	if (params.megabytes >= 1000) tags.push('Gran Tamaño');
	else if (params.megabytes >= 100) tags.push('Tamaño Medio');
	else tags.push('Compacto');

	return tags;
}

/**
 * ⏱️ Formatea duración en segundos a formato legible
 */
function formatDuration(seconds: number): string {
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const remainingSeconds = Math.floor(seconds % 60);

	if (hours > 0) {
		return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
	}

	return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * 🏷️ Obtiene etiqueta de calidad legible
 */
function getQualityLabel(qualityLevel: VideoQuality, technicalGrade: string): string {
	const qualityNames = {
		[VideoQuality.UHD_4K]: '4K Ultra HD',
		[VideoQuality.QHD_2K]: '2K Full HD',
		[VideoQuality.HD]: 'HD',
		[VideoQuality.SD]: 'SD',
		[VideoQuality.LOW]: 'Baja',
		[VideoQuality.UNKNOWN]: 'Desconocida',
	};

	return `${qualityNames[qualityLevel]} (${technicalGrade})`;
}
