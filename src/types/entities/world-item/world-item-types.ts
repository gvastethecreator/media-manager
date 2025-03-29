/**
 * @file Tipos para la entidad WorldItem
 * @module types/entities/world-item/world-item-types
 */

import type { Album } from '../album/types';
import type { Character } from '../character/character-types';
import type { Collection } from '../collection/collection-types';
import type { Concept } from '../concept/concept-types';
import type { Group } from '../group/group-types';
import type { Image } from '../image/index';
import type { Note } from '../note/note-types';
import type { Place } from '../place/place-types';
import type { Prompt } from '../prompt/prompt-types';
import type { Property } from '../property/property-types';
import type { Tag } from '../tag/tag-types';
import type { Video } from '../video/types';
import type { Wildcard } from '../wildcard/wildcard-types';

/**
 * Interfaz base para objeto del mundo
 */
export interface WorldItemBase {
  id: string;
  name: string;
  emoji: string;
  color: string;
  description: string | null;
  shortcut: string | null;
  category: string | null;
  sortBy: string;
  filters: string;

  // Atributos del objeto
  type: string;
  rarity: string;
  attributes: string;
  effects: string;
  size: string;

  // Características detalladas
  requirements: string;
  origin: string;
  stats: string;

  // Propiedades de visualización
  featuredImage: string | null;
  isFavorite: boolean;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interfaz extendida que incluye relaciones
 */
export interface WorldItemWithRelations extends WorldItemBase {
  // Relaciones con contenido
  images?: Image[];
  videos?: Video[];

  // Relaciones con entidades principales
  albums?: Album[];
  collections?: Collection[];
  tags?: Tag[];
  characters?: Character[];
  places?: Place[];
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
    tags?: number;
    characters?: number;
    places?: number;
    concepts?: number;
    prompts?: number;
    notes?: number;
    wildcards?: number;
    properties?: number;
    groups?: number;
  };
}

/**
 * Interfaz para crear un objeto del mundo
 */
export interface CreateWorldItemData {
  name: string;
  emoji?: string;
  color?: string;
  description?: string | null;
  shortcut?: string | null;
  category?: string | null;
  type?: string;
  rarity?: string;
  attributes?: string;
  effects?: string;
  size?: string;
  requirements?: string;
  origin?: string;
  stats?: string;
  featuredImage?: string | null;
  isFavorite?: boolean;
  sortBy?: string;
  filters?: string;
}

/**
 * Interfaz para actualizar un objeto del mundo
 */
export interface UpdateWorldItemData {
  name?: string;
  emoji?: string;
  color?: string;
  description?: string | null;
  shortcut?: string | null;
  category?: string | null;
  type?: string;
  rarity?: string;
  attributes?: string;
  effects?: string;
  size?: string;
  requirements?: string;
  origin?: string;
  stats?: string;
  featuredImage?: string | null;
  isFavorite?: boolean;
  sortBy?: string;
  filters?: string;
}

/**
 * Interfaz para filtros de búsqueda de objetos del mundo
 */
export interface WorldItemFilters {
  searchQuery?: string;
  categories?: string[];
  types?: string[];
  rarities?: string[];
  sizes?: string[];
  onlyFavorites?: boolean;
}

/**
 * Enumeración para criterios de ordenación
 */
export enum WorldItemSortCriteria {
  NAME_ASC = 'name:asc',
  NAME_DESC = 'name:desc',
  TYPE_ASC = 'type:asc',
  TYPE_DESC = 'type:desc',
  RARITY_ASC = 'rarity:asc',
  RARITY_DESC = 'rarity:desc',
  CREATED_ASC = 'created:asc',
  CREATED_DESC = 'created:desc',
  UPDATED_ASC = 'updated:asc',
  UPDATED_DESC = 'updated:desc',
}

/**
 * Mapa de propiedades para ordenación
 */
export const WORLD_ITEM_SORT_PROPERTY_MAP: Record<WorldItemSortCriteria, string> = {
  [WorldItemSortCriteria.NAME_ASC]: 'name',
  [WorldItemSortCriteria.NAME_DESC]: 'name',
  [WorldItemSortCriteria.TYPE_ASC]: 'type',
  [WorldItemSortCriteria.TYPE_DESC]: 'type',
  [WorldItemSortCriteria.RARITY_ASC]: 'rarity',
  [WorldItemSortCriteria.RARITY_DESC]: 'rarity',
  [WorldItemSortCriteria.CREATED_ASC]: 'createdAt',
  [WorldItemSortCriteria.CREATED_DESC]: 'createdAt',
  [WorldItemSortCriteria.UPDATED_ASC]: 'updatedAt',
  [WorldItemSortCriteria.UPDATED_DESC]: 'updatedAt',
};