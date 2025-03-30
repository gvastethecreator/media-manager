/**
 * @file Tipos para la entidad Concept
 * @module types/entities/concept/types
 */

import type { z } from 'zod';
import type { Album } from '../album/types';
import type { Character } from '../character/types';
import type { Collection } from '../collection/types';
import type { Group } from '../group/types';
import type { Image } from '../image/types';
import type { Note } from '../note/types';
import type { Place } from '../place/types';
import type { Prompt } from '../prompt/types';
import type { Property } from '../property/types';
import type { Tag } from '../tag/types';
import type { Video } from '../video/types';
import type { Wildcard } from '../wildcard/types';
import type { WorldItem } from '../world-item/types';
import type { ConceptSchema } from './schema';

/**
 * Interfaz base para Concept derivada del schema de Prisma
 */
export interface ConceptBase {
  id: string;
  name: string;
  emoji: string;
  color: string;
  description: string | null;
  content: string;
  category: string;
  tags: string;
  featuredImage: string | null;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Etiquetas deserializadas de un concepto
 */
export interface ConceptTags {
  items: string[];
}

/**
 * Relaciones de un concepto con otras entidades
 */
export interface ConceptRelations {
  images?: Image[];
  videos?: Video[];
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
}

/**
 * Conteo de entidades relacionadas con un concepto
 */
export interface ConceptCounts {
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
 * Propiedades adicionales para UI
 */
export interface ConceptUI {
  previewContent?: string;
  lastUpdated?: Date;
}

/**
 * Campos deserializados de un concepto
 */
export interface ConceptDeserialized {
  tags: string[];
}

/**
 * Filtros para búsqueda de conceptos
 */
export interface ConceptFilters {
  searchQuery?: string;
  categories?: string[];
  onlyFavorites?: boolean;
  contentContains?: string;
}

/**
 * Concepto completo con todos los campos y relaciones
 */
export interface ConceptComplete extends ConceptBase, ConceptDeserialized {
  _count?: ConceptCounts;
  _relations?: ConceptRelations;
  _ui?: ConceptUI;
}

/**
 * Datos para la creación de un concepto
 */
export interface ConceptCreateInput {
  name: string;
  emoji?: string;
  color?: string;
  description?: string | null;
  content?: string;
  category?: string;
  tags?: string[] | string; // Acepta tanto array como string JSON
  featuredImage?: string | null;
  isFavorite?: boolean;

  // Relaciones
  groupIds?: string[];
  propertyIds?: string[];
  wildcardIds?: string[];
  imageIds?: string[];
  videoIds?: string[];
  albumIds?: string[];
  collectionIds?: string[];
  tagIds?: string[];
  characterIds?: string[];
  placeIds?: string[];
  worldItemIds?: string[];
  promptIds?: string[];
  noteIds?: string[];
}

/**
 * Datos para la actualización de un concepto
 */
export interface ConceptUpdateInput extends Partial<ConceptCreateInput> {
  id?: string;
}

/**
 * Opciones para buscar conceptos
 */
export interface ConceptSearchOptions {
  filters?: ConceptFilters;
  sortBy?: ConceptSortCriteria;
  page?: number;
  pageSize?: number;
  includeRelations?: boolean;
  includeStats?: boolean;
}

/**
 * Respuesta de búsqueda de conceptos
 */
export interface ConceptSearchResult {
  items: ConceptComplete[];
  total: number;
  totalPages: number;
}

/**
 * Criterios de ordenación para conceptos
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

/**
 * Alias para opciones de ordenación
 */
export type ConceptSortOption = keyof typeof CONCEPT_SORT_PROPERTY_MAP | string;

/**
 * Tipo para validación con Zod
 */
export type ConceptValidation = z.infer<typeof ConceptSchema>;