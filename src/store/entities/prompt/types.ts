import { EntityType } from '@/types/entities/entities';
import type { PromptBase, PromptWithStats } from '@/types/entities/prompt/base';
import type { PromptSortOption, PromptViewMode } from '@/types/entities/prompt/enums';
import type { PromptExecutionParams, PromptExecutionResult, PromptFilters } from '@/types/entities/prompt/extended';

/**
 * Store completo de Prompts combinando todas las slices
 */
export interface PromptStore {
	// Estado - CoreSlice
	prompts: PromptWithStats[];
	selectedPrompt: PromptWithStats | null;
	isLoading: boolean;
	error: string | null;

	// Acciones - CoreSlice
	loadPrompts: () => Promise<void>;
	createPrompt: (data: Omit<PromptBase, 'id'>) => Promise<void>;
	updatePrompt: (id: string, data: Partial<PromptBase>) => Promise<void>;
	deletePrompt: (id: string) => Promise<void>;
	selectPrompt: (prompt: PromptWithStats | null) => void;
	reset: () => void;

	// Estado - FiltersSlice
	filters: PromptFilters;
	sortBy: PromptSortOption;
	page: number;
	pageSize: number;

	// Estado - UISlice
	viewMode: PromptViewMode;
	isCreateModalOpen: boolean;
	isEditModalOpen: boolean;
	isDeleteDialogOpen: boolean;
	isDetailsDrawerOpen: boolean;
	isExecuteModalOpen: boolean;

	// Acciones - FiltersSlice
	setFilters: (filters: Partial<PromptFilters>) => void;
	setSortBy: (sortOption: PromptSortOption) => void;
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
	openExecuteModal: () => void;
	closeExecuteModal: () => void;
	setViewMode: (mode: PromptViewMode) => void;
	resetUI: () => void;

	// Estado - ExecutionSlice
	isExecuting: boolean;
	executionResult: PromptExecutionResult | null;
	executionError: string | null;

	// Acciones - ExecutionSlice
	executePrompt: (params: PromptExecutionParams) => Promise<PromptExecutionResult | null>;
	clearExecutionResult: () => void;

	// Acciones - RelationsSlice
	addPromptToEntity: (promptId: string, entityId: string, entityType: EntityType) => Promise<void>;
	removePromptFromEntity: (promptId: string, entityId: string, entityType: EntityType) => Promise<void>;
}
