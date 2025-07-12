/**
 * @file Punto de entrada para los transformadores de la entidad Video.
 * @module transformers/video
 * @description Exporta las funciones de transformación canónicas para Video.
 * @see /src/transformers/video/mappers.ts
 * @see /src/transformers/video/transformer.ts
 * @updated 2025-01-27
 */

export { toVideoWithStats } from './mappers';
export { fromDrizzleVideo } from './transformer';
export type { VideoComplete } from '@/types/entities/video/types';
