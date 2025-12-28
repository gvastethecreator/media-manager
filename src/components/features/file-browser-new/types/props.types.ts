/**
 * @file Tipos de props para componentes del File Browser
 * @module file-browser-new/types/props
 */

import type { BrowserItem, BrowserItemGroup } from './item.types';
import type { ViewMode, ViewConfig, SortOption, PaginationState } from './view.types';

/**
 * Modificadores de click
 */
export interface ClickModifiers {
	ctrlKey: boolean;
	metaKey: boolean;
	shiftKey: boolean;
}

/**
 * Handler de click en item
 */
export type ItemClickHandler = (item: BrowserItem, modifiers?: ClickModifiers) => void;

/**
 * Handler de doble click en item
 */
export type ItemDoubleClickHandler = (item: BrowserItem) => void;

/**
 * Props del componente FileBrowser principal
 */
export interface FileBrowserProps {
	/** ID de carpeta a mostrar */
	folderId?: string | null;
	/** Items directos (alternativa a folderId) */
	items?: BrowserItem[];
	/** Handler de click simple */
	onItemClick?: ItemClickHandler;
	/** Handler de doble click */
	onItemDoubleClick?: ItemDoubleClickHandler;
	/** Clase CSS adicional */
	className?: string;
}

/**
 * Handler de click derecho en item
 */
export type ItemContextMenuHandler = (e: React.MouseEvent, item: BrowserItem) => void;

/**
 * Props para vistas individuales
 */
export interface BrowserViewProps {
	/** Items a mostrar */
	items: BrowserItem[];
	/** Grupos (si está agrupado) */
	groups?: BrowserItemGroup[] | null;
	/** Handler de click */
	onItemClick?: ItemClickHandler;
	/** Handler de doble click */
	onItemDoubleClick?: ItemDoubleClickHandler;
	/** Handler de context menu */
	onItemContextMenu?: ItemContextMenuHandler;
	/** Configuración de la vista */
	config: ViewConfig;
	/** Contenedor de scroll (para virtualización) */
	scrollContainer?: HTMLElement | null;
	/** Callback cuando el contenedor está listo */
	onContainerReady?: (el: HTMLDivElement | null) => void;
}

/**
 * Props para renderizador de items
 */
export interface ItemRendererProps {
	/** Item a renderizar */
	item: BrowserItem;
	/** Tamaño del item */
	size: number;
	/** Si está seleccionado */
	isSelected?: boolean;
	/** Si es el item activo */
	isActive?: boolean;
	/** Handler de click */
	onClick?: (e: React.MouseEvent) => void;
	/** Handler de doble click */
	onDoubleClick?: (e: React.MouseEvent) => void;
	/** Handler de context menu */
	onContextMenu?: (e: React.MouseEvent) => void;
	/** Clase CSS adicional */
	className?: string;
	/** Estilo inline */
	style?: React.CSSProperties;
}

/**
 * Props del toolbar
 */
export interface ToolbarProps {
	/** IDs de items seleccionables */
	itemIds: string[];
	/** Si está cargando */
	isLoading?: boolean;
	/** Handler de refresh */
	onRefresh?: () => void;
	/** Clase CSS adicional */
	className?: string;
}

/**
 * Props del status bar
 */
export interface StatusBarProps {
	/** Total de items */
	totalItems: number;
	/** Items mostrados actualmente */
	shownItems: number;
	/** Items seleccionados */
	selectedCount: number;
	/** Si está cargando */
	isLoading?: boolean;
	/** Estado de paginación */
	pagination?: PaginationState;
	/** Handler de página anterior */
	onPrevPage?: () => void;
	/** Handler de página siguiente */
	onNextPage?: () => void;
	/** Handler de refresh */
	onRefresh?: () => void;
	/** Clase CSS adicional */
	className?: string;
}

/**
 * Props de estado vacío
 */
export interface EmptyStateProps {
	/** Título */
	title?: string;
	/** Descripción */
	description?: string;
	/** Icono (componente React) */
	icon?: React.ComponentType<{ className?: string }>;
	/** Acción opcional */
	action?: {
		label: string;
		onClick: () => void;
	};
	/** Clase CSS adicional */
	className?: string;
}

/**
 * Props de estado de carga
 */
export interface LoadingStateProps {
	/** Modo de vista actual */
	viewMode: ViewMode;
	/** Tamaño de item */
	itemSize?: number;
	/** Conteo de items a simular */
	itemCount?: number;
	/** Clase CSS adicional */
	className?: string;
}

/**
 * Props para el proveedor de contexto
 */
export interface FileBrowserProviderProps {
	/** Hijos */
	children: React.ReactNode;
	/** ID de carpeta inicial */
	folderId?: string | null;
	/** Items directos */
	items?: BrowserItem[];
	/** Handler de click externo */
	onItemClick?: ItemClickHandler;
	/** Handler de doble click externo */
	onItemDoubleClick?: ItemDoubleClickHandler;
}
