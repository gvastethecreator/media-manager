/**
 * @file Tipos para la entidad Character
 * @module types/entities/character/character-types
 */

import type { Album } from '../album/types';
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
import type { WorldItem } from '../world-item/world-item-types';

/**
 * Interfaz base para personaje
 */
export interface CharacterBase {
  id: string;
  name: string;
  emoji: string;
  color: string;
  description: string | null;
  shortcut: string | null;
  category: string | null;
  sortBy: string;
  filters: string;

  // Atributos del personaje
  level: number;
  class: string;
  race: string;
  type: string | null;
  alignment: string;

  // Características detalladas
  backstory: string;
  stats: string;
  psychologicalProfile: string;
  socialProfile: string;
  relationships: string;
  goals: string;
  fears: string;
  beliefs: string;
  personality: string;
  skills: string;
  abilities: string;

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
export interface CharacterWithRelations extends CharacterBase {
  // Relaciones con contenido
  images?: Image[];
  videos?: Video[];

  // Relaciones con personajes
  relatedCharacters?: Character[];
  relatedTo?: Character[];

  // Relaciones con entidades principales
  albums?: Album[];
  collections?: Collection[];
  tags?: Tag[];
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
    relatedCharacters?: number;
    relatedTo?: number;
    albums?: number;
    collections?: number;
    tags?: number;
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

// Auto-referencia para relaciones
type Character = CharacterWithRelations;

/**
 * Interfaz para crear un personaje
 */
export interface CreateCharacterData {
  name: string;
  emoji?: string;
  color?: string;
  description?: string | null;
  shortcut?: string | null;
  category?: string | null;
  level?: number;
  class?: string;
  race?: string;
  type?: string | null;
  alignment?: string;
  backstory?: string;
  stats?: string;
  psychologicalProfile?: string;
  socialProfile?: string;
  relationships?: string;
  goals?: string;
  fears?: string;
  beliefs?: string;
  personality?: string;
  skills?: string;
  abilities?: string;
  featuredImage?: string | null;
  isFavorite?: boolean;
  sortBy?: string;
  filters?: string;
}

/**
 * Interfaz para actualizar un personaje
 */
export interface UpdateCharacterData {
  name?: string;
  emoji?: string;
  color?: string;
  description?: string | null;
  shortcut?: string | null;
  category?: string | null;
  level?: number;
  class?: string;
  race?: string;
  type?: string | null;
  alignment?: string;
  backstory?: string;
  stats?: string;
  psychologicalProfile?: string;
  socialProfile?: string;
  relationships?: string;
  goals?: string;
  fears?: string;
  beliefs?: string;
  personality?: string;
  skills?: string;
  abilities?: string;
  featuredImage?: string | null;
  isFavorite?: boolean;
  sortBy?: string;
  filters?: string;
}

/**
 * Interfaz para filtros de búsqueda de personajes
 */
export interface CharacterFilters {
  searchQuery?: string;
  categories?: string[];
  classes?: string[];
  races?: string[];
  levelRange?: {
    min?: number;
    max?: number;
  };
  alignments?: string[];
  onlyFavorites?: boolean;
}

/**
 * Enumeración para criterios de ordenación
 */
export enum CharacterSortCriteria {
  NAME_ASC = 'name:asc',
  NAME_DESC = 'name:desc',
  LEVEL_ASC = 'level:asc',
  LEVEL_DESC = 'level:desc',
  CREATED_ASC = 'created:asc',
  CREATED_DESC = 'created:desc',
  UPDATED_ASC = 'updated:asc',
  UPDATED_DESC = 'updated:desc',
}

/**
 * Mapa de propiedades para ordenación
 */
export const CHARACTER_SORT_PROPERTY_MAP: Record<CharacterSortCriteria, string> = {
  [CharacterSortCriteria.NAME_ASC]: 'name',
  [CharacterSortCriteria.NAME_DESC]: 'name',
  [CharacterSortCriteria.LEVEL_ASC]: 'level',
  [CharacterSortCriteria.LEVEL_DESC]: 'level',
  [CharacterSortCriteria.CREATED_ASC]: 'createdAt',
  [CharacterSortCriteria.CREATED_DESC]: 'createdAt',
  [CharacterSortCriteria.UPDATED_ASC]: 'updatedAt',
  [CharacterSortCriteria.UPDATED_DESC]: 'updatedAt',
};