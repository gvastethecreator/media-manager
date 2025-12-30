/**
 * @file Exportaciones públicas del File Browser refactorizado
 * @module file-browser-new
 *
 * Nueva arquitectura modular del explorador de archivos.
 *
 * ## Estructura:
 * - `types/` - Tipos TypeScript centralizados
 * - `core/` - Contexto, provider y constantes
 * - `hooks/` - Hooks reutilizables
 * - `components/` - Componentes UI atómicos
 * - `views/` - Vistas de rendering (grid, list, etc.)
 * - `utils/` - Utilidades puras (sort, filter, group)
 *
 * ## Uso básico:
 * ```tsx
 * import { FileBrowser } from '@/components/features/file-browser-new';
 *
 * // Por carpeta
 * <FileBrowser folderId="folder-123" />
 *
 * // Con items directos
 * <FileBrowser items={myItems} />
 * ```
 *
 * ## Uso con contexto:
 * ```tsx
 * import { FileBrowserProvider, useFileBrowserContext } from '@/components/features/file-browser-new';
 *
 * function MyApp() {
 *   return (
 *     <FileBrowserProvider folderId="folder-123">
 *       <MyCustomToolbar />
 *       <MyCustomView />
 *     </FileBrowserProvider>
 *   );
 * }
 *
 * function MyCustomToolbar() {
 *   const { selectAll, clearSelection, selectedIds } = useFileBrowserContext();
 *   // ...
 * }
 * ```
 */

// Componente principal
export { FileBrowser, FileBrowserByFolder } from './file-browser';

// Types
export type {
	// Item types
	BrowserEntityType,
	BrowserItem,
	SelectableBrowserItem,
	BrowserItemGroup,
	ProcessedItems,
	// View types
	ViewMode,
	RenderMode,
	ViewConfig,
	ViewConfigBase,
	GridViewConfig,
	ListViewConfig,
	MasonryViewConfig,
	TableViewConfig,
	CardsViewConfig,
	SortOption,
	FilterOption,
	PaginationState,
	InfiniteScrollOptions,
	// Props types
	ClickModifiers,
	ItemClickHandler,
	ItemDoubleClickHandler,
	FileBrowserProps,
	BrowserViewProps,
	ItemRendererProps,
	ToolbarProps,
	StatusBarProps,
	EmptyStateProps,
	LoadingStateProps,
	FileBrowserProviderProps,
} from './types';

// Type utilities
export {
	ENTITY_TYPE_MAP,
	normalizeEntityType,
	toBrowserItem,
	createParentNavItem,
	DEFAULT_VIEW_CONFIGS,
} from './types';

// Core
export {
	FileBrowserContext,
	useFileBrowserContext,
	useFileBrowserState,
	useFileBrowserActions,
	FileBrowserProvider,
	type FileBrowserState,
	type FileBrowserActions,
	type FileBrowserContextValue,
} from './core';

export {
	DEFAULT_VIEW_MODE,
	DEFAULT_PAGE_SIZE,
	DEFAULT_ITEM_SIZE,
	DEFAULT_SORT_OPTIONS,
	VIEW_CONFIGS,
	ITEM_SIZE_PRESETS,
} from './core';

// Hooks
export {
	useFileBrowser,
	useDataSource,
	useSelection,
	useKeyboardNavigation,
	usePagination,
	useFolderFilesPaginated,
	useFolderStats,
	useFolderCacheInvalidation,
	type UseFileBrowserOptions,
	type UseFileBrowserResult,
	type UseDataSourceOptions,
	type UseDataSourceResult,
	type UseSelectionOptions,
	type UseSelectionResult,
	type UseKeyboardNavigationOptions,
	type UseKeyboardNavigationResult,
	type UsePaginationOptions,
	type UsePaginationResult,
	type FolderFile,
	type FolderFilesResponse,
	type FolderStatsResponse,
	type UseFolderFilesPaginatedOptions,
	type UseFolderFilesPaginatedResult,
} from './hooks';

// Components
export {
	FileBrowserToolbar,
	FileBrowserStatusBar,
	FileBrowserEmptyState,
	FileBrowserLoadingState,
	FileBrowserErrorState,
	LoadMoreButton,
	ItemThumbnail,
	ItemRendererGrid,
	ItemRendererList,
	GenericItemRenderer,
	MediaThumbnail,
	type FileBrowserToolbarProps,
	type ErrorStateProps,
	type LoadMoreButtonProps,
	type GenericItemRendererProps,
	type MediaItem,
	type MediaThumbnailProps,
} from './components';

// Wrappers
export { HierarchicalFolderWrapper } from './wrappers';

// Views
export {
	GridView,
	ListView,
	MasonryView,
	TableView,
	CardsView,
	VIEW_REGISTRY,
	getViewComponent,
	getDefaultViewConfig,
	isValidViewMode,
	AVAILABLE_VIEW_MODES,
	type GridViewProps,
	type ListViewProps,
	type MasonryViewProps,
	type TableViewProps,
	type CardsViewProps,
	type ViewComponent,
	type ViewRegistryEntry,
} from './views';

// Utils
export {
	// Sorting
	sortBySingle,
	sortByMultiple,
	sortWithFoldersFirst,
	// Filtering
	filterBySearch,
	filterByEntityType,
	applyFilters,
	filterSynthetic,
	applyFilterPipeline,
	type FilterPipeline,
	// Grouping
	ENTITY_TYPE_DISPLAY_NAMES,
	ENTITY_TYPE_ORDER,
	groupByEntityType,
	groupByField,
	groupByDate,
	applyGrouping,
	flattenGroups,
	type GroupingType,
	type GroupingOptions,
} from './utils';
