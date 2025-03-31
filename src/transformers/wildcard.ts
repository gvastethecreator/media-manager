/**
 * @file Transformador de entidad Wildcard
 * @module transformers/wildcard
 * @deprecated Importar directamente desde src/transformers/wildcard/v2
 */

import {
    DEFAULT_WILDCARD_COLOR,
    DEFAULT_WILDCARD_EMOJI,
    WildcardTransformOptions,
    WildcardTransformer,
    extendWildcard,
    extendWildcards,
    fromPrismaWildcard,
    parseChildren,
    toBulkUpdateWildcardData,
    toCreateWildcardData,
    toPrismaWildcard,
    toSearchOptions,
    toUpdateWildcardData,
    toWildcardRelated,
    validateWildcard
} from './wildcard/v2';

// Re-exportar todo para compatibilidad
export {
    DEFAULT_WILDCARD_COLOR,
    DEFAULT_WILDCARD_EMOJI, WildcardTransformOptions, extendWildcard,
    extendWildcards, fromPrismaWildcard, parseChildren, toPrismaWildcard, validateWildcard
};

// Re-exportar funciones de mapeo con nombres compatibles
    export { toBulkUpdateWildcardData, toCreateWildcardData, toWildcardRelated as toRelatedWildcard, toSearchOptions, toUpdateWildcardData };

// Alias para compatibilidad con código existente
export const mapCreateWildcardDataToPrisma = toCreateWildcardData;
export const mapUpdateWildcardDataToPrisma = toUpdateWildcardData;
export const mapBulkUpdateWildcardDataToPrisma = toBulkUpdateWildcardData;
export const mapWildcardToRelated = toWildcardRelated;

export default WildcardTransformer;