/**
 * @file Tipos para la entidad Collection
 * @module types/entities/collection/collection-types
 */

import { BaseEntitySchema } from '@/types/common/base';
import type { SearchOptionsSchema } from '@/types/common/search';
import { z } from 'zod';
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
 * Esquema base para Collection
 */
export const CollectionSchema = BaseEntitySchema.extend({
  name: z.string(),
  description: z.string().optional(),
  type: z.string(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().default(false),
  isFavorite: z.boolean().default(false),
  metadata: z.record(z.string(), z.unknown()).optional(),
  settings: z.object({
    sortBy: z.string().optional(),
    viewMode: z.string().optional(),
    gridSize: z.number().optional(),
    showThumbnails: z.boolean().optional(),
    showDetails: z.boolean().optional(),
  }).optional(),
});

/**
 * Interfaz base para colección
 */
export interface CollectionBase {
  id: string;
  name: string;
  description?: string;
  type: string;
  category?: string;
  tags?: string[];
  isPublic: boolean;
  isFavorite: boolean;
  metadata?: Record<string, unknown>;
  settings?: {
    sortBy?: string;
    viewMode?: string;
    gridSize?: number;
    showThumbnails?: boolean;
    showDetails?: boolean;
  };
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
  search?: string;
  type?: string[];
  category?: string[];
  tags?: string[];
  isPublic?: boolean;
  isFavorite?: boolean;
  hasParent?: boolean;
  hasChildren?: boolean;
  hasImages?: boolean;
  hasVideos?: boolean;
  hasAlbums?: boolean;
  isShared?: boolean;
  dateRange?: {
    start?: Date;
    end?: Date;
  };
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

// Interfaces de relaciones
export interface CollectionRelations {
  owner?: { id: string };
  parent?: { id: string };
  children?: Array<{ id: string }>;
  images?: Array<{ id: string }>;
  videos?: Array<{ id: string }>;
  albums?: Array<{ id: string }>;
  tags?: Array<{ id: string }>;
  groups?: Array<{ id: string }>;
  characters?: Array<{ id: string }>;
  places?: Array<{ id: string }>;
  items?: Array<{ id: string }>;
  notes?: Array<{ id: string }>;
  sharedWith?: Array<{ id: string }>;
}

// Interface de conteos
export interface CollectionCounts {
  children: number;
  images: number;
  videos: number;
  albums: number;
  tags: number;
  groups: number;
  characters: number;
  places: number;
  items: number;
  notes: number;
  sharedWith: number;
}

// Interface completa
export interface CollectionComplete extends CollectionBase, CollectionRelations {
  _count: CollectionCounts;
}

// Interfaces para creación y actualización
export interface CollectionCreateInput extends Omit<CollectionBase, 'id' | 'createdAt' | 'updatedAt'>, Partial<CollectionRelations> {}
export interface CollectionUpdateInput extends Partial<Omit<CollectionBase, 'id' | 'createdAt' | 'updatedAt'>>, Partial<CollectionRelations> {}

export interface CollectionIncludes {
  owner?: boolean;
  parent?: boolean;
  children?: boolean;
  images?: boolean;
  videos?: boolean;
  albums?: boolean;
  tags?: boolean;
  groups?: boolean;
  characters?: boolean;
  places?: boolean;
  items?: boolean;
  notes?: boolean;
  sharedWith?: boolean;
  count?: boolean;
}

export interface CollectionSearchOptions extends SearchOptionsSchema {
  filters?: CollectionFilters;
  include?: CollectionIncludes;
}

export interface CollectionSearchResult {
  items: CollectionComplete[];
  total: number;
  page: number;
  pageSize: number;
}

// Opciones del transformer
export interface CollectionTransformerOptions {
  includeRelations?: boolean;
  includeCount?: boolean;
  customFields?: string[];
}