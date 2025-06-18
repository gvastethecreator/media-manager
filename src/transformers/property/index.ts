/**
 * @file Exportaciones principales de transformers para la entidad Property
 * @module transformers/property
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
    DEFAULT_PROPERTY_EMOJI, PropertyTransformOptions, extendProperties,
    extendProperty,
    fromPrismaProperty,
    generatePropertyColor,
    generatePropertyEmoji, toPrismaProperty,
    validateProperty
} from './serializers';

// Objeto para mantener compatibilidad con código existente
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