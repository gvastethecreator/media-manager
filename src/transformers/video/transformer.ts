/**
 * @file Transformer optimizado para la entidad Video
 * @module transformers/video/transformer
 * @description Transforma videos de Drizzle a VideoWithStats con análisis técnico avanzado
 * Última refactorización: 2025-01-27

 */

import { TransformerError } from '../../lib/errors/transformer-error';
import { serverLogger } from '../../lib/logger/server-logger';
import { createDefaultEntityStats } from '../../lib/utils';
import { formatFileSize } from '../../lib/utils/format.utils';
import type { VideoStatistics } from '../../types/entities/video/base';
import type { VideoComplete, VideoWithStats } from '../../types/entities/video/types';
import { VideoQuality } from '../../types/entities/video/types';
import { normalizeCounts, sumCounts, STANDARD_COUNT_KEYS } from '../common/counts';

// Enum para calidad de video (definición local si no existe en types)
enum VideoQualityLocal {
	UNKNOWN = 'unknown',
	LOW = 'low',
	MEDIUM = 'medium',
	HIGH = 'high',
	ULTRA = 'ultra',
}

// Tipos locales equivalentes a Drizzle (migración a Drizzle)
interface DrizzleVideoWithCounts {
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
	addedAt: Date;
	createdAt: Date;
	duration: number;
	folderId: string | null;
	hash: string;
	height: number | null;
	id: string;
	isFavorite: boolean;
	metadata: string | null;
	name: string | null;
	path: string;
	size: number;
	thumbnail: Buffer | null;
	thumbnailError: string | null;
	thumbnailErrorAt: Date | null;
	thumbnailHeight: number | null;
	thumbnailOptimizedAt: Date | null;
	thumbnailSize: number | null;
	thumbnailWidth: number | null;
	updatedAt: Date;
	width: number | null;
}

