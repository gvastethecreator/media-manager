/**
 * @file Punto de entrada para los transformadores de la entidad Thumbnail.
 * @module transformers/thumbnail
 * @description Exporta las funciones de transformación canónicas para Thumbnail.
 * @see /src/transformers/thumbnail/mappers.ts
 * @see /src/transformers/thumbnail/transformer.ts
 * @updated 2025-01-27
 */

// Exportar tipos
export type { ThumbnailBase, ThumbnailStatistics, ThumbnailWithStats } from '../../types/entities/thumbnail/base';

export { toThumbnailWithStats } from './mappers';
export { type ThumbnailComplete, transformThumbnail } from './transformer';
