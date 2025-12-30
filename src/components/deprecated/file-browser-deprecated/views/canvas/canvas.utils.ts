/**
 * @file canvas.utils.ts
 * @module components/file-browser/canvas/utils
 * @description Utilidades para cálculos de grid y coordenadas en canvas
 */

import type { MediaItem } from '../../components/media-thumbnail';
import type { Point } from './canvas.types';

/**
 * Calcula coordenadas relativas al contenido del canvas
 */
export function getContentCoords(
	e: { clientX: number; clientY: number },
	container: HTMLDivElement | null,
	viewport: { scrollLeft: number; scrollTop: number; offsetTop: number },
	scrollContainer: HTMLElement | null
): Point {
	if (!container) return { x: 0, y: 0 };
	const rect = container.getBoundingClientRect();
	const x = e.clientX - rect.left + viewport.scrollLeft;
	let y = e.clientY - rect.top + viewport.scrollTop;
	if (scrollContainer) y -= viewport.offsetTop;
	return { x, y };
}

/**
 * Convierte coordenadas a índice de item en el grid
 */
export function indexFromCoords(
	x: number,
	y: number,
	columns: number,
	cellSize: number,
	gap: number,
	itemsLength: number
): number {
	const col = Math.floor((x - gap) / (cellSize + gap));
	const row = Math.floor((y - gap) / (cellSize + gap));
	if (col < 0 || row < 0) return -1;
	const idx = row * columns + col;
	if (idx < 0 || idx >= itemsLength) return -1;
	return idx;
}

/**
 * Obtiene IDs de items dentro de un rectángulo de selección (marquee)
 */
export function idsFromMarquee(
	a: Point,
	b: Point,
	columns: number,
	cellSize: number,
	gap: number,
	items: MediaItem[]
): string[] {
	const minX = Math.min(a.x, b.x);
	const maxX = Math.max(a.x, b.x);
	const minY = Math.min(a.y, b.y);
	const maxY = Math.max(a.y, b.y);
	const firstCol = Math.max(0, Math.floor((minX - gap) / (cellSize + gap)));
	const lastCol = Math.floor((maxX - gap) / (cellSize + gap));
	const firstRow = Math.max(0, Math.floor((minY - gap) / (cellSize + gap)));
	const lastRow = Math.floor((maxY - gap) / (cellSize + gap));
	const ids: string[] = [];
	for (let row = firstRow; row <= lastRow; row++) {
		for (let col = firstCol; col <= lastCol; col++) {
			const i = row * columns + col;
			if (i >= 0 && i < items.length) ids.push(items[i].id);
		}
	}
	return ids;
}

/**
 * Calcula el número de columnas basado en el ancho del viewport
 */
export function calculateColumns(viewportWidth: number, itemSize: number, gap: number): number {
	return Math.max(1, Math.floor(Math.max(0, viewportWidth - gap) / (itemSize + gap)));
}

/**
 * Calcula el tamaño de celda ajustado para usar todo el ancho disponible
 */
export function calculateCellSize(viewportWidth: number, columns: number, itemSize: number, gap: number): number {
	return columns > 0 ? Math.max(20, Math.floor(Math.max(0, viewportWidth - (columns + 1) * gap) / columns)) : itemSize;
}

/**
 * Calcula el offset top de un elemento relativo a su contenedor de scroll
 */
export function computeOffsetTop(host: HTMLElement, internal: HTMLElement): number {
	const hostRect = host.getBoundingClientRect();
	const selfRect = internal.getBoundingClientRect();
	return host.scrollTop + (selfRect.top - hostRect.top);
}
