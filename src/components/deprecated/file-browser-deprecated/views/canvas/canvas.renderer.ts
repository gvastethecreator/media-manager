/**
 * @file canvas.renderer.ts
 * @module components/file-browser/canvas/renderer
 * @description Lógica de renderizado en canvas
 */

import type { MediaItem } from '../../components/media-thumbnail';
import type { CacheEntry } from './canvas-common';
import { CanvasRenderConfig } from './canvas-config';
import type { Point, VisibleRange, Viewport } from './canvas.types';

/**
 * Parámetros para renderizado de canvas
 */
export interface CanvasRenderParams {
	canvas: HTMLCanvasElement;
	items: MediaItem[];
	visibleRange: VisibleRange;
	columns: number;
	gap: number;
	cellSize: number;
	viewport: Viewport;
	hoverIndex: number | null;
	dragStart: Point | null;
	dragCurrent: Point | null;
	getCache: (key: string) => CacheEntry | undefined;
	isSelected: (id: string) => boolean;
}

/**
 * Renderiza el grid de items en el canvas
 */
export function renderCanvas(params: CanvasRenderParams): void {
	const {
		canvas,
		items,
		visibleRange,
		columns,
		gap,
		cellSize,
		viewport,
		hoverIndex,
		dragStart,
		dragCurrent,
		getCache,
		isSelected,
	} = params;

	const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
	const w = Math.floor(canvas.clientWidth);
	const h = Math.floor(canvas.clientHeight);

	if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
		canvas.width = w * dpr;
		canvas.height = h * dpr;
		canvas.style.width = `${w}px`;
		canvas.style.height = `${h}px`;
	}

	const ctx = canvas.getContext('2d');
	if (!ctx) return;

	ctx.resetTransform();
	ctx.scale(dpr, dpr);
	ctx.clearRect(0, 0, w, h);

	const startIndex = visibleRange.firstVisibleRow * columns;
	const endIndex = Math.min(items.length - 1, (visibleRange.lastVisibleRow + 1) * columns - 1);

	// Renderizar cada item
	for (let i = startIndex; i <= endIndex; i++) {
		const it = items[i];
		if (!it) continue;

		const col = i % columns;
		const row = Math.floor(i / columns);
		const x = col * (cellSize + gap) + gap;
		const y = (row - visibleRange.firstVisibleRow) * (cellSize + gap) + gap;

		renderItem(ctx, it, x, y, cellSize, i === hoverIndex, isSelected(it.id), getCache);
	}

	// Renderizar overlay de selección por arrastre
	if (dragStart && dragCurrent) {
		renderDragOverlay(ctx, dragStart, dragCurrent, viewport, visibleRange, cellSize, gap);
	}
}

/**
 * Renderiza un item individual
 */
function renderItem(
	ctx: CanvasRenderingContext2D,
	item: MediaItem,
	x: number,
	y: number,
	cellSize: number,
	isHovered: boolean,
	isItemSelected: boolean,
	getCache: (key: string) => CacheEntry | undefined
): void {
	const isFolder = item.entityType === 'folder';

	// Background
	ctx.fillStyle = '#111827';
	ctx.fillRect(x, y, cellSize, cellSize);

	// Borde de selección/hover
	if (isItemSelected) {
		ctx.strokeStyle = '#3b82f6';
		ctx.lineWidth = CanvasRenderConfig.grid.borderWidth;
		ctx.strokeRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
	} else if (!isFolder && isHovered) {
		ctx.strokeStyle = '#f59e0b';
		ctx.lineWidth = 1;
		ctx.setLineDash([4, 3]);
		ctx.strokeRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
		ctx.setLineDash([]);
	}

	const entry = getCache(item.id);

	// Renderizado especial para carpetas
	if (isFolder && entry?.status === 'ready' && entry.image) {
		renderFolderPreview(ctx, entry.image as any, x, y, cellSize);
		return;
	}

	// Renderizado normal
	renderNormalItem(ctx, entry, item, x, y, cellSize);
}

/**
 * Renderiza preview de carpeta
 */
function renderFolderPreview(
	ctx: CanvasRenderingContext2D,
	img: HTMLImageElement,
	x: number,
	y: number,
	cellSize: number
): void {
	const iw = (img.naturalWidth ?? img.width) as number;
	const ih = (img.naturalHeight ?? img.height) as number;

	if (iw > 0 && ih > 0) {
		const scale = Math.min(cellSize / iw, cellSize / ih);
		const dw = Math.ceil(iw * scale);
		const dh = Math.ceil(ih * scale);
		const dx = x + Math.floor((cellSize - dw) / 2);
		const dy = y + Math.floor((cellSize - dh) / 2);
		ctx.drawImage(img, dx, dy, dw, dh);
	} else {
		// Fallback
		ctx.fillStyle = '#374151';
		ctx.fillRect(x, y, cellSize, cellSize);
		ctx.fillStyle = '#e5e7eb';
		ctx.font = `${Math.floor(cellSize * 0.4)}px system-ui, -apple-system, Segoe UI, Roboto, Arial`;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText('📁', x + cellSize / 2, y + cellSize / 2);
	}
}

