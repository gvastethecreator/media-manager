import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSelectionStore } from '@/store/ui/selection.slice';
import type { ClickModifiers } from '../../types/file-browser.types';
import type { MediaItem } from '../media-thumbnail';
import {
	generate3DModelThumbnail,
	generateAdvancedImageThumbnail,
	generateAdvancedVideoThumbnail,
	generateAudioWaveform,
	generateJsonPreview,
} from '@/config/thumbnail-generators';
import { ThumbnailQuality } from '@/lib/config/thumbnail.config';

// Renderiza todos los items en un solo <canvas> para minimizar el overhead de DOM.
// Estrategia: layout en celdas (grid) con tamaño fijo, prefetch de imágenes con Intersection-like
// (calculado por posición/scroll), overscan, y caché en memoria de ImageBitmap/Image.

// Cache similar al de MediaThumbnail
const thumbnailCache = new Map<string, string>();
const CACHE_MAX_SIZE = 200; // limitar para evitar consumo excesivo de memoria

const cacheKeyFor = (item: MediaItem, type: string, quality: ThumbnailQuality) =>
	`${item.id || item.name}-${type}-${quality}`;

const getFallbackIcon = (entityType: string) => {
	switch (entityType) {
		case 'image':
			return '🖼️';
		case 'video':
			return '🎥';
		case 'audio':
			return '🎵';
		case 'document':
			return '📄';
		case 'jsonFile':
			return '📋';
		case 'file3d':
			return '🎲';
		default:
			return '📁';
	}
};

const cleanupThumbCache = () => {
	if (thumbnailCache.size > CACHE_MAX_SIZE) {
		const entries = Array.from(thumbnailCache.entries());
		const toDelete = entries.slice(0, Math.floor(CACHE_MAX_SIZE * 0.3));
		for (const [key] of toDelete) {
			thumbnailCache.delete(key);
		}
	}
};

// Generar thumbnail usando la misma lógica que MediaThumbnail
const generateThumbnailUrl = async (
	item: MediaItem,
	quality: ThumbnailQuality = ThumbnailQuality.MEDIUM
): Promise<string> => {
	let url = '';
	try {
		if (item.entityType === 'image') {
			const key = cacheKeyFor(item, 'image', quality);
			url = thumbnailCache.get(key) || '';
			if (!url) {
				url = await generateAdvancedImageThumbnail(item as any);
				if (url) {
					cleanupThumbCache();
					thumbnailCache.set(key, url);
				}
			}
			return url || item.thumbnailUrl || getFallbackIcon(item.entityType);
		}

		if (item.entityType === 'video') {
			const key = cacheKeyFor(item, 'videoPoster', quality);
			url = thumbnailCache.get(key) || '';
			if (!url) {
				url = await generateAdvancedVideoThumbnail(item as any, { timeOffset: 0 });
				if (url) {
					cleanupThumbCache();
					thumbnailCache.set(key, url);
				}
			}
			return url || item.thumbnailUrl || getFallbackIcon(item.entityType);
		}

		if (item.entityType === 'jsonFile') {
			const key = cacheKeyFor(item, 'json', quality);
			url = thumbnailCache.get(key) || '';
			if (!url) {
				url = await generateJsonPreview(item as any);
				if (url) {
					cleanupThumbCache();
					thumbnailCache.set(key, url);
				}
			}
			return url || getFallbackIcon(item.entityType);
		}

		if (item.entityType === 'file3d') {
			const key = cacheKeyFor(item, 'file3d', quality);
			url = thumbnailCache.get(key) || '';
			if (!url) {
				url = await generate3DModelThumbnail(item as any);
				if (url) {
					cleanupThumbCache();
					thumbnailCache.set(key, url);
				}
			}
			return url || getFallbackIcon(item.entityType);
		}

		if (item.entityType === 'audio') {
			const key = cacheKeyFor(item, 'audio', quality);
			url = thumbnailCache.get(key) || '';
			if (!url) {
				url = await generateAudioWaveform(item as any);
				if (url) {
					cleanupThumbCache();
					thumbnailCache.set(key, url);
				}
			}
			return url || getFallbackIcon(item.entityType);
		}

		// Tipos no soportados: usar icono genérico
		return getFallbackIcon(item.entityType);
	} catch (error) {
		console.error('Error generating thumbnail:', error);
		return getFallbackIcon(item.entityType);
	}
};

