/**
 * @file Tipos para la entidad Place
 * @module types/entities/place/types
 * @description Define los tipos relacionados con Place, adaptando el esquema de Prisma
 * para una mejor tipificación en la aplicación
 */

import type { Place as PrismaPlace } from '@prisma/client';
import type { Album } from '../album';
import type { Character } from '../character';
import type { Collection } from '../collection';
import type { Concept } from '../concept';
import type { Group } from '../group';
import type { Image } from '../image';
import type { Note } from '../note';
import type { Prompt } from '../prompt';
import type { Property } from '../property';
import type { Tag } from '../tag';
import type { Video } from '../video';
import type { Wildcard } from '../wildcard';
import type { WorldItem } from '../world-item';

/**
 * Tipo base para Place según el esquema de Prisma
 */
export type PlaceBase = PrismaPlace;

/**
 * Interfaz para los peligros de un lugar
 */
export interface PlaceDanger {
  name: string;
  description?: string;
  level?: number;
}

/**
 * Interfaz para los recursos de un lugar
 */
export interface PlaceResource {
  name: string;
  description?: string;
  abundance?: number;
}

/**
 * Interfaz para las estadísticas de un lugar
 */
export interface PlaceStat {
  name: string;
  value: number;
  maxValue?: number;
}

/**
 * Tipo para el objeto de estadísticas de un lugar
 */
export type PlaceStats = Record<string, number>;

/**
 * Interfaz para la entidad Place con todos los campos JSON deserializados
 */
export interface PlaceComplete extends PlaceBase {
  // Campos JSON deserializados
  dangersArray: PlaceDanger[];
  resourcesArray: PlaceResource[];
  statsObject: PlaceStats;
  filtersObject: PlaceFilters;
}

/**
 * Interfaz extendida que incluye propiedades para UI
 */
export interface PlaceExtended extends PlaceBase {
  // Propiedades de UI
  isSelected?: boolean;
  isExpanded?: boolean;
  isEditing?: boolean;
  isHighlighted?: boolean;

  // Cache de relaciones
  imagesCount?: number;
  notesCount?: number;
  conceptsCount?: number;
  promptsCount?: number;

  // Datos derivados
  dangerLevel?: string;
  displayPopulation?: string;
  displaySize?: string;
  regionPath?: string[];
  recentImages?: (string | null)[];
}

/**
 * Interfaz completa que combina PlaceComplete y PlaceExtended
 */
export interface PlaceExtendedComplete extends PlaceComplete, PlaceExtended {}

/**
 * Interfaz que añade relaciones a PlaceExtendedComplete
 */
export interface PlaceWithRelations extends PlaceExtendedComplete {
  // Relaciones
  images?: Image[];
  videos?: Video[];
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

  // Contadores de relaciones
  _count?: {
    images: number;
    videos: number;
    albums: number;
    collections: number;
    tags: number;
    characters: number;
    worldItems: number;
    concepts: number;
    prompts: number;
    notes: number;
    wildcards: number;
    properties: number;
    groups: number;
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
  // Campos JSON - pueden aceptar tanto string como array/objeto para flexibilidad
  dangers?: string | PlaceDanger[];
  resources?: string | PlaceResource[];
  lore?: string;
  history?: string;
  stats?: string | PlaceStats;
  sortBy?: string;
  filters?: string | PlaceFilters;
  // UI
  featuredImage?: string | null;
  isFavorite?: boolean;
  // Relaciones
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
  // Campos JSON - pueden aceptar tanto string como array/objeto para flexibilidad
  dangers?: string | PlaceDanger[];
  resources?: string | PlaceResource[];
  lore?: string;
  history?: string;
  stats?: string | PlaceStats;
  sortBy?: string;
  filters?: string | PlaceFilters;
  // UI
  featuredImage?: string | null;
  isFavorite?: boolean;
  // Relaciones
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
  hasImages?: boolean;
  hasNotes?: boolean;
  hasConcepts?: boolean;
  hasPrompts?: boolean;
}

/**
 * Enumeración para categorías de lugares
 */
export enum PlaceCategory {
  SETTLEMENT = 'settlement',
  LANDSCAPE = 'landscape',
  STRUCTURE = 'structure',
  BIOME = 'biome',
  UNDERGROUND = 'underground',
  MYTHICAL = 'mythical',
  HISTORICAL = 'historical',
  OTHER = 'other',
}

/**
 * Enumeración para tipos de lugares
 */
export enum PlaceType {
  CITY = 'city',
  TOWN = 'town',
  VILLAGE = 'village',
  RUIN = 'ruin',
  CASTLE = 'castle',
  FORTRESS = 'fortress',
  DUNGEON = 'dungeon',
  CAVE = 'cave',
  FOREST = 'forest',
  MOUNTAIN = 'mountain',
  VALLEY = 'valley',
  ISLAND = 'island',
  LAKE = 'lake',
  RIVER = 'river',
  OCEAN = 'ocean',
  DESERT = 'desert',
  TUNDRA = 'tundra',
  JUNGLE = 'jungle',
  SWAMP = 'swamp',
  OTHER = 'other',
}

/**
 * Enumeración para climas de lugares
 */
export enum PlaceClimate {
  TEMPERATE = 'temperate',
  TROPICAL = 'tropical',
  ARID = 'arid',
  COLD = 'cold',
  POLAR = 'polar',
  ALPINE = 'alpine',
  CONTINENTAL = 'continental',
  MEDITERRANEAN = 'mediterranean',
  OCEANIC = 'oceanic',
  MONSOON = 'monsoon',
  MAGICAL = 'magical',
  OTHER = 'other',
}

/**
 * Enumeración para criterios de ordenación
 */
export enum PlaceSortCriteria {
  NAME_ASC = 'name:asc',
  NAME_DESC = 'name:desc',
  CREATED_ASC = 'created:asc',
  CREATED_DESC = 'created:desc',
  UPDATED_ASC = 'updated:asc',
  UPDATED_DESC = 'updated:desc',
  POPULATION_ASC = 'population:asc',
  POPULATION_DESC = 'population:desc',
  TYPE_ASC = 'type:asc',
  TYPE_DESC = 'type:desc',
  DANGER_ASC = 'danger:asc',
  DANGER_DESC = 'danger:desc',
}

/**
 * Nombres de propiedades para ordenación
 */
export const PLACE_SORT_PROPERTY_MAP: Record<PlaceSortCriteria, string> = {
  [PlaceSortCriteria.NAME_ASC]: 'name',
  [PlaceSortCriteria.NAME_DESC]: 'name',
  [PlaceSortCriteria.CREATED_ASC]: 'createdAt',
  [PlaceSortCriteria.CREATED_DESC]: 'createdAt',
  [PlaceSortCriteria.UPDATED_ASC]: 'updatedAt',
  [PlaceSortCriteria.UPDATED_DESC]: 'updatedAt',
  [PlaceSortCriteria.POPULATION_ASC]: 'population',
  [PlaceSortCriteria.POPULATION_DESC]: 'population',
  [PlaceSortCriteria.TYPE_ASC]: 'type',
  [PlaceSortCriteria.TYPE_DESC]: 'type',
  [PlaceSortCriteria.DANGER_ASC]: 'dangers',
  [PlaceSortCriteria.DANGER_DESC]: 'dangers',
};