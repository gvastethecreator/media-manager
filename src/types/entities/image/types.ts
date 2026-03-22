/**
 * @file Tipos canónicos para la entidad Image
 * @module types/entities/image/types
 * @description Estructura unificada y validada para Image. Todos los campos clave son obligatorios.
 * Última migración: 2025-01-27
 */

import { z } from 'zod';
import { BaseEntitySchema } from '@/types/common/base';
import { MetadataFieldsSchema, UIFieldsSchema } from '@/types/common/transformer';

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
	thumbnail: z.string().nullable().optional(),
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
	addedAt: Date;
	createdAt: Date;
	description: string | null;
	folderId: string;
	hash: string;
	height: number;
	id: string;
	isFavorite: boolean;
	metadata: string | null;
	name: string;
	noteId: string | null;
	path: string;
	size: number;
	thumbnail: string | null;
	thumbnailError: string | null;
	thumbnailErrorAt: Date | null;
	thumbnailHeight: number | null;
	thumbnailMimeType: string | null;
	thumbnailOptimizedAt: Date | null;
	thumbnailSize: number | null;
	thumbnailWidth: number | null;
	updatedAt: Date;
	width: number;
}

/**
 * 📝 Datos para crear una Image
 */
export interface ImageCreateInput {
	// Relaciones opcionales
	albums?: string[];
	characters?: string[];
	collections?: string[];
	concepts?: string[];
	description?: string | null;
	folderId: string;
	groups?: string[];
	hash: string;
	height: number;
	isFavorite?: boolean;
	metadata?: string | null;
	name: string;
	notes?: string[];
	path: string;
	places?: string[];
	prompts?: string[];
	properties?: string[];
	size: number;
	tags?: string[];
	width: number;
	wildcards?: string[];
	worldItems?: string[];
}

/**
 * 📝 Datos para actualizar una Image
 */
export interface ImageUpdateInput {
	// Relaciones opcionales
	albums?: string[];
	characters?: string[];
	collections?: string[];
	concepts?: string[];
	description?: string | null;
	folderId?: string | null;
	groups?: string[];
	isFavorite?: boolean;
	metadata?: string | null;
	name?: string;
	notes?: string[];
	places?: string[];
	prompts?: string[];
	properties?: string[];
	tags?: string[];
	wildcards?: string[];
	worldItems?: string[];
}

/**
 * 🔎 Filtros de búsqueda para Image
 */
export interface ImageFilters {
	albums?: string[];
	aspectRatios?: string[];
	collections?: string[];
	colorTemperatures?: ('warm' | 'neutral' | 'cool')[];
	dateRange?: {
		start?: Date;
		end?: Date;
	};
	dimensionRange?: {
		minWidth?: number;
		maxWidth?: number;
		minHeight?: number;
		maxHeight?: number;
	};
	folders?: string[];
	hasError?: boolean;
	hasMetadata?: boolean;
	hasThumbnail?: boolean;
	onlyFavorites?: boolean;
	qualityRange?: {
		min?: number;
		max?: number;
	};
	searchQuery?: string;
	sizeRange?: {
		min?: number;
		max?: number;
	};
	tags?: string[];
	technicalGrades?: ('A' | 'B' | 'C' | 'D')[];
}

/**
 * 🔎 Opciones de búsqueda para Image
 */
export interface ImageSearchOptions {
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
	orderBy?: {
		[key in keyof ImageBase]?: 'asc' | 'desc';
	};
	skip?: number;
	take?: number;
	where?: ImageFilters;
}

/**
 * 📊 Resultado de búsqueda de Images
 */
export interface ImageSearchResult {
	hasMore: boolean;
	items: ImageComplete[];
	total: number;
}

/**
 * 🛠️ Opciones para el transformer de Image
 */
export interface ImageTransformerOptions {
	customFields?: (keyof ImageComplete)[];
	deserializeMetadata?: boolean;
	includeCount?: boolean;
	includeRelations?: boolean;
	includeThumbnail?: boolean;
	includeUI?: boolean;
	validateFields?: boolean;
}

/**
 * 📊 Metadatos de imagen parseados
 */
export interface ImageMetadata {
	ai?: ImageAIMetadata;
	analysis?: ImageAnalysis;
	bitDepth?: number;
	colorSpace?: string;
	compression?: string;
	dpi?: {
		x: number;
		y: number;
	};
	exif?: ImageEXIFData;
	format?: string;
	hasAlpha?: boolean;
	icc?: Record<string, unknown>;
	iptc?: Record<string, unknown>;
	orientation?: number;
	xmp?: Record<string, unknown>;
}

