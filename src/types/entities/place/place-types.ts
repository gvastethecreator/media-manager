/**
 * @file Tipos para la entidad Place
 * @module types/entities/place/place-types
 */

import type { Album } from '../album/types';
import type { Character } from '../character/character-types';
import type { Collection } from '../collection/collection-types';
import type { Concept } from '../concept/concept-types';
import type { Group } from '../group/group-types';
import type { Image } from '../image/index';
import type { Note } from '../note/note-types';
import type { Prompt } from '../prompt/prompt-types';
import type { Property } from '../property/property-types';
import type { Tag } from '../tag/tag-types';
import type { Video } from '../video/types';
import type { Wildcard } from '../wildcard/wildcard-types';
import type { WorldItem } from '../world-item/world-item-types';

/**
 * Interfaz base para lugar
 */
export interface PlaceBase {
  id: string;
  name: string;
  emoji: string;
  color: string;
  description: string | null;
  shortcut: string | null;
  category: string | null;
  sortBy: string;
  filters: string;

  // Atributos del lugar
  region: string;
  type: string;
  climate: string;
  population: number;
  government: string;

  // Características detalladas
  dangers: string;
  resources: string;
  lore: string;
  history: string;
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
export interface PlaceWithRelations extends PlaceBase {
  // Relaciones con contenido
  images?: Image[];
  videos?: Video[];

  // Relaciones con entidades principales
  albums?: Album[];
  collections?: Collection[];
  tags?: Tag[];
  characters?: Character[];
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
    tags?: number;
    characters?: number;
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
 * Interfaz para crear un lugar
 */
export interface CreatePlaceData {
  name: string;
  emoji?: string;
  color?: string;
  description?: string | null;
  shortcut?: string | null;
  category?: string | null;
  region?: string;
  type?: string;
  climate?: string;
  population?: number;
  government?: string;
  dangers?: string;
  resources?: string;
  lore?: string;
  history?: string;
  stats?: string;
  featuredImage?: string | null;
  isFavorite?: boolean;
  sortBy?: string;
  filters?: string;
  groupIds?: string[];
  propertyIds?: string[];
  wildcardIds?: string[];
}

/**
 * Interfaz para actualizar un lugar
 */
export interface UpdatePlaceData {
  name?: string;
  emoji?: string;
  color?: string;
  description?: string | null;
  shortcut?: string | null;
  category?: string | null;
  region?: string;
  type?: string;
  climate?: string;
  population?: number;
  government?: string;
  dangers?: string;
  resources?: string;
  lore?: string;
  history?: string;
  stats?: string;
  featuredImage?: string | null;
  isFavorite?: boolean;
  sortBy?: string;
  filters?: string;
  groupIds?: string[];
  propertyIds?: string[];
  wildcardIds?: string[];
}

/**
 * Interfaz para filtros de búsqueda de lugares
 */
export interface PlaceFilters {
  searchQuery?: string;
  categories?: string[];
  regions?: string[];
  types?: string[];
  climates?: string[];
  populationRange?: {
    min?: number;
    max?: number;
  };
  governments?: string[];
  onlyFavorites?: boolean;
}

/**
 * Enumeración para criterios de ordenación
 */
export enum PlaceSortCriteria {
  NAME_ASC = 'name:asc',
  NAME_DESC = 'name:desc',
  REGION_ASC = 'region:asc',
  REGION_DESC = 'region:desc',
  POPULATION_ASC = 'population:asc',
  POPULATION_DESC = 'population:desc',
  CREATED_ASC = 'created:asc',
  CREATED_DESC = 'created:desc',
  UPDATED_ASC = 'updated:asc',
  UPDATED_DESC = 'updated:desc',
}

/**
 * Mapa de propiedades para ordenación
 */
export const PLACE_SORT_PROPERTY_MAP: Record<PlaceSortCriteria, string> = {
  [PlaceSortCriteria.NAME_ASC]: 'name',
  [PlaceSortCriteria.NAME_DESC]: 'name',
  [PlaceSortCriteria.REGION_ASC]: 'region',
  [PlaceSortCriteria.REGION_DESC]: 'region',
  [PlaceSortCriteria.POPULATION_ASC]: 'population',
  [PlaceSortCriteria.POPULATION_DESC]: 'population',
  [PlaceSortCriteria.CREATED_ASC]: 'createdAt',
  [PlaceSortCriteria.CREATED_DESC]: 'createdAt',
  [PlaceSortCriteria.UPDATED_ASC]: 'updatedAt',
  [PlaceSortCriteria.UPDATED_DESC]: 'updatedAt',
};