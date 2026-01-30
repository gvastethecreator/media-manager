/**
 * @file Punto de entrada para los transformadores de la entidad UploadedImage.
 * @module transformers/uploaded-image
 * @description Exporta las funciones de transformación canónicas para UploadedImage.
 * @see /src/transformers/uploaded-image/mappers.ts
 * @see /src/transformers/uploaded-image/transformer.ts
 * @updated 2025-01-27
 */

// Exportar tipos
export type {
	UploadedImageBase,
	UploadedImageCreateInput,
	UploadedImageStatistics,
	UploadedImageUpdateInput,
	UploadedImageWithStats,
} from '../../types/entities/uploaded-image/types';
// Adaptadores
export { adaptUploadedImageResultToWithStats } from './adapter';
export { toUploadedImageExtended } from './mappers';
export {
	transformToUploadedImageFromDrizzle as transformUploadedImage,
	transformToUploadedImageWithRelationsFromDrizzle as fromDB,
} from './transformer';
