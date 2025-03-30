/**
 * @file Exportaciones de transformadores para la entidad Concept
 * @module transformers/concept
 */

// Exportar serializadores
export {
  deserializeTags,
  extendConcept,
  extendConcepts,
  fromConceptComplete,
  serializeTags,
  toConceptComplete,
  toConceptExtendedComplete,
  toConceptWithRelationsComplete,
  toConceptWithRelationsExtendedComplete,
  toConceptWithStatsComplete,
  // Funciones obsoletas, mantenidas por compatibilidad
  toExtendedConcept
} from './serializers';

// Exportar mappers
export {
  filterConcepts,
  mapCreateConceptDataToPrisma,
  mapUpdateConceptDataToPrisma,
  paginateConcepts,
  processConcepts,
  sortConcepts,
  toConceptWithStats,
  toCreateConceptData,
  toUpdateConceptData
} from './mappers';

