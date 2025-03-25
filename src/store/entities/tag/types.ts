/**
 * @file Tipos para el store de la entidad Tag
 * @module store/entities/tag/types
 */

import { type Tag, TagSortCriteria, TagViewMode } from '../../../types/entities/tag';

/**
 * Estado del núcleo del store
 */
export interface TagCoreState {
  tags: Record<string, Tag>;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

/**
 * Estado de la UI del store
 */
export interface TagUIState {
  selectedIds: string[];
  expandedIds: string[];
  editingId: string | null;
  highlightedId: string | null;
  viewMode: TagViewMode;
}

/**
 * Estado de filtros del store
 */
export interface TagFiltersState {
  sortBy: TagSortCriteria;
  searchQuery: string;
  showOnlyFavorites: boolean;
  categories: string[];
  rarities: string[];
}

/**
 * Estado completo del store
 */
export interface TagState {
  core: TagCoreState;
  ui: TagUIState;
  filters: TagFiltersState;
}