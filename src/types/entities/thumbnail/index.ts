/**
 * @file Barrel consolidado para tipos de Thumbnail
 * Unifica exportaciones evitando duplicados (resuelve errores TS2300 / TS2459)
 * Fuente de verdad: base.ts (canónico) + enums.ts
 * types.ts queda como legacy parcial (solo metadata opcional mientras se migra)
 */

// Canónicos
export type {
	ThumbnailBase,
	ThumbnailCreateInput,
	ThumbnailStatistics,
	ThumbnailUpdateInput,
	ThumbnailWithStats,
} from './base';
// NOTA: ThumbnailFormat se expone SOLO desde enums.ts para evitar duplicación
export { ThumbnailFormat, ThumbnailQuality } from './enums';
// Legacy (mantener mientras se elimina dependencia en código antiguo)
export type { ThumbnailMetadata } from './types';
export { thumbnailBaseSchema } from './types';
