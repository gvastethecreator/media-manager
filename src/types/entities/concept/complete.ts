/**
 * @file Tipos completos para la entidad Concept con campos JSON deserializados
 * @module types/entities/concept/complete
 */

import type { ConceptBase, ConceptWithRelations } from './types';

/**
 * Interfaz para Concept con campos JSON deserializados
 */
export interface ConceptComplete extends Omit<ConceptBase, 'tags'> {
  /**
   * Tags deserializados como array
   */
  tags: string[];
}

/**
 * Interfaz para Concept con relaciones y campos JSON deserializados
 */
export interface ConceptWithRelationsComplete extends Omit<ConceptWithRelations, 'tags'> {
  /**
   * Tags deserializados como array
   */
  tags: string[];
}

/**
 * Tipo para transformación completa de entidades con relaciones
 */
export type ConceptCompleteTransform<T extends ConceptBase> = Omit<T, 'tags'> & {
  tags: string[];
};