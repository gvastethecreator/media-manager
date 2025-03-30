/**
 * @file Exportaciones para el transformer de Concept
 * @module transformers/concept
 */

// Serializadores
export {

    // Tipos
    ConceptTransformOptions, deserializeTags, extendConcept,
    extendConcepts, fromConceptComplete,
    // Funciones principales
    fromPrismaConcept,
    // Funciones de deserialización/serialización
    serializeTags,
    // Funciones obsoletas
    toConceptComplete, toConceptExtendedComplete, toConceptWithRelationsComplete, toConceptWithRelationsExtendedComplete,
    toConceptWithStatsComplete, toExtendedConcept, toPrismaConcept,
    // Funciones de validación y extensión
    validateConcept
} from './serializers';

// Mappers
export {
    filterConcepts,
    // Funciones obsoletas
    mapCreateConceptDataToPrisma,
    mapUpdateConceptDataToPrisma, paginateConcepts,
    processConcepts, sortConcepts,
    // Funciones principales
    toCreateConceptData, toRelatedConcept, toSearchFilters, toSearchOptions, toSearchResult, toUpdateConceptData
} from './mappers';

// Exportación predeterminada
export default {
  // Serializers
  fromPrismaConcept,
  toPrismaConcept,
  serializeTags,
  deserializeTags,
  validateConcept,
  extendConcept,

  // Mappers
  toCreateConceptData,
  toUpdateConceptData,
  toSearchOptions,
  toSearchFilters,
  toSearchResult,
  toRelatedConcept
};

