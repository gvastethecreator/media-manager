/**
 * @file Tipos para la entidad Collection
 * @module types/entities/collection/collection-types
 */

import type { Album } from '../album/types';
import type { Character } from '../character/character-types';
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
  sortBy: string;
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
  editions: string;

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
  editions?: string;
  featuredImage?: string | null;
  isFavorite?: boolean;
  sortBy?: string;
  filters?: string;
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
  editions?: string;
  featuredImage?: string | null;
  isFavorite?: boolean;
  sortBy?: string;
  filters?: string;
  groupIds?: string[];
  propertyIds?: string[];
  wildcardIds?: string[];
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