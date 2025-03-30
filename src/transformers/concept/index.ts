/**
 * @file Exportaciones de transformadores para la entidad Concept
 * @module transformers/concept
 */

// Exportar serializadores
export {
    // Funciones principales
    deserializeTags, extendConcept,
    extendConcepts, fromConceptComplete, serializeTags,
    toConceptComplete, toConceptExtendedComplete,
    toConceptWithRelationsComplete, toConceptWithRelationsExtendedComplete, toConceptWithStatsComplete,
    // Funciones obsoletas, mantenidas por compatibilidad
    /** @deprecated Use toConceptComplete y extendConcept en su lugar */
    toExtendedConcept
} from './serializers';

// Exportar mappers
export {
    // Funciones principales
    filterConcepts,
    // Funciones obsoletas, mantenidas por compatibilidad
    /** @deprecated Use toCreateConceptData en su lugar */
    mapCreateConceptDataToPrisma,
    /** @deprecated Use toUpdateConceptData en su lugar */
    mapUpdateConceptDataToPrisma, paginateConcepts,
    processConcepts,
    sortConcepts,
    toConceptWithStats,
    toCreateConceptData,
    toUpdateConceptData
} from './mappers';

