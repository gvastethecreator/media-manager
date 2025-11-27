import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAddTags, useAddToCollection, useToggleFavorite } from '@/lib/api/files';
import { ThumbnailQuality } from '@/lib/config/thumbnail.config';
import { useFileViewerStore } from '@/store/ui/file-viewer.slice';
import { useSelectionStore } from '@/store/selection.store';
import type { MediaItem } from '../../components/media-thumbnail';
import { ExtendedContextMenu, type ExtendedContextMenuAction } from '../../context-menu/extended-context-menu';
import type { ClickModifiers } from '../../types/file-browser.types';
import { AnimationConfig, CanvasAnimationManager } from './canvas-animations';
import { generateThumbnailUrl, getFallbackIcon, useImageCache } from './canvas-common';
import { CanvasRenderConfig } from './canvas-config';

// Props y defaults
export interface AnimatedFileCanvasProps {
	items: MediaItem[];
	itemSize?: number;
	gap?: number;
	overscanRows?: number;
	scrollContainer?: HTMLElement | null;
	onItemClick?: (item: MediaItem, modifiers?: ClickModifiers) => void;
	onItemDoubleClick?: (item: MediaItem) => void;
}

const DEFAULTS = {
	itemSize: CanvasRenderConfig.grid.itemSize,
	gap: CanvasRenderConfig.grid.gap,
	overscanRows: CanvasRenderConfig.grid.overscanRows,
};

