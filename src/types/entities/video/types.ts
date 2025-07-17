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

/**
 * 🎥 Enums para Video
 */
export enum VideoFormat {
	MP4 = 'mp4',
	AVI = 'avi',
	MOV = 'mov',
	WMV = 'wmv',
	FLV = 'flv',
	WEBM = 'webm',
	MKV = 'mkv',
	M4V = 'm4v',
	THREE_GP = '3gp',
	OGV = 'ogv',
}

export enum VideoCodec {
	H264 = 'h264',
	H265 = 'h265',
	VP8 = 'vp8',
	VP9 = 'vp9',
	AV1 = 'av1',
	XVID = 'xvid',
	DIVX = 'divx',
}

export enum VideoQuality {
	LOW = 'low', // < 480p
	MEDIUM = 'medium', // 480p-720p
	HIGH = 'high', // 720p-1080p
	ULTRA = 'ultra', // > 1080p
	UNKNOWN = 'unknown',
}

export enum VideoSortCriteria {
	NAME_ASC = 'name:asc',
	NAME_DESC = 'name:desc',
	CREATED_ASC = 'created:asc',
	CREATED_DESC = 'created:desc',
	UPDATED_ASC = 'updated:asc',
	UPDATED_DESC = 'updated:desc',
	DURATION_ASC = 'duration:asc',
	DURATION_DESC = 'duration:desc',
	SIZE_ASC = 'size:asc',
	SIZE_DESC = 'size:desc',
	QUALITY_ASC = 'quality:asc',
	QUALITY_DESC = 'quality:desc',
}

export enum VideoViewMode {
	GRID = 'grid',
	LIST = 'list',
	TIMELINE = 'timeline',
}

/**
 * 📝 Tipo base para Video - definición canónica
 */
export interface VideoBase {
	id: string;
	name: string;
	description: string | null;
	path: string;
	hash: string;
	size: number;
	duration: number;
	width: number | null;
	height: number | null;
	metadata: string | null;
	thumbnail: string | null;
	thumbnailSize: number | null;
	thumbnailWidth: number | null;
	thumbnailHeight: number | null;
	isPublic: boolean;
	isFavorite: boolean;
	isHidden: boolean;
	folderId: string;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * ➕ Input para crear un nuevo video
 */
export interface VideoCreateInput {
	name: string;
	description?: string | null;
	path: string;
	hash: string;
	size: number;
	duration: number;
	width?: number | null;
	height?: number | null;
	metadata?: string | null;
	thumbnail?: Buffer | null;
	thumbnailSize?: number | null;
	thumbnailWidth?: number | null;
	thumbnailHeight?: number | null;
	isPublic?: boolean;
	isFavorite?: boolean;
	folderId: string;

	// Relaciones opcionales por IDs
	albumIds?: string[];
	collectionIds?: string[];
	tagIds?: string[];
	characterIds?: string[];
	placeIds?: string[];
	worldItemIds?: string[];
	conceptIds?: string[];
	promptIds?: string[];
	noteIds?: string[];
	wildcardIds?: string[];
	propertyIds?: string[];
	groupIds?: string[];
}

/**
 * 🔄 Input para actualizar un video
 */
export interface VideoUpdateInput {
	name?: string;
	description?: string | null;
	path?: string;
	size?: number;
	duration?: number;
	width?: number | null;
	height?: number | null;
	metadata?: string | null;
	thumbnail?: Buffer | null;
	thumbnailSize?: number | null;
	thumbnailWidth?: number | null;
	thumbnailHeight?: number | null;
	isPublic?: boolean;
	isFavorite?: boolean;
	folderId?: string;

