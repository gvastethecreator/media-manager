import { type BaseEntity, BaseEntitySchema, MetadataFieldsSchema, UIFieldsSchema } from '@/types/common/transformer';
import { z } from 'zod';

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
	addedAt: Date;
	sortBy: string;
	filters: string;
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
	folder: { id: string };
	stats?: { id: string };
	activities?: { id: string }[];
	uploadedImages?: { id: string }[];
	profiles?: { id: string }[];
	albums?: { id: string }[];
	collections?: { id: string }[];
	tags?: { id: string }[];
	characters?: { id: string }[];
	places?: { id: string }[];
	worldItems?: { id: string }[];
	concepts?: { id: string }[];
	prompts?: { id: string }[];
	notes?: { id: string }[];
	wildcards?: { id: string }[];
	properties?: { id: string }[];
	groups?: { id: string }[];
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
export interface ImageComplete extends ImageBase, ImageThumbnail, ImageRelations, ImageCounts {}

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
