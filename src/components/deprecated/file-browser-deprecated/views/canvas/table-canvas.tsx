import { useEffect, useMemo, useRef, useState } from 'react';
import { useAddTags, useAddToCollection, useToggleFavorite } from '@/lib/api/files';
import { ThumbnailQuality } from '@/lib/config/thumbnail.config';
import { clientLogger } from '@/lib/logger/client-logger';
import { useSelectionStore } from '@/store/selection.store';
import { useFileViewerStore } from '@/store/ui/file-viewer.slice';
import type { MediaItem } from '../../components/media-thumbnail';
import { ExtendedContextMenu, type ExtendedContextMenuAction } from '../../context-menu/extended-context-menu';
import type { ClickModifiers } from '../../types/file-browser.types';
import { generateThumbnailUrl, getFallbackIcon, useImageCache } from './canvas-common';
import { CanvasRenderConfig } from './canvas-config';

export interface TableCanvasProps {
	items: MediaItem[];
	rowHeight?: number;
	overscanRows?: number;
	scrollContainer?: HTMLElement | null;
	onItemClick?: (item: MediaItem, modifiers?: ClickModifiers) => void;
	onItemDoubleClick?: (item: MediaItem) => void;
}

const DEFAULTS = {
	rowHeight: CanvasRenderConfig.table.rowHeight,
	overscanRows: CanvasRenderConfig.table.overscanRows,
};

