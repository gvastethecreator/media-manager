/**
 * @file Tipos específicos para UI
 * @module types/ui
 */

import { z } from 'zod';

/**
 * Modos de vista disponibles
 */
export enum ViewMode {
	GRID = 'grid',
	LIST = 'list',
	TABLE = 'table',
	CARDS = 'cards',
	COMPACT = 'compact',
	DETAILED = 'detailed',
	GALLERY = 'gallery',
	SLIDESHOW = 'slideshow',
}

/**
 * Tipos de vistas principales
 */
export type ViewType =
	| 'all-images'
	| 'favorites'
	| 'collections'
	| 'collection-content'
	| 'folders'
	| 'folder-content'
	| 'tags'
	| 'tag-content'
	| 'search'
	| 'files'
	| 'settings'
	| 'development'
	| 'loading'
	| 'albums'
	| 'album-content'
	| 'characters'
	| 'character-content'
	| 'places'
	| 'place-content'
	| 'world-items'
	| 'world-item-content'
	| 'concepts'
	| 'concept-content'
	| 'prompts'
	| 'prompt-content'
	| 'notes'
	| 'note-content'
	| 'groups'
	| 'group-content'
	| 'properties'
	| 'property-content'
	| 'wildcards'
	| 'wildcard-content'
	| 'entity-cards'
	| 'canvas'
	| 'chat';

/**
 * Props base para componentes de vista
 */
export interface ViewProps {
	isResizing?: boolean;
	viewMode?: ViewMode;
	className?: string;
	style?: React.CSSProperties;
}

/**
 * Props para contenedor de vista
 */
export interface ViewContainerProps extends ViewProps {
	children?: React.ReactNode;
	header?: React.ReactNode;
	footer?: React.ReactNode;
	sidebar?: React.ReactNode;
}

/**
 * Props para componentes de tabla
 */
export interface TableProps<T = any> {
	data: T[];
	columns: TableColumn<T>[];
	sorting?: TableSorting;
	onSort?: (sorting: TableSorting) => void;
	onRowClick?: (row: T) => void;
	selectedRows?: string[];
	onRowSelect?: (id: string) => void;
}

/**
 * Configuración de columna de tabla
 */
export interface TableColumn<T = any> {
	id: string;
	header: string;
	accessorKey?: keyof T;
	accessorFn?: (row: T) => any;
	cell?: (props: { row: T; value: any }) => React.ReactNode;
	sortable?: boolean;
	width?: number;
}

/**
 * Estado de ordenación de tabla
 */
export interface TableSorting {
	id: string;
	desc: boolean;
}

/**
 * Props para componentes de galería
 */
export interface GalleryProps<T = any> {
	items: T[];
	renderItem: (item: T) => React.ReactNode;
	columns?: number;
	gap?: number;
	aspectRatio?: number;
	onItemClick?: (item: T) => void;
	selectedItems?: string[];
	onItemSelect?: (id: string) => void;
}

// Validaciones Zod
export const viewModeSchema = z.nativeEnum(ViewMode);

export const tableSortingSchema = z.object({
	id: z.string(),
	desc: z.boolean(),
});

export const tableColumnSchema = z.object({
	id: z.string(),
	header: z.string(),
	accessorKey: z.string().optional(),
	sortable: z.boolean().optional(),
	width: z.number().optional(),
});

// Tipos inferidos
export type ViewModeValidated = z.infer<typeof viewModeSchema>;
export type TableSortingValidated = z.infer<typeof tableSortingSchema>;
export type TableColumnValidated = z.infer<typeof tableColumnSchema>;
