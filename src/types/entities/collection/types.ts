/**
 * @file Tipos para la entidad Collection
 * @module types/entities/collection/collection-types
 */

import type { Album } from '../album/types';
import type { Character } from '../character/types';
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
 * Interfaz base para colección
 */
export interface CollectionBase {
  id: string;
  name: string;
  emoji: string;
  color: string;
  description: string | null;
  shortcut: string | null;
  category: string | null;

  /**
   * Criterio de ordenación serializado como string JSON
   * @remarks En la base de datos se almacena como string, pero en la aplicación se usa como objeto
   */
  sortBy: string;

  /**
   * Filtros serializados como string JSON
   * @remarks En la base de datos se almacena como string, pero en la aplicación se usa como array
   */
  filters: string;

  // Propiedades externas
  url: string | null;
  alternativeUrl: string | null;
  sourceImage: string | null;
  platform: string | null;
  price: number | null;
  network: string | null;
  tokenId: string | null;
  tokenAddress: string | null;
  contractAddress: string | null;
  contractType: string | null;

  /**
   * Ediciones serializadas como string JSON
   * @remarks En la base de datos se almacena como string, pero en la aplicación se usa como array de objetos
   */
  editions: string;

  // Propiedades de visualización
  featuredImage: string | null;
  isFavorite: boolean;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Representación de una edición de colección
 */
export interface CollectionEdition {
  id?: string;
  name: string;
  date?: string | Date;
  totalItems?: number;
  description?: string;
  price?: number;
  currency?: string;
}

/**
 * Representación de un filtro de colección
 */
export interface CollectionFilter {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startsWith' | 'endsWith';
  value: string | number | boolean | Date;
}

/**
 * Interfaz para crear una colección
 */
export interface CreateCollectionData {
  name: string;
  emoji?: string;
  color?: string;
  description?: string | null;
  shortcut?: string | null;
  category?: string | null;
  url?: string | null;
  alternativeUrl?: string | null;
  sourceImage?: string | null;
  platform?: string | null;
  price?: number | null;
  network?: string | null;
  tokenId?: string | null;
  tokenAddress?: string | null;
  contractAddress?: string | null;
  contractType?: string | null;

  /**
   * Ediciones (serán serializadas a string JSON)
   */
  editions?: string | CollectionEdition[];

  featuredImage?: string | null;
  isFavorite?: boolean;

  /**
   * Criterio de ordenación (será serializado a string JSON)
   */
  sortBy?: string | any;

  /**
   * Filtros (serán serializados a string JSON)
   */
  filters?: string | CollectionFilter[];

  groupIds?: string[];
  propertyIds?: string[];
  wildcardIds?: string[];
}

/**
 * Interfaz para actualizar una colección
 */
export interface UpdateCollectionData {
  name?: string;
  emoji?: string;
  color?: string;
  description?: string | null;
  shortcut?: string | null;
  category?: string | null;
  url?: string | null;
  alternativeUrl?: string | null;
  sourceImage?: string | null;
  platform?: string | null;
  price?: number | null;
  network?: string | null;
  tokenId?: string | null;
  tokenAddress?: string | null;
  contractAddress?: string | null;
  contractType?: string | null;

  /**
   * Ediciones (serán serializadas a string JSON)
   */
  editions?: string | CollectionEdition[];

  featuredImage?: string | null;
  isFavorite?: boolean;

  /**
   * Criterio de ordenación (será serializado a string JSON)
   */
  sortBy?: string | any;

  /**
   * Filtros (serán serializados a string JSON)
   */
  filters?: string | CollectionFilter[];

  groupIds?: string[];
  propertyIds?: string[];
  wildcardIds?: string[];
}

/**
 * Interfaz extendida que incluye relaciones
 */
export interface CollectionWithRelations extends CollectionBase {
  // Relaciones con contenido
  images?: Image[];
  videos?: Video[];

  // Relaciones con entidades principales
  albums?: Album[];
  tags?: Tag[];
  characters?: Character[];
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
    albums?: number;
    tags?: number;
    characters?: number;
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

/**
 * Interfaz para filtros de búsqueda de colecciones
 */
export interface CollectionFilters {
  searchQuery?: string;
  categories?: string[];
  platforms?: string[];
  networks?: string[];
  priceRange?: {
    min?: number;
    max?: number;
  };
  onlyFavorites?: boolean;
}

/**
 * Enumeración para criterios de ordenación
 */
export enum CollectionSortCriteria {
  NAME_ASC = 'name:asc',
  NAME_DESC = 'name:desc',
  CREATED_ASC = 'created:asc',
  CREATED_DESC = 'created:desc',
  UPDATED_ASC = 'updated:asc',
  UPDATED_DESC = 'updated:desc',
  PRICE_ASC = 'price:asc',
  PRICE_DESC = 'price:desc',
}

/**
 * Mapa de propiedades para ordenación
 */
export const COLLECTION_SORT_PROPERTY_MAP: Record<CollectionSortCriteria, string> = {
  [CollectionSortCriteria.NAME_ASC]: 'name',
  [CollectionSortCriteria.NAME_DESC]: 'name',
  [CollectionSortCriteria.CREATED_ASC]: 'createdAt',
  [CollectionSortCriteria.CREATED_DESC]: 'createdAt',
  [CollectionSortCriteria.UPDATED_ASC]: 'updatedAt',
  [CollectionSortCriteria.UPDATED_DESC]: 'updatedAt',
  [CollectionSortCriteria.PRICE_ASC]: 'price',
  [CollectionSortCriteria.PRICE_DESC]: 'price',
};