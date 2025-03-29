/**
 * @file Tipos para la entidad Tag
 * @module types/entities/tag/tag-types
 */

import type { Album } from '../album/types';
import type { Character } from '../character/types';
import type { Collection } from '../collection/types';
import type { Concept } from '../concept/types';
import type { Group } from '../group/types';
import type { Image } from '../image/index';
import type { Note } from '../note/types';
import type { Place } from '../place/types';
import type { Prompt } from '../prompt/types';
import type { Property } from '../property/types';
import type { Video } from '../video/types';
import type { Wildcard } from '../wildcard/types';
import type { WorldItem } from '../world-item/types';

/**
 * Interfaz base para etiqueta
 */
export interface TagBase {
  id: string;
  name: string;
  emoji: string;
  color: string;
  description: string | null;
  shortcut: string | null;
  category: string | null;
  featuredImage: string | null;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interfaz extendida que incluye relaciones
 */
export interface TagWithRelations extends TagBase {
  // Relaciones con contenido
  images?: Image[];
  videos?: Video[];

  // Relaciones con entidades principales
  albums?: Album[];
  collections?: Collection[];
  characters?: Character[];
  places?: Place[];
  worldItems?: WorldItem[];
  concepts?: Concept[];
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
    characters?: number;
    places?: number;
    worldItems?: number;
    concepts?: number;
    prompts?: number;
    notes?: number;
    wildcards?: number;
    properties?: number;
    groups?: number;
  };
}

/**
 * Interfaz para crear una etiqueta
 */
export interface CreateTagData {
  name: string;
  emoji?: string;
  color?: string;
  description?: string | null;
  shortcut?: string | null;
  category?: string | null;
  featuredImage?: string | null;
  isFavorite?: boolean;
  groupIds?: string[];
  propertyIds?: string[];
  wildcardIds?: string[];
}

/**
 * Interfaz para actualizar una etiqueta
 */
export interface UpdateTagData {
  name?: string;
  emoji?: string;
  color?: string;
  description?: string | null;
  shortcut?: string | null;
  category?: string | null;
  featuredImage?: string | null;
  isFavorite?: boolean;
  groupIds?: string[];
  propertyIds?: string[];
  wildcardIds?: string[];
}

/**
 * Interfaz para filtros de búsqueda de etiquetas
 */
export interface TagFilters {
  searchQuery?: string;
  categories?: string[];
  onlyFavorites?: boolean;
}

/**
 * Enumeración para criterios de ordenación
 */
export enum TagSortCriteria {
  NAME_ASC = 'name:asc',
  NAME_DESC = 'name:desc',
  CREATED_ASC = 'created:asc',
  CREATED_DESC = 'created:desc',
  UPDATED_ASC = 'updated:asc',
  UPDATED_DESC = 'updated:desc',
  USAGE_ASC = 'usage:asc',
  USAGE_DESC = 'usage:desc',
}

/**
 * Mapa de propiedades para ordenación
 */
export const TAG_SORT_PROPERTY_MAP: Record<TagSortCriteria, string> = {
  [TagSortCriteria.NAME_ASC]: 'name',
  [TagSortCriteria.NAME_DESC]: 'name',
  [TagSortCriteria.CREATED_ASC]: 'createdAt',
  [TagSortCriteria.CREATED_DESC]: 'createdAt',
  [TagSortCriteria.UPDATED_ASC]: 'updatedAt',
  [TagSortCriteria.UPDATED_DESC]: 'updatedAt',
  [TagSortCriteria.USAGE_ASC]: 'usage',
  [TagSortCriteria.USAGE_DESC]: 'usage',
};