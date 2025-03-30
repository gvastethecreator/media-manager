/**
 * Módulo de acciones para la entidad Concept
 * Exporta todas las acciones relacionadas con conceptos y sus relaciones
 */

// Acciones básicas de conceptos (CRUD)
export {
  createConcept, getConcept, getConcepts, getConceptWithRelations, updateConcept
} from './concept.actions';

// Acciones para la eliminación de conceptos
export {
  deleteConcept
} from './concept-delete.actions';

// Acciones para la gestión de imágenes relacionadas
export {
  addConceptImage, getConceptImages, removeConceptImage
} from './concept-images.actions';
