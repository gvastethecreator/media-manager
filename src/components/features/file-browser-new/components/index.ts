/**
 * @file Exportaciones de componentes del File Browser
 * @module file-browser-new/components
 */

export { FileBrowserToolbar, type FileBrowserToolbarProps } from './toolbar';
export { FileBrowserStatusBar } from './status-bar';
export { FileBrowserEmptyState } from './empty-state';
export { FileBrowserLoadingState } from './loading-state';
export { FileBrowserErrorState, type ErrorStateProps } from './error-state';
export { LoadMoreButton, type LoadMoreButtonProps } from './load-more-button';
export {
	ItemThumbnail,
	ItemRendererGrid,
	ItemRendererList,
	GenericItemRenderer,
	type GenericItemRendererProps,
} from './item-renderer';

// Nuevo componente de item multimedia con MediaThumbnail real
export {
	MediaItemGrid,
	MediaItemList,
	GenericMediaItem,
	type MediaItemProps,
	type GenericMediaItemProps,
} from './media-item';

// Context menu extendido para items
export {
	ItemContextMenu,
	type ItemContextMenuProps,
	type ContextMenuAction,
	type ContextMenuPayload,
} from './item-context-menu';

// MediaThumbnail - componente de thumbnail con soporte avanzado
export { MediaThumbnail } from './media-thumbnail';
export type { MediaItem, MediaThumbnailProps } from './media-thumbnail';
