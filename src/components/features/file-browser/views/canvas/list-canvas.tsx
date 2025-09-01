import { useEffect, useMemo, useRef, useState } from 'react';
import { useAddTags, useAddToCollection, useToggleFavorite } from '@/lib/api/files';
import { ThumbnailQuality } from '@/lib/config/thumbnail.config';
import { useFileViewerStore } from '@/store/ui/file-viewer.slice';
import { useSelectionStore } from '@/store/ui/selection.slice';
import type { MediaItem } from '../../components/media-thumbnail';
import { ExtendedContextMenu, type ExtendedContextMenuAction } from '../../context-menu/extended-context-menu';
import type { ClickModifiers } from '../../types/file-browser.types';
import { generateThumbnailUrl, getFallbackIcon, useImageCache } from './canvas-common';
import { CanvasRenderConfig } from './canvas-config';

export interface ListCanvasProps {
	items: MediaItem[];
	rowHeight?: number;
	gap?: number;
	overscanRows?: number;
	scrollContainer?: HTMLElement | null;
	onItemClick?: (item: MediaItem, modifiers?: ClickModifiers) => void;
	onItemDoubleClick?: (item: MediaItem) => void;
}

const DEFAULTS = {
	rowHeight: CanvasRenderConfig.list.rowHeight,
	gap: 0,
	overscanRows: CanvasRenderConfig.list.overscanRows,
};

