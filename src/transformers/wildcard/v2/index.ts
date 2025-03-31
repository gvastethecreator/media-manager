/**
 * @file Punto de entrada para el transformador de Wildcard (v2)
 * @module transformers/wildcard/v2
 */

// Importar componentes del serializador explícitamente
import {
    DEFAULT_WILDCARD_COLOR,
    DEFAULT_WILDCARD_EMOJI,
    WildcardTransformOptions,
    extendWildcard,
    extendWildcards,
    fromPrismaWildcard,
    parseChildren,
    toPrismaWildcard,
    validateWildcard
} from './serializers';

// Exportar desde serializers
export {
    DEFAULT_WILDCARD_COLOR,
    DEFAULT_WILDCARD_EMOJI,
    WildcardTransformOptions,
    extendWildcard,
    extendWildcards,
    fromPrismaWildcard,
    parseChildren,
    toPrismaWildcard,
    validateWildcard
};

// Importar componentes de mappers
    import {
        toBulkUpdateWildcardData,
        toCreateWildcardData,
        toSearchOptions,
        toUpdateWildcardData,
        toWildcardRelated
    } from './mappers';

// Exportar desde mappers
export {
    toBulkUpdateWildcardData,
    toCreateWildcardData,
    toSearchOptions,
    toUpdateWildcardData,
    toWildcardRelated
};

/**
 * Objeto transformador para Wildcards
 */
export const WildcardTransformer = {
  toPrisma: toPrismaWildcard,
  fromPrisma: fromPrismaWildcard,
  extend: extendWildcard,
  extendMany: extendWildcards,
  validate: validateWildcard,
  parseChildren,
  toRelated: toWildcardRelated,
  toCreateData: toCreateWildcardData,
  toUpdateData: toUpdateWildcardData,
  toBulkUpdateData: toBulkUpdateWildcardData,
  toSearchOptions
};

export default WildcardTransformer;