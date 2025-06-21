/**
 * @file Tipos canónicos para la entidad Video
 * @module types/entities/video/types
 * @warning ⚠️ No importar tipos de Prisma ni de archivos legacy. Usar solo estos tipos en transformers, server actions y validaciones.
 * @description Estructura unificada y validada para Video.
 * Última migración: 2025-06-18
 */

import { z } from 'zod';
import type { AlbumComplete } from '../album';
import type { CharacterComplete } from '../character';
import type { CollectionComplete } from '../collection';
import type { ConceptComplete } from '../concept';
import type { GroupComplete } from '../group';
import type { NoteComplete } from '../note';
import type { PlaceComplete } from '../place';
import type { PromptComplete } from '../prompt';
import type { PropertyComplete } from '../property';
import type { TagComplete } from '../tag';
import type { WildcardComplete } from '../wildcard';
import type { WorldItemComplete } from '../world-item';
import { VideoFormat } from './enums';

/**
 * Metadatos del video
 */
export interface VideoMetadata {
	duration: number;
	width: number;
	height: number;
	format: VideoFormat;
	size: number;
	codec?: string;
	bitrate?: number;
	frameRate?: number;
	aspectRatio?: string;
	audioCodec?: string;
	audioChannels?: number;
	audioSampleRate?: number;
	rotation?: number;
	hasAudio?: boolean;
	subtitleLanguages?: string[];
	audioLanguages?: string[];
	creationDate?: Date;
	location?: {
		latitude: number;
		longitude: number;
		name?: string;
	};
	camera?: {
		make?: string;
		model?: string;
		software?: string;
	};
}

/**
 * Tipo base canónico para Video
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
	thumbnail: Buffer | null;
	thumbnailSize: number | null;
	thumbnailWidth: number | null;
	thumbnailHeight: number | null;
	isPublic: boolean;
	isFavorite: boolean;
	folderId: string;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Relaciones principales (solo ids o any[] para evitar dependencias cruzadas)
 */
export interface VideoRelations {
	albums?: AlbumComplete[];
	collections?: CollectionComplete[];
	tags?: TagComplete[];
	characters?: CharacterComplete[];
	places?: PlaceComplete[];
	worldItems?: WorldItemComplete[];
	concepts?: ConceptComplete[];
	prompts?: PromptComplete[];
	notes?: NoteComplete[];
	wildcards?: WildcardComplete[];
	properties?: PropertyComplete[];
	groups?: GroupComplete[];
}

/**
 * UI y metadatos adicionales
 */
export interface VideoUI {
	thumbnailUrl?: string;
	isSelected?: boolean;
}

/**
 * Video completo
 */
export interface VideoComplete extends VideoBase, VideoRelations, VideoUI {}

/**
 * Input para creación
 */
export type VideoCreateInput = Omit<VideoBase, 'id' | 'createdAt' | 'updatedAt'> & {
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
};

/**
 * Input para actualización
 */
export type VideoUpdateInput = Partial<Omit<VideoBase, 'id'>> &
	Partial<{
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
	}> &
	Partial<VideoUI>;

/**
 * Esquema Zod para validación de Video
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

/**
 * Filtros para búsqueda de videos
 */
export interface VideoFilters {
	search?: string;
	folders?: string[];
	tags?: string[];
	dateRange?: {
		start?: Date;
		end?: Date;
	};
	isFavorite?: boolean;
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
}

/**
 * Datos para crear un video
 */
export interface CreateVideoData {
	name: string;
	path: string;
	folderId: string;
	hash: string;
	size: number;
	duration: number;
	width?: number;
	height?: number;
	description?: string;
	metadata?: string;
}

/**
 * Datos para actualizar un video
 */
export interface UpdateVideoData {
	name?: string;
	description?: string;
	isFavorite?: boolean;
	isPublic?: boolean;
}

/**
 * Video extendido con relaciones completas
 */
export interface VideoExtended extends VideoComplete {
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
 * Opciones de paginación para videos
 */
export interface VideoPaginationOptions {
	page?: number;
	limit?: number;
	sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'size' | 'duration';
	sortDirection?: 'asc' | 'desc';
}

/**
 * Resultado paginado de videos
 */
export interface PaginatedVideos {
	videos: VideoExtended[];
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
 * Estadísticas de videos
 */
export interface VideoStats {
	total: number;
	totalSize: number;
	totalDuration: number;
	averageDuration: number;
	byFormat: Record<string, number>;
	byFolder: Record<string, number>;
	favorites: number;
	public: number;
	withThumbnails: number;
}

// 🟢 Documentación y advertencia:
// - Usar solo estos tipos en transformers, server actions y validaciones.
// - No importar tipos de Prisma ni de archivos legacy.
// - Validar siempre con VideoSchema antes de persistir.
