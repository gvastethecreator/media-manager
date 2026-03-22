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
	/** Gap entre items */
	gap: number;
	/** Modo de renderizado */
	renderMode: RenderMode;
}

/**
 * Configuración para vistas tipo grid
 */
export interface GridViewConfig extends ViewConfigBase {
	/** Columnas fijas (0 = auto) */
	columns: number;
	/** Tamaño de celda en píxeles */
	itemSize: number;
	kind: 'grid';
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
	/** Ancho mínimo de columna */
	columnWidth: number;
	kind: 'masonry';
	/** Padding del contenedor */
	padding?: number;
	/** TCG: efecto holográfico */
	tcgHolo?: boolean;
	/** TCG: revelar info solo en hover */
	tcgHoverReveal?: boolean;
	/** TCG: bordes redondeados */
	tcgRounded?: boolean;
	/** TCG: sombras */
	tcgShadows?: boolean;
	/** TCG: tilt 3D en hover */
	tcgTilt?: boolean;
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
	/** Tamaño de card */
	cardSize: number;
	kind: 'cards';
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
		gap: 16,
		columnWidth: 220,
		padding: 20,
		tcgHoverReveal: true,
		tcgHolo: true,
		tcgShadows: true,
		tcgRounded: true,
		tcgTilt: true,
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
		gap: 32,
		cardSize: 200,
		showDetails: true,
	},
};

/**
 * Opciones de ordenamiento
 */
export interface SortOption {
	direction: 'asc' | 'desc';
	field: string;
}

/**
 * Opciones de filtrado
 */
export interface FilterOption {
	field: string;
	operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startsWith' | 'endsWith';
	value: unknown;
}

/**
 * Estado de paginación
 */
export interface PaginationState {
	hasMore: boolean;
	page: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
}

/**
 * Opciones de scroll infinito
 */
export interface InfiniteScrollOptions {
	autoLoad: boolean;
	cooldownMs: number;
	enabled: boolean;
	threshold: number;
}
