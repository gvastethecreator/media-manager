import type { VisualPresetExtended } from '@/types/entities/visual-preset';

// Slice de Core - Estado principal
export interface VisualPresetCoreState {
	presets: VisualPresetExtended[];
	currentPresetId: string | null;
	currentPreset: VisualPresetExtended | null;
	loading: boolean;
	error: string | null;
	isCreating: boolean;
	isUpdating: boolean;
	isDeleting: boolean;
}

// Slice de Core - Acciones
export interface VisualPresetCoreActions {
	fetchPresets: () => Promise<void>;
	fetchPresetById: (id: string) => Promise<VisualPresetExtended | null>;
	createPreset: (data: any) => Promise<VisualPresetExtended | null>;
	updatePreset: (id: string, data: any) => Promise<VisualPresetExtended | null>;
	deletePreset: (id: string) => Promise<boolean>;
	setCurrentPresetId: (id: string | null) => void;
	setCurrentPreset: (preset: VisualPresetExtended | null) => void;
	resetError: () => void;
}

// Slice de UI - Estado de interfaz
export interface VisualPresetUIState {
	isPresetModalOpen: boolean;
	isDeleteModalOpen: boolean;
	isSidebarOpen: boolean;
	viewMode: 'grid' | 'list' | 'cards';
	isDarkMode: boolean;
	selectedTab: string;
}

// Slice de UI - Acciones
export interface VisualPresetUIActions {
	togglePresetModal: () => void;
	openPresetModal: () => void;
	closePresetModal: () => void;
	toggleDeleteModal: () => void;
	openDeleteModal: () => void;
	closeDeleteModal: () => void;
	toggleSidebar: () => void;
	setViewMode: (mode: 'grid' | 'list' | 'cards') => void;
	toggleDarkMode: () => void;
	setSelectedTab: (tab: string) => void;
}

// Slice de Filtros - Estado
export interface VisualPresetFiltersState {
	searchTerm: string;
	selectedCategory: string | null;
	selectedTags: string[];
	onlyPublic: boolean;
	onlyDefault: boolean;
	sortBy: 'name' | 'date' | 'category';
	sortDirection: 'asc' | 'desc';
}

// Slice de Filtros - Acciones
export interface VisualPresetFiltersActions {
	setSearchTerm: (term: string) => void;
	setSelectedCategory: (category: string | null) => void;
	addSelectedTag: (tag: string) => void;
	removeSelectedTag: (tag: string) => void;
	clearSelectedTags: () => void;
	toggleOnlyPublic: () => void;
	toggleOnlyDefault: () => void;
	setSortBy: (sortBy: 'name' | 'date' | 'category') => void;
	toggleSortDirection: () => void;
	resetFilters: () => void;
	getFilteredPresets: () => VisualPresetExtended[];
}

// Store completo combinando todos los slices
export interface VisualPresetStore
	extends VisualPresetCoreState,
		VisualPresetCoreActions,
		VisualPresetUIState,
		VisualPresetUIActions,
		VisualPresetFiltersState,
		VisualPresetFiltersActions {
	// Propiedad para versión del store
	version?: number;
}