export interface FileCanvasProps {
	items: MediaItem[];
	itemSize?: number; // tamaño de celda (cuadrada)
	gap?: number;
	overscanRows?: number;
	onItemClick?: (item: MediaItem, modifiers?: ClickModifiers) => void;
	onItemDoubleClick?: (item: MediaItem) => void;
}

const DEFAULTS = {
	itemSize: 160,
	gap: 8,
	overscanRows: 4,
};

type CacheEntry = {
	status: 'loading' | 'ready' | 'error';
	image?: ImageBitmap | HTMLImageElement;
	fallbackIcon?: string; // Para emojis/iconos de fallback
};

function useImageCache() {
	const cache = useRef<Map<string, CacheEntry>>(new Map());
	const pending = useRef<Map<string, Promise<void>>>(new Map());

	const load = (key: string, src: string) => {
		if (!key) return;
		if (!src) return;
		if (cache.current.has(key) || pending.current.has(key)) return;

		console.log('Starting image load:', { key, src });
		cache.current.set(key, { status: 'loading' });

		const p = (async () => {
			try {
				// Intentar crear ImageBitmap (más eficiente para canvas) si está disponible
				// Fallback a HTMLImageElement
				const imgEl = new Image();
				imgEl.decoding = 'async';
				imgEl.loading = 'eager';
				imgEl.crossOrigin = 'anonymous';
				imgEl.src = src;

				await new Promise((resolve, reject) => {
					imgEl.onload = resolve;
					imgEl.onerror = reject;
					// Timeout fallback
					setTimeout(() => reject(new Error('Timeout')), 10_000);
				});

				console.log('Image loaded successfully:', { key, width: imgEl.naturalWidth, height: imgEl.naturalHeight });

				let bmp: ImageBitmap | HTMLImageElement;
				if ('createImageBitmap' in window) {
					try {
						bmp = await createImageBitmap(imgEl);
						console.log('Created ImageBitmap for:', key);
					} catch {
						bmp = imgEl;
						console.log('Fallback to HTMLImageElement for:', key);
					}
				} else {
					bmp = imgEl;
					console.log('Using HTMLImageElement (no createImageBitmap):', key);
				}
				cache.current.set(key, { status: 'ready', image: bmp });
			} catch (error) {
				console.error('Image load failed:', { key, src, error });
				cache.current.set(key, { status: 'error' });
			} finally {
				pending.current.delete(key);
			}
		})();

		pending.current.set(key, p);
	};

	const get = (key: string) => cache.current.get(key);
	const set = (key: string, entry: CacheEntry) => cache.current.set(key, entry);

	return { load, get, set } as const;
}

