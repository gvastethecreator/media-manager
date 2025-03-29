import type { FileItem } from '@/types/file-item';
import type * as React from 'react';

// Tipos de acciones del menú contextual
export type ContextMenuAction =
	| 'mark-toggle'
	| 'favorite-toggle'
	| 'collection-add'
	| 'tag-add'
	| 'album-add'
	| 'character-add'
	| 'place-add'
	| 'object-add'
	| 'world-item-add'
	| 'collection-create'
	| 'tag-create'
	| 'album-create'
	| 'character-create'
	| 'place-create'
	| 'object-create'
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

// Tipo para la data adicional en acciones de menú contextual
export interface ContextMenuActionData {
	id?: string;
	name?: string;
	[key: string]: unknown;
}

// Props para el componente principal del menú contextual
export interface FileContextMenuProps {
	file: FileItem;
	children: React.ReactNode;
	onAction: (action: ContextMenuAction, file: FileItem, data?: Record<string, unknown>) => void;
}

// Estado de carga para submenu
export interface LoadingState {
	loading: boolean;
	open: boolean;
	loaded: boolean;
	hasError: boolean;
	loadedCount: number; // Número de elementos cargados correctamente
}

// Estados de carga para todos los tipos de entidades
export interface LoadingStates {
	collections: LoadingState;
	tags: LoadingState;
	albums: LoadingState;
	characters: LoadingState;
	places: LoadingState;
	objects?: LoadingState;
	worldItems: LoadingState;
	prompts: LoadingState;
	notes: LoadingState;
	concepts: LoadingState;
}

// Propiedades para el submenú de entidades
export interface SubMenuProps {
	title?: string;
	icon?: React.ReactNode;
	entityName: string;
	entities: any[];
	isLoading: boolean;
	hasError: boolean;
	loadedCount?: number;
	onSelectAction: (entity: any) => void;
	onCreateAction: () => void;
	renderItemAction: (entity: any) => React.ReactNode;
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
