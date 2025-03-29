/**
 * @file Exportaciones principales de tipos para la entidad Concept
 * @module types/entities/concept
 */

export * from './base';
export * from './concept-types';
export * from './enums';
export * from './extended';

// Alias común para el tipo principal
export type { ConceptWithRelations as Concept } from './concept-types';