export function FileCanvas({
	items,
	itemSize = DEFAULTS.itemSize,
	gap = DEFAULTS.gap,
	overscanRows = DEFAULTS.overscanRows,
	onItemClick,
	onItemDoubleClick,
}: FileCanvasProps) {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const [viewport, setViewport] = useState({ width: 0, height: 0, scrollTop: 0, scrollLeft: 0 });
	const { load, get, set } = useImageCache();
	const isSelected = useSelectionStore((s) => s.isSelected);
	const selectedIds = useSelectionStore((s) => s.selectedIds);
	const setSelectedIds = useSelectionStore((s) => s.setSelectedIds);
	const setActiveId = useSelectionStore((s) => s.setActiveId);

	// Estados de interacción (hover y selección por arrastre)
	const [hoverIndex, setHoverIndex] = useState<number | null>(null);
	const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
	const [dragCurrent, setDragCurrent] = useState<{ x: number; y: number } | null>(null);

	// Layout: número de columnas basado en ancho del contenedor
	const columns = Math.max(1, Math.floor((viewport.width + gap) / (itemSize + gap)));
	const rowHeight = itemSize + gap;
	const totalRows = Math.ceil(items.length / columns);
	const totalHeight = totalRows * rowHeight + gap;

	// Visible rows con overscan
	const firstVisibleRow = Math.max(0, Math.floor(viewport.scrollTop / rowHeight) - overscanRows);
	const lastVisibleRow = Math.min(
		totalRows - 1,
		Math.floor((viewport.scrollTop + viewport.height) / rowHeight) + overscanRows
	);

	const visibleRange = useMemo(() => ({ firstVisibleRow, lastVisibleRow }), [firstVisibleRow, lastVisibleRow]);

	// Utilidades: coordenadas relativas al contenido y mapeo a índices
	const getContentCoords = (e: { clientX: number; clientY: number }) => {
		const container = containerRef.current;
		if (!container) return { x: 0, y: 0 };
		const rect = container.getBoundingClientRect();
		const x = e.clientX - rect.left + viewport.scrollLeft;
		const y = e.clientY - rect.top + viewport.scrollTop;
		return { x, y };
	};

	const indexFromCoords = (x: number, y: number) => {
		const col = Math.floor((x - gap) / (itemSize + gap));
		const row = Math.floor((y - gap) / (itemSize + gap));
		if (col < 0 || row < 0) return -1;
		const idx = row * columns + col;
		if (idx < 0 || idx >= items.length) return -1;
		return idx;
	};

	const idsFromMarquee = (a: { x: number; y: number }, b: { x: number; y: number }) => {
		const minX = Math.min(a.x, b.x);
		const maxX = Math.max(a.x, b.x);
		const minY = Math.min(a.y, b.y);
		const maxY = Math.max(a.y, b.y);
		const firstCol = Math.max(0, Math.floor((minX - gap) / (itemSize + gap)));
		const lastCol = Math.floor((maxX - gap) / (itemSize + gap));
		const firstRow = Math.max(0, Math.floor((minY - gap) / (itemSize + gap)));
		const lastRow = Math.floor((maxY - gap) / (itemSize + gap));
		const ids: string[] = [];
		for (let row = firstRow; row <= lastRow; row++) {
			for (let col = firstCol; col <= lastCol; col++) {
				const i = row * columns + col;
				if (i >= 0 && i < items.length) ids.push(items[i].id);
			}
		}
		return ids;
	};

	// Prefetch imágenes de items visibles
	useEffect(() => {
		const startIndex = visibleRange.firstVisibleRow * columns;
		const endIndex = Math.min(items.length - 1, (visibleRange.lastVisibleRow + 1) * columns - 1);

		// Debug: log items para ver qué thumbnailUrl tienen
		console.log('FileCanvas prefetch debug:', {
			startIndex,
			endIndex,
			totalItems: items.length,
			sampleItems: items
				.slice(0, 3)
				.map((it) => ({ id: it.id, thumbnailUrl: it.thumbnailUrl, name: it.name, entityType: it.entityType })),
		});

		// Generar thumbnails de manera asíncrona para los items visibles
		const loadThumbnails = async () => {
			for (let i = startIndex; i <= endIndex; i++) {
				const it = items[i];
				if (!it) continue;
				const key = it.id;

				// Si ya tenemos la imagen en caché, continuar
				if (get(key)) continue;

				try {
					// Generar thumbnail usando la misma lógica que MediaThumbnail
					const src = await generateThumbnailUrl(it, ThumbnailQuality.MEDIUM);
					console.log('Generated thumbnail URL for:', { key, src, entityType: it.entityType });

					if (src && !src.startsWith('🎵') && !src.startsWith('🖼️') && !src.startsWith('🎥')) {
						// Solo cargar si es una URL real (no un emoji)
						load(key, src);
					} else {
						// Para fallback icons (emojis), crear un placeholder entry
						console.log('Using fallback icon for:', { key, src, entityType: it.entityType });
						set(key, { status: 'ready', fallbackIcon: src });
					}
				} catch (error) {
					console.error('Error generating thumbnail for item:', { key, error });
					const fallback = getFallbackIcon(it.entityType);
					set(key, { status: 'ready', fallbackIcon: fallback });
				}
			}
		};

		loadThumbnails();
	}, [visibleRange, columns, items, load, get, set]);

	// Render en canvas
	useEffect(() => {
		const canvas = canvasRef.current;
		const container = containerRef.current;
		if (!canvas) return;
		if (!container) return;

		const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
		const w = Math.floor(container.clientWidth);
		const h = Math.floor(container.clientHeight);
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

		// Offset superior por scroll
		const startIndex = visibleRange.firstVisibleRow * columns;
		const endIndex = Math.min(items.length - 1, (visibleRange.lastVisibleRow + 1) * columns - 1);

		console.log('Canvas render debug:', {
			visibleRange,
			startIndex,
			endIndex,
			cacheStatus: items.slice(startIndex, Math.min(startIndex + 5, endIndex + 1)).map((it) => ({
				id: it.id,
				name: it.name,
				hasThumbUrl: !!it.thumbnailUrl,
				cacheEntry: get(it.id)?.status,
			})),
		});

		for (let i = startIndex; i <= endIndex; i++) {
			const it = items[i];
			if (!it) continue;
			const col = i % columns;
			const row = Math.floor(i / columns);
			const x = col * (itemSize + gap) + gap;
			const y = row * (itemSize + gap) + gap - viewport.scrollTop;

			// Background y borde de selección
			ctx.fillStyle = '#111827'; // bg-card aproximado (tailwind slate-900)
			ctx.fillRect(x, y, itemSize, itemSize);
			if (isSelected(it.id)) {
				ctx.strokeStyle = '#3b82f6';
				ctx.lineWidth = 2;
				ctx.strokeRect(x + 1, y + 1, itemSize - 2, itemSize - 2);
			}

			const entry = get(it.id);
			// Definir área de recorte por celda para simular object-fit: cover sin desbordes
			const pad = 2; // pequeño padding visual
			ctx.save();
			ctx.beginPath();
			ctx.rect(x + pad, y + pad, itemSize - pad * 2, itemSize - pad * 2);
			ctx.clip();

			// Mejora de calidad de reescalado
			ctx.imageSmoothingEnabled = true;
			// imageSmoothingQuality puede no estar tipeado, pero la mayoría de navegadores lo soportan
			(ctx as any).imageSmoothingQuality = 'high';

			if (entry?.status === 'ready' && entry.image) {
				// Ajuste para cubrir celda manteniendo aspect ratio (object-fit: cover)
				const img = entry.image as any;
				const iw = (img.naturalWidth ?? img.width) as number;
				const ih = (img.naturalHeight ?? img.height) as number;
				if (iw > 0 && ih > 0) {
					const scale = Math.max((itemSize - pad * 2) / iw, (itemSize - pad * 2) / ih);
					const dw = Math.ceil(iw * scale);
					const dh = Math.ceil(ih * scale);
					// centrado dentro del área recortada
					const dx = x + pad + Math.floor((itemSize - pad * 2 - dw) / 2);
					const dy = y + pad + Math.floor((itemSize - pad * 2 - dh) / 2);
					ctx.drawImage(img, dx, dy, dw, dh);
				}
			} else if (entry?.status === 'ready' && entry.fallbackIcon) {
				// Renderizar fallback icon (emoji) centrado y recortado
				ctx.fillStyle = '#374151';
				ctx.fillRect(x + pad, y + pad, itemSize - pad * 2, itemSize - pad * 2);
				ctx.fillStyle = '#e5e7eb';
				ctx.font = `${Math.floor(itemSize * 0.45)}px system-ui, -apple-system, Segoe UI, Roboto, Arial`;
				ctx.textAlign = 'center';
				ctx.textBaseline = 'middle';
				ctx.fillText(entry.fallbackIcon, x + itemSize / 2, y + itemSize / 2);
				ctx.textAlign = 'left';
				ctx.textBaseline = 'alphabetic';
			} else {
				// placeholder con información del estado, recortado a la celda
				ctx.fillStyle = entry?.status === 'loading' ? '#6b7280' : '#374151';
				ctx.fillRect(x + pad, y + pad, itemSize - pad * 2, itemSize - pad * 2);
				// Texto de debug del estado
				ctx.fillStyle = '#ffffff';
				ctx.font = '10px monospace';
				ctx.textAlign = 'center';
				const statusText = entry?.status || (it.thumbnailUrl ? 'no-cache' : 'no-url');
				ctx.fillText(statusText, x + itemSize / 2, y + itemSize / 2);
				ctx.textAlign = 'left';
			}

			// Restaurar para que bordes/overlays no queden recortados
			ctx.restore();
		}
		// Overlay de hover
		if (hoverIndex !== null && hoverIndex >= startIndex && hoverIndex <= endIndex) {
			const col = hoverIndex % columns;
			const row = Math.floor(hoverIndex / columns);
			const x = col * (itemSize + gap) + gap;
			const y = row * (itemSize + gap) + gap - viewport.scrollTop;
			ctx.strokeStyle = '#f59e0b';
			ctx.lineWidth = 2;
			ctx.setLineDash([4, 3]);
			ctx.strokeRect(x + 2, y + 2, itemSize - 4, itemSize - 4);
			ctx.setLineDash([]);
		}

		// Overlay de selección por arrastre (rectángulo)
		if (dragStart && dragCurrent) {
			const rx = Math.min(dragStart.x, dragCurrent.x) - viewport.scrollLeft;
			const ry = Math.min(dragStart.y, dragCurrent.y) - viewport.scrollTop;
			const rw = Math.abs(dragCurrent.x - dragStart.x);
			const rh = Math.abs(dragCurrent.y - dragStart.y);
			ctx.fillStyle = 'rgba(59, 130, 246, 0.15)';
			ctx.strokeStyle = '#3b82f6';
			ctx.lineWidth = 1;
			ctx.fillRect(rx, ry, rw, rh);
			ctx.strokeRect(rx, ry, rw, rh);
		}
	}, [
		items,
		visibleRange,
		columns,
		gap,
		itemSize,
		get,
		isSelected,
		viewport.scrollTop,
		viewport.scrollLeft,
		hoverIndex,
		dragStart,
		dragCurrent,
	]);

	// Observa tamaño del contenedor y scroll
	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const onScroll = () => {
			setViewport((v) => ({ ...v, scrollTop: container.scrollTop, scrollLeft: container.scrollLeft }));
		};
		container.addEventListener('scroll', onScroll, { passive: true });

		const ro = new ResizeObserver((entries) => {
			for (const entry of entries) {
				const cr = entry.contentRect;
				setViewport((v) => ({ ...v, width: Math.floor(cr.width), height: Math.floor(cr.height) }));
			}
		});
		ro.observe(container);

		// init values
		setViewport({
			width: container.clientWidth,
			height: container.clientHeight,
			scrollTop: container.scrollTop,
			scrollLeft: container.scrollLeft,
		});

		return () => {
			ro.disconnect();
			container.removeEventListener('scroll', onScroll);
		};
	}, []);

	// Handlers de puntero para selección por arrastre y hover
	const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
		if (e.button !== 0) return; // solo botón primario
		const pos = getContentCoords(e);
		setDragStart(pos);
		setDragCurrent(pos);
		(e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
	};

	const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
		const pos = getContentCoords(e);
		if (dragStart) {
			setDragCurrent(pos);
			return;
		}
		const idx = indexFromCoords(pos.x, pos.y);
		setHoverIndex((prev) => (prev !== idx ? idx : prev));
	};

	const handlePointerLeave = () => {
		setHoverIndex((prev) => (prev !== null ? null : prev));
	};

	const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
		const pos = getContentCoords(e);
		const hadDrag = dragStart && dragCurrent;
		const dragDx = hadDrag ? Math.abs((dragCurrent as any).x - (dragStart as any).x) : 0;
		const dragDy = hadDrag ? Math.abs((dragCurrent as any).y - (dragStart as any).y) : 0;

		// Reset drag state
		setDragCurrent(null);
		setDragStart(null);

		// Selección por rectángulo si hay arrastre significativo
		if (hadDrag && (dragDx > 4 || dragDy > 4)) {
			const ids = idsFromMarquee(dragStart as any as { x: number; y: number }, pos);
			if (ids.length > 0) {
				if (e.ctrlKey || e.metaKey) {
					const prev = new Set(useSelectionStore.getState().selectedIds);
					for (const id of ids) {
						if (prev.has(id)) prev.delete(id);
						else prev.add(id);
					}
					setSelectedIds(Array.from(prev));
				} else {
					setSelectedIds(ids);
				}
				setActiveId(ids.at(-1) ?? null);
			}
			return;
		}

		// Click simple o doble click
		const idx = indexFromCoords(pos.x, pos.y);
		if (idx === -1) return;
		const item = items[idx];
		if (!item) return;
		const modifiers: ClickModifiers = { ctrlKey: e.ctrlKey, metaKey: e.metaKey, shiftKey: e.shiftKey };
		if (e.detail >= 2) {
			onItemDoubleClick?.(item);
		} else {
			onItemClick?.(item, modifiers);
		}
	};

	return (
		<div
			className="h-full overflow-auto"
			onPointerDown={handlePointerDown}
			onPointerLeave={handlePointerLeave}
			onPointerMove={handlePointerMove}
			onPointerUp={handlePointerUp}
			ref={containerRef}
		>
			<div style={{ height: totalHeight, position: 'relative' }}>
				<canvas ref={canvasRef} style={{ position: 'sticky', top: 0, left: 0, width: '100%', height: '100%' }} />
			</div>
		</div>
	);
}