export function AnimatedFileCanvas({
	items,
	itemSize = DEFAULTS.itemSize,
	gap = DEFAULTS.gap,
	overscanRows = DEFAULTS.overscanRows,
	scrollContainer = null,
	onItemClick,
	onItemDoubleClick,
}: AnimatedFileCanvasProps) {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const animationManager = useRef(new CanvasAnimationManager());
	const animationFrameRef = useRef<number | null>(null);

	const [viewport, setViewport] = useState({ width: 0, height: 0, scrollTop: 0, scrollLeft: 0, offsetTop: 0 });
	const { load, get, set } = useImageCache();
	const isSelected = useSelectionStore((s) => s.isSelected);
	const selectedIds = useSelectionStore((s) => s.selectedIds);
	const setSelectedIds = useSelectionStore((s) => s.setSelectedIds);
	const setActiveId = useSelectionStore((s) => s.setActiveId);
	const activeId = useSelectionStore((s) => s.activeId);
	const { openViewer } = useFileViewerStore();

	// Mutations API
	const toggleFavorite = useToggleFavorite();
	const addToCollection = useAddToCollection();
	const addTags = useAddTags();

	// Estados de interacción
	const [hoverIndex, setHoverIndex] = useState<number | null>(null);
	const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
	const [dragCurrent, setDragCurrent] = useState<{ x: number; y: number } | null>(null);

	// Tooltip con animación mejorada
	const [hoverTooltip, setHoverTooltip] = useState<{
		visible: boolean;
		text: string;
		x: number;
		y: number;
		itemIndex: number | null;
	}>(() => ({ visible: false, text: '', x: 0, y: 0, itemIndex: null }));

	// Estado del menú contextual
	const [contextMenu, setContextMenu] = useState<{
		isOpen: boolean;
		position: { x: number; y: number } | null;
		selectedItems: MediaItem[];
	}>({
		isOpen: false,
		position: null,
		selectedItems: [],
	});

	// Layout calculations
	const columns = Math.max(1, Math.floor(Math.max(0, viewport.width - gap) / (itemSize + gap)));
	const cellSize =
		columns > 0 ? Math.max(20, Math.floor(Math.max(0, viewport.width - (columns + 1) * gap) / columns)) : itemSize;
	const rowHeight = cellSize + gap;
	const totalRows = Math.ceil(items.length / columns);
	const totalHeight = totalRows * rowHeight + gap;

	// Visible rows con overscan
	const localScrollTop = Math.max(0, viewport.scrollTop - (scrollContainer ? viewport.offsetTop : 0));
	const firstVisibleRow = Math.max(0, Math.floor(localScrollTop / rowHeight) - overscanRows);
	const lastVisibleRow = Math.min(
		totalRows - 1,
		Math.floor((localScrollTop + viewport.height) / rowHeight) + overscanRows
	);

	const visibleRange = useMemo(() => ({ firstVisibleRow, lastVisibleRow }), [firstVisibleRow, lastVisibleRow]);

	// Utilidades de coordenadas
	const getContentCoords = (e: { clientX: number; clientY: number }) => {
		const container = containerRef.current;
		if (!container) return { x: 0, y: 0 };
		const rect = container.getBoundingClientRect();
		const x = e.clientX - rect.left + viewport.scrollLeft;
		let y = e.clientY - rect.top + viewport.scrollTop;
		if (scrollContainer) y -= viewport.offsetTop;
		return { x, y };
	};

	const indexFromCoords = (x: number, y: number) => {
		const col = Math.floor((x - gap) / (cellSize + gap));
		const row = Math.floor((y - gap) / (cellSize + gap));
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
	};

	// Función de render con animaciones mejorada
	const renderCanvas = useCallback(() => {
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
		const endIndex = Math.min(items.length - 1, (visibleRange.lastVisibleRow + 1) * columns - 1);

		// Renderizar items con animaciones
		for (let i = startIndex; i <= endIndex; i++) {
			const item = items[i];
			if (!item) continue;

			const col = i % columns;
			const row = Math.floor(i / columns);
			const x = col * (cellSize + gap) + gap;
			const y = (row - visibleRange.firstVisibleRow) * (cellSize + gap) + gap;

			// Aplicar animaciones de hover
			const hoverAnim = animationManager.current.getHoverAnimation(i);
			let scale = 1;
			let offsetY = 0;
			let borderAlpha = 0;
			let shadowBlur = 0;

			if (hoverAnim) {
				scale = hoverAnim.scale.currentValue;
				offsetY = hoverAnim.offsetY.currentValue;
				borderAlpha = hoverAnim.borderAlpha.currentValue;
				shadowBlur = hoverAnim.shadowBlur.currentValue;
			}

			// Calcular posición final con transformaciones
			const centerX = x + cellSize / 2;
			const centerY = y + cellSize / 2;
			const finalX = centerX - (cellSize * scale) / 2;
			const finalY = centerY - (cellSize * scale) / 2 + offsetY;
			const finalSize = cellSize * scale;

			// Aplicar sombra si hay hover
			if (shadowBlur > 0) {
				ctx.save();
				ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
				ctx.shadowBlur = shadowBlur;
				ctx.shadowOffsetY = 2;
				ctx.fillStyle = '#111827';
				ctx.fillRect(finalX, finalY, finalSize, finalSize);
				ctx.restore();
			} else {
				// Background normal
				ctx.fillStyle = '#111827';
				ctx.fillRect(finalX, finalY, finalSize, finalSize);
			}

			// Borde de selección
			if (isSelected(item.id)) {
				ctx.strokeStyle = '#3b82f6';
				ctx.lineWidth = CanvasRenderConfig.grid.borderWidth;
				ctx.strokeRect(finalX + 1, finalY + 1, finalSize - 2, finalSize - 2);
			}

			// Borde de hover animado
			if (borderAlpha > 0) {
				ctx.save();
				ctx.strokeStyle = `rgba(245, 158, 11, ${borderAlpha})`;
				ctx.lineWidth = 2;
				ctx.setLineDash([4, 3]);
				ctx.strokeRect(finalX + 2, finalY + 2, finalSize - 4, finalSize - 4);
				ctx.setLineDash([]);
				ctx.restore();
			}

			// Contenido de la imagen
			const entry = get(item.id);
			const pad = 2;

			ctx.save();
			ctx.beginPath();
			ctx.rect(finalX + pad, finalY + pad, finalSize - pad * 2, finalSize - pad * 2);
			ctx.clip();

			ctx.imageSmoothingEnabled = CanvasRenderConfig.visuals.enableSmoothing;
			(ctx as any).imageSmoothingQuality = 'high';

			if (entry?.status === 'ready' && entry.image) {
				const img = entry.image as any;
				const iw = (img.naturalWidth ?? img.width) as number;
				const ih = (img.naturalHeight ?? img.height) as number;

				if (iw > 0 && ih > 0) {
					// Fade-in animation
					const now = performance.now();
					const t0 = entry.readyAt ?? now;
					const dt = Math.max(0, now - t0);
					const alpha = Math.min(1, dt / 220);
					const prevAlpha = ctx.globalAlpha;
					ctx.globalAlpha = alpha;

					const imageScale = Math.max((finalSize - pad * 2) / iw, (finalSize - pad * 2) / ih);
					const dw = Math.ceil(iw * imageScale);
					const dh = Math.ceil(ih * imageScale);
					const dx = finalX + pad + Math.floor((finalSize - pad * 2 - dw) / 2);
					const dy = finalY + pad + Math.floor((finalSize - pad * 2 - dh) / 2);

					ctx.drawImage(img, dx, dy, dw, dh);
					ctx.globalAlpha = prevAlpha;
				}
			} else if (entry?.status === 'ready' && entry.fallbackIcon) {
				ctx.fillStyle = '#374151';
				ctx.fillRect(finalX + pad, finalY + pad, finalSize - pad * 2, finalSize - pad * 2);
				ctx.fillStyle = '#e5e7eb';
				ctx.font = `${Math.floor(finalSize * 0.45)}px system-ui, -apple-system, Segoe UI, Roboto, Arial`;
				ctx.textAlign = 'center';
				ctx.textBaseline = 'middle';
				ctx.fillText(entry.fallbackIcon, finalX + finalSize / 2, finalY + finalSize / 2);
				ctx.textAlign = 'left';
				ctx.textBaseline = 'alphabetic';
			} else {
				ctx.fillStyle = entry?.status === 'loading' ? '#6b7280' : '#374151';
				ctx.fillRect(finalX + pad, finalY + pad, finalSize - pad * 2, finalSize - pad * 2);
				ctx.fillStyle = '#ffffff';
				ctx.font = '10px monospace';
				ctx.textAlign = 'center';
				const statusText = entry?.status || (item.thumbnailUrl ? 'no-cache' : 'no-url');
				ctx.fillText(statusText, finalX + finalSize / 2, finalY + finalSize / 2);
				ctx.textAlign = 'left';
			}

			ctx.restore();
		}

		// Overlay de selección por arrastre
		if (dragStart && dragCurrent) {
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
	}, [
		items,
		visibleRange,
		columns,
		gap,
		cellSize,
		get,
		isSelected,
		viewport.scrollLeft,
		dragStart,
		dragCurrent,
		scrollContainer,
	]);

	// Loop de animación principal
	const animationLoop = useCallback(() => {
		const currentTime = performance.now();
		const needsRedraw = animationManager.current.update(currentTime);

		if (needsRedraw) {
			renderCanvas();
		}

		animationFrameRef.current = requestAnimationFrame(animationLoop);
	}, [renderCanvas]);

	// Iniciar loop de animación
	useEffect(() => {
		animationFrameRef.current = requestAnimationFrame(animationLoop);

		return () => {
			if (animationFrameRef.current) {
				cancelAnimationFrame(animationFrameRef.current);
			}
		};
	}, [animationLoop]);

	// Prefetch de imágenes (sin cambios)
	useEffect(() => {
		const startIndex = visibleRange.firstVisibleRow * columns;
		const endIndex = Math.min(items.length - 1, (visibleRange.lastVisibleRow + 1) * columns - 1);

		const loadThumbnails = async () => {
			for (let i = startIndex; i <= endIndex; i++) {
				const it = items[i];
				if (!it) continue;
				const key = it.id;

				if (get(key)) continue;

				try {
					const src = await generateThumbnailUrl(it, ThumbnailQuality.MEDIUM);

					if (src && !src.startsWith('🎵') && !src.startsWith('🖼️') && !src.startsWith('🎥')) {
						load(key, src);
					} else {
						set(key, { status: 'ready', fallbackIcon: src });
					}
				} catch (error) {
					const fallback = getFallbackIcon(it.entityType);
					set(key, { status: 'ready', fallbackIcon: fallback });
				}
			}
		};

		loadThumbnails();
	}, [visibleRange, columns, items, load, get, set]);

	// Manejo de hover mejorado
	const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
		const pos = getContentCoords(e);

		if (dragStart) {
			setDragCurrent(pos);
			return;
		}

		const idx = indexFromCoords(pos.x, pos.y);

		// Gestión de hover animation
		if (idx !== hoverIndex) {
			// Terminar animación anterior
			if (hoverIndex !== null) {
				animationManager.current.endHoverAnimation(hoverIndex);
			}

			// Iniciar nueva animación
			if (idx >= 0 && idx < items.length) {
				animationManager.current.startHoverAnimation(idx);

				// Actualizar tooltip
				const col = idx % Math.max(1, columns);
				const row = Math.floor(idx / Math.max(1, columns));
				const x = col * (cellSize + gap) + gap + 8;
				const y = (row - visibleRange.firstVisibleRow) * (cellSize + gap) + gap + 8;
				const name = items[idx]?.name || '';

				setHoverTooltip({
					visible: true,
					text: name,
					x,
					y,
					itemIndex: idx,
				});

				// Iniciar animación de tooltip
				animationManager.current.startTooltipAnimation(AnimationConfig.tooltip.fadeDelay);
			} else {
				setHoverTooltip((prev) => ({ ...prev, visible: false, itemIndex: null }));
				animationManager.current.endTooltipAnimation();
			}

			setHoverIndex(idx >= 0 && idx < items.length ? idx : null);
		}
	};

	const handlePointerLeave = () => {
		if (hoverIndex !== null) {
			animationManager.current.endHoverAnimation(hoverIndex);
			animationManager.current.endTooltipAnimation();
		}
		setHoverIndex(null);
		setHoverTooltip((prev) => ({ ...prev, visible: false, itemIndex: null }));
	};

	// Resto de handlers (sin cambios significativos)
	const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
		if (e.button !== 0) return;
		const pos = getContentCoords(e);
		setDragStart(pos);
		setDragCurrent(pos);
		(e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
	};

	const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
		const pos = getContentCoords(e);
		const hadDrag = dragStart && dragCurrent;
		const dragDx = hadDrag ? Math.abs((dragCurrent as any).x - (dragStart as any).x) : 0;
		const dragDy = hadDrag ? Math.abs((dragCurrent as any).y - (dragStart as any).y) : 0;

		setDragCurrent(null);
		setDragStart(null);

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

		const idx = indexFromCoords(pos.x, pos.y);
		if (idx === -1) return;
		const item = items[idx];
		if (!item) return;
		const modifiers: ClickModifiers = { ctrlKey: e.ctrlKey, metaKey: e.metaKey, shiftKey: e.shiftKey };

		onItemClick?.(item, modifiers);
	};

	const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();

		const pos = getContentCoords(e);
		const idx = indexFromCoords(pos.x, pos.y);

		if (idx !== -1 && items[idx]) {
			const clickedItem = items[idx];

			if (!selectedIds.includes(clickedItem.id)) {
				setSelectedIds([clickedItem.id]);
				setActiveId(clickedItem.id);
			}

			const currentSelectedItems = items.filter((item) =>
				(selectedIds.includes(clickedItem.id) ? selectedIds : [clickedItem.id]).includes(item.id)
			);

			setContextMenu({
				isOpen: true,
				position: { x: e.clientX, y: e.clientY },
				selectedItems: currentSelectedItems,
			});
		} else if (contextMenu.isOpen) {
			setContextMenu({
				isOpen: false,
				position: null,
				selectedItems: [],
			});
		}
	};

	const closeContextMenu = () => {
		setContextMenu({
			isOpen: false,
			position: null,
			selectedItems: [],
		});
	};

	const handleContextMenuAction = (
		action: ExtendedContextMenuAction,
		payload: { selected: MediaItem[]; targetId?: string }
	) => {
		const selected = payload.selected ?? [];
		if (selected.length === 0) return;
		switch (action) {
			case 'open': {
				const first = selected[0];
				if (first && first.entityType === 'image') {
					const singleImageItem = {
						id: first.id,
						name: first.name,
						type: first.entityType,
						path: first.path || '',
						size: first.size || 0,
						width: (first as any).width ?? null,
						height: (first as any).height ?? null,
						thumbnail: null,
						metadata: null,
					};
					openViewer([singleImageItem] as any, 0);
				}
				break;
			}
			case 'add-to-favorites': {
				(async () => {
					for (const it of selected) {
						try {
							await toggleFavorite.mutateAsync(it.id);
						} catch { }
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
						} catch { }
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
						} catch { }
					}
				})();
				break;
			}
			default:
				break;
		}
	};

	const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
		const pos = getContentCoords(e as any);
		const idx = indexFromCoords(pos.x, pos.y);
		if (idx === -1) return;
		const item = items[idx];
		if (!item) return;

		if (item.entityType === 'image') {
			const imageItem = {
				id: item.id,
				name: item.name,
				type: item.entityType,
				path: item.path || '',
				size: item.size || 0,
				width: (item as any).width ?? null,
				height: (item as any).height ?? null,
				thumbnail: null,
				metadata: null,
			};
			openViewer([imageItem] as any, 0);
		}

		onItemDoubleClick?.(item);
	};

	// Viewport management (sin cambios)
	useEffect(() => {
		const internal = containerRef.current;
		if (!internal) return;

		let host: HTMLElement | null = null;

		if (scrollContainer) {
			host = scrollContainer;
		} else {
			const computedStyle = window.getComputedStyle(internal);
			if (computedStyle.overflow === 'auto' || computedStyle.overflowY === 'auto') {
				host = internal;
			} else {
				let parent = internal.parentElement;
				while (parent) {
					const style = window.getComputedStyle(parent);
					if (style.overflow === 'auto' || style.overflowY === 'auto') {
						host = parent;
						break;
					}
					parent = parent.parentElement;
				}
				host = host || internal;
			}
		}

		if (!host) return;

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

		const initialViewport = {
			width: host.clientWidth,
			height: host.clientHeight,
			scrollTop: host.scrollTop,
			scrollLeft: host.scrollLeft,
			offsetTop: scrollContainer ? computeOffsetTop() : 0,
		};

		setViewport(initialViewport);

		return () => {
			ro.disconnect();
			host.removeEventListener('scroll', onScroll);
			if (rafId != null) cancelAnimationFrame(rafId);
		};
	}, [scrollContainer]);

	// Auto-scroll al ítem activo
	useEffect(() => {
		if (!activeId) return;
		const idx = items.findIndex((it) => it.id === activeId);
		if (idx < 0) return;

		const host = (scrollContainer ?? containerRef.current) as HTMLElement | null;
		if (!host) return;

		const row = Math.floor(idx / Math.max(1, columns));
		const firstRow = visibleRange.firstVisibleRow;
		const lastRow = visibleRange.lastVisibleRow;
		if (row >= firstRow && row <= lastRow) return;

		const rowsPerViewport = Math.max(1, lastRow - firstRow + 1);
		const targetFirstRow = Math.max(0, row - Math.floor(rowsPerViewport / 2));
		const targetTop = targetFirstRow * (cellSize + gap);
		const offset = scrollContainer ? (viewport.offsetTop ?? 0) : 0;
		try {
			host.scrollTo({ top: targetTop + offset, behavior: 'smooth' });
		} catch {
			host.scrollTop = targetTop + offset;
		}
	}, [
		activeId,
		items,
		columns,
		visibleRange.firstVisibleRow,
		visibleRange.lastVisibleRow,
		cellSize,
		gap,
		scrollContainer,
		viewport.offsetTop,
	]);

	// Cleanup
	useEffect(() => {
		return () => {
			animationManager.current.clear();
		};
	}, []);

	const useExternal = !!scrollContainer;

	// Renderizar tooltip animado
	const renderAnimatedTooltip = () => {
		if (!hoverTooltip.visible || hoverTooltip.itemIndex === null) return null;

		const tooltipAnim = animationManager.current.getTooltipAnimation();
		if (!tooltipAnim) return null;

		const alpha = tooltipAnim.alpha.currentValue;
		const scale = tooltipAnim.scale.currentValue;
		const offsetY = tooltipAnim.offsetY.currentValue;

		if (alpha <= 0) return null;

		return (
			<div
				aria-hidden
				style={{
					position: 'absolute',
					zIndex: 20,
					pointerEvents: 'none',
					left: hoverTooltip.x,
					top: hoverTooltip.y + offsetY,
					maxWidth: '60%',
					backgroundColor: `rgba(0,0,0,${0.8 * alpha})`,
					color: '#fff',
					fontSize: '0.75rem',
					borderRadius: 6,
					padding: '0.375rem 0.75rem',
					whiteSpace: 'nowrap',
					overflow: 'hidden',
					textOverflow: 'ellipsis',
					boxShadow: `0 4px 12px rgba(0,0,0,${0.4 * alpha})`,
					transform: `scale(${scale})`,
					transformOrigin: 'left top',
					opacity: alpha,
					backdropFilter: 'blur(4px)',
				}}
			>
				{hoverTooltip.text}
				<span className="sr-only">nombre de archivo en hover</span>
			</div>
		);
	};

	return (
		<>
			<div
				className={useExternal ? 'relative w-full' : 'relative h-full w-full overflow-auto'}
				data-testid="animated-file-canvas"
				onContextMenu={handleContextMenu}
				onDoubleClick={handleDoubleClick}
				onPointerDown={handlePointerDown}
				onPointerLeave={handlePointerLeave}
				onPointerMove={handlePointerMove}
				onPointerUp={handlePointerUp}
				ref={containerRef}
				role="application"
				style={useExternal ? { height: viewport.height } : undefined}
			>
				<div style={{ height: totalHeight }} />
				<canvas className="pointer-events-none absolute inset-0" ref={canvasRef} />

				{/* Tooltip animado */}
				{renderAnimatedTooltip()}
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
