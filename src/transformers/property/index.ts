/**
 * @file Exportaciones principales de transformers para la entidad Property
 * @module transformers/property
 * @description Este módulo centraliza todas las funciones de transformación para Property.
 * Ultima actualización: 2025-06-18
 */

// Exportar mappers
export {
    toCreatePropertyData,
    toRelatedProperty,
    toSearchFilters,
    toSearchOptions,
    toSearchResult,
    toUpdatePropertyData
} from './mappers';

// Exportar serializadores
export {
    DEFAULT_PROPERTY_COLOR,
    DEFAULT_PROPERTY_EMOJI, extendProperties,
    extendProperty,
    fromPrismaProperty,
    generatePropertyColor,
    generatePropertyEmoji, PropertyTransformOptions, toPrismaProperty,
    validateProperty
} from './serializers';

// Objeto para mantener compatibilidad con código existente
import {
    DEFAULT_PROPERTY_COLOR,
    DEFAULT_PROPERTY_EMOJI,
    extendProperties,
    extendProperty,
    fromPrismaProperty,
    generatePropertyColor,
    generatePropertyEmoji,
    toPrismaProperty,
    validateProperty
} from './serializers';

import {
    toCreatePropertyData,
    toRelatedProperty,
    toSearchFilters,
    toSearchOptions,
    toSearchResult,
    toUpdatePropertyData
} from './mappers';

const PropertyTransformer = {
    // Serializadores
    fromPrismaProperty,
    toPrismaProperty,
    validateProperty,
    extendProperty,
    extendProperties,
    generatePropertyColor,
    generatePropertyEmoji,
    DEFAULT_PROPERTY_COLOR,
    DEFAULT_PROPERTY_EMOJI,

    // Mappers
    toCreatePropertyData,
    toUpdatePropertyData,
    toSearchOptions,
    toSearchFilters,
    toSearchResult,
    toRelatedProperty,
};

export default PropertyTransformer;