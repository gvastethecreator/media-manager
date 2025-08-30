import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ViewMode = 'grid' | 'list' | 'cards' | 'masonry' | 'simple-grid' | 'table' | 'single' | 'canvas';

export type SortOption = {
	field: string;
	direction: 'asc' | 'desc';
};

export type FilterOption = {
	field: string;
	value: string | number | boolean | null;
	operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startsWith' | 'endsWith';
};

export interface ViewOptionsState {
	viewMode: ViewMode;
	itemSize: number;
	sortOptions: SortOption[];
	sortVersion: number; // Incrementa en cada cambio de sortOptions para invalidar caches derivados
	filterOptions: FilterOption[];
	searchQuery: string;
	groupByEntityType: boolean;
	useCanvasRendering: boolean;
	setUseCanvasRendering: (enabled: boolean) => void;
	toggleUseCanvasRendering: () => void;
	setViewMode: (mode: ViewMode) => void;
	setItemSize: (size: number) => void;
	setSortOptions: (options: SortOption[]) => void;
	addSortOption: (option: SortOption) => void;
	removeSortOption: (field: string) => void;
	setFilterOptions: (options: FilterOption[]) => void;
	addFilterOption: (option: FilterOption) => void;
	removeFilterOption: (field: string) => void;
	setSearchQuery: (query: string) => void;
	setGroupByEntityType: (enabled: boolean) => void;
	toggleGroupByEntityType: () => void;
	resetFilters: () => void;
	resetAll: () => void;
}

const DEFAULT_STATE = {
	viewMode: 'grid' as ViewMode,
	itemSize: 150,
	sortOptions: [{ field: 'createdAt', direction: 'desc' as const }],
	sortVersion: 0,
	filterOptions: [],
	searchQuery: '',
	groupByEntityType: false,
	useCanvasRendering: false,
};

export type ViewOptionsStore = ViewOptionsState;

export const useViewOptionsStore = create<ViewOptionsState>()(
	persist(
		(set) => ({
			...DEFAULT_STATE,

			setUseCanvasRendering: (enabled: boolean) => set({ useCanvasRendering: enabled }),
			toggleUseCanvasRendering: () => set((state) => ({ useCanvasRendering: !state.useCanvasRendering })),

			setViewMode: (mode) => set({ viewMode: mode }),

			setItemSize: (size) => set({ itemSize: size }),

			setSortOptions: (options) => set((state) => ({ sortOptions: options, sortVersion: state.sortVersion + 1 })),

			addSortOption: (option) =>
				set((state) => {
					const exists = state.sortOptions.some((o) => o.field === option.field);
					if (exists) {
						return {
							sortOptions: state.sortOptions.map((o) => (o.field === option.field ? option : o)),
							sortVersion: state.sortVersion + 1,
						};
					}
					return { sortOptions: [...state.sortOptions, option], sortVersion: state.sortVersion + 1 };
				}),

			removeSortOption: (field) =>
				set((state) => ({
					sortOptions: state.sortOptions.filter((o) => o.field !== field),
					sortVersion: state.sortVersion + 1,
				})),

			setFilterOptions: (options) => set({ filterOptions: options }),

			addFilterOption: (option) =>
				set((state) => {
					// Replace if exists, otherwise add
					const exists = state.filterOptions.some((o) => o.field === option.field);
					if (exists) {
						return {
							filterOptions: state.filterOptions.map((o) => (o.field === option.field ? option : o)),
						};
					}
					return { filterOptions: [...state.filterOptions, option] };
				}),

			removeFilterOption: (field) =>
				set((state) => ({
					filterOptions: state.filterOptions.filter((o) => o.field !== field),
				})),

			setSearchQuery: (query) => set({ searchQuery: query }),

			setGroupByEntityType: (enabled: boolean) => set({ groupByEntityType: enabled }),
			toggleGroupByEntityType: () => set((state) => ({ groupByEntityType: !state.groupByEntityType })),

			resetFilters: () =>
				set({
					filterOptions: [],
					searchQuery: '',
				}),

			resetAll: () => set(DEFAULT_STATE),
		}),
		{
			name: 'view-options-storage',
		}
	)
);
