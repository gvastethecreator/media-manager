/**
 * @file Tipos para la entidad Group
 * @module types/entities/group/group-types
 */

import type { Album } from '../album/album-types';
import type { Character } from '../character/character-types';
import type { Collection } from '../collection/collection-types';
import type { Concept } from '../concept/concept-types';
import type { Image } from '../image/image-types';
import type { Note } from '../note/note-types';
import type { Place } from '../place/place-types';
import type { Prompt } from '../prompt/prompt-types';
import type { Property } from '../property/property-types';
import type { Tag } from '../tag/tag-types';
import type { Video } from '../video/video-types';
import type { Wildcard } from '../wildcard/wildcard-types';
import type { WorldItem } from '../world-item/world-item-types';

/**
 * Interfaz base para grupo
 */
export interface GroupBase {
  id: string;
  name: string;
  emoji: string;
  color: string;
  description: string | null;
  shortcut: string | null;
  category: string | null;
  sortBy: string;
  filters: string;
  featuredImage: string | null;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interfaz extendida que incluye relaciones
 */
export interface GroupWithRelations extends GroupBase {
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
  wildcards?: Wildcard[];
  properties?: Property[];
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
    prompts?: number;
    notes?: number;
    wildcards?: number;
    properties?: number;
  };
}

/**
 * Interfaz para crear un grupo
 */
export interface CreateGroupData {
  name: string;
  emoji?: string;
  color?: string;
  description?: string | null;
  shortcut?: string | null;
  category?: string | null;
  sortBy?: string;
  filters?: string;
  featuredImage?: string | null;
  isFavorite?: boolean;
}

/**
 * Interfaz para actualizar un grupo
 */
export interface UpdateGroupData {
  name?: string;
  emoji?: string;
  color?: string;
  description?: string | null;
  shortcut?: string | null;
  category?: string | null;
  sortBy?: string;
  filters?: string;
  featuredImage?: string | null;
  isFavorite?: boolean;
}

/**
 * Interfaz para filtros de búsqueda de grupos
 */
export interface GroupFilters {
  searchQuery?: string;
  categories?: string[];
  onlyFavorites?: boolean;
}

/**
 * Enumeración para criterios de ordenación
 */
export enum GroupSortCriteria {
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
export const GROUP_SORT_PROPERTY_MAP: Record<GroupSortCriteria, string> = {
  [GroupSortCriteria.NAME_ASC]: 'name',
  [GroupSortCriteria.NAME_DESC]: 'name',
  [GroupSortCriteria.CREATED_ASC]: 'createdAt',
  [GroupSortCriteria.CREATED_DESC]: 'createdAt',
  [GroupSortCriteria.UPDATED_ASC]: 'updatedAt',
  [GroupSortCriteria.UPDATED_DESC]: 'updatedAt',
};