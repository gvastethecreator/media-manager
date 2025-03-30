/**
 * @file Exportaciones principales de transformers para la entidad Property
 * @module transformers/property
 */

// Serializadores
export {
    DEFAULT_PROPERTY_COLOR,
    DEFAULT_PROPERTY_EMOJI,
    PropertyTransformOptions,
    extendProperties,
    extendProperty,
    fromPrismaProperty,
    generatePropertyColor,
    generatePropertyEmoji, toPrismaProperty, toRelatedProperty as toPropertyRelated, validateProperty
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

// Exportación predeterminada
export default {
  // Serializadores
  fromPrismaProperty,
  toPrismaProperty,
  validateProperty,
  extendProperty,
  extendProperties,

  // Mappers
  toCreatePropertyData,
  toUpdatePropertyData,
  toSearchOptions,
  toSearchFilters,
  toSearchResult,
  toRelatedProperty
};

