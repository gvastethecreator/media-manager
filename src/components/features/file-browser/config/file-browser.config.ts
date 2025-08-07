/**
 * @file Configuración y constantes para FileBrowser
 * @module components/features/file-browser/config/file-browser.config
 * @description Constantes y configuraciones extraídas del FileBrowser
 */

export const FALLBACK_WIDTH = 1200;

export const DEBOUNCE_DELAY = 300;

export const MEASUREMENT_THRESHOLD = 10;

export const DEFAULT_PROPS = {
	entityType: 'image' as const,
	entityTypes: [],
	mode: 'auto' as const,
	selectedIds: [],
	layout: 'vertical' as const,
	variant: 'default' as const,
	size: 'md' as const,
} as const;

export const AUTO_SYNC_DISABLED_FOLDERS = ['photography'];

export const VIEW_MODES = {
	LIST: 'list',
	GRID: 'grid',
	SIMPLE_GRID: 'simple-grid',
	CARDS: 'cards',
	MASONRY: 'masonry',
} as const;

export const ENTITY_LOADING_CONFIG = {
	image: {
		store: 'useImageStore',
		loadFunction: 'loadImages',
		getByFolder: 'getImagesByFolder',
		getSorted: 'getSortedImages',
	},
	// TODO: Añadir configuraciones para otros tipos de entidades
} as const;
