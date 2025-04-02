/**
 * @file Exportaciones principales de transformers para la entidad Property
 * @module transformers/property
 */

// Transformadores principales
export {
    transformProperties, transformProperty, transformPropertyToExtended,
    transformPropertyToWithStats,
    type TransformPropertyOptions
} from './transformer';

// Serializadores
export {
    DEFAULT_PROPERTY_COLOR,
    DEFAULT_PROPERTY_EMOJI,
    extendProperties,
    extendProperty,
    fromPrismaProperty,
    generatePropertyColor,
    generatePropertyEmoji,
    toPrismaProperty,
    toRelatedProperty as toPropertyRelated,
    validateProperty,
    type PropertyTransformOptions
} from './serializers';

// Mappers
export {
    toCreatePropertyData,
    toRelatedProperty,
    toSearchFilters,
    toSearchOptions,
    toSearchResult,
    toUpdatePropertyData
} from './mappers';

