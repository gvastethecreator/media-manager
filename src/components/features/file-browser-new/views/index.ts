/**
 * @file Exportaciones de vistas del File Browser
 * @module file-browser-new/views
 */

export { CardsView, type CardsViewProps } from './cards';
export { GridView, type GridViewProps } from './grid';
export { ListView, type ListViewProps } from './list';
export { MasonryView, type MasonryViewProps } from './masonry';
export { TableView, type TableViewProps } from './table';

export {
	AVAILABLE_VIEW_MODES,
	getDefaultViewConfig,
	getViewComponent,
	isValidViewMode,
	VIEW_REGISTRY,
	type ViewComponent,
	type ViewRegistryEntry,
} from './view-registry';
