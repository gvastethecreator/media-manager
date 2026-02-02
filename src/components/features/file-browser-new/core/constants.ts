/**
 * @file Constantes y configuración del File Browser
 * @module file-browser-new/core/constants
 */

import type { InfiniteScrollOptions, SortOption, ViewConfig, ViewMode } from '../types/view.types';

/**
 * Modo de vista por defecto
 */
export const DEFAULT_VIEW_MODE: ViewMode = 'grid';

/**
 * Tamaño de página por defecto
 */
export const DEFAULT_PAGE_SIZE = 200;

/**
 * Tamaño máximo de página
 */
export const MAX_PAGE_SIZE = 200;

/**
 * Tamaño de item por defecto
 */
export const DEFAULT_ITEM_SIZE = 150;

/**
 * Opciones de ordenamiento por defecto
 */
export const DEFAULT_SORT_OPTIONS: SortOption[] = [{ field: 'createdAt', direction: 'desc' }];

/**
 * Opciones de scroll infinito por defecto
 */
export const DEFAULT_INFINITE_SCROLL: InfiniteScrollOptions = {
	enabled: true,
	threshold: 300,
	autoLoad: false,
	cooldownMs: 300,
};

/**
 * Configuración de virtualización por defecto
 */
export const DEFAULT_VIRTUALIZATION = {
	enabled: true,
	threshold: 100,
	overscan: 5,
	estimatedItemHeight: 200,
	maxItems: 250,
};

/**
 * Configuraciones de vista por defecto
 */
export const VIEW_CONFIGS: Record<ViewMode, ViewConfig> = {
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
		padding: 16,
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
		gap: 12,
		cardSize: 180,
		showDetails: true,
	},
};

/**
 * Columnas por defecto para vista de tabla
 */
export const TABLE_DEFAULT_COLUMNS = [
	{ key: 'name', label: 'Nombre', width: 250 },
	{ key: 'entityType', label: 'Tipo', width: 100 },
	{ key: 'size', label: 'Tamaño', width: 100 },
	{ key: 'createdAt', label: 'Fecha', width: 150 },
] as const;

/**
 * Tamaños predefinidos para vistas
 */
export const ITEM_SIZE_PRESETS = {
	small: 100,
	medium: 150,
	large: 200,
	xlarge: 280,
} as const;

/**
 * Cache de thumbnails
 */
export const THUMBNAIL_CACHE_CONFIG = {
	maxSize: 1000,
	cleanupBatch: 50,
	ttlMs: 5 * 60 * 1000, // 5 minutos
};

/**
 * Debounce de búsqueda (ms)
 */
export const SEARCH_DEBOUNCE_MS = 300;

/**
 * Intervalo de refresh automático (ms)
 */
export const AUTO_REFRESH_INTERVAL_MS = 30_000;
