/**
 * @file Exportaciones de hooks del File Browser
 * @module file-browser-new/hooks
 */

export { actionToEntityType, type EntityType, useAddToEntity } from './use-add-to-entity';
export { type UseDataSourceOptions, type UseDataSourceResult, useDataSource } from './use-data-source';
export { type UseFileBrowserOptions, type UseFileBrowserResult, useFileBrowser } from './use-file-browser';
// Hooks de datos de carpetas
export {
	type FolderFile,
	type FolderFilesResponse,
	type FolderStatsResponse,
	type UseFolderFilesPaginatedOptions,
	type UseFolderFilesPaginatedResult,
	useFolderCacheInvalidation,
	useFolderFilesPaginated,
	useFolderStats,
} from './use-folder-files-paginated';
export {
	type UseKeyboardNavigationOptions,
	type UseKeyboardNavigationResult,
	useKeyboardNavigation,
} from './use-keyboard';
export { type UsePaginationOptions, type UsePaginationResult, usePagination } from './use-pagination';
export { type UseSelectionOptions, type UseSelectionResult, useSelection } from './use-selection';
