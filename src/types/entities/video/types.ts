/**
 * @file Tipos canónicos para la entidad Video
 * @module types/entities/video/types
 * @description Estructura unificada y optimizada para Video con patrón EntityWithStats.
 * Última refactorización: 2025-01-27
 */

import { z } from 'zod';
import type { AlbumWithStats } from '../album';
import type { CharacterWithStats } from '../character';
import type { CollectionWithStats } from '../collection';
import type { ConceptWithStats } from '../concept';
import type { GroupWithStats } from '../group';
import type { NoteComplete } from '../note';
import type { PlaceComplete } from '../place';
import type { PromptComplete } from '../prompt';
import type { PropertyComplete } from '../property';
import type { TagWithStats } from '../tag';
import type { WildcardWithStats } from '../wildcard';
import type { WorldItemWithStats } from '../world-item';
// Imports optimizados usando tipos WithStats
import type { VideoStatistics } from './base';
import { VideoCodec, VideoFormat, VideoQuality, VideoSortCriteria, VideoViewMode } from './enums';

/**
 * 📝 Tipo base para Video - definición canónica
 */
export interface VideoBase {
	createdAt: Date;
	description: string | null;
	duration: number;
	folderId: string;
	hash: string;
	height: number | null;
	id: string;

	isFavorite: boolean;
	isHidden: boolean;
	isPublic: boolean;
	metadata: string | null;
	name: string;
	path: string;
	size: number;
	thumbnail: string | null;
	thumbnailHeight: number | null;
	thumbnailSize: number | null;
	thumbnailWidth: number | null;
	updatedAt: Date;
	width: number | null;
}

/**
 * ➕ Input para crear un nuevo video
 */
export interface VideoCreateInput {
	// Relaciones opcionales por IDs
	albumIds?: string[];
	characterIds?: string[];
	collectionIds?: string[];
	conceptIds?: string[];
	description?: string | null;
	duration: number;
	folderId: string;
	groupIds?: string[];
	hash: string;
	height?: number | null;

	isFavorite?: boolean;
	isHidden?: boolean;
	isPublic?: boolean;
	metadata?: string | null;
	mimeType?: string;
	name: string;
	noteIds?: string[];
	path: string;
	placeIds?: string[];
	promptIds?: string[];
	propertyIds?: string[];
	size: number;
	tagIds?: string[];
	thumbnail?: Buffer | null;
	thumbnailHeight?: number | null;
	thumbnailSize?: number | null;
	thumbnailWidth?: number | null;
	width?: number | null;
	wildcardIds?: string[];
	worldItemIds?: string[];
}

/**
 * 🔄 Input para actualizar un video
 */
export interface VideoUpdateInput {
	// Relaciones opcionales por IDs
	albumIds?: string[];
	characterIds?: string[];
	collectionIds?: string[];
	conceptIds?: string[];
	description?: string | null;
	duration?: number;
	folderId?: string;
	groupIds?: string[];
	height?: number | null;

	isFavorite?: boolean;
	isHidden?: boolean;
	isPublic?: boolean;
	metadata?: string | null;
	name?: string;
	noteIds?: string[];
	path?: string;
	placeIds?: string[];
	promptIds?: string[];
	propertyIds?: string[];
	size?: number;
	tagIds?: string[];
	thumbnail?: Buffer | null;
	thumbnailHeight?: number | null;
	thumbnailSize?: number | null;
	thumbnailWidth?: number | null;
	width?: number | null;
	wildcardIds?: string[];
	worldItemIds?: string[];
}

/**
 * 🔍 Filtros para búsqueda de videos
 */
export interface VideoFilters {
	albums?: string[];
	characters?: string[];
	collections?: string[];
	dateRange?: {
		start?: Date;
		end?: Date;
	};
	duplicateStatus?: ('unique' | 'duplicate' | 'similar')[];
	folders?: string[];
	hasAudio?: boolean;
	hasMetadata?: boolean;
	hasSubtitles?: boolean;
	hasThumbnail?: boolean;
	isFavorite?: boolean;
	maxDuration?: number;
	maxHeight?: number;
	maxSize?: number;
	maxWidth?: number;
	minDuration?: number;
	minHeight?: number;
	minQualityScore?: number;
	minSize?: number;
	minWidth?: number;

