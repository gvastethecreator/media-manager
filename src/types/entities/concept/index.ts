/**
 * @file Exporta todos los tipos relacionados con la entidad Concept
 * @module types/entities/concept
 */

// Tipos base y acciones
export * from './actions';
export * from './complete';
export * from './enums';
export * from './extended';
export * from './types';

// Re-exportar ConceptWithRelations como Concept para consistencia con otras entidades
import type { ConceptWithRelations } from './types';
export type Concept = ConceptWithRelations;
