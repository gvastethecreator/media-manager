/**
 * @file Tipos para el store de la entidad Tag
 * @module store/entities/tag/types
 */

import { type Tag } from '@/types/entities/tag';
import { TagSortCriteria, TagViewMode } from '@/types/entities/tag/enums';

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
  selectedId: string | null;
  selectedIds: string[]; // Selección múltiple
  expandedIds: string[]; // IDs expandidos
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

// Re-exportar para el store
export { TagSortCriteria, TagViewMode };

// 🔍 Filtros alternativos (para compatibilidad)
export interface TagFilters {
  sortBy: TagSortCriteria;
  searchTerm: string;
  category: string | null;
  rarity: string | null;
}

// 📊 Estado del store alternativo (para compatibilidad)
export interface TagAltState {
  tags: Tag[];
  ui: TagUIState;
  filters: TagFilters;
  isLoading: boolean;
  error: string | null;
}

// 🔄 Acciones del store
export interface TagActions {
  // Carga de tags
  loadTags: () => Promise<void>;

  // Gestión de tags
  createTag: (tag: Partial<Tag>) => Promise<void>;
  updateTag: (id: string, tag: Partial<Tag>) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;

  // Acciones de UI
  selectTag: (id: string | null) => void;
  startEditing: (id: string | null) => void;
  highlightTag: (id: string | null) => void;
  setViewMode: (mode: TagViewMode) => void;

  // Filtros
  updateFilters: (filters: Partial<TagFilters>) => void;
  clearFilters: () => void;

  // Selectores
  getTagById: (id: string) => Tag | undefined;
  getFilteredTags: () => Tag[];
  getSortedTags: () => Tag[];
}

// 🏗️ Store completo
export type TagStore = TagAltState & TagActions;