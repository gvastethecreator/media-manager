import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDebounce, useRaf } from '@/hooks/useThrottle';
import { ThumbnailQuality } from '@/lib/config/thumbnail.config';
import { useSelectionStore } from '@/store/ui/selection.slice';
import type { MediaItem } from '../../components/media-thumbnail';
import type { ClickModifiers } from '../../types/file-browser.types';
import { generateThumbnailUrl, getFallbackIcon, useImageCache } from './canvas-common';
import { CanvasRenderConfig } from './canvas-config';

export interface CardsCanvasProps {
	items: MediaItem[];
	itemSize?: number; // altura total de la tarjeta, miniatura ocupa ~70%
	gap?: number;
	overscanRows?: number;
	scrollContainer?: HTMLElement | null;
	onItemClick?: (item: MediaItem, modifiers?: ClickModifiers) => void;
	onItemDoubleClick?: (item: MediaItem) => void;
}

const DEFAULTS = {
	itemSize: Math.max(180, CanvasRenderConfig.grid.itemSize + 20),
	gap: CanvasRenderConfig.grid.gap,
	overscanRows: CanvasRenderConfig.grid.overscanRows,
};

// CardsCanvas dibuja en canvas para mantener performance pero agrega una franja de texto (nombre, tipo)
export function CardsCanvas({
	items,
	itemSize = DEFAULTS.itemSize,
	gap = DEFAULTS.gap,
	overscanRows = DEFAULTS.overscanRows,
	scrollContainer = null,
	onItemClick,
	onItemDoubleClick,
}: CardsCanvasProps) {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const [viewport, setViewport] = useState({ width: 0, height: 0, scrollTop: 0, scrollLeft: 0, offsetTop: 0 });
	const { load, get, set } = useImageCache();
	const isSelected = useSelectionStore((s) => s.isSelected);
	const viewportRafRef = useRef<number | null>(null);

	const columns = Math.max(1, Math.floor(Math.max(0, viewport.width - gap) / (itemSize + gap)));
	const cellSize =
		columns > 0 ? Math.max(120, Math.floor(Math.max(0, viewport.width - (columns + 1) * gap) / columns)) : itemSize;
	const textBand = Math.max(28, Math.floor(cellSize * 0.28));
	const cellHeight = cellSize + textBand;
	const rowHeight = cellHeight + gap;
	const totalRows = Math.ceil(items.length / columns);
	const totalHeight = totalRows * rowHeight + gap;

	const localScrollTop = Math.max(0, viewport.scrollTop - (scrollContainer ? viewport.offsetTop : 0));
	const firstVisibleRow = Math.max(0, Math.floor(localScrollTop / rowHeight) - overscanRows);
	const lastVisibleRow = Math.min(
		totalRows - 1,
		Math.floor((localScrollTop + viewport.height) / rowHeight) + overscanRows
	);
	const visibleRange = useMemo(() => ({ firstVisibleRow, lastVisibleRow }), [firstVisibleRow, lastVisibleRow]);

	// Prefetch con AbortController y debouncing para evitar requests masivos
	const abortControllerRef = useRef<AbortController | null>(null);

	const debouncedPrefetch = useDebounce(
		useCallback(
			async (startIndex: number, endIndex: number, items: MediaItem[]) => {
				// Cancelar requests anteriores
				if (abortControllerRef.current) {
					abortControllerRef.current.abort();
				}

				// Crear nuevo controller
				abortControllerRef.current = new AbortController();
				const signal = abortControllerRef.current.signal;

				try {
					for (let i = startIndex; i <= endIndex; i++) {
						if (signal.aborted) break;

						const it = items[i];
						if (!it) continue;
						const key = it.id;
						if (get(key)) continue;
						try {
							const src = await generateThumbnailUrl(it, ThumbnailQuality.MEDIUM);
							if (signal.aborted) break;

							if (src && !src.startsWith('🎵') && !src.startsWith('🖼️') && !src.startsWith('🎥')) load(key, src);
							else set(key, { status: 'ready', fallbackIcon: src });
						} catch {
							if (signal.aborted) break;
							set(key, { status: 'ready', fallbackIcon: getFallbackIcon(it.entityType) });
						}
					}
				} catch (error: unknown) {
					if (error instanceof Error && error.name !== 'AbortError') {
						console.warn('Error en prefetch de thumbnails:', error);
					}
				}
			},
			[load, get, set]
		),
		200
	); // 200ms debounce

	useEffect(() => {
		const startIndex = visibleRange.firstVisibleRow * columns;
		const rawEndIndex = Math.min(items.length - 1, (visibleRange.lastVisibleRow + 1) * columns - 1);

		// 🚀 OPTIMIZACIÓN: Limitar máximo 250 elementos en memoria para mejorar rendimiento del scroll
		const MAX_ITEMS_IN_MEMORY = 250;
		const endIndex = Math.min(rawEndIndex, startIndex + MAX_ITEMS_IN_MEMORY - 1);

		debouncedPrefetch(startIndex, endIndex, items);
	}, [visibleRange, columns, items, debouncedPrefetch]);

	// Render callback throttleado para 60fps máximo
	const renderCallback = useCallback(() => {
		const canvas = canvasRef.current;
		const container = containerRef.current;
		if (!canvas) return;
		if (!container) return;
		const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
		const host = (scrollContainer ?? container) as HTMLElement;
		const w = Math.floor(host.clientWidth);
		const h = Math.floor(host.clientHeight);
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
		const rawEndIndex = Math.min(items.length - 1, (visibleRange.lastVisibleRow + 1) * columns - 1);

		// 🚀 OPTIMIZACIÓN: Limitar máximo 250 elementos renderizados para mejorar rendimiento del scroll
		const MAX_ITEMS_RENDERED = 250;
		const endIndex = Math.min(rawEndIndex, startIndex + MAX_ITEMS_RENDERED - 1);

		for (let i = startIndex; i <= endIndex; i++) {
			const it = items[i];
			if (!it) continue;
			const col = i % columns;
			const row = Math.floor(i / columns);
			const x = col * (cellSize + gap) + gap;
			const y = (row - visibleRange.firstVisibleRow) * rowHeight + gap;
			// Card background
			ctx.fillStyle = '#0b1020';
			ctx.fillRect(x, y, cellSize, cellHeight);
			if (isSelected(it.id)) {
				ctx.strokeStyle = '#3b82f6';
				ctx.lineWidth = CanvasRenderConfig.grid.borderWidth;
				ctx.strokeRect(x + 1, y + 1, cellSize - 2, cellHeight - 2);
			}

			// Image area
			const imgH = cellSize;
			const imgW = cellSize;
			const pad = 2;
			const imgX = x + pad;
			const imgY = y + pad;
			const imgBoxW = imgW - pad * 2;
			const imgBoxH = imgH - pad * 2;
			const entry = get(it.id);
			ctx.save();
			ctx.beginPath();
			ctx.rect(imgX, imgY, imgBoxW, imgBoxH);
			ctx.clip();
			if (entry?.status === 'ready' && entry.image) {
				const img = entry.image as any;
				const iw = (img.naturalWidth ?? img.width) as number;
				const ih = (img.naturalHeight ?? img.height) as number;
				if (iw > 0 && ih > 0) {
					const scale = Math.max(imgBoxW / iw, imgBoxH / ih);
					const dw = Math.ceil(iw * scale);
					const dh = Math.ceil(ih * scale);
					const dx = imgX + Math.floor((imgBoxW - dw) / 2);
					const dy = imgY + Math.floor((imgBoxH - dh) / 2);
					ctx.drawImage(img, dx, dy, dw, dh);
				}
			} else if (entry?.status === 'ready' && entry.fallbackIcon) {
				ctx.fillStyle = '#374151';
				ctx.fillRect(imgX, imgY, imgBoxW, imgBoxH);
				ctx.fillStyle = '#e5e7eb';
				ctx.font = `${Math.floor(cellSize * 0.45)}px system-ui`;
				ctx.textAlign = 'center';
				ctx.textBaseline = 'middle';
				ctx.fillText(entry.fallbackIcon, imgX + imgBoxW / 2, imgY + imgBoxH / 2);
				ctx.textAlign = 'left';
				ctx.textBaseline = 'alphabetic';
			} else {
				ctx.fillStyle = '#1f2937';
				ctx.fillRect(imgX, imgY, imgBoxW, imgBoxH);
			}
			ctx.restore();

			// Text band
			const bandY = y + imgH;
			ctx.fillStyle = '#0e152b';
			ctx.fillRect(x, bandY, cellSize, textBand);
			ctx.fillStyle = '#e5e7eb';
			ctx.font = '12px system-ui';
			drawClampedText(ctx, it.name || '—', x + 8, bandY + Math.floor(textBand / 2) - 2, cellSize - 16);
			ctx.fillStyle = '#9ca3af';
			ctx.font = '11px system-ui';
			const meta = [it.entityType, formatSize(it.size)].filter(Boolean).join(' · ');
			drawClampedText(ctx, meta, x + 8, bandY + Math.floor(textBand / 2) + 12, cellSize - 16);
		}
	}, [items, visibleRange, columns, gap, cellSize, textBand, rowHeight, cellHeight, isSelected, get, scrollContainer]);

	const rafRender = useRaf(renderCallback);

	// useEffect que agenda render por frame (RAF)
	useEffect(() => {
		rafRender();
	}, [rafRender]);

	// Observe
	useEffect(() => {
		const internal = containerRef.current;
		if (!internal) return;
		const host = (scrollContainer ?? internal) as HTMLElement;
		const computeOffsetTop = () => {
			const hostRect = host.getBoundingClientRect();
			const selfRect = internal.getBoundingClientRect();
			return host.scrollTop + (selfRect.top - hostRect.top);
		};
		const onScroll = () => {
			if (viewportRafRef.current != null) return;
			viewportRafRef.current = requestAnimationFrame(() => {
				viewportRafRef.current = null;
				setViewport((v) => ({
					...v,
					scrollTop: host.scrollTop,
					scrollLeft: host.scrollLeft,
					offsetTop: scrollContainer ? computeOffsetTop() : 0,
				}));
			});
		};
		host.addEventListener('scroll', onScroll, { passive: true });
		const ro = new ResizeObserver(() => {
			if (viewportRafRef.current != null) return;
			viewportRafRef.current = requestAnimationFrame(() => {
				viewportRafRef.current = null;
				setViewport((v) => ({
					...v,
					width: Math.floor(host.clientWidth),
					height: Math.floor(host.clientHeight),
					offsetTop: scrollContainer ? computeOffsetTop() : 0,
				}));
			});
		});
		ro.observe(host);
		ro.observe(internal);
		setViewport({
			width: host.clientWidth,
			height: host.clientHeight,
			scrollTop: host.scrollTop,
			scrollLeft: host.scrollLeft,
			offsetTop: scrollContainer ? computeOffsetTop() : 0,
		});
		return () => {
			ro.disconnect();
			host.removeEventListener('scroll', onScroll);
			if (viewportRafRef.current != null) cancelAnimationFrame(viewportRafRef.current);
		};
	}, [scrollContainer]);

	// Click handling
	const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
		if (!containerRef.current) return;
		const pos = getContentCoords(e, containerRef.current, viewport, scrollContainer);
		const idx = indexFromCoords(pos.x, pos.y, columns, cellSize, gap, textBand, visibleRange.firstVisibleRow);
		if (idx === -1) return;
		const item = items[idx];
		const modifiers: ClickModifiers = { ctrlKey: e.ctrlKey, metaKey: e.metaKey, shiftKey: e.shiftKey };
		if (e.detail >= 2) onItemDoubleClick?.(item);
		else onItemClick?.(item, modifiers);
	};

	return (
		<div
			className={scrollContainer ? 'relative w-full' : 'relative h-full w-full overflow-auto'}
			data-testid="cards-canvas"
			onPointerUp={handlePointerUp}
			ref={containerRef}
		>
			<div style={{ height: totalHeight }} />
			<canvas className="pointer-events-none absolute inset-0" ref={canvasRef} />
		</div>
	);
}

