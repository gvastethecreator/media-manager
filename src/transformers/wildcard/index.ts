/**
 * @file Exportaciones para el transformer de Wildcard
 * @module transformers/wildcard
 */

// Exportar mappers
// Exportar funciones específicas de mappers que sí se usan
export { mapCreateWildcardDataToPrisma, mapUpdateWildcardDataToPrisma, mapWildcardFiltersToPrisma } from './mappers';

// Exportar serializadores
export {
	parseWildcardChildren,
	serializeWildcardChildren,
	toRelatedWildcard,
} from './serializers';
// Exportar tipos explícitamente
export type { TransformWildcardOptions } from './transformer';
// Exportar transformadores
export {
	transformWildcard,
	transformWildcards,
	transformWildcardToExtended,
	transformWildcardToWithStats,
} from './transformer';
