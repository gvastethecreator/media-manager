/**
 * @file canvas.types.ts
 * @module components/file-browser/canvas/types
 * @description Tipos e interfaces para FileCanvas
 */

import type { MediaItem } from '../../components/media-thumbnail';

/**
 * Props del componente FileCanvas
 */
export interface FileCanvasProps {
	items: MediaItem[];
	itemSize?: number;
	gap?: number;
	overscanRows?: number;
	/** Contenedor de scroll externo (p.ej., en vistas agrupadas) */
	scrollContainer?: HTMLElement | null;
	onItemClick?: (item: MediaItem, modifiers?: ClickModifiers) => void;
	onItemDoubleClick?: (item: MediaItem) => void;
}

/**
 * Modificadores de click
 */
export interface ClickModifiers {
	ctrlKey: boolean;
	metaKey: boolean;
	shiftKey: boolean;
}

/**
 * Estado del viewport
 */
export interface Viewport {
	width: number;
	height: number;
	scrollTop: number;
	scrollLeft: number;
	offsetTop: number;
}

/**
 * Coordenadas 2D
 */
export interface Point {
	x: number;
	y: number;
}

/**
 * Estado del tooltip
 */
export interface TooltipState {
	visible: boolean;
	text: string;
	x: number;
	y: number;
}

/**
 * Rango de filas visibles
 */
export interface VisibleRange {
	firstVisibleRow: number;
	lastVisibleRow: number;
}
