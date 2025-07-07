/**
 * @file Tipos canónicos para la entidad Image
 * @module types/entities/image/types
 * @description Estructura unificada y validada para Image. Todos los campos clave son obligatorios.
 * Última migración: 2025-01-27
 */

import { z } from 'zod';
import { BaseEntitySchema, MetadataFieldsSchema, UIFieldsSchema } from '@/types/common/transformer';
import type { AlbumWithStats } from '../album';
import type { CharacterWithStats } from '../character';
import type { CollectionWithStats } from '../collection';
import type { ConceptComplete } from '../concept';
import type { FolderComplete } from '../folder';
import type { GroupWithStats } from '../group';
import type { NoteComplete } from '../note';
import type { PlaceComplete } from '../place';
import type { PromptComplete } from '../prompt';
import type { PropertyComplete } from '../property';
import type { TagWithStats } from '../tag';
import type { WildcardComplete } from '../wildcard';
import type { WorldItemComplete } from '../world-item';

/**
 * 🔍 Esquema de validación para Image
 */
export const ImageSchema = z.object({
	...BaseEntitySchema.shape,
	...UIFieldsSchema.shape,
	...MetadataFieldsSchema.shape,
	path: z.string(),
	hash: z.string(),
	size: z.number(),
	width: z.number(),
	height: z.number(),
	metadata: z.string().nullable().optional(),
	thumbnail: z.instanceof(Buffer).nullable().optional(),
	thumbnailSize: z.number().nullable().optional(),
	thumbnailWidth: z.number().nullable().optional(),
	thumbnailHeight: z.number().nullable().optional(),
	thumbnailError: z.string().nullable().optional(),
	thumbnailErrorAt: z.date().nullable().optional(),
	thumbnailOptimizedAt: z.date().nullable().optional(),
	addedAt: z.date(),
});

/**
 * 🖼️ Tipo base canónico para Image
 */
export interface ImageBase {
	id: string;
	name: string;
	description?: string | null;
	path: string;
	hash: string;
	size: number;
	width: number;
	height: number;
	metadata?: string | null; // JSON string en DB
	isFavorite: boolean;
	folderId: string | null;
	addedAt: Date;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * 🖼️ Datos de thumbnail
 */
export interface ImageThumbnail {
	thumbnail?: Buffer | null;
	thumbnailSize?: number | null;
	thumbnailWidth?: number | null;
	thumbnailHeight?: number | null;
	thumbnailError?: string | null;
	thumbnailErrorAt?: Date | null;
	thumbnailOptimizedAt?: Date | null;
}

/**
 * 🔗 Relaciones de Image optimizadas (usando tipos WithStats)
 */
export interface ImageRelations {
	folder?: FolderComplete | null;
	albums?: AlbumWithStats[];
	collections?: CollectionWithStats[];
	tags?: TagWithStats[];
	characters?: CharacterWithStats[];
	places?: PlaceComplete[];
	worldItems?: WorldItemComplete[];
	concepts?: ConceptComplete[];
	prompts?: PromptComplete[];
	notes?: NoteComplete[];
	wildcards?: WildcardComplete[];
	properties?: PropertyComplete[];
	groups?: GroupWithStats[];
}

/**
 * 📊 Estadísticas específicas de Image
 */
export interface ImageStatistics {
	// Conteos de relaciones
	totalAlbums: number;
	totalCollections: number;
	totalTags: number;
	totalCharacters: number;
	totalPlaces: number;
	totalWorldItems: number;
	totalConcepts: number;
	totalPrompts: number;
	totalNotes: number;
	totalWildcards: number;
	totalProperties: number;
	totalGroups: number;
	totalAssociations: number;

	// Métricas técnicas
	megapixels: number;
	aspectRatio: number;
	fileSize: number; // En MB
	dimensions: string; // "1920x1080"

	// Métricas de uso
	views: number;
	likes: number;
	downloads: number;
	shares: number;

	// Análisis de calidad
	qualityScore: number; // 0-100
	technicalGrade: 'A' | 'B' | 'C' | 'D';
	colorTemperature: 'warm' | 'neutral' | 'cool';

	// Metadatos AI
	aiConfidence: number; // 0-100
	autoTags: string[];
	duplicateStatus: 'unique' | 'duplicate' | 'similar';

