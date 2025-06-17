/**
 * @file Exportaciones principales de transformers para la entidad Property
 * @module transformers/property
 */

// Mappers
export {
	toCreatePropertyData,
	toRelatedProperty,
	toSearchFilters,
	toSearchOptions,
	toSearchResult,
	toUpdatePropertyData,
} from './mappers';

// Serializadores
export {
	DEFAULT_PROPERTY_COLOR,
	DEFAULT_PROPERTY_EMOJI,
	extendProperties,
	extendProperty,
	fromPrismaProperty,
	generatePropertyColor,
	generatePropertyEmoji,
	type PropertyTransformOptions,
	toPrismaProperty,
	toRelatedProperty as toPropertyRelated,
	validateProperty,
} from './serializers';
// Transformadores principales
export {
	type TransformPropertyOptions,
	transformProperties,
	transformProperty,
	transformPropertyToExtended,
	transformPropertyToWithStats,
} from './transformer';
