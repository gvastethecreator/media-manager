import type { ConceptBase, ConceptWithStats } from '@/types/entities/concept/base';
import type { ConceptCreateInput, ConceptFilters, ConceptSortOption, ConceptUpdateInput, ConceptViewMode } from '@/types/entities/concept/types';
import { EntityType } from '@/types/entities/entities';

/**
 * Slice de estado y acciones para el core de Conceptos
 */
export interface ConceptCoreSlice {
	concepts: ConceptWithStats[];
	selectedConcept: ConceptWithStats | null;
	isLoading: boolean;
	error: string | null;
	loadConcepts: () => Promise<void>;
	createConcept: (data: ConceptCreateInput) => Promise<void>;
	updateConcept: (id: string, data: ConceptUpdateInput) => Promise<void>;
	deleteConcept: (id: string) => Promise<void>;
	selectConcept: (concept: ConceptWithStats | null) => void;
	reset: () => void;
}

/**
 * Slice de estado y acciones para los filtros de Conceptos
 */
export interface ConceptFiltersSlice {
	filters: ConceptFilters;
	sortBy: ConceptSortOption;
	page: number;
	pageSize: number;
	setFilters: (filters: Partial<ConceptFilters>) => void;
	setSortBy: (sortOption: ConceptSortOption) => void;
	setPage: (page: number) => void;
	setPageSize: (size: number) => void;
	setCategoryFilter: (category: string | null) => void;
	setSearchFilter: (search: string) => void;
	setTagsFilter: (tags: string[]) => void;
	setOnlyFavoritesFilter: (onlyFavorites: boolean) => void;
	clearFilters: () => void;
}

/**
 * Slice de estado y acciones para la UI de Conceptos
 */
export interface ConceptUISlice {
	viewMode: ConceptViewMode;
	isCreateModalOpen: boolean;
	isEditModalOpen: boolean;
	isDeleteDialogOpen: boolean;
	isDetailsDrawerOpen: boolean;
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
