/**
 * @file Punto de entrada para los transformadores de la entidad WorldItem.
 * @module transformers/world-item
 * @description Exporta las funciones de transformación canónicas para WorldItem.
 * @see /src/transformers/world-item/mappers.ts
 * @see /src/transformers/world-item/transformer.ts
 * @updated 2025-01-27
 */

export { toWorldItemWithStats } from './mappers';
export { type WorldItemComplete, fromDrizzleWorldItem } from './transformer';