	qualityLevel?: VideoQuality[];
	search?: string;
	tags?: string[];
	technicalGrade?: ('A' | 'B' | 'C' | 'D')[];
}

/**
 * 🔗 Relaciones de Video
 */
export interface VideoRelations {
	albums?: AlbumWithStats[];
	characters?: CharacterWithStats[];
	collections?: CollectionWithStats[];
	concepts?: ConceptWithStats[];
	groups?: GroupWithStats[];
	notes?: NoteComplete[];
	places?: PlaceComplete[];
	prompts?: PromptComplete[];
	properties?: PropertyComplete[];
	tags?: TagWithStats[];
	wildcards?: WildcardWithStats[];
	worldItems?: WorldItemWithStats[];
}

/**
 * 🎥 Video completo con relaciones
 */
export interface VideoComplete extends VideoBase {
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
	albums?: AlbumWithStats[];
	characters?: CharacterWithStats[];
	collections?: CollectionWithStats[];
	concepts?: ConceptWithStats[];
	groups?: GroupWithStats[];
	notes?: NoteComplete[];
	places?: PlaceComplete[];
	prompts?: PromptComplete[];
	properties?: PropertyComplete[];
	stats?: VideoStatistics;
	tags?: TagWithStats[];
	wildcards?: WildcardWithStats[];
	worldItems?: WorldItemWithStats[];
}

/**
 * 📄 Opciones de paginación
 */
export interface VideoPaginationOptions {
	limit?: number;
	page?: number;
	sortBy?: VideoSortCriteria;
	sortDirection?: 'asc' | 'desc';
}

/**
 * 🎥 Tipo completo para Video con relaciones y estadísticas
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
	audioCodec?: string;
	bitrate?: number;
	entityType: 'video';
	frameRate?: number;
	/** Alias para compatibilidad - apunta a stats */
	statistics?: VideoStatistics;
	stats: VideoStatistics;
	thumbnailUrl: string | null;
	videoCodec?: string;
}

/**
 * 📊 Resultado paginado de búsqueda
 */
export interface PaginatedVideos {
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
		hasNextPage: boolean;
		hasPreviousPage: boolean;
	};
	videos: VideoWithStats[];
}

/**
 * 📈 Estadísticas generales de videos
 */
export interface VideoStats {
	averageDuration: number;
	averageSize: number;
	byFolder: Record<string, number>;
	byFormat: Record<string, number>;
	byQuality: Record<VideoQuality, number>;
	duplicates: number;
	favorites: number;
	highQuality: number; // Grade A+B
	public: number;
	total: number;
	totalDownloads: number;
	totalDuration: number;
	totalSize: number;
	totalViews: number;
	withAudio: number;
	withSubtitles: number;
	withThumbnails: number;
}

/**
 * 🎮 Estado de reproducción
 */
export interface VideoPlayState {
	currentTime: number;
	duration: number;
	isMuted: boolean;
	isPlaying: boolean;
	playbackRate: number;
	volume: number;
}

/**
 * 🎬 Metadatos de video
 */
export interface VideoMetadata {
	audioCodec?: string;
	bitrate?: number;
	codec?: string;
	frameRate?: number;
	subtitles?: boolean;
	[key: string]: any;
}

/**
 * ⚡ Esquema Zod para validación
 */
export const VideoSchema = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string().nullable(),
	path: z.string(),
	hash: z.string(),
	size: z.number(),
	duration: z.number(),
	width: z.number().nullable(),
	height: z.number().nullable(),
	metadata: z.string().nullable(),
	thumbnail: z.unknown().nullable(),
	thumbnailSize: z.number().nullable(),
	thumbnailWidth: z.number().nullable(),
	thumbnailHeight: z.number().nullable(),

	isFavorite: z.boolean(),
	isHidden: z.boolean(),
	isPublic: z.boolean(),
	folderId: z.string(),
	createdAt: z.date(),
	updatedAt: z.date(),
});
