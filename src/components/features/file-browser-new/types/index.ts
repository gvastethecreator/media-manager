/**
 * @file Exportaciones de tipos del File Browser
 * @module file-browser-new/types
 */

// Item types
export type {
	BrowserEntityType,
	BrowserItem,
	SelectableBrowserItem,
	BrowserItemGroup,
	ProcessedItems,
} from './item.types';

export {
	ENTITY_TYPE_MAP,
	normalizeEntityType,
	toBrowserItem,
	createParentNavItem,
} from './item.types';

// View types
export type {
	ViewMode,
	RenderMode,
	ViewConfigBase,
	GridViewConfig,
	ListViewConfig,
	MasonryViewConfig,
	TableViewConfig,
	CardsViewConfig,
	ViewConfig,
	SortOption,
	FilterOption,
	PaginationState,
	InfiniteScrollOptions,
} from './view.types';

export { DEFAULT_VIEW_CONFIGS } from './view.types';

// Props types
export type {
	ClickModifiers,
	ItemClickHandler,
	ItemDoubleClickHandler,
	ItemContextMenuHandler,
	FileBrowserProps,
	BrowserViewProps,
	ItemRendererProps,
	ToolbarProps,
	StatusBarProps,
	EmptyStateProps,
	LoadingStateProps,
	FileBrowserProviderProps,
} from './props.types';
