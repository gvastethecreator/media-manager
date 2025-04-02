/**
 * @file Exportaciones para el transformer de Wildcard
 * @module transformers/wildcard
 */

// Exportar tipos explícitamente
export type { TransformWildcardOptions } from './transformer';

// Exportar transformadores
export {
    transformWildcard,
    transformWildcardToExtended,
    transformWildcardToWithStats,
    transformWildcards
} from './transformer';

// Exportar serializadores
export {
    parseWildcardChildren,
    serializeWildcardChildren,
    toRelatedWildcard
} from './serializers';

// Exportar mappers
export { } from './mappers';

// Exportar funciones específicas de mappers que sí se usan
export { mapCreateWildcardDataToPrisma, mapUpdateWildcardDataToPrisma, mapWildcardFiltersToPrisma } from './mappers';

