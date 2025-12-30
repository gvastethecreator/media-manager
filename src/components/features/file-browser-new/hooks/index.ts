/**
 * @file Exportaciones de hooks del File Browser
 * @module file-browser-new/hooks
 */

export { useFileBrowser, type UseFileBrowserOptions, type UseFileBrowserResult } from './use-file-browser';
export { useDataSource, type UseDataSourceOptions, type UseDataSourceResult } from './use-data-source';
export { useSelection, type UseSelectionOptions, type UseSelectionResult } from './use-selection';
export {
	useKeyboardNavigation,
	type UseKeyboardNavigationOptions,
	type UseKeyboardNavigationResult,
} from './use-keyboard';
export { usePagination, type UsePaginationOptions, type UsePaginationResult } from './use-pagination';
export { useAddToEntity, actionToEntityType, type EntityType } from './use-add-to-entity';

// Hooks de datos de carpetas
export {
	useFolderFilesPaginated,
	useFolderStats,
	useFolderCacheInvalidation,
	type FolderFile,
	type FolderFilesResponse,
	type FolderStatsResponse,
	type UseFolderFilesPaginatedOptions,
	type UseFolderFilesPaginatedResult,
} from './use-folder-files-paginated';
