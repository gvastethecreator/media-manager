/**
 * @file Punto de entrada para los transformadores de la entidad Property.
 * @module transformers/property
 * @description Exporta las funciones de transformación canónicas para Property.
 * @see /src/transformers/property/mappers.ts
 * @see /src/transformers/property/transformer.ts
 * @updated 2025-01-27
 */

export { toPropertyWithStats } from './mappers';
export { transformProperty, type PropertyComplete } from './transformer';
