import type { EntityType } from '@/types/entities/entities';
import type { PromptBase, PromptWithStats } from '@/types/entities/prompt/base';
import type { PromptSortOption, PromptViewMode } from '@/types/entities/prompt/enums';
import type { PromptExecutionParams, PromptExecutionResult, PromptFilters } from '@/types/entities/prompt/extended';

/**
 * Store completo de Prompts combinando todas las slices
 */
export interface PromptStore {
	// Acciones - RelationsSlice
	addPromptToEntity: (promptId: string, entityId: string, entityType: EntityType) => Promise<void>;
	clearExecutionResult: () => void;
	clearFilters: () => void;
	closeCreateModal: () => void;
	closeDeleteDialog: () => void;
	closeDetailsDrawer: () => void;
	closeEditModal: () => void;
	closeExecuteModal: () => void;
	createPrompt: (data: Omit<PromptBase, 'id'>) => Promise<void>;
	deletePrompt: (id: string) => Promise<void>;
	error: string | null;

	// Acciones - ExecutionSlice
	executePrompt: (params: PromptExecutionParams) => Promise<PromptExecutionResult | null>;
	executionError: string | null;
	executionResult: PromptExecutionResult | null;

	// Estado - FiltersSlice
	filters: PromptFilters;
	isCreateModalOpen: boolean;
	isDeleteDialogOpen: boolean;
	isDetailsDrawerOpen: boolean;
	isEditModalOpen: boolean;
	isExecuteModalOpen: boolean;

	// Estado - ExecutionSlice
	isExecuting: boolean;
	isLoading: boolean;

	// Acciones - CoreSlice
	loadPrompts: () => Promise<void>;

	// Acciones - UISlice
	openCreateModal: () => void;
	openDeleteDialog: () => void;
	openDetailsDrawer: () => void;
	openEditModal: () => void;
	openExecuteModal: () => void;
	page: number;
	pageSize: number;
	// Estado - CoreSlice
	prompts: PromptWithStats[];
	removePromptFromEntity: (promptId: string, entityId: string, entityType: EntityType) => Promise<void>;
	reset: () => void;
	resetUI: () => void;
	selectedPrompt: PromptWithStats | null;
	selectPrompt: (prompt: PromptWithStats | null) => void;
	setCategoryFilter: (category: string | null) => void;

	// Acciones - FiltersSlice
	setFilters: (filters: Partial<PromptFilters>) => void;
	setOnlyFavoritesFilter: (onlyFavorites: boolean) => void;
	setPage: (page: number) => void;
	setPageSize: (size: number) => void;
	setSearchFilter: (search: string) => void;
	setSortBy: (sortOption: PromptSortOption) => void;
	setTagsFilter: (tags: string[]) => void;
	setViewMode: (mode: PromptViewMode) => void;
	sortBy: PromptSortOption;
	updatePrompt: (id: string, data: Partial<PromptBase>) => Promise<void>;

	// Estado - UISlice
	viewMode: PromptViewMode;
}
