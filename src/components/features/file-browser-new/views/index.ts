/**
 * @file Exportaciones de vistas del File Browser
 * @module file-browser-new/views
 */

export { GridView, type GridViewProps } from './grid';
export { ListView, type ListViewProps } from './list';
export { MasonryView, type MasonryViewProps } from './masonry';
export { TableView, type TableViewProps } from './table';
export { CardsView, type CardsViewProps } from './cards';

export {
	VIEW_REGISTRY,
	getViewComponent,
	getDefaultViewConfig,
	isValidViewMode,
	AVAILABLE_VIEW_MODES,
	type ViewComponent,
	type ViewRegistryEntry,
} from './view-registry';
