import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDebounce, useRaf } from '@/hooks/useThrottle';
import { ThumbnailQuality } from '@/lib/config/thumbnail.config';
import { useSelectionStore } from '@/store/ui/selection.slice';
import type { MediaItem } from '../../components/media-thumbnail';
import type { ClickModifiers } from '../../types/file-browser.types';
import { generateThumbnailUrl, getFallbackIcon, useImageCache } from './canvas-common';
import { CanvasRenderConfig } from './canvas-config';

export interface MasonryCanvasProps {
	items: MediaItem[];
	columnWidth?: number;
	gap?: number;
	overscanPadding?: number; // px por arriba y abajo
	scrollContainer?: HTMLElement | null;
	onItemClick?: (item: MediaItem, modifiers?: ClickModifiers) => void;
	onItemDoubleClick?: (item: MediaItem) => void;
}

const DEFAULTS = {
	columnWidth: CanvasRenderConfig.masonry.columnWidth,
	gap: CanvasRenderConfig.masonry.gap,
	overscanPadding: CanvasRenderConfig.masonry.overscanPadding,
};

type PlacedItem = { id: string; x: number; y: number; w: number; h: number; index: number };

export function MasonryCanvas({
	items,
	columnWidth = DEFAULTS.columnWidth,
	gap = DEFAULTS.gap,
	overscanPadding = DEFAULTS.overscanPadding,
	scrollContainer = null,
	onItemClick,
	onItemDoubleClick,
}: MasonryCanvasProps) {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const [viewport, setViewport] = useState({ width: 0, height: 0, scrollTop: 0, scrollLeft: 0, offsetTop: 0 });
	const { load, get, set } = useImageCache();
	const isSelected = useSelectionStore((s) => s.isSelected);
	const viewportRafRef = useRef<number | null>(null);
	const abortControllerRef = useRef<AbortController | null>(null);

	// Layout: calcular columnas y posiciones con algoritmo simple de "mínima columna"
	const layout = useMemo(() => {
		const width = Math.max(1, viewport.width);
		const colW = Math.max(80, Math.floor(columnWidth));
		const columns = Math.max(1, Math.floor((width + gap) / (colW + gap)));
		const actualColW = Math.floor((width - gap * (columns + 1)) / columns);
		const colHeights = new Array<number>(columns).fill(gap);
		const placed: PlacedItem[] = [];
		for (let i = 0; i < items.length; i++) {
			const it = items[i];
			const ratio = Math.max(0.25, Math.min(4, it.width && it.height ? it.width / it.height : 1.5));
			const w = actualColW;
			const h = Math.floor(w / ratio);
			// elegir columna con menor altura acumulada
			let col = 0;
			for (let c = 1; c < columns; c++) if (colHeights[c] < colHeights[col]) col = c;
			const x = gap + col * (actualColW + gap);
			const y = colHeights[col];
			placed.push({ id: it.id, x, y, w, h, index: i });
			colHeights[col] += h + gap;
		}
		const totalHeight = Math.max(...colHeights) + gap;
		return { placed, totalHeight, columns, actualColW };
	}, [items, viewport.width, columnWidth, gap]);

	// Prefetch con debounce y AbortController
	const debouncedPrefetch = useDebounce(
		useCallback(async () => {
			// Cancelar cualquier operación anterior
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}

			// Crear nuevo AbortController
			const controller = new AbortController();
			abortControllerRef.current = controller;

			try {
				const vTop = viewport.scrollTop - (scrollContainer ? viewport.offsetTop : 0);
				const startY = Math.max(0, vTop - overscanPadding);
				const endY = vTop + viewport.height + overscanPadding;
				const inRange = layout.placed.filter((p) => p.y + p.h >= startY && p.y <= endY);

				for (const p of inRange) {
					if (controller.signal.aborted) break;

					const it = items[p.index];
					const key = it.id;
					if (get(key)) continue;
					try {
						const src = await generateThumbnailUrl(it, ThumbnailQuality.MEDIUM);
						if (controller.signal.aborted) break;

						if (src && !src.startsWith('🎵') && !src.startsWith('🖼️') && !src.startsWith('🎥')) {
							load(key, src);
						} else {
							set(key, { status: 'ready', fallbackIcon: src });
						}
					} catch {
						if (!controller.signal.aborted) {
							set(key, { status: 'ready', fallbackIcon: getFallbackIcon(it.entityType) });
						}
					}
				}
			} catch (error) {
				if (!controller.signal.aborted) {
					console.warn('Prefetch error:', error);
				}
			} finally {
				if (abortControllerRef.current === controller) {
					abortControllerRef.current = null;
				}
			}
		}, [
			items,
			layout.placed,
			viewport.scrollTop,
			viewport.height,
			overscanPadding,
			get,
			load,
			set,
			scrollContainer,
			viewport.offsetTop,
		]),
		200
	);

	// useEffect que ejecuta el prefetch debounceado
	useEffect(() => {
		debouncedPrefetch();
	}, [debouncedPrefetch]);

	// Render con throttle
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

		const vTop = viewport.scrollTop - (scrollContainer ? viewport.offsetTop : 0);
		const startY = Math.max(0, vTop - overscanPadding);
		const endY = vTop + viewport.height + overscanPadding;
		const visible = layout.placed.filter((p) => p.y + p.h >= startY && p.y <= endY);

		for (const p of visible) {
			const it = items[p.index];
			const x = p.x;
			const y = p.y - startY; // relativo al viewport dibujado
			// bg
			ctx.fillStyle = '#0b1020';
			ctx.fillRect(x, y, p.w, p.h);
			if (isSelected(it.id)) {
				ctx.strokeStyle = '#3b82f6';
				ctx.lineWidth = CanvasRenderConfig.masonry.borderWidth;
				ctx.strokeRect(x + 1, y + 1, p.w - 2, p.h - 2);
			}
			const entry = get(it.id);
			ctx.save();
			ctx.beginPath();
			ctx.rect(x + 2, y + 2, p.w - 4, p.h - 4);
			ctx.clip();
			if (entry?.status === 'ready' && entry.image) {
				const img = entry.image as any;
				const iw = (img.naturalWidth ?? img.width) as number;
				const ih = (img.naturalHeight ?? img.height) as number;
				const scale = Math.max((p.w - 4) / iw, (p.h - 4) / ih);
				const dw = Math.ceil(iw * scale);
				const dh = Math.ceil(ih * scale);
				const dx = x + 2 + Math.floor((p.w - 4 - dw) / 2);
				const dy = y + 2 + Math.floor((p.h - 4 - dh) / 2);
				ctx.drawImage(img, dx, dy, dw, dh);
			} else if (entry?.status === 'ready' && entry.fallbackIcon) {
				ctx.fillStyle = '#374151';
				ctx.fillRect(x + 2, y + 2, p.w - 4, p.h - 4);
				ctx.fillStyle = '#e5e7eb';
				ctx.font = `${Math.floor(Math.min(p.w, p.h) * 0.45)}px system-ui`;
				ctx.textAlign = 'center';
				ctx.textBaseline = 'middle';
				ctx.fillText(entry.fallbackIcon, x + p.w / 2, y + p.h / 2);
				ctx.textAlign = 'left';
				ctx.textBaseline = 'alphabetic';
			} else {
				ctx.fillStyle = '#1f2937';
				ctx.fillRect(x + 2, y + 2, p.w - 4, p.h - 4);
			}
			ctx.restore();
		}
	}, [
		items,
		layout.placed,
		viewport.scrollTop,
		viewport.height,
		overscanPadding,
		get,
		isSelected,
		scrollContainer,
		viewport.offsetTop,
	]);

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

	// Click hit testing
	const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
		if (!containerRef.current) return;
		const rect = containerRef.current.getBoundingClientRect();
		const x = e.clientX - rect.left + viewport.scrollLeft;
		let y = e.clientY - rect.top + viewport.scrollTop;
		if (scrollContainer) y -= viewport.offsetTop;
		// encontrar item por punto
		const hit = layout.placed.find((p) => x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h);
		if (!hit) return;
		const item = items[hit.index];
		const modifiers: ClickModifiers = { ctrlKey: e.ctrlKey, metaKey: e.metaKey, shiftKey: e.shiftKey };
		if (e.detail >= 2) onItemDoubleClick?.(item);
		else onItemClick?.(item, modifiers);
	};

	return (
		<div
			className={scrollContainer ? 'relative w-full' : 'relative h-full w-full overflow-auto'}
			data-testid="masonry-canvas"
			onPointerUp={handlePointerUp}
			ref={containerRef}
		>
			<div style={{ height: layout.totalHeight }} />
			<canvas className="pointer-events-none absolute inset-0" ref={canvasRef} />
		</div>
	);
}