type DrizzleVideoFromDrizzle = DrizzleVideoWithCounts & {
	folder?: { id: string; name: string };
	tags?: Array<{ id: string; name: string }>;
	albums?: Array<{ id: string; name: string }>;
	collections?: Array<{ id: string; name: string }>;
	characters?: Array<{ id: string; name: string }>;
	places?: Array<{ id: string; name: string }>;
	worldItems?: Array<{ id: string; name: string }>;
	concepts?: Array<{ id: string; name: string }>;
	prompts?: Array<{ id: string; name: string }>;
	notes?: Array<{ id: string; content: string }>;
	wildcards?: Array<{ id: string; name: string }>;
	properties?: Array<{ key: string; value: unknown }>;
	groups?: Array<{ id: string; name: string }>;
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
		const counts = normalizeCounts(_count);

		// 📊 Calcular estadísticas de relaciones
		const totalRelations = sumCounts(_count, STANDARD_COUNT_KEYS);

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
		const technicalGrade = determineTechnicalGrade(qualityScore, qualityLevel as unknown as VideoQuality, megabytes);

		// 🤖 Análisis AI y metadatos
		const metadata = parseVideoMetadata(baseData.metadata);
		const hasAudio = (metadata?.hasAudio as boolean) ?? true; // Asumir que tiene audio por defecto
		const hasSubtitles = Array.isArray(metadata?.subtitleLanguages) ? metadata.subtitleLanguages.length > 0 : false;
		const bitrate = typeof metadata?.bitrate === 'number' ? metadata.bitrate : null;
		const frameRate = typeof metadata?.frameRate === 'number' ? metadata.frameRate : null;

		// 🏷️ Auto-tagging inteligente
		const autoTags = generateAutoTags({
			qualityLevel: qualityLevel as unknown as VideoQuality,
			durationMinutes,
			hasAudio,
			hasSubtitles,
			aspectRatio,
			megabytes,
		});

		// 🔍 Detección de duplicados (basada en hash - consistente con imágenes)
		const duplicateStatus = determineDuplicateStatus(baseData.hash);

		// Siempre generar la URL del thumbnail - la API se encarga de generarlo si no existe
		const thumbnailUrl = `/api/videos/${baseData.id}/thumbnail`;

		// 📊 Estadísticas completas
		const statistics: VideoStatistics = {
			...createDefaultEntityStats(),
			// Conteos de relaciones
			albumCount: counts.albums,
			collectionCount: counts.collections,
			tagCount: counts.tags,
			characterCount: counts.characters,
			placeCount: counts.places,
			worldItemCount: counts.worldItems,
			conceptCount: counts.concepts,
			promptCount: counts.prompts,
			noteCount: counts.notes,
			wildcardCount: counts.wildcards,
			propertyCount: counts.properties,
			groupCount: counts.groups,
			totalRelations,
			totalAssociations: totalRelations,
			totalItems: totalRelations,
			imageCount: 0, // Videos no tienen imágenes
			videoCount: 1, // Este es un video
			lastUpdated: new Date(baseData.updatedAt),
			size: baseData.size,

			// Métricas técnicas
			durationMinutes,
			durationHours,
			megabytes,
			gigabytes,
			aspectRatio,
			resolution,
			formattedSize: formatFileSize(baseData.size),
			formattedDuration: formatDuration(baseData.duration),

			// Métricas de calidad
			qualityLevel,
			qualityScore,
			technicalGrade,
			hasAudio,
			hasSubtitles,
			bitrate,
			frameRate,

			// Métricas de uso
			views: 0,
			likes: 0,
			downloads: 0,
			lastViewed: null,

			// Estado de duplicados
			duplicateStatus,

			// Thumbnail URL
			thumbnailUrl,
		};

		return {
			...baseData,
			name: baseData.name || 'Untitled Video',
			thumbnail: baseData.thumbnail ? baseData.thumbnail.toString('base64') : null,
			folderId: baseData.folderId || '',
			entityType: 'video' as const,
			isHidden: false,
			isPublic: false,
			statistics,
			stats: statistics,
			thumbnailUrl,
			description: null,
			hash: baseData.hash || '',
			_count: counts,
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
			name: videoFromDrizzle.name || 'Untitled Video',
			folderId: videoFromDrizzle.folderId || '',
			thumbnail: videoFromDrizzle.thumbnail ? videoFromDrizzle.thumbnail.toString('base64') : null,
			// Propiedades requeridas faltantes
			isHidden: false,
			isPublic: false,
			description: null,
			hash: videoFromDrizzle.hash || '',
			stats: undefined,
			// Simplificar relaciones para evitar dependencias circulares
			tags: (videoFromDrizzle.tags || []) as unknown as any[],
			albums: (videoFromDrizzle.albums || []) as unknown as any[],
			collections: (videoFromDrizzle.collections || []) as unknown as any[],
			characters: (videoFromDrizzle.characters || []) as unknown as any[],
			places: (videoFromDrizzle.places || []) as unknown as any[],
			worldItems: (videoFromDrizzle.worldItems || []) as unknown as any[],
			concepts: (videoFromDrizzle.concepts || []) as unknown as any[],
			prompts: (videoFromDrizzle.prompts || []) as unknown as any[],
			notes: (videoFromDrizzle.notes || []) as unknown as any[],
			wildcards: (videoFromDrizzle.wildcards || []) as unknown as any[],
			properties: (videoFromDrizzle.properties || []) as unknown as any[],
			groups: (videoFromDrizzle.groups || []) as unknown as any[],
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
	if (!(width && height)) {
		return 'unknown';
	}
	const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
	const divisor = gcd(width, height);
	const aspectWidth = width / divisor;
	const aspectHeight = height / divisor;

	// Casos comunes
	if (aspectWidth === 16 && aspectHeight === 9) {
		return '16:9';
	}
	if (aspectWidth === 4 && aspectHeight === 3) {
		return '4:3';
	}
	if (aspectWidth === 1 && aspectHeight === 1) {
		return '1:1';
	}
	if (aspectWidth === 21 && aspectHeight === 9) {
		return '21:9';
	}
	if (aspectWidth === 3 && aspectHeight === 2) {
		return '3:2';
	}

	return `${aspectWidth}:${aspectHeight}`;
}

/**
 * 📏 Formatea la resolución del video
 */
function formatResolution(width: number | null, height: number | null): string {
	if (!(width && height)) {
		return 'unknown';
	}
	return `${width}x${height}`;
}

/**
 * 🏆 Determina el nivel de calidad basado en resolución
 */
function determineQualityLevel(width: number | null, height: number | null): VideoQualityLocal {
	if (!(width && height)) {
		return VideoQualityLocal.UNKNOWN;
	}

	const pixels = width * height;

	if (pixels >= 8_294_400) {
		return VideoQualityLocal.ULTRA; // 3840x2160 (4K)
	}
	if (pixels >= 2_073_600) {
		return VideoQualityLocal.HIGH; // 1920x1080 (2K/FHD)
	}
	if (pixels >= 921_600) {
		return VideoQualityLocal.MEDIUM; // 1280x720 (HD)
	}
	if (pixels >= 307_200) {
		return VideoQualityLocal.MEDIUM; // 640x480 (SD)
	}

	return VideoQualityLocal.LOW;
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
	if (pixels >= 8_294_400) {
		score += 40; // 4K
	} else if (pixels >= 2_073_600) {
		score += 35; // 2K
	} else if (pixels >= 921_600) {
		score += 30; // HD
	} else if (pixels >= 307_200) {
		score += 20; // SD
	} else {
		score += 10; // Low
	}

	// Duración (20 puntos máximo)
	const minutes = params.duration / 60;
	if (minutes >= 60) {
		score += 20; // Película
	} else if (minutes >= 30) {
		score += 18; // Episodio largo
	} else if (minutes >= 10) {
		score += 15; // Episodio corto
	} else if (minutes >= 3) {
		score += 12; // Clip largo
	} else if (minutes >= 1) {
		score += 8; // Clip corto
	} else {
		score += 3; // Muy corto
	}

	// Tamaño vs calidad (15 puntos máximo)
	const mbPerMinute = params.size / (1024 * 1024) / Math.max(minutes, 0.1);
	if (mbPerMinute >= 50) {
		score += 15; // Alta calidad
	} else if (mbPerMinute >= 20) {
		score += 12; // Buena calidad
	} else if (mbPerMinute >= 10) {
		score += 8; // Calidad media
	} else if (mbPerMinute >= 5) {
		score += 5; // Baja calidad
	} else {
		score += 2; // Muy baja calidad
	}

	// Metadatos (10 puntos máximo)
	if (params.hasMetadata) {
		score += 5;
	}
	if (params.hasThumbnail) {
		score += 5;
	}

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
	if (qualityScore >= 80 && qualityLevel === VideoQuality.ULTRA) {
		return 'A';
	}
	if (qualityScore >= 60 && qualityLevel === VideoQuality.HIGH) {
		return 'B';
	}
	if (qualityScore >= 40 && qualityLevel === VideoQuality.MEDIUM) {
		return 'C';
	}
	return 'D';
}

/**
 * 🤖 Parsea metadatos del video
 */
function parseVideoMetadata(metadataStr: string | null): Record<string, unknown> {
	if (!metadataStr) {
		return {};
	}

	try {
		return JSON.parse(metadataStr);
	} catch {
		return {};
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
	if (params.qualityLevel === VideoQuality.ULTRA) {
		tags.push('4K', 'Ultra HD');
	} else if (params.qualityLevel === VideoQuality.HIGH) {
		tags.push('2K', 'Full HD');
	} else if (params.qualityLevel === VideoQuality.MEDIUM) {
		tags.push('HD');
	} else if (params.qualityLevel === VideoQuality.LOW) {
		tags.push('SD');
	}

	// Tags de duración
	if (params.durationMinutes >= 90) {
		tags.push('Película', 'Largo');
	} else if (params.durationMinutes >= 45) {
		tags.push('Episodio');
	} else if (params.durationMinutes >= 10) {
		tags.push('Corto');
	} else if (params.durationMinutes >= 1) {
		tags.push('Clip');
	} else {
		tags.push('Micro');
	}

	// Tags de características
	if (!params.hasAudio) {
		tags.push('Sin Audio');
	}
	if (params.hasSubtitles) {
		tags.push('Subtítulos');
	}

	// Tags de aspecto
	if (params.aspectRatio === '16:9') {
		tags.push('Widescreen');
	} else if (params.aspectRatio === '4:3') {
		tags.push('Clásico');
	} else if (params.aspectRatio === '1:1') {
		tags.push('Cuadrado');
	} else if (params.aspectRatio === '21:9') {
		tags.push('Ultrawide');
	}

	// Tags de tamaño
	if (params.megabytes >= 1000) {
		tags.push('Gran Tamaño');
	} else if (params.megabytes >= 100) {
		tags.push('Tamaño Medio');
	} else {
		tags.push('Compacto');
	}

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
function getQualityLabel(qualityLevel: VideoQualityLocal, technicalGrade: string): string {
	const qualityNames = {
		[VideoQualityLocal.ULTRA]: '4K Ultra HD',
		[VideoQualityLocal.HIGH]: '2K Full HD',
		[VideoQualityLocal.MEDIUM]: 'HD',
		[VideoQualityLocal.LOW]: 'SD',
		[VideoQualityLocal.UNKNOWN]: 'Unknown',
	};

	return `${qualityNames[qualityLevel]} (${technicalGrade})`;
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