/**
 * Renderiza item normal (no-carpeta)
 */
function renderNormalItem(
	ctx: CanvasRenderingContext2D,
	entry: CacheEntry | undefined,
	item: MediaItem,
	x: number,
	y: number,
	cellSize: number
): void {
	const pad = 2;
	ctx.save();
	ctx.beginPath();
	ctx.rect(x + pad, y + pad, cellSize - pad * 2, cellSize - pad * 2);
	ctx.clip();

	ctx.imageSmoothingEnabled = CanvasRenderConfig.visuals.enableSmoothing;
	(ctx as any).imageSmoothingQuality = 'high';

	if (entry?.status === 'ready' && entry.image) {
		renderImage(ctx, entry, x, y, cellSize, pad);
	} else if (entry?.status === 'ready' && entry.fallbackIcon) {
		renderFallbackIcon(ctx, entry.fallbackIcon, x, y, cellSize, pad);
	} else {
		renderPlaceholder(ctx, entry, item, x, y, cellSize, pad);
	}

	ctx.restore();
}

/**
 * Renderiza imagen con fade-in
 */
function renderImage(
	ctx: CanvasRenderingContext2D,
	entry: CacheEntry,
	x: number,
	y: number,
	cellSize: number,
	pad: number
): void {
	const img = entry.image as any;
	const iw = (img.naturalWidth ?? img.width) as number;
	const ih = (img.naturalHeight ?? img.height) as number;

	if (iw > 0 && ih > 0) {
		const now = performance.now();
		const t0 = entry.readyAt ?? now;
		const dt = Math.max(0, now - t0);
		const alpha = Math.min(1, dt / 220);
		const prevAlpha = ctx.globalAlpha;
		ctx.globalAlpha = alpha;

		const scale = Math.max((cellSize - pad * 2) / iw, (cellSize - pad * 2) / ih);
		const dw = Math.ceil(iw * scale);
		const dh = Math.ceil(ih * scale);
		const dx = x + pad + Math.floor((cellSize - pad * 2 - dw) / 2);
		const dy = y + pad + Math.floor((cellSize - pad * 2 - dh) / 2);

		ctx.drawImage(img, dx, dy, dw, dh);
		ctx.globalAlpha = prevAlpha;
	}
}

/**
 * Renderiza icono fallback (emoji)
 */
function renderFallbackIcon(
	ctx: CanvasRenderingContext2D,
	icon: string,
	x: number,
	y: number,
	cellSize: number,
	pad: number
): void {
	ctx.fillStyle = '#374151';
	ctx.fillRect(x + pad, y + pad, cellSize - pad * 2, cellSize - pad * 2);
	ctx.fillStyle = '#e5e7eb';
	ctx.font = `${Math.floor(cellSize * 0.45)}px system-ui, -apple-system, Segoe UI, Roboto, Arial`;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.fillText(icon, x + cellSize / 2, y + cellSize / 2);
	ctx.textAlign = 'left';
	ctx.textBaseline = 'alphabetic';
}

/**
 * Renderiza placeholder
 */
function renderPlaceholder(
	ctx: CanvasRenderingContext2D,
	entry: CacheEntry | undefined,
	item: MediaItem,
	x: number,
	y: number,
	cellSize: number,
	pad: number
): void {
	ctx.fillStyle = entry?.status === 'loading' ? '#6b7280' : '#374151';
	ctx.fillRect(x + pad, y + pad, cellSize - pad * 2, cellSize - pad * 2);
	ctx.fillStyle = '#ffffff';
	ctx.font = '10px monospace';
	ctx.textAlign = 'center';
	const statusText = entry?.status || (item.thumbnailUrl ? 'no-cache' : 'no-url');
	ctx.fillText(statusText, x + cellSize / 2, y + cellSize / 2);
	ctx.textAlign = 'left';
}

/**
 * Renderiza overlay de selección por arrastre
 */
function renderDragOverlay(
	ctx: CanvasRenderingContext2D,
	dragStart: Point,
	dragCurrent: Point,
	viewport: Viewport,
	visibleRange: VisibleRange,
	cellSize: number,
	gap: number
): void {
	const rx = Math.min(dragStart.x, dragCurrent.x) - viewport.scrollLeft;
	const firstRowY = visibleRange.firstVisibleRow * (cellSize + gap) + gap;
	const ry = Math.min(dragStart.y, dragCurrent.y) - firstRowY;
	const rw = Math.abs(dragCurrent.x - dragStart.x);
	const rh = Math.abs(dragCurrent.y - dragStart.y);

	ctx.fillStyle = 'rgba(59, 130, 246, 0.15)';
	ctx.strokeStyle = '#3b82f6';
	ctx.lineWidth = 1;
	ctx.fillRect(rx, ry, rw, rh);
	ctx.strokeRect(rx, ry, rw, rh);
}
