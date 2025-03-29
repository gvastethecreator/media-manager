/**
 * @file Tipos para la entidad Property
 * @module types/entities/property/property-types
 */

import type { Album } from '../album/album-types';
import type { Character } from '../character/character-types';
import type { Collection } from '../collection/collection-types';
import type { Concept } from '../concept/concept-types';
import type { Group } from '../group/group-types';
import type { Image } from '../image/image-types';
import type { Note } from '../note/note-types';
import type { Place } from '../place/place-types';
import type { Prompt } from '../prompt/prompt-types';
import type { Tag } from '../tag/tag-types';
import type { Video } from '../video/video-types';
import type { Wildcard } from '../wildcard/wildcard-types';
import type { WorldItem } from '../world-item/world-item-types';

/**
 * Interfaz base para propiedad
 */
export interface PropertyBase {
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
export interface PropertyWithRelations extends PropertyBase {
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
  groups?: Group[];
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
    groups?: number;
  };
}

/**
 * Interfaz para crear una propiedad
 */
export interface CreatePropertyData {
  name: string;
  emoji?: string;
  color?: string;
  description?: string | null;
  shortcut?: string | null;
  category?: string | null;
  featuredImage?: string | null;
  isFavorite?: boolean;
}

/**
 * Interfaz para actualizar una propiedad
 */
export interface UpdatePropertyData {
  name?: string;
  emoji?: string;
  color?: string;
  description?: string | null;
  shortcut?: string | null;
  category?: string | null;
  featuredImage?: string | null;
  isFavorite?: boolean;
}

/**
 * Interfaz para filtros de búsqueda de propiedades
 */
export interface PropertyFilters {
  searchQuery?: string;
  categories?: string[];
  onlyFavorites?: boolean;
}

/**
 * Enumeración para criterios de ordenación
 */
export enum PropertySortCriteria {
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
export const PROPERTY_SORT_PROPERTY_MAP: Record<PropertySortCriteria, string> = {
  [PropertySortCriteria.NAME_ASC]: 'name',
  [PropertySortCriteria.NAME_DESC]: 'name',
  [PropertySortCriteria.CREATED_ASC]: 'createdAt',
  [PropertySortCriteria.CREATED_DESC]: 'createdAt',
  [PropertySortCriteria.UPDATED_ASC]: 'updatedAt',
  [PropertySortCriteria.UPDATED_DESC]: 'updatedAt',
};