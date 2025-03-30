/**
 * @file Tipos para la entidad Concept
 * @module types/entities/concept/concept-types
 */

import type { Prisma } from '@prisma/client';
import type { Album } from '../album';
import type { Character } from '../character';
import type { Collection } from '../collection';
import type { Group } from '../group';
import type { Image } from '../image';
import type { Note } from '../note';
import type { Place } from '../place';
import type { Prompt } from '../prompt';
import type { Property } from '../property';
import type { Tag } from '../tag';
import type { Video } from '../video';
import type { Wildcard } from '../wildcard';
import type { WorldItem } from '../world-item';

/**
 * Tipo base para Concept derivado del schema de Prisma
 *
 * Campos JSON:
 * - tags: Almacenado como string en formato JSON, representa un array de etiquetas.
 */
export type ConceptBase = Prisma.ConceptGetPayload<Record<string, never>>;

/**
 * Interfaz para crear un nuevo concepto
 */
export interface CreateConceptData {
  name: string;
  emoji?: string;
  color?: string;
  description?: string | null;
  content?: string;
  category?: string;
  tags?: string[] | string; // Acepta tanto array como string JSON
  featuredImage?: string | null;
  isFavorite?: boolean;
  // Campos para relaciones
  groupIds?: string[];
  propertyIds?: string[];
  wildcardIds?: string[];
}

/**
 * Interfaz para actualizar un concepto existente
 */
export interface UpdateConceptData extends Partial<CreateConceptData> {}

/**
 * Interfaz extendida que incluye relaciones
 */
export interface ConceptWithRelations extends ConceptBase {
  // Relaciones con contenido
  images?: Image[];
  videos?: Video[];

  // Relaciones con entidades principales
  albums?: Album[];
  collections?: Collection[];
  tagEntities?: Tag[]; // Renombrado para evitar conflicto con campo tags
  characters?: Character[];
  places?: Place[];
  worldItems?: WorldItem[];
  prompts?: Prompt[];
  notes?: Note[];
  wildcards?: Wildcard[];
  properties?: Property[];
  groups?: Group[];

  // Contadores
  _count?: {
    images?: number;
    videos?: number;
    albums?: number;
    collections?: number;
    tags?: number;
    characters?: number;
    places?: number;
    worldItems?: number;
    prompts?: number;
    notes?: number;
    wildcards?: number;
    properties?: number;
    groups?: number;
  };
}

/**
 * Estadísticas para conceptos
 */
export interface ConceptStats {
  images?: number;
  videos?: number;
  albums?: number;
  collections?: number;
  tags?: number;
  characters?: number;
  places?: number;
  worldItems?: number;
  prompts?: number;
  notes?: number;
  wildcards?: number;
  properties?: number;
  groups?: number;
}

/**
 * Interfaz para concepto con estadísticas incluidas
 */
export interface ConceptWithStats extends ConceptBase {
  _count: ConceptStats;
}

/**
 * Tipo para la relación de concepto con otras entidades
 */
export interface ConceptRelation {
  entityId: string;
  entityType: string;
  conceptId: string;
}

/**
 * Interfaz para filtros de búsqueda de conceptos
 */
export interface ConceptFilters {
  searchQuery?: string;
  categories?: string[];
  onlyFavorites?: boolean;
  contentContains?: string;
}

/**
 * Enumeración para criterios de ordenación
 */
export enum ConceptSortCriteria {
  NAME_ASC = 'name:asc',
  NAME_DESC = 'name:desc',
  CREATED_ASC = 'created:asc',
  CREATED_DESC = 'created:desc',
  UPDATED_ASC = 'updated:asc',
  UPDATED_DESC = 'updated:desc',
}

/**
 * Mapa de propiedades para ordenación
 */
export const CONCEPT_SORT_PROPERTY_MAP: Record<ConceptSortCriteria, string> = {
  [ConceptSortCriteria.NAME_ASC]: 'name',
  [ConceptSortCriteria.NAME_DESC]: 'name',
  [ConceptSortCriteria.CREATED_ASC]: 'createdAt',
  [ConceptSortCriteria.CREATED_DESC]: 'createdAt',
  [ConceptSortCriteria.UPDATED_ASC]: 'updatedAt',
  [ConceptSortCriteria.UPDATED_DESC]: 'updatedAt',
};