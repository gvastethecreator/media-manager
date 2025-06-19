/**
 * @file Punto de entrada para los transformadores de la entidad Wildcard.
 * @module transformers/wildcard
 * @description Exporta de forma controlada las funciones de mapeo y transformación para la entidad Wildcard.
 */

// De mappers.ts
export {
	mapCreateWildcardDataToPrisma,
	mapUpdateWildcardDataToPrisma,
	mapWildcardSearchOptionsToPrisma,
} from './mappers';

// De transformer.ts
export { fromPrismaWildcard, fromPrismaWildcards } from './transformer';
