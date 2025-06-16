import type { FileItem } from '@/types/file-item';
import type * as React from 'react';

/**
 * Tipos de acciones disponibles en el menú contextual
 */
export type ContextMenuAction =
	| 'mark-toggle'
	| 'favorite-toggle'
	| 'add-to-collection'
	| 'add-tag'
	| 'add-to-album'
	| 'collection-create'
	| 'tag-create'
	| 'album-create'
	| 'character-create'
	| 'place-create'
	| 'world-item-create'
	| 'object-create' // Legacy
	| 'object-add' // Legacy
	| 'world-item-add'
	| 'preview'
	| 'open'
	| 'download'
	| 'copy'
	| 'copy-path'
	| 'delete';

// Tipo para la data adicional en acciones de menú contextual
export interface ContextMenuActionData {
	id?: string;
	name?: string;
	[key: string]: unknown;
}

/**
 * Props para el menú contextual de archivos
 */
export interface FileContextMenuProps {
	file: FileItem;
	children: React.ReactNode;
	onAction: (action: ContextMenuAction, file: FileItem, data?: Record<string, unknown>) => void | Promise<void>;
}

/**
 * Props para los componentes de submenú
 */
export interface SubmenuProps {
	file: FileItem;
	onAction: (action: ContextMenuAction, file: FileItem, data?: Record<string, unknown>) => void;
	loadingStates: LoadingStates;
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
	objects: EntityLoadingState; // Legacy
	worldItems: EntityLoadingState;
	prompts: EntityLoadingState;
	notes: EntityLoadingState;
	concepts: EntityLoadingState;
};

// Función auxiliar para parsear metadata
export const getMetadata = (metadata: string | null) => {
	if (!metadata) {
		return null;
	}
	try {
		return JSON.parse(metadata);
	} catch {
		return null;
	}
};
