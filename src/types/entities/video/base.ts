/**
 * @file Tipos base para la entidad Video.
 * @module types/entities/video/base
 * @description Define los tipos canónicos para Video usando el patrón Base + Statistics + WithStats.
 * ✅ MIGRADO A DRIZZLE - Enero 2025
 */

import type { EntityStats } from '../entity.types';

/**
 * 🎥 Tipo base de Video directamente desde el schema de Drizzle.
 * Representa las propiedades fundamentales de un video sin estadísticas calculadas.
 */
export interface VideoBase {
	// Timestamps del sistema
	createdAt: Date;
	description: string | null;

	// Propiedades de video específicas
	duration: number;

	// Relaciones
	folderId: string;
	hash: string;
	height: number | null;
	// Identificación
	id: string;

	// Estados
	isFavorite: boolean;
	isHidden: boolean;
	isPublic: boolean;

	// Metadatos
	metadata: string | null;
	name: string;

	// Propiedades del archivo
	path: string;
	size: number;

	// Thumbnail
	thumbnail: Buffer | null;
	thumbnailHeight: number | null;
	thumbnailSize: number | null;
	thumbnailWidth: number | null;
	updatedAt: Date;
	width: number | null;
}

/**
 * 📊 Estadísticas calculadas y métricas para un video.
 * Extiende EntityStats con propiedades específicas de videos.
 */
export interface VideoStatistics extends EntityStats {
	aspectRatio: string;
	bitrate: number | null;
	downloads: number;

	// Estado de duplicados
	duplicateStatus: 'unique' | 'duplicate' | 'similar';
	durationHours: number;
	// Métricas técnicas de video
	durationMinutes: number;
	formattedDuration: string;
	formattedSize: string;
	frameRate: number | null;
	gigabytes: number;
	hasAudio: boolean;
	hasSubtitles: boolean;

	// Funciones de archivo del sistema
	isDirectory?: () => boolean;
	isFile?: () => boolean;
	lastViewed: Date | null;
	likes: number;
	megabytes: number;

	// Métricas de calidad
	qualityLevel: 'low' | 'medium' | 'high' | 'ultra' | 'unknown';
	resolution: string;
	technicalGrade: 'A' | 'B' | 'C' | 'D';
	thumbnailUrl: string | null;

	// Métricas de relaciones
	totalRelations: number;

	// Métricas de uso específicas de video
	views: number;
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
	codec?: string;
	entityType: 'video';
	fps?: number;
	fullUrl: string;
	/** Alias para compatibilidad - apunta a stats */
	statistics?: VideoStatistics;
	stats: VideoStatistics;
	thumbnailUrl: string | null;

	// Propiedades adicionales de archivo
	type?: string;
}