function getContentCoords(
	e: { clientX: number; clientY: number },
	container: HTMLElement,
	viewport: any,
	scrollContainer: HTMLElement | null
) {
	const rect = container.getBoundingClientRect();
	const x = e.clientX - rect.left + viewport.scrollLeft;
	let y = e.clientY - rect.top + viewport.scrollTop;
	if (scrollContainer) y -= viewport.offsetTop;
	return { x, y };
}

function indexFromCoords(
	x: number,
	y: number,
	columns: number,
	cellSize: number,
	gap: number,
	textBand: number,
	firstRow: number
) {
	const rowHeight = cellSize + textBand + gap;
	const col = Math.floor((x - gap) / (cellSize + gap));
	const row = Math.floor((y - gap) / rowHeight) + firstRow;
	if (col < 0 || row < 0) return -1;
	const idx = row * columns + col;
	return idx;
}

function drawClampedText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number) {
	if (ctx.measureText(text).width <= maxWidth) {
		ctx.fillText(text, x, y);
		return;
	}
	let lo = 0;
	let hi = text.length;
	const ell = '…';
	while (lo < hi) {
		const mid = Math.floor((lo + hi) / 2);
		const t = text.slice(0, mid) + ell;
		if (ctx.measureText(t).width <= maxWidth) lo = mid + 1;
		else hi = mid;
	}
	const clamped = text.slice(0, Math.max(0, lo - 1)) + ell;
	ctx.fillText(clamped, x, y);
}

function formatSize(size?: number) {
	if (!size || size <= 0) return '';
	const units = ['B', 'KB', 'MB', 'GB'];
	let s = size;
	let u = 0;
	while (s >= 1024 && u < units.length - 1) {
		s /= 1024;
		u++;
	}
	return `${s.toFixed(u === 0 ? 0 : 1)} ${units[u]}`;
}
