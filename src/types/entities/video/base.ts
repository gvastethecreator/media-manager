/**
 * @file Tipos base para la entidad Video.
 * @module types/entities/video/base
 * @description Define los tipos canónicos para Video usando el patrón Base + Statistics + WithStats.
 * ✅ MIGRADO A DRIZZLE - Enero 2025
 */

/**
 * 🎥 Tipo base de Video directamente desde el schema de Drizzle.
 * Representa las propiedades fundamentales de un video sin estadísticas calculadas.
 */
export interface VideoBase {
	// Identificación
	id: string;
	name: string;
	description: string | null;

	// Propiedades del archivo
	path: string;
	hash: string;
	size: number;

	// Propiedades de video específicas
	duration: number;
	width: number | null;
	height: number | null;

	// Metadatos
	metadata: string | null;

	// Thumbnail
	thumbnail: Buffer | null;
	thumbnailSize: number | null;
	thumbnailWidth: number | null;
	thumbnailHeight: number | null;

	// Estados
	isFavorite: boolean;
	isHidden: boolean;

	// Relaciones
	folderId: string;

	// Timestamps del sistema
	createdAt: Date;
	updatedAt: Date;
}

/**
 * 📊 Estadísticas calculadas y métricas para un video.
 */
export interface VideoStatistics {
	// Conteos de relaciones
	albumCount: number;
	collectionCount: number;
	tagCount: number;
	characterCount: number;
	placeCount: number;
	worldItemCount: number;
	conceptCount: number;
	promptCount: number;
	noteCount: number;
	wildcardCount: number;
	propertyCount: number;
	groupCount: number;
	totalRelations: number;
	totalAssociations: number;
	totalItems: number;

	// Métricas técnicas de video
	durationMinutes: number;
	durationHours: number;
	megabytes: number;
	gigabytes: number;
	aspectRatio: string;
	resolution: string;
	formattedSize: string;
	formattedDuration: string;

	// Métricas de calidad
	qualityLevel: 'low' | 'medium' | 'high' | 'ultra' | 'unknown';
	qualityScore: number; // 0-100
	technicalGrade: 'A' | 'B' | 'C' | 'D';
	hasAudio: boolean;
	hasSubtitles: boolean;
	bitrate: number | null;
	frameRate: number | null;

	// Métricas de uso
	views: number;
	likes: number;
	downloads: number;
	lastViewed: Date | null;

	// Estado de duplicados
	duplicateStatus: 'unique' | 'duplicate' | 'similar';
	thumbnailUrl: string | null;
}

/**
 * 📊 Alias para compatibilidad - VideoStats apunta a VideoStatistics
 */
export type VideoStats = VideoStatistics;

/**
 * 🎥 Tipo enriquecido de Video que incluye estadísticas calculadas.
 * Este es el tipo canónico que debe usarse en la aplicación.
 */
export interface VideoWithStats extends VideoBase {
	entityType: 'video';
	stats: VideoStatistics;
	thumbnailUrl: string | null;
	fullUrl: string;
	fps?: number;
	codec?: string;
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
}
