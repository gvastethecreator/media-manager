/**
 * @file Punto de entrada para los tipos de Thumbnail
 * @module types/entities/thumbnail
 */

export type {
	ThumbnailComplete,
	ThumbnailExtended,
	ThumbnailStats,
	ThumbnailWithStats,
} from './extended';

export type {
	ThumbnailBase,
	ThumbnailCreateInput,
	ThumbnailMetadata,
	ThumbnailRelations,
	ThumbnailUpdateInput,
} from './types';
export {
	ThumbnailFormat,
	ThumbnailQuality,
	thumbnailBaseSchema,
} from './types';

// Añadir aquí exportaciones adicionales si es necesario
