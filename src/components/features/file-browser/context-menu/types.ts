import type { ReactNode } from 'react';
import type { FileItem } from '@/lib/contexts/file-context';

/**
 * Tipos de acciones disponibles en el menú contextual
 */
export type ContextMenuAction =
	// Acciones principales
	| 'preview'
	| 'open'
	| 'download'
	| 'copy'
	| 'copy-path'
	| 'delete'
	| 'favorite-toggle'
	| 'mark-toggle'
	// Acciones de entidades
	| 'add-to-collection'
	| 'collection-create'
	| 'add-tag'
	| 'tag-create'
	| 'add-to-album'
	| 'album-create'
	| 'add-to-character'
	| 'character-create'
	| 'add-to-place'
	| 'place-create'
	| 'add-to-world-item'
	| 'world-item-create'
	| 'add-to-concept'
	| 'concept-create'
	| 'add-to-prompt'
	| 'prompt-create'
	| 'add-to-note'
	| 'note-create';

// Tipo para la data adicional en acciones de menú contextual
export interface ContextMenuActionData {
	id?: string;
	name?: string;
	[key: string]: unknown;
}

/**
 * Props para el componente FileContextMenu
 */
export interface FileContextMenuProps {
	/** Archivo asociado al menú */
	file: FileItem;
	/** Contenido a envolver con el menú contextual (opcional en la nueva implementación) */
	children?: ReactNode;
	/** Manejador de acciones del menú */
	onAction: (action: ContextMenuAction, file: FileItem, data?: Record<string, unknown>) => void;
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
 * Tipo para el estado de carga de entidades
 */
export interface EntityLoadingState {
	loading: boolean;
	loaded: boolean;
	error: string | null;
}

/**
 * Tipo para el estado de carga de todas las entidades
 */
export interface EntitiesLoadingState {
	collections: EntityLoadingState;
	tags: EntityLoadingState;
	albums: EntityLoadingState;
	characters: EntityLoadingState;
	places: EntityLoadingState;
	worldItems: EntityLoadingState;
	concepts: EntityLoadingState;
	prompts: EntityLoadingState;
	notes: EntityLoadingState;
}

/**
 * Tipo para un elemento genérico de submenú
 */
export interface SubmenuItem {
	id: string;
	name: string;
	emoji?: string;
	color?: string;
	isFavorite?: boolean;
	isRecent?: boolean;
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

/**
 * Props para el componente EntitySubMenu
 */
export interface SubMenuProps {
	title: string;
	icon: ReactNode;
	entityName: string;
	entities: any[];
	isLoading: boolean;
	hasError: boolean;
	onSelectAction: (entity: any) => void;
	onCreateAction: () => void;
	renderItemAction: (entity: any) => ReactNode;
	onOpenChange?: (open: boolean) => void;
}

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
