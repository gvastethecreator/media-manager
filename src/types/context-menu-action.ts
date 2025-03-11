import type * as React from 'react';
import type { FileItem } from './file-item';

/**
 * Tipos de acciones disponibles en el menú contextual
 */
export type ContextMenuAction =
	| 'mark-toggle'
	| 'favorite-toggle'
	| 'collection-add'
	| 'tag-add'
	| 'album-add'
	| 'character-add'
	| 'place-add'
	| 'object-add' // Legacy - se mantendrá temporalmente
	| 'world-item-add'
	| 'collection-create'
	| 'tag-create'
	| 'album-create'
	| 'character-create'
	| 'place-create'
	| 'object-create' // Legacy - se mantendrá temporalmente
	| 'world-item-create'
	| 'prompt-add'
	| 'note-add'
	| 'concept-add'
	| 'prompt-create'
	| 'note-create'
	| 'concept-create'
	| 'preview'
	| 'open'
	| 'download'
	| 'copy'
	| 'copy-path'
	| 'delete';

/**
 * Datos adicionales para acciones específicas
 */
export interface ContextMenuActionData {
	id?: string;
	[key: string]: unknown;
}

/**
 * Props para el componente principal del menú contextual
 */
export interface FileContextMenuProps {
	file: FileItem;
	children: React.ReactNode;
	onAction: (action: ContextMenuAction, file: FileItem, data?: ContextMenuActionData) => void;
}

/**
 * Props para los componentes de submenú
 */
export interface SubmenuProps {
	file: FileItem;
	onAction: (action: ContextMenuAction, file: FileItem, data?: ContextMenuActionData) => void;
	loadingStates: LoadingStates;
	onOpenChange?: (entity: keyof LoadingStates, isOpen: boolean) => void;
}

/**
 * Estado de carga para cada tipo de entidad
 */
export interface EntityLoadingState {
	loading: boolean;
	open: boolean;
	loaded: boolean;
}

/**
 * Estado de carga para todos los tipos de entidades
 */
export type LoadingStates = {
	collections: EntityLoadingState;
	tags: EntityLoadingState;
	albums: EntityLoadingState;
	characters: EntityLoadingState;
	places: EntityLoadingState;
	objects: EntityLoadingState; // Legacy - se mantendrá temporalmente
	worldItems: EntityLoadingState;
	prompts: EntityLoadingState;
	notes: EntityLoadingState;
	concepts: EntityLoadingState;
};