	lastUpdated: Date;
}

/**
 * 🖼️ Image con estadísticas optimizadas (tipo principal)
 */
export interface ImageWithStats extends ImageBase, ImageRelations, ImageUI {
	statistics: ImageStatistics;
	// Campos derivados calculados
	thumbnailUrl: string;
	fullUrl: string;
	displayName: string;
	parsedMetadata: ImageMetadata | null;
	formattedSize: string;
	formattedDimensions: string;
	aspectRatioLabel: string;
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
 * 📝 Datos para crear una Image
 */
export interface ImageCreateInput {
	name: string;
	description?: string | null;
	path: string;
	hash: string;
	size: number;
	width: number;
	height: number;
	metadata?: string | null;
	isFavorite?: boolean;
	folderId: string;
	// Relaciones opcionales
	albums?: string[];
	collections?: string[];
	tags?: string[];
	characters?: string[];
	places?: string[];
	worldItems?: string[];
	concepts?: string[];
	prompts?: string[];
	notes?: string[];
	wildcards?: string[];
	properties?: string[];
	groups?: string[];
}

/**
 * 📝 Datos para actualizar una Image
 */
export interface ImageUpdateInput {
	name?: string;
	description?: string | null;
	isFavorite?: boolean;
	folderId?: string | null;
	metadata?: string | null;
	// Relaciones opcionales
	albums?: string[];
	collections?: string[];
	tags?: string[];
	characters?: string[];
	places?: string[];
	worldItems?: string[];
	concepts?: string[];
	prompts?: string[];
	notes?: string[];
	wildcards?: string[];
	properties?: string[];
	groups?: string[];
}

/**
 * 🔎 Filtros de búsqueda para Image
 */
export interface ImageFilters {
	searchQuery?: string;
	folders?: string[];
	tags?: string[];
	albums?: string[];
	collections?: string[];
	onlyFavorites?: boolean;
	hasMetadata?: boolean;
	hasThumbnail?: boolean;
	hasError?: boolean;
	dateRange?: {
		start?: Date;
		end?: Date;
	};
	sizeRange?: {
		min?: number;
		max?: number;
	};
	dimensionRange?: {
		minWidth?: number;
		maxWidth?: number;
		minHeight?: number;
		maxHeight?: number;
	};
	qualityRange?: {
		min?: number;
		max?: number;
	};
	aspectRatios?: string[];
	colorTemperatures?: ('warm' | 'neutral' | 'cool')[];
	technicalGrades?: ('A' | 'B' | 'C' | 'D')[];
}

/**
 * 🔎 Opciones de búsqueda para Image
 */
export interface ImageSearchOptions {
	skip?: number;
	take?: number;
	orderBy?: {
		[key in keyof ImageBase]?: 'asc' | 'desc';
	};
	where?: ImageFilters;
	include?: {
		albums?: boolean;
		collections?: boolean;
		tags?: boolean;
		characters?: boolean;
		places?: boolean;
		worldItems?: boolean;
		concepts?: boolean;
		prompts?: boolean;
		notes?: boolean;
		wildcards?: boolean;
		properties?: boolean;
		groups?: boolean;
		folder?: boolean;
		_count?: boolean;
	};
}

/**
 * 📊 Resultado de búsqueda de Images
 */
export interface ImageSearchResult {
	items: ImageComplete[];
	total: number;
	hasMore: boolean;
}

/**
 * 🛠️ Opciones para el transformer de Image
 */
export interface ImageTransformerOptions {
	includeRelations?: boolean;
	includeCount?: boolean;
	includeThumbnail?: boolean;
	validateFields?: boolean;
	deserializeMetadata?: boolean;
	includeUI?: boolean;
	customFields?: (keyof ImageComplete)[];
}

/**
 * 📊 Metadatos de imagen parseados
 */
export interface ImageMetadata {
	format?: string;
	compression?: string;
	colorSpace?: string;
	bitDepth?: number;
	hasAlpha?: boolean;
	orientation?: number;
	dpi?: {
		x: number;
		y: number;
	};
	exif?: ImageEXIFData;
	iptc?: Record<string, unknown>;
	xmp?: Record<string, unknown>;
	icc?: Record<string, unknown>;
	ai?: ImageAIMetadata;
	analysis?: ImageAnalysis;
}

/**
 * 📸 Datos EXIF de imagen
 */
export interface ImageEXIFData {
	make?: string;
	model?: string;
	software?: string;
	dateTime?: string;
	dateTimeOriginal?: string;
	dateTimeDigitized?: string;
	exposureTime?: string;
	fNumber?: number;
	iso?: number;
	focalLength?: string;
	lensModel?: string;
	flash?: string;
	whiteBalance?: string;
	gps?: {
		latitude?: number;
		longitude?: number;
		altitude?: number;
	};
	artist?: string;
	copyright?: string;
}

/**
 * 🤖 Metadatos de AI
 */
export interface ImageAIMetadata {
	model?: string;
	prompt?: string;
	negativePrompt?: string;
	seed?: number;
	steps?: number;
	cfgScale?: number;
	sampler?: string;
	scheduler?: string;
	strength?: number;
	guidance?: number;
	clipSkip?: number;
	extraParameters?: Record<string, unknown>;
	generatedAt?: Date;
	processingTime?: number;
}

/**
 * 🔬 Análisis de imagen
 */
export interface ImageAnalysis {
	dominantColors?: string[];
	averageBrightness?: number;
	contrast?: number;
	sharpness?: number;
	noise?: number;
	faces?: number;
	objects?: string[];
	scenes?: string[];
	emotions?: string[];
	text?: string[];
	landmarks?: string[];
	celebrities?: string[];
	brands?: string[];
	safetyRating?: 'safe' | 'moderate' | 'adult';
	confidenceScores?: Record<string, number>;
}

/**
 * 🔗 Interfaz para imágenes relacionadas
 */
export interface RelatedImage {
	id: string;
	name: string;
	thumbnailUrl: string;
	similarity: number;
	relationship: string;
}

/**
 * 🏷️ Enumeraciones y tipos auxiliares
 */
export enum ImageSortCriteria {
	NAME_ASC = 'name:asc',
	NAME_DESC = 'name:desc',
	DATE_ASC = 'date:asc',
	DATE_DESC = 'date:desc',
	SIZE_ASC = 'size:asc',
	SIZE_DESC = 'size:desc',
	DIMENSIONS_ASC = 'dimensions:asc',
	DIMENSIONS_DESC = 'dimensions:desc',
	QUALITY_ASC = 'quality:asc',
	QUALITY_DESC = 'quality:desc',
	VIEWS_ASC = 'views:asc',
	VIEWS_DESC = 'views:desc',
	LIKES_ASC = 'likes:asc',
	LIKES_DESC = 'likes:desc',
}

/**
 * 📋 Opciones de ordenamiento para UI
 */
export enum ImageSortOption {
	NAME = 'name',
	DATE = 'date',
	SIZE = 'size',
	DIMENSIONS = 'dimensions',
	QUALITY = 'quality',
	VIEWS = 'views',
	LIKES = 'likes',
	CREATED_AT = 'createdAt',
	UPDATED_AT = 'updatedAt',
}

/**
 * 🎨 Modos de vista para Images
 */
export enum ImageViewMode {
	GRID = 'grid',
	LIST = 'list',
	MASONRY = 'masonry',
	TIMELINE = 'timeline',
	MAP = 'map',
	SLIDESHOW = 'slideshow',
	COMPARISON = 'comparison',
}

/**
 * 📊 Configuración de vista para Images
 */
export interface ImageViewConfig {
	viewMode: ImageViewMode;
	sortBy: ImageSortOption;
	sortDirection: 'asc' | 'desc';
	gridSize: 'small' | 'medium' | 'large' | 'xl';
	showMetadata: boolean;
	showThumbnails: boolean;
	showFilenames: boolean;
	showDimensions: boolean;
	showFileSize: boolean;
	groupBy: 'folder' | 'date' | 'tag' | 'album' | 'quality' | null;
	enableAnimations: boolean;
	autoPlay: boolean;
	showFavorites: boolean;
	enableZoom: boolean;
	enableFullscreen: boolean;
}

export const IMAGE_SORT_PROPERTY_MAP: Record<ImageSortCriteria, string> = {
	[ImageSortCriteria.NAME_ASC]: 'name',
	[ImageSortCriteria.NAME_DESC]: 'name',
	[ImageSortCriteria.DATE_ASC]: 'addedAt',
	[ImageSortCriteria.DATE_DESC]: 'addedAt',
	[ImageSortCriteria.SIZE_ASC]: 'size',
	[ImageSortCriteria.SIZE_DESC]: 'size',
	[ImageSortCriteria.DIMENSIONS_ASC]: 'width',
	[ImageSortCriteria.DIMENSIONS_DESC]: 'width',
	[ImageSortCriteria.QUALITY_ASC]: 'statistics.qualityScore',
	[ImageSortCriteria.QUALITY_DESC]: 'statistics.qualityScore',
	[ImageSortCriteria.VIEWS_ASC]: 'views',
	[ImageSortCriteria.VIEWS_DESC]: 'views',
	[ImageSortCriteria.LIKES_ASC]: 'likes',
	[ImageSortCriteria.LIKES_DESC]: 'likes',
};

// Tipos inferidos de Zod
export type ImageValidated = z.infer<typeof ImageSchema>;
