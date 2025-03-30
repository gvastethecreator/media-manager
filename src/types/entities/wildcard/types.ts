/**
 * @file Tipos para la entidad Wildcard
 * @module types/entities/wildcard/types
 */

import type { Wildcard as PrismaWildcard } from '@prisma/client';
import type { Album } from '../album/types';
import type { Character } from '../character/types';
import type { Collection } from '../collection/types';
import type { Concept } from '../concept/types';
import type { Group } from '../group/types';
import type { Image } from '../image/image-types';
import type { Note } from '../note/types';
import type { Place } from '../place/types';
import type { Prompt } from '../prompt/types';
import type { Property } from '../property/types';
import type { Tag } from '../tag/types';
import type { Video } from '../video/video-types';
import type { WorldItem } from '../world-item/types';

/**
 * Interfaz base para comodín
 */
export interface WildcardBase extends PrismaWildcard {
  id: string;
  name: string;
  emoji: string;
  color: string;
  description: string | null;
  shortcut: string | null;
  category: string | null;
  children: string; // JSON string de hijos
  featuredImage: string | null;
  isFavorite: boolean;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interfaz para relaciones de Wildcard
 */
export interface WildcardRelations {
  // Relaciones jerárquicas
  parent?: PrismaWildcard | null;
  childWildcards?: PrismaWildcard[];

  // Otras relaciones
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
  properties?: Property[];
  groups?: Group[];
}

/**
 * Interfaz para conteos de relaciones
 */
export interface WildcardCounts {
  childWildcards?: number;
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
  properties?: number;
  groups?: number;
}

/**
 * Interfaz para campos UI calculados
 */
export interface WildcardUI {
  hasParent: boolean;
  hasChildren: boolean;
  itemCount: number;
  parsedChildren: any[];
  lastUpdated: Date;
}

/**
 * Interfaz para datos deserializados
 */
export interface WildcardDeserialized extends WildcardBase {
  parsedChildren?: any[];
  _relations?: WildcardRelations;
  _count?: WildcardCounts;
  _ui?: WildcardUI;
}

/**
 * Interfaz extendida que incluye relaciones
 */
export interface WildcardWithRelations extends WildcardBase {
  _relations: WildcardRelations;
}

/**
 * Interfaz completa que incluye todos los campos y relaciones
 */
export interface WildcardComplete extends WildcardBase {
  parsedChildren: any[];
  _relations?: WildcardRelations;
  _count?: WildcardCounts;
  _ui: WildcardUI;
}

/**
 * Interfaz para crear un comodín
 */
export interface CreateWildcardData {
  name: string;
  emoji?: string;
  color?: string;
  description?: string | null;
  shortcut?: string | null;
  category?: string | null;
  children?: string | any[];
  featuredImage?: string | null;
  isFavorite?: boolean;
  parentId?: string | null;
}

/**
 * Interfaz para actualizar un comodín
 */
export interface UpdateWildcardData {
  name?: string;
  emoji?: string;
  color?: string;
  description?: string | null;
  shortcut?: string | null;
  category?: string | null;
  children?: string | any[];
  featuredImage?: string | null;
  isFavorite?: boolean;
  parentId?: string | null;
}

/**
 * Alias para mantener compatibilidad con la API actual
 */
export type WildcardUpdateInput = UpdateWildcardData;

/**
 * Interfaz para filtros de búsqueda de comodines
 */
export interface WildcardFilters {
  searchQuery?: string;
  categories?: string[];
  onlyFavorites?: boolean;
  parentId?: string | null;
  hasChildren?: boolean;
}

/**
 * Interfaz para opciones de búsqueda de comodines
 */
export interface WildcardSearchOptions {
  page?: number;
  pageSize?: number;
  sortBy?: WildcardSortCriteria;
  filters?: WildcardFilters;
  include?: {
    parent?: boolean;
    childWildcards?: boolean;
    images?: boolean;
    videos?: boolean;
    albums?: boolean;
    collections?: boolean;
    tags?: boolean;
    characters?: boolean;
    places?: boolean;
    worldItems?: boolean;
    concepts?: boolean;
    prompts?: boolean;
    notes?: boolean;
    properties?: boolean;
    groups?: boolean;
  };
}

/**
 * Interfaz para resultados de búsqueda de comodines
 */
export interface WildcardSearchResult {
  items: WildcardComplete[];
  total: number;
  totalPages: number;
}

/**
 * Enumeración para criterios de ordenación
 */
export enum WildcardSortCriteria {
  NAME_ASC = 'name:asc',
  NAME_DESC = 'name:desc',
  CREATED_ASC = 'created:asc',
  CREATED_DESC = 'created:desc',
  UPDATED_ASC = 'updated:asc',
  UPDATED_DESC = 'updated:desc',
}

/**
 * Enumeración para modos de visualización
 */
export enum WildcardViewMode {
  GRID = 'grid',
  LIST = 'list',
  CARDS = 'cards',
  TREE = 'tree',
  DETAILS = 'details',
}

/**
 * Mapa de propiedades para ordenación
 */
export const WILDCARD_SORT_PROPERTY_MAP: Record<WildcardSortCriteria, string> = {
  [WildcardSortCriteria.NAME_ASC]: 'name',
  [WildcardSortCriteria.NAME_DESC]: 'name',
  [WildcardSortCriteria.CREATED_ASC]: 'createdAt',
  [WildcardSortCriteria.CREATED_DESC]: 'createdAt',
  [WildcardSortCriteria.UPDATED_ASC]: 'updatedAt',
  [WildcardSortCriteria.UPDATED_DESC]: 'updatedAt',
};