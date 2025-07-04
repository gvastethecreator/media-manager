/**
 * @file Punto de entrada para los transformadores de la entidad Wildcard.
 * @module transformers/wildcard
 * @description Exporta de forma controlada las funciones de mapeo y transformación para la entidad Wildcard.
 */

export {
	toWildcardWithStats,
	mapCreateWildcardData,
	mapUpdateWildcardData,
	mapWildcardFilters,
	// Alias para compatibilidad
	mapCreateWildcardDataToPrisma,
	mapUpdateWildcardDataToPrisma,
} from './mappers';

export { fromDrizzleWildcard, transformWildcard, type WildcardComplete } from './transformer';
