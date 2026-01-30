/**
 * @file Tipos de vistas del File Browser
 * @module file-browser-new/types/view
 */

/**
 * Modos de vista disponibles
 */
export type ViewMode = 'grid' | 'list' | 'masonry' | 'table' | 'cards';

/**
 * Modos de renderizado
 */
export type RenderMode = 'canvas' | 'virtualized' | 'simple';

/**
 * Configuración base de vista
 */
export interface ViewConfigBase {
	/** Modo de renderizado */
	renderMode: RenderMode;
	/** Gap entre items */
	gap: number;
}

/**
 * Configuración para vistas tipo grid
 */
export interface GridViewConfig extends ViewConfigBase {
	kind: 'grid';
	/** Tamaño de celda en píxeles */
	itemSize: number;
	/** Columnas fijas (0 = auto) */
	columns: number;
}

/**
 * Configuración para vistas tipo lista
 */
export interface ListViewConfig extends ViewConfigBase {
	kind: 'list';
	/** Altura de fila en píxeles */
	rowHeight: number;
}

/**
 * Configuración para vistas tipo masonry
 */
export interface MasonryViewConfig extends ViewConfigBase {
	kind: 'masonry';
	/** Ancho mínimo de columna */
	columnWidth: number;
}

/**
 * Configuración para vistas tipo tabla
 */
export interface TableViewConfig extends ViewConfigBase {
	kind: 'table';
	/** Altura de fila */
	rowHeight: number;
	/** Columnas visibles */
	visibleColumns: string[];
}

/**
 * Configuración para vistas tipo cards
 */
export interface CardsViewConfig extends ViewConfigBase {
	kind: 'cards';
	/** Tamaño de card */
	cardSize: number;
	/** Mostrar detalles */
	showDetails: boolean;
}

/**
 * Unión de configuraciones de vista
 */
export type ViewConfig = GridViewConfig | ListViewConfig | MasonryViewConfig | TableViewConfig | CardsViewConfig;

/**
 * Valores por defecto para cada tipo de vista
 */
export const DEFAULT_VIEW_CONFIGS: Record<ViewMode, ViewConfig> = {
	grid: {
		kind: 'grid',
		renderMode: 'canvas',
		gap: 8,
		itemSize: 150,
		columns: 0,
	},
	list: {
		kind: 'list',
		renderMode: 'canvas',
		gap: 0,
		rowHeight: 36,
	},
	masonry: {
		kind: 'masonry',
		renderMode: 'canvas',
		gap: 8,
		columnWidth: 200,
	},
	table: {
		kind: 'table',
		renderMode: 'canvas',
		gap: 0,
		rowHeight: 32,
		visibleColumns: ['name', 'type', 'size', 'createdAt'],
	},
	cards: {
		kind: 'cards',
		renderMode: 'canvas',
		gap: 12,
		cardSize: 180,
		showDetails: true,
	},
};

/**
 * Opciones de ordenamiento
 */
export interface SortOption {
	field: string;
	direction: 'asc' | 'desc';
}

/**
 * Opciones de filtrado
 */
export interface FilterOption {
	field: string;
	value: unknown;
	operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startsWith' | 'endsWith';
}

/**
 * Estado de paginación
 */
export interface PaginationState {
	page: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
	hasMore: boolean;
}

/**
 * Opciones de scroll infinito
 */
export interface InfiniteScrollOptions {
	enabled: boolean;
	threshold: number;
	autoLoad: boolean;
	cooldownMs: number;
}
