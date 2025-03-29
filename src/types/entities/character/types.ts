/**
 * @file Tipos para la entidad Character
 * @module types/entities/character/character-types
 */

import type { Album } from '../album/types';
import type { Collection } from '../collection/types';
import type { Concept } from '../concept/types';
import type { Group } from '../group/types';
import type { Image } from '../image/index';
import type { Note } from '../note/types';
import type { Place } from '../place/types';
import type { Prompt } from '../prompt/types';
import type { Property } from '../property/types';
import type { Tag } from '../tag/types';
import type { Video } from '../video/types';
import type { Wildcard } from '../wildcard/types';
import type { WorldItem } from '../world-item/types';

/**
 * Interfaz base para personaje
 * Nota: En la base de datos, varios campos se almacenan como strings JSON:
 * - stats: Es un string JSON que representa un objeto de estadísticas
 * - relationships: Es un string JSON que representa un array de relaciones
 * - goals: Es un string JSON que representa un array de objetivos
 * - fears: Es un string JSON que representa un array de miedos
 * - beliefs: Es un string JSON que representa un array de creencias
 * - personality: Es un string JSON que representa un array de rasgos de personalidad
 * - skills: Es un string JSON que representa un array de habilidades
 * - abilities: Es un string JSON que representa un array de capacidades
 * - filters: Es un string JSON que representa la configuración de filtros
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
  stats: string;         // String JSON que representa un objeto
  psychologicalProfile: string;
  socialProfile: string;
  relationships: string; // String JSON que representa un array
  goals: string;         // String JSON que representa un array
  fears: string;         // String JSON que representa un array
  beliefs: string;       // String JSON que representa un array
  personality: string;   // String JSON que representa un array
  skills: string;        // String JSON que representa un array
  abilities: string;     // String JSON que representa un array

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
  relatedCharacters?: CharacterWithRelations[];
  relatedTo?: CharacterWithRelations[];

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

// Definición explícita para evitar confusión con el tipo importado desde Prisma
export type CharacterComplete = CharacterWithRelations;

/**
 * Interfaz para crear un personaje
 * Los campos complejos pueden aceptar tanto strings JSON como objetos/arrays
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
  stats?: string | Record<string, any>;                 // Puede recibir objeto o string JSON
  psychologicalProfile?: string;
  socialProfile?: string;
  relationships?: string | Array<any>;                  // Puede recibir array o string JSON
  goals?: string | string[];                            // Puede recibir array o string JSON
  fears?: string | string[];                            // Puede recibir array o string JSON
  beliefs?: string | string[];                          // Puede recibir array o string JSON
  personality?: string | string[];                      // Puede recibir array o string JSON
  skills?: string | string[];                           // Puede recibir array o string JSON
  abilities?: string | string[];                        // Puede recibir array o string JSON
  featuredImage?: string | null;
  isFavorite?: boolean;
  sortBy?: string;
  filters?: string | Record<string, any>;               // Puede recibir objeto o string JSON
  groupIds?: string[];
  propertyIds?: string[];
  wildcardIds?: string[];
  tagIds?: string[];                                    // IDs de tags relacionados
}

/**
 * Interfaz para actualizar un personaje
 * Los campos complejos pueden aceptar tanto strings JSON como objetos/arrays
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
  stats?: string | Record<string, any>;                 // Puede recibir objeto o string JSON
  psychologicalProfile?: string;
  socialProfile?: string;
  relationships?: string | Array<any>;                  // Puede recibir array o string JSON
  goals?: string | string[];                            // Puede recibir array o string JSON
  fears?: string | string[];                            // Puede recibir array o string JSON
  beliefs?: string | string[];                          // Puede recibir array o string JSON
  personality?: string | string[];                      // Puede recibir array o string JSON
  skills?: string | string[];                           // Puede recibir array o string JSON
  abilities?: string | string[];                        // Puede recibir array o string JSON
  featuredImage?: string | null;
  isFavorite?: boolean;
  sortBy?: string;
  filters?: string | Record<string, any>;               // Puede recibir objeto o string JSON
  groupIds?: string[];
  propertyIds?: string[];
  wildcardIds?: string[];
  tagIds?: string[];                                    // IDs de tags relacionados
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