export function ListCanvas({
	items,
	rowHeight = DEFAULTS.rowHeight,
	gap = DEFAULTS.gap,
	overscanRows = DEFAULTS.overscanRows,
	scrollContainer = null,
	onItemClick,
	onItemDoubleClick,
}: ListCanvasProps) {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const [viewport, setViewport] = useState({ width: 0, height: 0, scrollTop: 0, scrollLeft: 0, offsetTop: 0 });
	const { load, get, set } = useImageCache();
	const { openViewer } = useFileViewerStore();
	const toggleFavorite = useToggleFavorite();
	const addToCollection = useAddToCollection();
	const addTags = useAddTags();

	const isSelected = useSelectionStore((s) => s.isSelected);
	const selectedIds = useSelectionStore((s) => s.selectedIds);
	const setSelectedIds = useSelectionStore((s) => s.setSelectedIds);
	const setActiveId = useSelectionStore((s) => s.setActiveId);

	// Estado del menú contextual
	const [contextMenu, setContextMenu] = useState<{
		isOpen: boolean;
		position: { x: number; y: number } | null;
		selectedItems: MediaItem[];
	}>({ isOpen: false, position: null, selectedItems: [] });

	const totalHeight = items.length * rowHeight + gap;

	const localScrollTop = Math.max(0, viewport.scrollTop - (scrollContainer ? viewport.offsetTop : 0));
	const firstVisibleRow = Math.max(0, Math.floor(localScrollTop / rowHeight) - overscanRows);
	const lastVisibleRow = Math.min(
		items.length - 1,
		Math.floor((localScrollTop + viewport.height) / rowHeight) + overscanRows
	);

	const visibleRange = useMemo(() => ({ firstVisibleRow, lastVisibleRow }), [firstVisibleRow, lastVisibleRow]);

	// Prefetch thumbs for visible rows
	useEffect(() => {
		const startIndex = visibleRange.firstVisibleRow;
		const endIndex = visibleRange.lastVisibleRow;
		const prefetch = async () => {
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
					console.warn(`Failed to generate thumbnail for ${it.name}:`, error);
					const fallback = getFallbackIcon(it.entityType);
					set(key, { status: 'ready', fallbackIcon: fallback });
				}
			}
		};
		prefetch();
	}, [visibleRange, items, load, get, set]);

	// Render
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

		const startIndex = visibleRange.firstVisibleRow;
		const endIndex = visibleRange.lastVisibleRow;

		// Drawing constants
		const padX = 8;
		const thumb = CanvasRenderConfig.list.thumbSize;
		const textLeft = padX + thumb + 10;
		const baseY = startIndex * rowHeight - localScrollTop; // Y offset so first visible row starts at 0

		for (let i = startIndex; i <= endIndex; i++) {
			const it = items[i];
			if (!it) continue;
			const y = baseY + (i - startIndex) * rowHeight;

			// Row bg
			ctx.fillStyle = i % 2 === 0 ? '#0b1020' : '#0d1224';
			ctx.fillRect(0, y, w, rowHeight - 1);

			// Selection highlight
			if (isSelected(it.id)) {
				ctx.fillStyle = 'rgba(59,130,246,0.18)';
				ctx.fillRect(0, y, w, rowHeight - 1);
				ctx.strokeStyle = '#3b82f6';
				ctx.lineWidth = CanvasRenderConfig.list.borderWidth;
				ctx.strokeRect(0.5, y + 0.5, w - 1, rowHeight - 2);
			}

			// Thumbnail
			const entry = get(it.id);
			const thumbY = Math.floor(y + (rowHeight - thumb) / 2);
			const thumbX = padX;
			ctx.save();
			ctx.beginPath();
			ctx.rect(thumbX, thumbY, thumb, thumb);
			ctx.clip();
			ctx.imageSmoothingEnabled = CanvasRenderConfig.visuals.enableSmoothing;
			(ctx as any).imageSmoothingQuality = 'high';

			if (entry?.status === 'ready' && entry.image) {
				const img = entry.image as any;
				const iw = (img.naturalWidth ?? img.width) as number;
				const ih = (img.naturalHeight ?? img.height) as number;
				if (iw > 0 && ih > 0) {
					// Usar cover fit para mejor apariencia
					const scale = Math.max(thumb / iw, thumb / ih);
					const dw = Math.ceil(iw * scale);
					const dh = Math.ceil(ih * scale);
					const dx = thumbX + Math.floor((thumb - dw) / 2);
					const dy = thumbY + Math.floor((thumb - dh) / 2);
					try {
						ctx.drawImage(img, dx, dy, dw, dh);
					} catch (error) {
						console.warn('Error drawing image:', error);
						// Fallback a icono si falla el drawImage
						ctx.fillStyle = '#374151';
						ctx.fillRect(thumbX, thumbY, thumb, thumb);
						const fallbackIcon = getFallbackIcon(it.entityType);
						ctx.fillStyle = '#e5e7eb';
						ctx.font = `${Math.floor(thumb * 0.6)}px system-ui, Segoe UI`;
						ctx.textAlign = 'center';
						ctx.textBaseline = 'middle';
						ctx.fillText(fallbackIcon, thumbX + thumb / 2, thumbY + thumb / 2);
					}
				}
			} else if (entry?.status === 'ready' && entry.fallbackIcon) {
				ctx.fillStyle = '#374151';
				ctx.fillRect(thumbX, thumbY, thumb, thumb);
				ctx.fillStyle = '#e5e7eb';
				ctx.font = `${Math.floor(thumb * 0.6)}px system-ui, Segoe UI`;
				ctx.textAlign = 'center';
				ctx.textBaseline = 'middle';
				ctx.fillText(entry.fallbackIcon, thumbX + thumb / 2, thumbY + thumb / 2);
			} else if (entry?.status === 'loading') {
				// Loading state
				ctx.fillStyle = '#1f2937';
				ctx.fillRect(thumbX, thumbY, thumb, thumb);
				ctx.fillStyle = '#6b7280';
				ctx.font = `${Math.floor(thumb * 0.4)}px system-ui`;
				ctx.textAlign = 'center';
				ctx.textBaseline = 'middle';
				ctx.fillText('⟳', thumbX + thumb / 2, thumbY + thumb / 2);
			} else {
				// Default/error state
				ctx.fillStyle = '#1f2937';
				ctx.fillRect(thumbX, thumbY, thumb, thumb);
				const fallbackIcon = getFallbackIcon(it.entityType);
				ctx.fillStyle = '#6b7280';
				ctx.font = `${Math.floor(thumb * 0.6)}px system-ui`;
				ctx.textAlign = 'center';
				ctx.textBaseline = 'middle';
				ctx.fillText(fallbackIcon, thumbX + thumb / 2, thumbY + thumb / 2);
			}

			// Restaurar estado del texto
			ctx.textAlign = 'left';
			ctx.textBaseline = 'alphabetic';
			ctx.restore();

			// Texts
			ctx.fillStyle = '#e5e7eb';
			ctx.font = '13px system-ui, Segoe UI, Roboto';
			const name = it.name || '—';
			const maxTextWidth = Math.max(40, w - textLeft - 12);
			const nameY = Math.floor(y + rowHeight / 2) - 2;
			drawClampedText(ctx, name, textLeft, nameY, maxTextWidth);

			// Secondary line (type/size)
			ctx.fillStyle = '#9ca3af';
			ctx.font = '12px system-ui, Segoe UI, Roboto';
			const meta = [it.entityType, formatSize(it.size)].filter(Boolean).join(' · ');
			drawClampedText(ctx, meta, textLeft, nameY + 14, maxTextWidth);
		}
	}, [items, visibleRange, rowHeight, get, isSelected, scrollContainer, localScrollTop]);

	// Observe container size/scroll
	useEffect(() => {
		const internal = containerRef.current;
		if (!internal) return;
		let host: HTMLElement | null = null;
		if (scrollContainer) host = scrollContainer;
		else host = internal;

		const computeOffsetTop = () => {
			if (!host) return 0;
			const hostRect = host.getBoundingClientRect();
			const selfRect = internal.getBoundingClientRect();
			return host.scrollTop + (selfRect.top - hostRect.top);
		};

		let rafId: number | null = null;
		const onScroll = () => {
			if (!host) return;
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
			if (!host) return;
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

		// init
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

	// Click handling (single/double)
	const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
		if (!containerRef.current) return;
		const pos = getContentCoords(e, containerRef.current, viewport, scrollContainer);
		const idx = indexFromCoords(pos.x, pos.y, rowHeight, items.length);
		if (idx === -1) return;
		const item = items[idx];
		const modifiers: ClickModifiers = { ctrlKey: e.ctrlKey, metaKey: e.metaKey, shiftKey: e.shiftKey };
		if (e.detail >= 2) {
			// Abrir visor con los items actuales (solo imágenes)
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

	// Menú contextual (right-click)
	const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
		if (!containerRef.current) return;
		const pos = getContentCoords(e, containerRef.current, viewport, scrollContainer);
		const idx = indexFromCoords(pos.x, pos.y, rowHeight, items.length);
		if (idx !== -1 && items[idx]) {
			const clickedItem = items[idx];
			if (!selectedIds.includes(clickedItem.id)) {
				setSelectedIds([clickedItem.id]);
				setActiveId(clickedItem.id);
			}
			const currentSelectedItems = items.filter((it) =>
				(selectedIds.includes(clickedItem.id) ? selectedIds : [clickedItem.id]).includes(it.id)
			);
			setContextMenu({
				isOpen: true,
				position: { x: e.clientX, y: e.clientY },
				selectedItems: currentSelectedItems,
			});
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
				data-testid="list-canvas"
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

function indexFromCoords(x: number, y: number, rowHeight: number, totalItems: number) {
	const row = Math.floor(y / rowHeight);
	if (row < 0 || row >= totalItems) return -1;
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
