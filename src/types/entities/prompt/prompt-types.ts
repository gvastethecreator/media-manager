/**
 * @file Tipos para la entidad Prompt
 * @module types/entities/prompt/prompt-types
 */

import type { Album } from '../album/types';
import type { Character } from '../character/character-types';
import type { Collection } from '../collection/collection-types';
import type { Concept } from '../concept/concept-types';
import type { Group } from '../group/group-types';
import type { Image } from '../image/index';
import type { Note } from '../note/note-types';
import type { Place } from '../place/place-types';
import type { Property } from '../property/property-types';
import type { Tag } from '../tag/tag-types';
import type { Video } from '../video/types';
import type { Wildcard } from '../wildcard/wildcard-types';
import type { WorldItem } from '../world-item/world-item-types';

/**
 * Interfaz base para prompt
 */
export interface PromptBase {
  id: string;
  name: string;
  emoji: string;
  color: string;
  description: string | null;
  content: string;
  purpose: string;
  category: string;
  parameters: string;
  featuredImage: string | null;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interfaz extendida que incluye relaciones
 */
export interface PromptWithRelations extends PromptBase {
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
  concepts?: Concept[];
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
    concepts?: number;
    notes?: number;
    wildcards?: number;
    properties?: number;
    groups?: number;
  };
}

/**
 * Interfaz para crear un prompt
 */
export interface CreatePromptData {
  name: string;
  emoji?: string;
  color?: string;
  description?: string | null;
  content?: string;
  purpose?: string;
  category?: string;
  parameters?: string;
  featuredImage?: string | null;
  isFavorite?: boolean;
}

/**
 * Interfaz para actualizar un prompt
 */
export interface UpdatePromptData {
  name?: string;
  emoji?: string;
  color?: string;
  description?: string | null;
  content?: string;
  purpose?: string;
  category?: string;
  parameters?: string;
  featuredImage?: string | null;
  isFavorite?: boolean;
}

/**
 * Interfaz para filtros de búsqueda de prompts
 */
export interface PromptFilters {
  searchQuery?: string;
  categories?: string[];
  purposes?: string[];
  onlyFavorites?: boolean;
  contentContains?: string;
}

/**
 * Enumeración para criterios de ordenación
 */
export enum PromptSortCriteria {
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
export const PROMPT_SORT_PROPERTY_MAP: Record<PromptSortCriteria, string> = {
  [PromptSortCriteria.NAME_ASC]: 'name',
  [PromptSortCriteria.NAME_DESC]: 'name',
  [PromptSortCriteria.CREATED_ASC]: 'createdAt',
  [PromptSortCriteria.CREATED_DESC]: 'createdAt',
  [PromptSortCriteria.UPDATED_ASC]: 'updatedAt',
  [PromptSortCriteria.UPDATED_DESC]: 'updatedAt',
};