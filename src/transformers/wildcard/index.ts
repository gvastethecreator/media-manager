/**
 * @file Punto de entrada para los transformadores de la entidad Wildcard.
 * @module transformers/wildcard
 * @description Exporta de forma controlada las funciones de mapeo y transformación para la entidad Wildcard.
 */

export {
	mapCreateWildcardData,
	// Alias para compatibilidad
	mapCreateWildcardDataToPrisma,
	mapUpdateWildcardData,
	mapUpdateWildcardDataToPrisma,
	mapWildcardFilters,
	toWildcardWithStats,
} from './mappers';

export { fromDrizzleWildcard, transformWildcard, type WildcardComplete } from './transformer';
