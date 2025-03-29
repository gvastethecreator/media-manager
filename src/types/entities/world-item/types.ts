/**
 * @file Tipos para la entidad WorldItem
 * @module types/entities/world-item/world-item-types
 */

import type { Album } from '../album';
import type { Character } from '../character';
import type { Collection } from '../collection';
import type { Concept } from '../concept';
import type { Group } from '../group';
import type { Image } from '../image';
import type { Note } from '../note';
import type { Place } from '../place';
import type { Prompt } from '../prompt';
import type { Property } from '../property';
import type { Tag } from '../tag';
import type { Video } from '../video';
import type { Wildcard } from '../wildcard';
import type { WorldItemRequirement, WorldItemStats } from './enums';

/**
 * Interfaz base para objeto del mundo
 * Nota: En la base de datos, algunos campos se almacenan como strings JSON:
 * - attributes: Es un string JSON que representa un array de atributos
 * - effects: Es un string JSON que representa un array de efectos
 * - requirements: Es un string JSON que representa un objeto de requisitos
 * - stats: Es un string JSON que representa un objeto de estadísticas
 * - filters: Es un string JSON que representa la configuración de filtros
 * - tags: Es un string JSON que representa un array de tags (en algunas implementaciones)
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
  filters: string;          // String JSON que representa un objeto

  // Atributos del objeto
  type: string;
  rarity: string;
  attributes: string;       // String JSON que representa array
  effects: string;          // String JSON que representa array
  size: string;             // Valores predefinidos: 'tiny', 'small', 'medium', 'large', 'huge'

  // Características detalladas
  requirements: string;     // String JSON que representa un objeto
  origin: string;
  stats: string;            // String JSON que representa objeto
  tags?: string;            // String JSON que representa array (opcional)

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
  tagEntities?: Tag[];      // Relación con entidades Tag (renombrado para evitar conflicto)
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
    tagEntities?: number;   // Renombrado para mantener consistencia
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

// Definición explícita para evitar confusión con el tipo importado desde Prisma
export type WorldItemComplete = WorldItemWithRelations;

/**
 * Enum para los tamaños válidos de WorldItem
 * Estos son los valores válidos para el campo 'size'
 */
export enum WorldItemSize {
  TINY = 'tiny',
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
  HUGE = 'huge'
}

/**
 * Interfaz para crear un objeto del mundo
 * Los campos complejos pueden aceptar tanto strings JSON como objetos/arrays
 */
export interface CreateWorldItemData {
  name: string;
  emoji?: string;
  color?: string;
  description?: string | null;
  shortcut?: string | null;
  category?: string | null;

  // Campos básicos
  type?: string;
  rarity?: string;
  size?: WorldItemSize | string;   // Puede ser un valor del enum o un string
  origin?: string;

  // Campos JSON - pueden aceptar tanto strings como objetos/arrays
  attributes?: string | string[];                                 // Puede recibir array o string JSON
  effects?: string | string[];                                    // Puede recibir array o string JSON
  requirements?: string | Record<string, WorldItemRequirement>;   // Puede recibir objeto o string JSON
  stats?: string | WorldItemStats;                                // Puede recibir objeto o string JSON
  tags?: string | string[];                                       // Puede recibir array o string JSON

  // Propiedades adicionales
  featuredImage?: string | null;
  isFavorite?: boolean;
  sortBy?: string;
  filters?: string | Record<string, any>;                         // Puede recibir objeto o string JSON

  // Relaciones
  groupIds?: string[];
  propertyIds?: string[];
  wildcardIds?: string[];
  tagIds?: string[];                                              // IDs de tags relacionados
}

/**
 * Interfaz para actualizar un objeto del mundo
 * Los campos complejos pueden aceptar tanto strings JSON como objetos/arrays
 */
export interface UpdateWorldItemData {
  name?: string;
  emoji?: string;
  color?: string;
  description?: string | null;
  shortcut?: string | null;
  category?: string | null;

  // Campos básicos
  type?: string;
  rarity?: string;
  size?: WorldItemSize | string;   // Puede ser un valor del enum o un string
  origin?: string;

  // Campos JSON - pueden aceptar tanto strings como objetos/arrays
  attributes?: string | string[];                                 // Puede recibir array o string JSON
  effects?: string | string[];                                    // Puede recibir array o string JSON
  requirements?: string | Record<string, WorldItemRequirement>;   // Puede recibir objeto o string JSON
  stats?: string | WorldItemStats;                                // Puede recibir objeto o string JSON
  tags?: string | string[];                                       // Puede recibir array o string JSON

  // Propiedades adicionales
  featuredImage?: string | null;
  isFavorite?: boolean;
  sortBy?: string;
  filters?: string | Record<string, any>;                         // Puede recibir objeto o string JSON

  // Relaciones
  groupIds?: string[];
  propertyIds?: string[];
  wildcardIds?: string[];
  tagIds?: string[];                                              // IDs de tags relacionados
}

/**
 * Interfaz para filtros de búsqueda de objetos del mundo
 */
export interface WorldItemFilters {
  searchQuery?: string;
  categories?: string[];
  types?: string[];
  rarities?: string[];
  sizes?: WorldItemSize[]; // Usar enum para validar valores
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