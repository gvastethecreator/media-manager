import type { ConceptBase, ConceptWithStats } from '@/types/entities/concept/base';
import type { ConceptSortOption, ConceptViewMode } from '@/types/entities/concept/enums';
import type { ConceptFilters } from '@/types/entities/concept/extended';
import type { EntityType } from '@/types/entities/entities';

/**
 * Store completo de Conceptos combinando todas las slices
 */
export interface ConceptStore {
  // Estado - CoreSlice
  concepts: ConceptWithStats[];
  selectedConcept: ConceptWithStats | null;
  isLoading: boolean;
  error: string | null;

  // Acciones - CoreSlice
  loadConcepts: () => Promise<void>;
  createConcept: (data: Omit<ConceptBase, 'id'>) => Promise<void>;
  updateConcept: (id: string, data: Partial<ConceptBase>) => Promise<void>;
  deleteConcept: (id: string) => Promise<void>;
  selectConcept: (concept: ConceptWithStats | null) => void;
  reset: () => void;

  // Estado - FiltersSlice
  filters: ConceptFilters;
  sortBy: ConceptSortOption;
  page: number;
  pageSize: number;

  // Estado - UISlice
  viewMode: ConceptViewMode;
  isCreateModalOpen: boolean;
  isEditModalOpen: boolean;
  isDeleteDialogOpen: boolean;
  isDetailsDrawerOpen: boolean;

  // Acciones - FiltersSlice
  setFilters: (filters: Partial<ConceptFilters>) => void;
  setSortBy: (sortOption: ConceptSortOption) => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setCategoryFilter: (category: string | null) => void;
  setSearchFilter: (search: string) => void;
  setTagsFilter: (tags: string[]) => void;
  setOnlyFavoritesFilter: (onlyFavorites: boolean) => void;
  clearFilters: () => void;

  // Acciones - UISlice
  openCreateModal: () => void;
  closeCreateModal: () => void;
  openEditModal: () => void;
  closeEditModal: () => void;
  openDeleteDialog: () => void;
  closeDeleteDialog: () => void;
  openDetailsDrawer: () => void;
  closeDetailsDrawer: () => void;
  setViewMode: (mode: ConceptViewMode) => void;
  resetUI: () => void;

  // Acciones - RelationsSlice
  addConceptToEntity: (conceptId: string, entityId: string, entityType: EntityType) => Promise<void>;
  removeConceptFromEntity: (conceptId: string, entityId: string, entityType: EntityType) => Promise<void>;
}