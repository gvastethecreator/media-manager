import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ViewMode = 'grid' | 'list' | 'cards' | 'masonry' | 'simple-grid' | 'table' | 'single' | 'canvas';
export type RenderingMode = 'virtualized' | 'canvas' | 'webgl';
export type PaginationMode = 'pagination' | 'infinite';

export type ViewKey = 'grid' | 'list' | 'masonry' | 'cards' | 'table';

export interface PerViewConfigBase {
	renderingMode: RenderingMode;
}

export interface GridLikeViewConfig extends PerViewConfigBase {
	itemSize: number; // tamaño de celda o tarjeta
	gap?: number;
}

export interface ListLikeViewConfig extends PerViewConfigBase {
	rowHeight: number;
}

export type PerViewConfig =
	| ({ kind: 'grid' | 'masonry' | 'cards' } & GridLikeViewConfig)
	| ({ kind: 'list' | 'table' } & ListLikeViewConfig);

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
	includeSubfolders: boolean;
	backgroundColor: string;
	pagination: {
		mode: PaginationMode;
		pageSize: number;
	};
	views: Record<ViewKey, PerViewConfig>;
	virtualization: {
		enabled: boolean;
		threshold: number;
		overscan: number;
		estimatedItemHeight: number;
		maxItems: number; // Límite máximo de elementos en memoria
	};
	setUseCanvasRendering: (enabled: boolean) => void;
	toggleUseCanvasRendering: () => void;
	setIncludeSubfolders: (enabled: boolean) => void;
	toggleIncludeSubfolders: () => void;
	setBackgroundColor: (color: string) => void;
	setPaginationMode: (mode: PaginationMode) => void;
	setPageSize: (size: number) => void;
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
	setRenderingMode: (view: ViewKey, mode: RenderingMode) => void;
	setViewConfig: (view: ViewKey, patch: Partial<PerViewConfig>) => void;
	setVirtualization: (patch: Partial<ViewOptionsState['virtualization']>) => void;
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
	includeSubfolders: false,
	backgroundColor: 'transparent',
	pagination: {
		mode: 'pagination' as PaginationMode,
		pageSize: 300,
	},
	views: {
		grid: { kind: 'grid', renderingMode: 'canvas', itemSize: 150, gap: 8 },
		list: { kind: 'list', renderingMode: 'canvas', rowHeight: 36 },
		masonry: { kind: 'grid', renderingMode: 'canvas', itemSize: 150, gap: 8 },
		cards: { kind: 'grid', renderingMode: 'canvas', itemSize: 180, gap: 12 },
		table: { kind: 'list', renderingMode: 'canvas', rowHeight: 32 },
	} as Record<ViewKey, PerViewConfig>,
	virtualization: {
		enabled: true,
		threshold: 100, // Activar virtualización con 100+ elementos
		overscan: 5, // Renderizar 5 elementos extra arriba/abajo para scroll suave
		estimatedItemHeight: 200, // Altura estimada por elemento
		maxItems: 250, // Límite máximo de elementos en memoria para performance
	},
};

export type ViewOptionsStore = ViewOptionsState;

export const useViewOptionsStore = create<ViewOptionsState>()(
	persist(
		(set, get) => ({
			...DEFAULT_STATE,

			setUseCanvasRendering: (enabled: boolean) => set({ useCanvasRendering: enabled }),
			toggleUseCanvasRendering: () =>
				set((state: ViewOptionsState) => ({ useCanvasRendering: !state.useCanvasRendering })),

			setIncludeSubfolders: (enabled: boolean) => set({ includeSubfolders: enabled }),
			toggleIncludeSubfolders: () =>
				set((state: ViewOptionsState) => ({ includeSubfolders: !state.includeSubfolders })),

			setBackgroundColor: (color: string) => set({ backgroundColor: color }),

			setPaginationMode: (mode: PaginationMode) =>
				set((state: ViewOptionsState) => ({ pagination: { ...state.pagination, mode } })),
			setPageSize: (size: number) =>
				set((state: ViewOptionsState) => ({ pagination: { ...state.pagination, pageSize: Math.max(1, size) } })),

			setViewMode: (mode: ViewMode) => set({ viewMode: mode }),

			setItemSize: (size: number) => set({ itemSize: size }),

			setSortOptions: (options: SortOption[]) =>
				set((state: ViewOptionsState) => ({ sortOptions: options, sortVersion: state.sortVersion + 1 })),

			addSortOption: (option: SortOption) =>
				set((state: ViewOptionsState) => {
					const exists = state.sortOptions.some((o: SortOption) => o.field === option.field);
					if (exists) {
						return {
							sortOptions: state.sortOptions.map((o: SortOption) => (o.field === option.field ? option : o)),
							sortVersion: state.sortVersion + 1,
						};
					}
					return { sortOptions: [...state.sortOptions, option], sortVersion: state.sortVersion + 1 };
				}),

			removeSortOption: (field: string) =>
				set((state: ViewOptionsState) => ({
					sortOptions: state.sortOptions.filter((o: SortOption) => o.field !== field),
					sortVersion: state.sortVersion + 1,
				})),

			setFilterOptions: (options: FilterOption[]) => set({ filterOptions: options }),

			addFilterOption: (option: FilterOption) =>
				set((state: ViewOptionsState) => {
					// Replace if exists, otherwise add
					const exists = state.filterOptions.some((o: FilterOption) => o.field === option.field);
					if (exists) {
						return {
							filterOptions: state.filterOptions.map((o: FilterOption) => (o.field === option.field ? option : o)),
						};
					}
					return { filterOptions: [...state.filterOptions, option] };
				}),

			removeFilterOption: (field: string) =>
				set((state: ViewOptionsState) => ({
					filterOptions: state.filterOptions.filter((o: FilterOption) => o.field !== field),
				})),

			setSearchQuery: (query: string) => set({ searchQuery: query }),

			setGroupByEntityType: (enabled: boolean) => set({ groupByEntityType: enabled }),
			toggleGroupByEntityType: () =>
				set((state: ViewOptionsState) => ({ groupByEntityType: !state.groupByEntityType })),

			setRenderingMode: (view: ViewKey, mode: RenderingMode) =>
				set((state: ViewOptionsState) => ({
					views: {
						...state.views,
						[view]: { ...state.views[view], renderingMode: mode } as PerViewConfig,
					},
				})),

			setViewConfig: (view: ViewKey, patch: Partial<PerViewConfig>) =>
				set((state: ViewOptionsState) => ({
					views: {
						...state.views,
						[view]: { ...state.views[view], ...patch } as PerViewConfig,
					},
				})),

			setVirtualization: (patch: Partial<typeof DEFAULT_STATE.virtualization>) =>
				set((state: ViewOptionsState) => ({
					virtualization: { ...state.virtualization, ...patch },
				})),

			resetFilters: () =>
				set({
					filterOptions: [],
					searchQuery: '',
				}),

			resetAll: () => set(DEFAULT_STATE),
		}),
		{
			name: 'view-options-storage',
			// merge para compatibilidad con estados previos persistidos
			merge: (persisted: any, current: any) => {
				const merged = { ...current, ...persisted };
				// defaults para nuevos campos
				merged.backgroundColor ??= DEFAULT_STATE.backgroundColor;
				merged.pagination ??= DEFAULT_STATE.pagination;
				merged.views = { ...DEFAULT_STATE.views, ...(persisted?.views ?? {}) };
				return merged;
			},
		}
	)
);
