export type ContextMenuAction =
	| 'open'
	| 'copy'
	| 'rename'
	| 'delete'
	| 'move'
	| 'paste'
	| 'add-to-collection'
	| 'add-to-album'
	| 'add-tag'
	| 'favorite-toggle'
	| 'preview'
	| 'download'
	| 'open-in-explorer';

export interface CustomContextMenuProps<T = unknown> {
	isOpen: boolean;
	position: { x: number; y: number } | null;
	selectedItems: T[];
	onAction: (action: ContextMenuAction, data?: T | T[]) => void;
	onClose: () => void;
}
