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
	| 'collection-create'
	| 'tag-create'
	| 'album-create'
	| 'character-create'
	| 'place-create'
	| 'object-create'
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

// Props para el componente principal del menú contextual
export interface FileContextMenuProps {
	file: FileItem;
	children: React.ReactNode;
	onAction: (action: ContextMenuAction, file: FileItem, data?: Record<string, unknown>) => void;
}

// Interfaces para los estados de carga
export interface EntityLoadingState {
	loading: boolean;
	open: boolean;
	loaded: boolean;
}

// Tipo para los estados de carga de todos los tipos de entidades
export type LoadingStates = {
	collections: EntityLoadingState;
	tags: EntityLoadingState;
	albums: EntityLoadingState;
	characters: EntityLoadingState;
	places: EntityLoadingState;
	objects: EntityLoadingState;
	prompts: EntityLoadingState;
	notes: EntityLoadingState;
	concepts: EntityLoadingState;
};

// Componente de submenú genérico
export interface SubMenuProps<T> {
	title: string;
	icon: React.ReactNode;
	entityName: string;
	entities: T[];
	isLoading: boolean;
	onSelect: (entity: T) => void;
	onCreate: () => void;
	renderItem: (entity: T) => React.ReactNode;
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
