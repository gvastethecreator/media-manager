/**
 * @file Punto de entrada para los transformadores de la entidad UploadedImage.
 * @module transformers/uploaded-image
 * @description Exporta las funciones de transformación canónicas para UploadedImage.
 * @see /src/transformers/uploaded-image/mappers.ts
 * @see /src/transformers/uploaded-image/transformer.ts
 * @updated 2025-01-27
 */

export { toUploadedImageExtended } from './mappers';
export { transformToUploadedImageFromDrizzle, type UploadedImageComplete } from './transformer';
