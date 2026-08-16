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
	gap?: number;
	itemSize: number; // tamaño de celda o tarjeta
	padding?: number;
	tcgHolo?: boolean;
	tcgHoverReveal?: boolean;
	tcgRounded?: boolean;
	tcgShadows?: boolean;
	tcgTilt?: boolean;
}

export interface ListLikeViewConfig extends PerViewConfigBase {
	rowHeight: number;
}

export type PerViewConfig =
	| ({ kind: 'grid' | 'masonry' | 'cards' } & GridLikeViewConfig)
	| ({ kind: 'list' | 'table' } & ListLikeViewConfig);

export interface SortOption {
	direction: 'asc' | 'desc';
	field: string;
}

export interface FilterOption {
	field: string;
	operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startsWith' | 'endsWith';
	value: string | number | boolean | null;
}

export interface ViewOptionsState {
	addFilterOption: (option: FilterOption) => void;
	addSortOption: (option: SortOption) => void;
	animationDuration: number;
	backgroundColor: string;
	enableAnimations: boolean;
	filterOptions: FilterOption[];
	groupByEntityType: boolean;
	includeSubfolders: boolean;
	infiniteScroll: {
		enabled: boolean;
		threshold: number; // Píxeles desde el bottom para activar carga automática
		autoLoad: boolean; // Si debe cargar automáticamente o usar botón manual
		cooldownMs: number; // Tiempo mínimo entre cargas automáticas
	};
	itemSize: number;
	pagination: {
		mode: PaginationMode;
		pageSize: number;
	};
	removeFilterOption: (field: string) => void;
	removeSortOption: (field: string) => void;
	resetAll: () => void;
	resetFilters: () => void;
	resetLocalStorage: () => void;
	searchQuery: string;
	setAnimationDuration: (duration: number) => void;
	setBackgroundColor: (color: string) => void;
	setEnableAnimations: (enabled: boolean) => void;
	setFilterOptions: (options: FilterOption[]) => void;
	setGroupByEntityType: (enabled: boolean) => void;
	setIncludeSubfolders: (enabled: boolean) => void;
	setInfiniteScroll: (patch: Partial<ViewOptionsState['infiniteScroll']>) => void;
	setItemSize: (size: number) => void;
	setPageSize: (size: number) => void;
	setPaginationMode: (mode: PaginationMode) => void;
	setRenderingMode: (view: ViewKey, mode: RenderingMode) => void;
	setSearchQuery: (query: string) => void;
	setShowMetadata: (enabled: boolean) => void;
	setShowStats: (enabled: boolean) => void;
	setShowTags: (enabled: boolean) => void;
	setShowThumbnails: (enabled: boolean) => void;
	setSortOptions: (options: SortOption[]) => void;
	setUseCanvasRendering: (enabled: boolean) => void;
	setViewConfig: (view: ViewKey, patch: Partial<PerViewConfig>) => void;
	setViewMode: (mode: ViewMode) => void;
	setVirtualization: (patch: Partial<ViewOptionsState['virtualization']>) => void;
	showMetadata: boolean;
	showStats: boolean;
	showTags: boolean;
	showThumbnails: boolean;
	sortOptions: SortOption[];
	sortVersion: number; // Incrementa en cada cambio de sortOptions para invalidar caches derivados
	toggleEnableAnimations: () => void;
	toggleGroupByEntityType: () => void;
	toggleIncludeSubfolders: () => void;
	toggleInfiniteScrollAutoLoad: () => void;
	toggleInfiniteScrollEnabled: () => void;
	toggleShowMetadata: () => void;
	toggleShowStats: () => void;
	toggleShowTags: () => void;
	toggleShowThumbnails: () => void;
	toggleUseCanvasRendering: () => void;
	useCanvasRendering: boolean;
	viewMode: ViewMode;
	views: Record<ViewKey, PerViewConfig>;
	virtualization: {
		enabled: boolean;
		threshold: number;
		overscan: number;
		estimatedItemHeight: number;
		maxItems: number; // Límite máximo de elementos en memoria
	};
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
	includeSubfolders: true,
	backgroundColor: 'transparent',
	showThumbnails: true,
	showMetadata: true,
	showTags: true,
	showStats: true,
	enableAnimations: true,
	animationDuration: 300,
	pagination: {
		mode: 'infinite' as PaginationMode,
		pageSize: 200,
	},
	infiniteScroll: {
		enabled: true,
		threshold: 300, // 300px desde el bottom
		autoLoad: true, // Por defecto usar scroll infinito automático
		cooldownMs: 300,
	},
	views: {
		grid: { kind: 'grid', renderingMode: 'canvas', itemSize: 150, gap: 8 },
		list: { kind: 'list', renderingMode: 'canvas', rowHeight: 36 },
		masonry: {
			kind: 'masonry',
			renderingMode: 'canvas',
			itemSize: 200,
			gap: 8,
			padding: 16,
			tcgHoverReveal: true,
			tcgHolo: true,
			tcgShadows: true,
			tcgRounded: true,
			tcgTilt: true,
		},
		cards: { kind: 'grid', renderingMode: 'canvas', itemSize: 180, gap: 12 },
		table: { kind: 'list', renderingMode: 'canvas', rowHeight: 32 },
	} as Record<ViewKey, PerViewConfig>,
	virtualization: {
		enabled: true,
		threshold: 100, // Activar virtualización con 100+ elementos
		overscan: 5, // Renderizar 5 elementos extra arriba/abajo para scroll suave
		estimatedItemHeight: 200, // Altura estimada por elemento
		maxItems: 1000, // Límite máximo de elementos en memoria para performance
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
				set((state: ViewOptionsState) => ({
					pagination: { ...state.pagination, pageSize: Math.min(200, Math.max(1, size)) },
				})),

			setViewMode: (mode: ViewMode) => {
				if (get().viewMode === mode) return;
				set({ viewMode: mode });
			},

			setItemSize: (size: number) =>
				set((state: ViewOptionsState) => {
					const viewKey = state.viewMode as ViewKey;
					const currentView = state.views[viewKey];

					// Sincronizar itemSize global y el de la vista actual
					const updates: Partial<ViewOptionsState> = { itemSize: size };

					// Si la vista actual tiene itemSize (grid, masonry, cards), actualizarlo también
					if (currentView && 'itemSize' in currentView) {
						updates.views = {
							...state.views,
							[viewKey]: { ...currentView, itemSize: size } as PerViewConfig,
						};
					}

					return updates;
				}),

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

			setInfiniteScroll: (patch: Partial<typeof DEFAULT_STATE.infiniteScroll>) =>
				set((state: ViewOptionsState) => ({
					infiniteScroll: { ...state.infiniteScroll, ...patch },
				})),

			toggleInfiniteScrollEnabled: () =>
				set((state: ViewOptionsState) => ({
					infiniteScroll: { ...state.infiniteScroll, enabled: !state.infiniteScroll.enabled },
				})),

			toggleInfiniteScrollAutoLoad: () =>
				set((state: ViewOptionsState) => ({
					infiniteScroll: { ...state.infiniteScroll, autoLoad: !state.infiniteScroll.autoLoad },
				})),

			setShowThumbnails: (enabled: boolean) => set({ showThumbnails: enabled }),
			toggleShowThumbnails: () => set((state: ViewOptionsState) => ({ showThumbnails: !state.showThumbnails })),

			setShowMetadata: (enabled: boolean) => set({ showMetadata: enabled }),
			toggleShowMetadata: () => set((state: ViewOptionsState) => ({ showMetadata: !state.showMetadata })),

			setShowTags: (enabled: boolean) => set({ showTags: enabled }),
			toggleShowTags: () => set((state: ViewOptionsState) => ({ showTags: !state.showTags })),

			setShowStats: (enabled: boolean) => set({ showStats: enabled }),
			toggleShowStats: () => set((state: ViewOptionsState) => ({ showStats: !state.showStats })),

			setEnableAnimations: (enabled: boolean) => set({ enableAnimations: enabled }),
			toggleEnableAnimations: () => set((state: ViewOptionsState) => ({ enableAnimations: !state.enableAnimations })),

			setAnimationDuration: (duration: number) => set({ animationDuration: duration }),

			resetFilters: () =>
				set({
					filterOptions: [],
					searchQuery: '',
				}),

			resetAll: () => set(DEFAULT_STATE),

			resetLocalStorage: () => {
				localStorage.removeItem('view-options-storage');
				window.location.reload();
			},
		}),
		{
			name: 'view-options-storage',
			version: 2,
			migrate: (persisted: any, version) => {
				if (!persisted || version >= 2) {
					return persisted;
				}

				return {
					...persisted,
					pagination: {
						...(persisted.pagination ?? {}),
						mode: 'infinite' as PaginationMode,
					},
					infiniteScroll: {
						...DEFAULT_STATE.infiniteScroll,
						...(persisted.infiniteScroll ?? {}),
						enabled: true,
						autoLoad: true,
					},
				};
			},
			// merge para compatibilidad con estados previos persistidos
			merge: (persisted: any, current: any) => {
				const merged = { ...current, ...persisted };
				// defaults para nuevos campos
				merged.backgroundColor ??= DEFAULT_STATE.backgroundColor;
				merged.pagination ??= DEFAULT_STATE.pagination;
				merged.pagination.mode ??= DEFAULT_STATE.pagination.mode;
				merged.pagination.pageSize = Math.min(200, Math.max(1, merged.pagination.pageSize ?? 200));
				merged.infiniteScroll ??= DEFAULT_STATE.infiniteScroll;
				merged.infiniteScroll.cooldownMs ??= DEFAULT_STATE.infiniteScroll.cooldownMs;
				merged.includeSubfolders ??= DEFAULT_STATE.includeSubfolders;
				merged.groupByEntityType ??= DEFAULT_STATE.groupByEntityType;
				merged.views = { ...DEFAULT_STATE.views, ...(persisted?.views ?? {}) };
				// defaults para settings visuales
				merged.showThumbnails ??= DEFAULT_STATE.showThumbnails;
				merged.showMetadata ??= DEFAULT_STATE.showMetadata;
				merged.showTags ??= DEFAULT_STATE.showTags;
				merged.showStats ??= DEFAULT_STATE.showStats;
				merged.enableAnimations ??= DEFAULT_STATE.enableAnimations;
				merged.animationDuration ??= DEFAULT_STATE.animationDuration;
				return merged;
			},
		}
	)
);
