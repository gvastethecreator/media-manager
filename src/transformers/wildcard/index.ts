/**
 * @file Punto de entrada para los transformadores de la entidad Wildcard.
 * @module transformers/wildcard
 * @description Exporta las funciones de transformación canónicas para Wildcard.
 * @see /src/transformers/wildcard/mappers.ts
 * @see /src/transformers/wildcard/transformer.ts
 * @updated 2025-01-27
 */

export { toWildcardWithStats } from './mappers';
export { type WildcardComplete, transformWildcard } from './transformer';
