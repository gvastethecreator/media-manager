/**
 * @file Punto de entrada para los tipos de Thumbnail
 * @module types/entities/thumbnail
 */

export {
	ThumbnailFormat,
	ThumbnailQuality,
	thumbnailBaseSchema,
} from './types';

export type {
	ThumbnailBase,
	ThumbnailCreateInput,
	ThumbnailMetadata,
	ThumbnailRelations,
	ThumbnailUpdateInput,
} from './types';

export type {
	ThumbnailComplete,
	ThumbnailExtended,
	ThumbnailStats,
	ThumbnailWithStats,
} from './extended';

// Añadir aquí exportaciones adicionales si es necesario
