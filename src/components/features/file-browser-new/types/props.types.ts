/**
 * @file Tipos de props para componentes del File Browser
 * @module file-browser-new/types/props
 */

import type { BrowserItem, BrowserItemGroup } from './item.types';
import type { PaginationState, ViewConfig, ViewMode } from './view.types';
import type { StartupFileMutationRecovery } from '@/lib/api/file-mutation-recovery';

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
	/** Clase CSS adicional */
	className?: string;
	/** ID de carpeta a mostrar */
	folderId?: string | null;
	/** Items directos (alternativa a folderId) */
	items?: BrowserItem[];
	/** Handler de click simple */
	onItemClick?: ItemClickHandler;
	/** Handler de doble click */
	onItemDoubleClick?: ItemDoubleClickHandler;
}

/**
 * Handler de click derecho en item
 */
export type ItemContextMenuHandler = (e: React.MouseEvent, item: BrowserItem) => void;

/**
 * Props para vistas individuales
 */
export interface BrowserViewProps {
	/** Configuración de la vista */
	config: ViewConfig;
	/** Grupos (si está agrupado) */
	groups?: BrowserItemGroup[] | null;
	/** Items a mostrar */
	items: BrowserItem[];
	/** Límite de items animados en layout */
	layoutItemLimit?: number;
	/** Callback cuando el contenedor está listo */
	onContainerReady?: (el: HTMLDivElement | null) => void;
	/** Handler de click */
	onItemClick?: ItemClickHandler;
	/** Handler de context menu */
	onItemContextMenu?: ItemContextMenuHandler;
	/** Handler de doble click */
	onItemDoubleClick?: ItemDoubleClickHandler;
	/** Callback cuando el root del layout está listo */
	onLayoutRootReady?: (el: HTMLElement | null) => void;
	/** Contenedor de scroll (para virtualización) */
	scrollContainer?: HTMLElement | null;
	/** Suprime animación de aparición (p.ej. al cambiar vista) */
	suppressAppearAnimation?: boolean;
	/** Configuración de virtualización */
	virtualization?: {
		enabled: boolean;
		threshold: number;
		overscan: number;
		estimatedItemHeight: number;
		maxItems: number;
	};
}

/**
 * Props para renderizador de items
 */
export interface ItemRendererProps {
	/** Clase CSS adicional */
	className?: string;
	/** Si es el item activo */
	isActive?: boolean;
	/** Si está seleccionado */
	isSelected?: boolean;
	/** Item a renderizar */
	item: BrowserItem;
	/** Handler de click */
	onClick?: (e: React.MouseEvent) => void;
	/** Handler de context menu */
	onContextMenu?: (e: React.MouseEvent) => void;
	/** Handler de doble click */
	onDoubleClick?: (e: React.MouseEvent) => void;
	/** Tamaño del item */
	size: number;
	/** Estilo inline */
	style?: React.CSSProperties;
}

/**
 * Props del toolbar
 */
export interface ToolbarProps {
	/** Clase CSS adicional */
	className?: string;
	/** Si está cargando */
	isLoading?: boolean;
	/** IDs de items seleccionables */
	itemIds: string[];
	/** Handler de refresh */
	onRefresh?: () => void;
}

/**
 * Props del status bar
 */
export interface StatusBarProps {
	/** Clase CSS adicional */
	className?: string;
	/** Si está cargando */
	isLoading?: boolean;
	/** Handler de página siguiente */
	onNextPage?: () => void;
	/** Handler de página anterior */
	onPrevPage?: () => void;
	/** Handler de refresh */
	onRefresh?: () => void;
	/** Estado de paginación */
	pagination?: PaginationState;
	/** Resultado seguro de la reconciliación al iniciar */
	startupRecovery?: StartupFileMutationRecovery;
	/** No se pudo consultar el estado de reconciliación al iniciar */
	startupRecoveryUnavailable?: boolean;
	/** Items seleccionados */
	selectedCount: number;
	/** Items mostrados actualmente */
	shownItems: number;
	/** Total de items */
	totalItems: number;
}

/**
 * Props de estado vacío
 */
export interface EmptyStateProps {
	/** Acción opcional */
	action?: {
		label: string;
		onClick: () => void;
	};
	/** Clase CSS adicional */
	className?: string;
	/** Descripción */
	description?: string;
	/** Icono (componente React) */
	icon?: React.ComponentType<{ className?: string }>;
	/** Título */
	title?: string;
}

/**
 * Props de estado de carga
 */
export interface LoadingStateProps {
	/** Clase CSS adicional */
	className?: string;
	/** Conteo de items a simular */
	itemCount?: number;
	/** Tamaño de item */
	itemSize?: number;
	/** Modo de vista actual */
	viewMode: ViewMode;
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
