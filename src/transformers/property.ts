/**
 * @file Archivo principal para transformadores de Property
 * @module transformers/property
 * @deprecated Importar directamente desde 'src/transformers/property/v2'
 */

import PropertyTransformer, {
    DEFAULT_PROPERTY_COLOR,
    DEFAULT_PROPERTY_EMOJI,
    PropertyTransformOptions,
    extendProperties,
    extendProperty,
    fromPrismaProperty,
    generatePropertyColor,
    generatePropertyEmoji,
    toCreatePropertyData,
    toPrismaProperty,
    toRelatedProperty,
    toSearchFilters,
    toSearchOptions,
    toSearchResult,
    toUpdatePropertyData,
    validateProperty
} from './property/v2';

// Re-exportar funciones individualmente
export {
    DEFAULT_PROPERTY_COLOR,
    DEFAULT_PROPERTY_EMOJI,
    PropertyTransformOptions,
    extendProperties,
    extendProperty,
    fromPrismaProperty,
    generatePropertyColor,
    generatePropertyEmoji,
    toCreatePropertyData, toPrismaProperty, toRelatedProperty as toPropertyRelated, // Mantener compatibilidad con nombre antiguo
    toSearchFilters,
    toSearchOptions,
    toSearchResult, toUpdatePropertyData,
    validateProperty
};

// Exportar objeto de compatibilidad como predeterminado
export default PropertyTransformer;