export function TableCanvas({
	items,
	rowHeight = DEFAULTS.rowHeight,
	overscanRows = DEFAULTS.overscanRows,
	scrollContainer = null,
	onItemClick,
	onItemDoubleClick,
}: TableCanvasProps) {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const [viewport, setViewport] = useState({ width: 0, height: 0, scrollTop: 0, scrollLeft: 0, offsetTop: 0 });
	const headerHeight = 28;
	const { load, get, set } = useImageCache();
	const { openViewer } = useFileViewerStore();
	const toggleFavorite = useToggleFavorite();
	const addToCollection = useAddToCollection();
	const addTags = useAddTags();
	const isSelected = useSelectionStore((s) => s.isSelected);
	const selectedIds = useSelectionStore((s) => s.selectedIds);
	const setSelectedIds = useSelectionStore((s) => s.setSelectedIds);
	const setActiveId = useSelectionStore((s) => s.setActiveId);

	const [contextMenu, setContextMenu] = useState<{
		isOpen: boolean;
		position: { x: number; y: number } | null;
		selectedItems: MediaItem[];
	}>({ isOpen: false, position: null, selectedItems: [] });

	const totalHeight = headerHeight + items.length * rowHeight;

	const localScrollTop = Math.max(0, viewport.scrollTop - (scrollContainer ? viewport.offsetTop : 0));
	const firstVisibleRow = Math.max(
		0,
		Math.floor(Math.max(0, localScrollTop - headerHeight) / rowHeight) - overscanRows
	);
	const lastVisibleRow = Math.min(
		items.length - 1,
		Math.floor(Math.max(0, localScrollTop + viewport.height - headerHeight) / rowHeight) + overscanRows
	);
	const visibleRange = useMemo(() => ({ firstVisibleRow, lastVisibleRow }), [firstVisibleRow, lastVisibleRow]);

	// Prefetch thumbs
	useEffect(() => {
		const startIndex = visibleRange.firstVisibleRow;
		const endIndex = visibleRange.lastVisibleRow;
		(async () => {
			for (let i = startIndex; i <= endIndex; i++) {
				const it = items[i];
				if (!it) continue;
				const key = it.id;
				if (get(key)) continue;
				try {
					const src = await generateThumbnailUrl(it, ThumbnailQuality.LOW);
					// Si es un emoji/fallback, lo guardamos directamente como fallbackIcon
					if (src && /^[\u{1F000}-\u{1FFFF}]$/u.test(src)) {
						set(key, { status: 'ready', fallbackIcon: src });
					} else if (src && src.trim() !== '') {
						// Solo intentar cargar si tenemos una URL válida
						load(key, src);
					} else {
						// Fallback por defecto
						const fallback = getFallbackIcon(it.entityType);
						set(key, { status: 'ready', fallbackIcon: fallback });
					}
				} catch (error) {
					clientLogger.warn(`Failed to generate thumbnail for ${it.name}:`, error);
					const fallback = getFallbackIcon(it.entityType);
					set(key, { status: 'ready', fallbackIcon: fallback });
				}
			}
		})();
	}, [visibleRange, items, load, get, set]);

	useEffect(() => {
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

		// Header
		drawHeader(ctx, w, headerHeight);

		// Columns
		const cols = calcColumns(w);
		const startIndex = visibleRange.firstVisibleRow;
		const endIndex = visibleRange.lastVisibleRow;
		const baseY = headerHeight + startIndex * rowHeight - localScrollTop;

		for (let i = startIndex; i <= endIndex; i++) {
			const it = items[i];
			if (!it) continue;
			const y = baseY + (i - startIndex) * rowHeight;

			// Row background
			ctx.fillStyle = i % 2 === 0 ? '#0b1020' : '#0d1224';
			ctx.fillRect(0, y, w, rowHeight);

			// Selection outline
			if (isSelected(it.id)) {
				ctx.strokeStyle = '#3b82f6';
				ctx.lineWidth = CanvasRenderConfig.table.borderWidth;
				ctx.strokeRect(0.5, y + 0.5, w - 1, rowHeight - 1);
			}

			// Name column with icon/thumbnail square
			const entry = get(it.id);
			const th = CanvasRenderConfig.table.thumbSize;
			const ty = Math.floor(y + (rowHeight - th) / 2);
			const tx = cols.name.x + 8;
			ctx.save();
			ctx.beginPath();
			ctx.rect(tx, ty, th, th);
			ctx.clip();
			ctx.imageSmoothingEnabled = CanvasRenderConfig.visuals.enableSmoothing;
			(ctx as any).imageSmoothingQuality = 'high';

			if (entry?.status === 'ready' && entry.image) {
				const img = entry.image as any;
				const iw = (img.naturalWidth ?? img.width) as number;
				const ih = (img.naturalHeight ?? img.height) as number;
				if (iw > 0 && ih > 0) {
					const scale = Math.max(th / iw, th / ih);
					const dw = Math.ceil(iw * scale);
					const dh = Math.ceil(ih * scale);
					const dx = tx + Math.floor((th - dw) / 2);
					const dy = ty + Math.floor((th - dh) / 2);
					try {
						ctx.drawImage(img, dx, dy, dw, dh);
					} catch (error) {
						clientLogger.warn('Error drawing image:', error);
						// Fallback a icono si falla el drawImage
						ctx.fillStyle = '#374151';
						ctx.fillRect(tx, ty, th, th);
						const fallbackIcon = getFallbackIcon(it.entityType);
						ctx.fillStyle = '#e5e7eb';
						ctx.font = `${Math.floor(th * 0.6)}px system-ui`;
						ctx.textAlign = 'center';
						ctx.textBaseline = 'middle';
						ctx.fillText(fallbackIcon, tx + th / 2, ty + th / 2);
					}
				}
			} else if (entry?.status === 'ready' && entry.fallbackIcon) {
				ctx.fillStyle = '#374151';
				ctx.fillRect(tx, ty, th, th);
				ctx.fillStyle = '#e5e7eb';
				ctx.font = `${Math.floor(th * 0.6)}px system-ui`;
				ctx.textAlign = 'center';
				ctx.textBaseline = 'middle';
				ctx.fillText(entry.fallbackIcon, tx + th / 2, ty + th / 2);
			} else if (entry?.status === 'loading') {
				// Loading state
				ctx.fillStyle = '#1f2937';
				ctx.fillRect(tx, ty, th, th);
				ctx.fillStyle = '#6b7280';
				ctx.font = `${Math.floor(th * 0.5)}px system-ui`;
				ctx.textAlign = 'center';
				ctx.textBaseline = 'middle';
				ctx.fillText('⟳', tx + th / 2, ty + th / 2);
			} else {
				// Default/error state
				ctx.fillStyle = '#1f2937';
				ctx.fillRect(tx, ty, th, th);
				const fallbackIcon = getFallbackIcon(it.entityType);
				ctx.fillStyle = '#6b7280';
				ctx.font = `${Math.floor(th * 0.6)}px system-ui`;
				ctx.textAlign = 'center';
				ctx.textBaseline = 'middle';
				ctx.fillText(fallbackIcon, tx + th / 2, ty + th / 2);
			}

			// Restaurar estado del texto
			ctx.textAlign = 'left';
			ctx.textBaseline = 'alphabetic';
			ctx.restore();

			// Name text
			ctx.fillStyle = '#e5e7eb';
			ctx.font = '12px system-ui, Segoe UI';
			const nameX = tx + th + 8;
			const nameMax = cols.name.w - (nameX - cols.name.x) - 8;
			drawClampedText(ctx, it.name || '—', nameX, Math.floor(y + rowHeight / 2) + 4, nameMax);

			// Type
			ctx.fillStyle = '#cbd5e1';
			ctx.font = '12px system-ui';
			drawClampedText(ctx, it.entityType || '', cols.type.x + 8, Math.floor(y + rowHeight / 2) + 4, cols.type.w - 16);

			// Size
			ctx.textAlign = 'right';
			drawClampedText(
				ctx,
				formatSize(it.size),
				cols.size.x + cols.size.w - 8,
				Math.floor(y + rowHeight / 2) + 4,
				cols.size.w - 16
			);
			ctx.textAlign = 'left';
		}
	}, [items, visibleRange, rowHeight, scrollContainer, localScrollTop, isSelected, get]);

	useEffect(() => {
		const internal = containerRef.current;
		if (!internal) return;
		const host = (scrollContainer ?? internal) as HTMLElement;
		const computeOffsetTop = () => {
			const hostRect = host.getBoundingClientRect();
			const selfRect = internal.getBoundingClientRect();
			return host.scrollTop + (selfRect.top - hostRect.top);
		};
		let rafId: number | null = null;
		const onScroll = () => {
			if (rafId != null) return;
			rafId = requestAnimationFrame(() => {
				rafId = null;
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
			if (rafId != null) return;
			rafId = requestAnimationFrame(() => {
				rafId = null;
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
			if (rafId != null) cancelAnimationFrame(rafId);
		};
	}, [scrollContainer]);

	const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
		if (!containerRef.current) return;
		const pos = getContentCoords(e, containerRef.current, viewport, scrollContainer);
		const idx = indexFromCoords(pos.x, pos.y, items.length, rowHeight, 28);
		if (idx === -1) return;
		const item = items[idx];
		const modifiers: ClickModifiers = { ctrlKey: e.ctrlKey, metaKey: e.metaKey, shiftKey: e.shiftKey };
		if (e.detail >= 2) {
			const imageItems = items
				.filter((it) => it.entityType === 'image')
				.map((it) => ({
					id: it.id,
					name: it.name,
					type: it.entityType,
					path: it.path || '',
					size: it.size || 0,
					width: (it as any).width ?? null,
					height: (it as any).height ?? null,
					thumbnail: null,
					metadata: null,
				}));
			const initialIndex = imageItems.findIndex((x) => x.id === item.id);
			if (initialIndex >= 0) openViewer(imageItems as any, initialIndex);
			onItemDoubleClick?.(item);
		} else onItemClick?.(item, modifiers);
	};

	const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
		if (!containerRef.current) return;
		const pos = getContentCoords(e, containerRef.current, viewport, scrollContainer);
		const idx = indexFromCoords(pos.x, pos.y, items.length, rowHeight, headerHeight);
		if (idx !== -1 && items[idx]) {
			const clickedItem = items[idx];
			if (!selectedIds.includes(clickedItem.id)) {
				setSelectedIds([clickedItem.id]);
				setActiveId(clickedItem.id);
			}
			const currentSelectedItems = items.filter((it) =>
				(selectedIds.includes(clickedItem.id) ? selectedIds : [clickedItem.id]).includes(it.id)
			);
			setContextMenu({ isOpen: true, position: { x: e.clientX, y: e.clientY }, selectedItems: currentSelectedItems });
		} else if (contextMenu.isOpen) {
			setContextMenu({ isOpen: false, position: null, selectedItems: [] });
		}
	};

	const closeContextMenu = () => setContextMenu({ isOpen: false, position: null, selectedItems: [] });
	const handleContextMenuAction = (
		action: ExtendedContextMenuAction,
		payload: { selected: MediaItem[]; targetId?: string }
	) => {
		const selected = payload.selected ?? [];
		if (selected.length === 0) return;
		switch (action) {
			case 'open': {
				const imageItems = items.map((it) => ({
					id: it.id,
					name: it.name,
					type: it.entityType,
					path: it.path || '',
					size: it.size || 0,
					width: (it as any).width ?? null,
					height: (it as any).height ?? null,
					thumbnail: null,
					metadata: null,
				}));
				const first = selected[0];
				const initialIndex = imageItems.findIndex((x) => x.id === first.id);
				if (initialIndex >= 0) openViewer(imageItems as any, initialIndex);
				break;
			}
			case 'add-to-favorites': {
				(async () => {
					for (const it of selected) {
						try {
							await toggleFavorite.mutateAsync(it.id);
						} catch {}
					}
				})();
				break;
			}
			case 'add-to-collection': {
				const targetId = payload.targetId;
				if (!targetId) return;
				(async () => {
					for (const it of selected) {
						try {
							await addToCollection.mutateAsync({ fileId: it.id, collectionId: targetId });
						} catch {}
					}
				})();
				break;
			}
			case 'add-to-tag': {
				const targetId = payload.targetId;
				if (!targetId) return;
				(async () => {
					for (const it of selected) {
						try {
							await addTags.mutateAsync({ fileId: it.id, tags: [targetId] });
						} catch {}
					}
				})();
				break;
			}
			default:
				break;
		}
	};

	return (
		<>
			<div
				className={scrollContainer ? 'relative w-full' : 'relative h-full w-full overflow-auto'}
				data-testid="table-canvas"
				onContextMenu={handleContextMenu}
				onPointerUp={handlePointerUp}
				ref={containerRef}
				role="application"
			>
				<div style={{ height: totalHeight }} />
				<canvas className="pointer-events-none absolute inset-0" ref={canvasRef} />
			</div>
			<ExtendedContextMenu
				isOpen={contextMenu.isOpen}
				onAction={handleContextMenuAction}
				onClose={closeContextMenu}
				position={contextMenu.position}
				selectedItems={contextMenu.selectedItems}
			/>
		</>
	);
}

function calcColumns(width: number) {
	const nameW = Math.max(160, Math.floor(width * 0.6));
	const typeW = Math.max(100, Math.floor(width * 0.2));
	const sizeW = Math.max(100, width - nameW - typeW);
	return {
		name: { x: 0, w: nameW },
		type: { x: nameW, w: typeW },
		size: { x: nameW + typeW, w: sizeW },
	};
}

function drawHeader(ctx: CanvasRenderingContext2D, w: number, h: number) {
	ctx.fillStyle = '#0a0f1e';
	ctx.fillRect(0, 0, w, h);
	ctx.strokeStyle = '#111827';
	ctx.beginPath();
	ctx.moveTo(0, h - 0.5);
	ctx.lineTo(w, h - 0.5);
	ctx.stroke();
	const cols = calcColumns(w);
	ctx.fillStyle = '#94a3b8';
	ctx.font = '12px system-ui, Segoe UI';
	ctx.fillText('Nombre', cols.name.x + 8, h - 8);
	ctx.fillText('Tipo', cols.type.x + 8, h - 8);
	ctx.textAlign = 'right';
	ctx.fillText('Tamaño', cols.size.x + cols.size.w - 8, h - 8);
	ctx.textAlign = 'left';
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

function indexFromCoords(x: number, y: number, total: number, rowHeight: number, headerHeight: number) {
	if (y < headerHeight) return -1;
	const row = Math.floor((y - headerHeight) / rowHeight);
	if (row < 0 || row >= total) return -1;
	return row;
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
