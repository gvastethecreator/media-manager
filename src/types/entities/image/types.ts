import { type BaseEntity, BaseEntitySchema, MetadataFieldsSchema, UIFieldsSchema } from '@/types/common/transformer';
import { z } from 'zod';
import type { ActivityComplete } from '../activity';
import type { AlbumComplete } from '../album';
import type { CharacterComplete } from '../character';
import type { CollectionComplete } from '../collection';
import type { ConceptComplete } from '../concept';
import type { FolderComplete } from '../folder';
import type { GroupComplete } from '../group';
import type { NoteComplete } from '../note';
import type { PlaceComplete } from '../place';
import type { ProfileComplete } from '../profile';
import type { PromptComplete } from '../prompt';
import type { PropertyComplete } from '../property';
import type { TagComplete } from '../tag';
import type { UploadedImageComplete } from '../uploaded-image';
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
 * 🔄 Tipo base para Image
 */
export interface ImageBase extends BaseEntity {
	id: string;
	name: string;
	description?: string | null;
	path: string;
	hash: string;
	size: number;
	width: number;
	height: number;
	metadata?: string | null;
	isFavorite: boolean;
	folderId: string | null; // Debe ser null si no hay folder
	addedAt: Date;
	createdAt: Date;
	updatedAt: Date;
	// ELIMINADO: sortBy y filters no existen en el modelo Image de Prisma
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
 * 🔗 Relaciones de Image
 */
export interface ImageRelations {
	folder?: FolderComplete | null;
	stats?: ImageStatsBase | null;
	activities?: ActivityComplete[];
	uploadedImages?: UploadedImageComplete[];
	profiles?: ProfileComplete[];
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
 * 📊 Conteos de relaciones de Image
 */
export interface ImageCounts {
	_count?: {
		activities?: number;
		uploadedImages?: number;
		profiles?: number;
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
 * 🎯 Filtros específicos para Image
 */
export interface ImageFilters {
	search?: string;
	folders?: string[];
	tags?: string[];
	dateRange?: {
		start?: Date;
		end?: Date;
	};
	isFavorite?: boolean;
	minWidth?: number;
	maxWidth?: number;
	minHeight?: number;
	maxHeight?: number;
	minSize?: number;
	maxSize?: number;
	hasMetadata?: boolean;
	hasThumbnail?: boolean;
	hasError?: boolean;
}

/**
 * 🔄 Image completa con todas las relaciones
 */
export interface ImageComplete extends Omit<ImageBase, 'metadata'>, ImageThumbnail, ImageRelations, ImageCounts {
	metadata: ImageMetadata | null;
}

/**
 * 🃏 Datos de una imagen para mostrar en una tarjeta, con estadísticas calculadas.
 */
export interface ImageWithStats extends ImageBase, ImageRelations, ImageCounts {
	thumbnailUrl: string;
	metadata: ImageMetadata | null; // Metadatos parseados
	totalAssociations: number;
}

/**
 * 📝 Datos para crear una Image
 */
export type ImageCreateInput = Omit<ImageBase, 'id' | 'createdAt' | 'updatedAt'> &
	Partial<ImageThumbnail> &
	Pick<ImageRelations, 'folder'> &
	Partial<Omit<ImageRelations, 'folder'>>;

/**
 * 📝 Datos para actualizar una Image
 */
export type ImageUpdateInput = Partial<Omit<ImageBase, 'id'>> & Partial<ImageThumbnail> & Partial<ImageRelations>;

/**
 * 🔍 Opciones de búsqueda para Image
 */
export interface ImageSearchOptions {
	skip?: number;
	take?: number;
	orderBy?: {
		[key in keyof ImageBase]?: 'asc' | 'desc';
	};
	where?: ImageFilters;
	include?: {
		[key in keyof ImageRelations]?: boolean;
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
 * 🎯 Opciones para el transformer de Image
 */
export interface ImageTransformerOptions {
	includeRelations?: boolean;
	includeCount?: boolean;
	includeThumbnail?: boolean;
	validateFields?: boolean;
	customFields?: (keyof ImageComplete)[];
}

/**
 * 🖼️ Metadatos de la imagen
 */
export interface ImageMetadata {
	format?: string;
	exif?: Record<string, unknown>;
	iptc?: Record<string, unknown>;
	xmp?: Record<string, unknown>;
	icc?: Record<string, unknown>;
	ai?: ImageAIMetadata;
}

/**
 * 📊 Estadísticas básicas de la imagen
 * NOTA: Campo downloads eliminado - no existe en el esquema Prisma ImageStats
 */
export interface ImageStatsBase {
	id: string;
	imageId: string;
	views: number;
	likes: number;
	// downloads: number; // ❌ ELIMINADO - No existe en esquema Prisma
}

/**
 * 🎨 Configuración visual de la imagen
 */
export interface ImageVisualConfigBase {
	id: string;
	imageId: string;
	config: string;
}

/**
 * 🧠 Metadatos de IA de la imagen
 */
export interface ImageAIMetadata {
	model?: string;
	prompt?: string;
	negativePrompt?: string;
	seed?: number;
	samplingSteps?: number;
	cfgScale?: number;
	samplingMethod?: string;
	extraParameters?: Record<string, unknown>;
}

export interface CreateImageData {
	name: string;
	path: string;
	folderId: string;
	hash: string;
	size: number;
	width: number;
	height: number;
	description?: string;
	metadata?: string;
	presetId?: string | null;
}

export interface UpdateImageData {
	name?: string;
	description?: string;
	presetId?: string | null;
	isFavorite?: boolean;
}

export interface ImageExtended extends ImageBase {
	// Relaciones extendidas y campos enriquecidos
	tags?: any[];
	collections?: any[];
	albums?: any[];
	characters?: any[];
	places?: any[];
	worldItems?: any[];
	concepts?: any[];
	prompts?: any[];
	notes?: any[];
	wildcards?: any[];
	properties?: any[];
	groups?: any[];
	stats?: any;
	folder?: any;
}

/**
 * 🎯 Criterios de ordenamiento para Image
 */
export type ImageSortCriteria =
	| 'name_asc'
	| 'name_desc'
	| 'date_asc'
	| 'date_desc'
	| 'size_asc'
	| 'size_desc'
	| 'width_asc'
	| 'width_desc'
	| 'height_asc'
	| 'height_desc'
	| 'favorite_first'
	| 'favorite_last';

/**
 * 🖼️ Modos de visualización para Image
 */
export type ImageViewMode = 'grid' | 'list' | 'masonry' | 'timeline' | 'map' | 'slideshow';

/**
 * 🎛️ Configuración de vista para Image
 */
export interface ImageViewConfig {
	viewMode: ImageViewMode;
	sortBy: ImageSortCriteria;
	sortDirection: 'asc' | 'desc';
	gridSize: 'small' | 'medium' | 'large';
	showMetadata: boolean;
	showThumbnails: boolean;
	groupBy: 'folder' | 'date' | 'tag' | 'size' | null;
	enableAnimations: boolean;
	autoPlay: boolean; // Para slideshow
	showFavorites: boolean;
}

/**
 * 🔍 Filtro avanzado para Image
 */
export interface ImageFilter {
	field: keyof ImageBase | 'metadata' | 'tags' | 'folder';
	operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'notIn';
	value: any;
}
