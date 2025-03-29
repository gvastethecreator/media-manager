/**
 * @file Tipos para la entidad Concept
 * @module types/entities/concept/concept-types
 */

import type { Album } from '../album/types';
import type { Character } from '../character/character-types';
import type { Collection } from '../collection/collection-types';
import type { Group } from '../group/group-types';
import type { Image } from '../image/index';
import type { Note } from '../note/note-types';
import type { Place } from '../place/place-types';
import type { Prompt } from '../prompt/prompt-types';
import type { Property } from '../property/property-types';
import type { Tag } from '../tag/tag-types';
import type { Video } from '../video/types';
import type { Wildcard } from '../wildcard/wildcard-types';
import type { WorldItem } from '../world-item/world-item-types';

/**
 * Interfaz base para concepto
 */
export interface ConceptBase {
  id: string;
  name: string;
  emoji: string;
  color: string;
  description: string | null;
  content: string;
  category: string;
  featuredImage: string | null;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
}

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
  tags?: Tag[];
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
 * Interfaz para crear un concepto
 */
export interface CreateConceptData {
  name: string;
  emoji?: string;
  color?: string;
  description?: string | null;
  content?: string;
  category?: string;
  featuredImage?: string | null;
  isFavorite?: boolean;
}

/**
 * Interfaz para actualizar un concepto
 */
export interface UpdateConceptData {
  name?: string;
  emoji?: string;
  color?: string;
  description?: string | null;
  content?: string;
  category?: string;
  featuredImage?: string | null;
  isFavorite?: boolean;
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