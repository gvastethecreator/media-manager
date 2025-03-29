/**
 * @file Tipos para la entidad Wildcard
 * @module types/entities/wildcard/wildcard-types
 */

import type { Wildcard } from '@prisma/client';
import type { Album } from '../album/album-types';
import type { Character } from '../character/character-types';
import type { Collection } from '../collection/collection-types';
import type { Concept } from '../concept/concept-types';
import type { Group } from '../group/group-types';
import type { Image } from '../image/image-types';
import type { Note } from '../note/note-types';
import type { Place } from '../place/place-types';
import type { Prompt } from '../prompt/prompt-types';
import type { Property } from '../property/property-types';
import type { Tag } from '../tag/tag-types';
import type { Video } from '../video/video-types';
import type { WorldItem } from '../world-item/world-item-types';

/**
 * Interfaz base para comodín
 */
export interface WildcardBase {
  id: string;
  name: string;
  emoji: string;
  color: string;
  description: string | null;
  shortcut: string | null;
  category: string | null;
  children: string; // JSON string de hijos
  featuredImage: string | null;
  isFavorite: boolean;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interfaz extendida que incluye relaciones
 */
export interface WildcardWithRelations extends WildcardBase {
  // Relaciones jerárquicas
  parent?: Wildcard | null;
  childWildcards?: Wildcard[];

  // Otras relaciones
  images?: Image[];
  videos?: Video[];
  albums?: Album[];
  collections?: Collection[];
  tags?: Tag[];
  characters?: Character[];
  places?: Place[];
  worldItems?: WorldItem[];
  concepts?: Concept[];
  prompts?: Prompt[];
  notes?: Note[];
  properties?: Property[];
  groups?: Group[];

  _count?: {
    childWildcards?: number;
    images?: number;
    videos?: number;
    albums?: number;
    collections?: number;
    tags?: number;
    characters?: number;
    places?: number;
    worldItems?: number;
    concepts?: number;
    prompts?: number;
    notes?: number;
    properties?: number;
    groups?: number;
  };
}

/**
 * Interfaz para crear un comodín
 */
export interface CreateWildcardData {
  name: string;
  emoji?: string;
  color?: string;
  description?: string | null;
  shortcut?: string | null;
  category?: string | null;
  children?: string;
  featuredImage?: string | null;
  isFavorite?: boolean;
  parentId?: string | null;
}

/**
 * Interfaz para actualizar un comodín
 */
export interface UpdateWildcardData {
  name?: string;
  emoji?: string;
  color?: string;
  description?: string | null;
  shortcut?: string | null;
  category?: string | null;
  children?: string;
  featuredImage?: string | null;
  isFavorite?: boolean;
  parentId?: string | null;
}

/**
 * Interfaz para filtros de búsqueda de comodines
 */
export interface WildcardFilters {
  searchQuery?: string;
  categories?: string[];
  onlyFavorites?: boolean;
  parentId?: string | null;
  hasChildren?: boolean;
}

/**
 * Enumeración para criterios de ordenación
 */
export enum WildcardSortCriteria {
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
export const WILDCARD_SORT_PROPERTY_MAP: Record<WildcardSortCriteria, string> = {
  [WildcardSortCriteria.NAME_ASC]: 'name',
  [WildcardSortCriteria.NAME_DESC]: 'name',
  [WildcardSortCriteria.CREATED_ASC]: 'createdAt',
  [WildcardSortCriteria.CREATED_DESC]: 'createdAt',
  [WildcardSortCriteria.UPDATED_ASC]: 'updatedAt',
  [WildcardSortCriteria.UPDATED_DESC]: 'updatedAt',
};