/**
 * 📸 Datos EXIF de imagen
 */
export interface ImageEXIFData {
	artist?: string;
	copyright?: string;
	dateTime?: string;
	dateTimeDigitized?: string;
	dateTimeOriginal?: string;
	exposureTime?: string;
	flash?: string;
	fNumber?: number;
	focalLength?: string;
	gps?: {
		latitude?: number;
		longitude?: number;
		altitude?: number;
	};
	iso?: number;
	lensModel?: string;
	make?: string;
	model?: string;
	software?: string;
	whiteBalance?: string;
}

/**
 * 🤖 Metadatos de AI
 */
export interface ImageAIMetadata {
	cfgScale?: number;
	clipSkip?: number;
	extraParameters?: Record<string, unknown>;
	generatedAt?: Date;
	guidance?: number;
	model?: string;
	negativePrompt?: string;
	processingTime?: number;
	prompt?: string;
	sampler?: string;
	scheduler?: string;
	seed?: number;
	steps?: number;
	strength?: number;
}

/**
 * 🔬 Análisis de imagen
 */
export interface ImageAnalysis {
	averageBrightness?: number;
	brands?: string[];
	celebrities?: string[];
	confidenceScores?: Record<string, number>;
	contrast?: number;
	dominantColors?: string[];
	emotions?: string[];
	faces?: number;
	landmarks?: string[];
	noise?: number;
	objects?: string[];
	safetyRating?: 'safe' | 'moderate' | 'adult';
	scenes?: string[];
	sharpness?: number;
	text?: string[];
}

/**
 * 🔗 Interfaz para imágenes relacionadas
 */
export interface RelatedImage {
	id: string;
	name: string;
	relationship: string;
	similarity: number;
	thumbnailUrl: string;
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
	autoPlay: boolean;
	enableAnimations: boolean;
	enableFullscreen: boolean;
	enableZoom: boolean;
	gridSize: 'small' | 'medium' | 'large' | 'xl';
	groupBy: 'folder' | 'date' | 'tag' | 'album' | 'quality' | null;
	showDimensions: boolean;
	showFavorites: boolean;
	showFilenames: boolean;
	showFileSize: boolean;
	showMetadata: boolean;
	showThumbnails: boolean;
	sortBy: ImageSortOption;
	sortDirection: 'asc' | 'desc';
	viewMode: ImageViewMode;
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

export type ImageValidated = z.infer<typeof ImageSchema>;

/**
 * 🖼️ Image con propiedades extendidas para UI y relaciones
 */
export interface ImageExtended extends ImageBase {
	// Conteos (siempre presentes en ImageWithStats)
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
	// Relaciones (simplificadas para evitar dependencias circulares)
	albums?: any[];
	characters?: any[];
	collections?: any[];
	concepts?: any[];
	folder?: any;
	groups?: any[];
	notes?: any[];
	places?: any[];
	prompts?: any[];
	properties?: any[];
	tags?: any[];
	wildcards?: any[];
	worldItems?: any[];
}

/**
 * 🎯 Tipo completo para Image con todas las relaciones
 * @deprecated Usar ImageWithStats en su lugar
 */
export interface ImageComplete extends ImageExtended {
	// Alias para compatibilidad
}

/**
 * 📊 Image con estadísticas
 */
export interface ImageWithStats extends ImageExtended {
	averageSize?: number;
	dimensions?: {
		width: number;
		height: number;
		aspectratio: number;
		orientation: 'landscape' | 'portrait' | 'square';
	};
	statistics?: {
		views: number;
		likes: number;
		shares: number;
		downloads: number;
		qualityScore: number;
		aestheticScore: number;
		technicalScore: number;
		popularityScore: number;
		lastViewedAt?: Date;
		lastLikedAt?: Date;
		lastSharedAt?: Date;
		lastDownloadedAt?: Date;
	};
	url?: string;
}

/**
 * 🗂️ Estado del slice de imágenes para gestión de estado
 */
export interface ImageCoreSlice {
	error: string | null;
	filters: ImageSearchOptions;
	hasMore: boolean;
	images: ImageBase[];
	loading: boolean;
	selectedImageId: string | null;
	totalCount: number;
}
