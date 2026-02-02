/**
 * @file Registro de vistas del File Browser
 * @module file-browser-new/views/view-registry
 */

import type { ComponentType } from 'react';
import type { BrowserViewProps } from '../types/props.types';
import type { ViewConfig, ViewMode } from '../types/view.types';
import { CardsView } from './cards';
import { GridView } from './grid';
import { ListView } from './list';
import { MasonryView } from './masonry';
import { TableView } from './table';

/**
 * Tipo de componente de vista
 */
export type ViewComponent<T extends BrowserViewProps = BrowserViewProps> = ComponentType<T>;

/**
 * Registro de vistas
 */
export interface ViewRegistryEntry {
	component: ViewComponent<any>;
	defaultConfig: ViewConfig;
}

/**
 * Registro de todas las vistas disponibles
 */
export const VIEW_REGISTRY: Record<ViewMode, ViewRegistryEntry> = {
	grid: {
		component: GridView,
		defaultConfig: {
			kind: 'grid',
			renderMode: 'canvas',
			gap: 8,
			itemSize: 150,
			columns: 0,
		},
	},
	list: {
		component: ListView,
		defaultConfig: {
			kind: 'list',
			renderMode: 'canvas',
			gap: 0,
			rowHeight: 36,
		},
	},
	masonry: {
		component: MasonryView,
		defaultConfig: {
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
	},
	table: {
		component: TableView,
		defaultConfig: {
			kind: 'table',
			renderMode: 'canvas',
			gap: 0,
			rowHeight: 32,
			visibleColumns: ['name', 'entityType', 'size', 'createdAt'],
		},
	},
	cards: {
		component: CardsView,
		defaultConfig: {
			kind: 'cards',
			renderMode: 'canvas',
			gap: 12,
			cardSize: 180,
			showDetails: true,
		},
	},
};

/**
 * Obtiene componente de vista
 */
export function getViewComponent(mode: ViewMode): ViewComponent<any> {
	return VIEW_REGISTRY[mode]?.component ?? VIEW_REGISTRY.grid.component;
}

/**
 * Obtiene configuración por defecto de vista
 */
export function getDefaultViewConfig(mode: ViewMode): ViewConfig {
	return VIEW_REGISTRY[mode]?.defaultConfig ?? VIEW_REGISTRY.grid.defaultConfig;
}

/**
 * Verifica si un modo de vista es válido
 */
export function isValidViewMode(mode: string): mode is ViewMode {
	return mode in VIEW_REGISTRY;
}

/**
 * Lista de modos de vista disponibles
 */
export const AVAILABLE_VIEW_MODES: ViewMode[] = Object.keys(VIEW_REGISTRY) as ViewMode[];
