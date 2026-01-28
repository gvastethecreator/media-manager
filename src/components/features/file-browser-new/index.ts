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

// Components
export {
	type ErrorStateProps,
	FileBrowserEmptyState,
	FileBrowserErrorState,
	FileBrowserLoadingState,
	FileBrowserStatusBar,
	FileBrowserToolbar,
	type FileBrowserToolbarProps,
	GenericItemRenderer,
	type GenericItemRendererProps,
	ItemRendererGrid,
	ItemRendererList,
	ItemThumbnail,
	LoadMoreButton,
	type LoadMoreButtonProps,
	type MediaItem,
	MediaThumbnail,
	type MediaThumbnailProps,
} from './components';
// Core
export {
	DEFAULT_ITEM_SIZE,
	DEFAULT_PAGE_SIZE,
	DEFAULT_SORT_OPTIONS,
	DEFAULT_VIEW_MODE,
	type FileBrowserActions,
	FileBrowserContext,
	type FileBrowserContextValue,
	FileBrowserProvider,
	type FileBrowserState,
	ITEM_SIZE_PRESETS,
	useFileBrowserActions,
	useFileBrowserContext,
	useFileBrowserState,
	VIEW_CONFIGS,
} from './core';
// Componente principal
export { FileBrowser, FileBrowserByFolder } from './file-browser';
// Hooks
export {
	type FolderFile,
	type FolderFilesResponse,
	type FolderStatsResponse,
	type UseDataSourceOptions,
	type UseDataSourceResult,
	type UseFileBrowserOptions,
	type UseFileBrowserResult,
	type UseFolderFilesPaginatedOptions,
	type UseFolderFilesPaginatedResult,
	type UseKeyboardNavigationOptions,
	type UseKeyboardNavigationResult,
	type UsePaginationOptions,
	type UsePaginationResult,
	type UseSelectionOptions,
	type UseSelectionResult,
	useDataSource,
	useFileBrowser,
	useFolderCacheInvalidation,
	useFolderFilesPaginated,
	useFolderStats,
	useKeyboardNavigation,
	usePagination,
	useSelection,
} from './hooks';
// Types
export type {
	// Item types
	BrowserEntityType,
	BrowserItem,
	BrowserItemGroup,
	BrowserViewProps,
	CardsViewConfig,
	// Props types
	ClickModifiers,
	EmptyStateProps,
	FileBrowserProps,
	FileBrowserProviderProps,
	FilterOption,
	GridViewConfig,
	InfiniteScrollOptions,
	ItemClickHandler,
	ItemDoubleClickHandler,
	ItemRendererProps,
	ListViewConfig,
	LoadingStateProps,
	MasonryViewConfig,
	PaginationState,
	ProcessedItems,
	RenderMode,
	SelectableBrowserItem,
	SortOption,
	StatusBarProps,
	TableViewConfig,
	ToolbarProps,
	ViewConfig,
	ViewConfigBase,
	// View types
	ViewMode,
} from './types';
// Type utilities
export {
	createParentNavItem,
	DEFAULT_VIEW_CONFIGS,
	toBrowserItem,
} from './types';
// Utils
export {
	applyFilterPipeline,
	applyFilters,
	applyGrouping,
	// Grouping
	ENTITY_TYPE_DISPLAY_NAMES,
	ENTITY_TYPE_ORDER,
	type FilterPipeline,
	filterByEntityType,
	// Filtering
	filterBySearch,
	filterSynthetic,
	flattenGroups,
	type GroupingOptions,
	type GroupingType,
	groupByDate,
	groupByEntityType,
	groupByField,
	sortByMultiple,
	// Sorting
	sortBySingle,
	sortWithFoldersFirst,
} from './utils';

// Views
export {
	AVAILABLE_VIEW_MODES,
	CardsView,
	type CardsViewProps,
	GridView,
	type GridViewProps,
	getDefaultViewConfig,
	getViewComponent,
	isValidViewMode,
	ListView,
	type ListViewProps,
	MasonryView,
	type MasonryViewProps,
	TableView,
	type TableViewProps,
	VIEW_REGISTRY,
	type ViewComponent,
	type ViewRegistryEntry,
} from './views';
// Wrappers
export { HierarchicalFolderWrapper } from './wrappers';
