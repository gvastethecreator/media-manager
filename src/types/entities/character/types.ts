/**
 * @file Tipos para la entidad Character
 * @module types/entities/character/character-types
 */

import type { BaseEntity } from '@/types/store.types';
import type { JSONString, Nullable } from '@/utils/types/utility-types';
import { z } from 'zod';
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
 */
export interface CharacterBase extends BaseEntity {
    name: string;
    emoji: string;
    color: string;
    description: Nullable<string>;
    shortcut: Nullable<string>;
    category: Nullable<string>;
    sortBy: JSONString<CharacterSortCriteria>;
    filters: JSONString<CharacterFilters>;

    // Atributos del personaje
    level: number;
    class: string;
    race: string;
    type: Nullable<string>;
    alignment: string;

    // Características detalladas
    backstory: string;
    stats: JSONString<Record<string, any>>;
    psychologicalProfile: string;
    socialProfile: string;
    relationships: JSONString<Array<any>>;
    goals: JSONString<string[]>;
    fears: JSONString<string[]>;
    beliefs: JSONString<string[]>;
    personality: JSONString<string[]>;
    skills: JSONString<string[]>;
    abilities: JSONString<string[]>;

    // Propiedades de visualización
    featuredImage: Nullable<string>;
    isFavorite: boolean;

    // Metadata
    createdAt: Date;
    updatedAt: Date;
}

// Contadores unificados
export interface CharacterCount {
    images: number;
    videos: number;
    relatedCharacters: number;
    relatedTo: number;
    albums: number;
    collections: number;
    tags: number;
    places: number;
    worldItems: number;
    concepts: number;
    prompts: number;
    notes: number;
    wildcards: number;
    properties: number;
    groups: number;
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
    _count?: Partial<CharacterCount>;
}

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
    hasImages?: boolean;
    hasRelations?: boolean;
}

// Validaciones Zod
export const characterFilterSchema = z.object({
    searchQuery: z.string().optional(),
    categories: z.array(z.string()).optional(),
    classes: z.array(z.string()).optional(),
    races: z.array(z.string()).optional(),
    levelRange: z.object({
        min: z.number().optional(),
        max: z.number().optional()
    }).optional(),
    alignments: z.array(z.string()).optional(),
    onlyFavorites: z.boolean().optional(),
    hasImages: z.boolean().optional(),
    hasRelations: z.boolean().optional()
});

export const characterSchema = z.object({
    id: z.string(),
    name: z.string().min(1),
    emoji: z.string(),
    color: z.string(),
    description: z.string().nullable(),
    shortcut: z.string().nullable(),
    category: z.string().nullable(),
    level: z.number(),
    class: z.string(),
    race: z.string(),
    type: z.string().nullable(),
    alignment: z.string(),
    backstory: z.string(),
    sortBy: z.string(),
    filters: z.string(),
    // JSON fields
    stats: z.string(),
    psychologicalProfile: z.string(),
    socialProfile: z.string(),
    relationships: z.string(),
    goals: z.string(),
    fears: z.string(),
    beliefs: z.string(),
    personality: z.string(),
    skills: z.string(),
    abilities: z.string(),
    // Display properties
    featuredImage: z.string().nullable(),
    isFavorite: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date()
});

export type CharacterFilter = z.infer<typeof characterFilterSchema>;
export type CharacterValidated = z.infer<typeof characterSchema>;

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