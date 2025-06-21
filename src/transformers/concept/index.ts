/**
 * @file Índice de transformadores para la entidad Concept.
 * @module transformers/concept
 * @description Centraliza la exportación de funciones de transformación y mapeo
 * para la entidad Concept, asegurando una interfaz consistente para el resto de la aplicación.
 */

// --- Exportaciones de Mappers ---
// Se renombran para seguir el patrón de nomenclatura: map[Entidad][Accion]To[Destino]
export {
    createFilter as mapConceptFiltersToPrisma,
    createOrderBy as mapConceptOrderByToPrisma, toSearchOptions as mapConceptSearchOptionsToPrisma, toCreateData as mapCreateConceptDataToPrisma, toUpdateData as mapUpdateConceptDataToPrisma
} from './mappers';

// --- Exportaciones de Transformer ---
// Proporcionan la lógica central de transformación de datos de Prisma al tipo canónico.
export {
    conceptPayload,
    fromPrismaConcept,
    fromPrismaConcepts
} from './transformer';

