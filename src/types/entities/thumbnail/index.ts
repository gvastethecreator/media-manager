/**
 * @file Punto de entrada para los tipos de Thumbnail
 * @module types/entities/thumbnail
 * @updated 2025-01-27 - Migrado a estructura canónica Base+Statistics+WithStats
 */

// ✅ EXPORTACIONES PRINCIPALES (estructura canónica)
export type {
	ThumbnailBase,
	// Legacy para compatibilidad temporal
	ThumbnailComplete,
	ThumbnailCreateInput,
	ThumbnailExtended,
	ThumbnailStatistics,
	ThumbnailUpdateInput,
	ThumbnailWithStats,
} from './base';

export { ThumbnailQuality } from './base';

// 🔧 LEGACY: Exportaciones del archivo types.ts (en transición)
export type {
	ThumbnailMetadata,
	ThumbnailRelations,
} from './types';

export {
	ThumbnailFormat,
	thumbnailBaseSchema,
} from './types';