	// Relaciones opcionales por IDs
	albumIds?: string[];
	collectionIds?: string[];
	tagIds?: string[];
	characterIds?: string[];
	placeIds?: string[];
	worldItemIds?: string[];
	conceptIds?: string[];
	promptIds?: string[];
	noteIds?: string[];
	wildcardIds?: string[];
	propertyIds?: string[];
	groupIds?: string[];
}

/**
 * 🔍 Filtros para búsqueda de videos
 */
export interface VideoFilters {
	search?: string;
	folders?: string[];
	tags?: string[];
	albums?: string[];
	collections?: string[];
	characters?: string[];
	dateRange?: {
		start?: Date;
		end?: Date;
	};
	isFavorite?: boolean;
	isPublic?: boolean;
	qualityLevel?: VideoQuality[];
	minDuration?: number;
	maxDuration?: number;
	minWidth?: number;
	maxWidth?: number;
	minHeight?: number;
	maxHeight?: number;
	minSize?: number;
	maxSize?: number;
	hasMetadata?: boolean;
	hasThumbnail?: boolean;
	hasAudio?: boolean;
	hasSubtitles?: boolean;
	duplicateStatus?: ('unique' | 'duplicate' | 'similar')[];
	minQualityScore?: number;
	technicalGrade?: ('A' | 'B' | 'C' | 'D')[];
}

/**
 * 🔗 Relaciones de Video
 */
export interface VideoRelations {
	albums?: AlbumWithStats[];
	collections?: CollectionWithStats[];
	tags?: TagWithStats[];
	characters?: CharacterWithStats[];
	places?: PlaceComplete[];
	worldItems?: WorldItemWithStats[];
	concepts?: ConceptWithStats[];
	prompts?: PromptComplete[];
	notes?: NoteComplete[];
	wildcards?: WildcardWithStats[];
	properties?: PropertyComplete[];
	groups?: GroupWithStats[];
}

/**
 * 🎥 Video completo con relaciones
 */
export interface VideoComplete extends VideoBase {
	albums?: AlbumWithStats[];
	collections?: CollectionWithStats[];
	tags?: TagWithStats[];
	characters?: CharacterWithStats[];
	places?: PlaceComplete[];
	worldItems?: WorldItemWithStats[];
	concepts?: ConceptWithStats[];
	prompts?: PromptComplete[];
	notes?: NoteComplete[];
	wildcards?: WildcardWithStats[];
	properties?: PropertyComplete[];
	groups?: GroupWithStats[];
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

/**
 * 📄 Opciones de paginación
 */
export interface VideoPaginationOptions {
	page?: number;
	limit?: number;
	sortBy?: VideoSortCriteria;
	sortDirection?: 'asc' | 'desc';
}

/**
 * 🎥 Tipo completo para Video con relaciones y estadísticas
 */
export interface VideoWithStats extends VideoBase {
	entityType: 'video';
	stats: VideoStatistics;
	thumbnailUrl: string | null;
	frameRate?: number;
	videoCodec?: string;
	audioCodec?: string;
	bitrate?: number;
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
	statistics?: VideoStatistics;
}

/**
 * 📊 Resultado paginado de búsqueda
 */
export interface PaginatedVideos {
	videos: VideoWithStats[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
		hasNextPage: boolean;
		hasPreviousPage: boolean;
	};
}

/**
 * 📈 Estadísticas generales de videos
 */
export interface VideoStats {
	total: number;
	totalSize: number;
	totalDuration: number;
	averageDuration: number;
	averageSize: number;
	byFormat: Record<string, number>;
	byQuality: Record<VideoQuality, number>;
	byFolder: Record<string, number>;
	favorites: number;
	public: number;
	withThumbnails: number;
	withAudio: number;
	withSubtitles: number;
	duplicates: number;
	highQuality: number; // Grade A+B
	totalViews: number;
	totalDownloads: number;
}

/**
 * 🎮 Estado de reproducción
 */
export interface VideoPlayState {
	isPlaying: boolean;
	currentTime: number;
	duration: number;
	volume: number;
	isMuted: boolean;
	playbackRate: number;
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
	thumbnail: z.any().nullable(),
	thumbnailSize: z.number().nullable(),
	thumbnailWidth: z.number().nullable(),
	thumbnailHeight: z.number().nullable(),
	isPublic: z.boolean(),
	isFavorite: z.boolean(),
	folderId: z.string(),
	createdAt: z.date(),
	updatedAt: z.date(),
});
