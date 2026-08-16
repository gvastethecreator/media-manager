import type { ConceptWithStats } from '@/types/entities/concept/base';
import type {
	ConceptCreateInput,
	ConceptFilters,
	ConceptSortOption,
	ConceptUpdateInput,
	ConceptViewMode,
} from '@/types/entities/concept/types';
import { EntityType } from '@/types/entities/entities';

/**
 * Slice de estado y acciones para el core de Conceptos
 */
export interface ConceptCoreSlice {
	concepts: ConceptWithStats[];
	createConcept: (data: ConceptCreateInput) => Promise<void>;
	deleteConcept: (id: string) => Promise<void>;
	error: string | null;
	isLoading: boolean;
	loadConcepts: () => Promise<void>;
	reset: () => void;
	selectConcept: (concept: ConceptWithStats | null) => void;
	selectedConcept: ConceptWithStats | null;
	updateConcept: (id: string, data: ConceptUpdateInput) => Promise<void>;
}

/**
 * Slice de estado y acciones para los filtros de Conceptos
 */
export interface ConceptFiltersSlice {
	clearFilters: () => void;
	filters: ConceptFilters;
	page: number;
	pageSize: number;
	setCategoryFilter: (category: string | null) => void;
	setFilters: (filters: Partial<ConceptFilters>) => void;
	setOnlyFavoritesFilter: (onlyFavorites: boolean) => void;
	setPage: (page: number) => void;
	setPageSize: (size: number) => void;
	setSearchFilter: (search: string) => void;
	setSortBy: (sortOption: ConceptSortOption) => void;
	setTagsFilter: (tags: string[]) => void;
	sortBy: ConceptSortOption;
}

/**
 * Slice de estado y acciones para la UI de Conceptos
 */
export interface ConceptUISlice {
	closeCreateModal: () => void;
	closeDeleteDialog: () => void;
	closeDetailsDrawer: () => void;
	closeEditModal: () => void;
	isCreateModalOpen: boolean;
	isDeleteDialogOpen: boolean;
	isDetailsDrawerOpen: boolean;
	isEditModalOpen: boolean;
	openCreateModal: () => void;
	openDeleteDialog: () => void;
	openDetailsDrawer: () => void;
	openEditModal: () => void;
	resetUI: () => void;
	setViewMode: (mode: ConceptViewMode) => void;
	viewMode: ConceptViewMode;
}

/**
 * Slice de estado y acciones para las relaciones de Conceptos
 */
export interface ConceptRelationsSlice {
	addConceptToEntity: (conceptId: string, entityId: string, entityType: EntityType) => Promise<void>;
	removeConceptFromEntity: (conceptId: string, entityId: string, entityType: EntityType) => Promise<void>;
}

/**
 * Store completo de Conceptos combinando todas las slices
 */
export interface ConceptStore extends ConceptCoreSlice, ConceptFiltersSlice, ConceptUISlice, ConceptRelationsSlice {}
