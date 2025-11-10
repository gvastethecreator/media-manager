import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CreateEntityModal, type EntityType } from '@/components/features/modals/create-entity-modal';
import { useDebounce, useRaf } from '@/hooks/useThrottle';
import {
	useAddTags,
	useAddToAlbum,
	useAddToCharacter,
	useAddToCollection,
	useAddToConcept,
	useAddToGroup,
	useAddToNote,
	useAddToPlace,
	useAddToPrompt,
	useAddToProperty,
	useAddToWildcard,
	useAddToWorldItem,
	useToggleFavorite,
} from '@/lib/api/files';
import { ThumbnailQuality } from '@/lib/config/thumbnail.config';
import { useFileViewerStore } from '@/store/ui/file-viewer.slice';
import { useSelectionStore } from '@/store/ui/selection.slice';
import type { MediaItem } from '../../components/media-thumbnail';
import { ExtendedContextMenu, type ExtendedContextMenuAction } from '../../context-menu/extended-context-menu';
import type { ClickModifiers } from '../../types/file-browser.types';
import { generateThumbnailUrl, getFallbackIcon, useImageCache } from './canvas-common';
import { CanvasRenderConfig } from './canvas-config';

// Renderiza todos los items en un solo <canvas> para minimizar el overhead de DOM.
// Estrategia: layout en celdas (grid) con tamaño fijo, prefetch de imágenes con Intersection-like
// (calculado por posición/scroll), overscan, y caché en memoria de ImageBitmap/Image.

// Props y defaults
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

const DEFAULTS = {
	itemSize: CanvasRenderConfig.grid.itemSize,
	gap: CanvasRenderConfig.grid.gap,
	overscanRows: CanvasRenderConfig.grid.overscanRows,
};

export function FileCanvas({
	items,
	itemSize = DEFAULTS.itemSize,
	gap = DEFAULTS.gap,
	overscanRows = DEFAULTS.overscanRows,
	scrollContainer = null,
	onItemClick,
	onItemDoubleClick,
}: FileCanvasProps) {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
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
	const addToAlbum = useAddToAlbum();
	const addToGroup = useAddToGroup();
	const addToCharacter = useAddToCharacter();
	const addToPlace = useAddToPlace();
	const addToConcept = useAddToConcept();
	const addToWorldItem = useAddToWorldItem();
	const addToNote = useAddToNote();
	const addToPrompt = useAddToPrompt();
	const addToProperty = useAddToProperty();
	const addToWildcard = useAddToWildcard();

	// Estados de interacción (hover y selección por arrastre)
	const [hoverIndex, setHoverIndex] = useState<number | null>(null);
	const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
	const [dragCurrent, setDragCurrent] = useState<{ x: number; y: number } | null>(null);

	// Tooltip ligero en hover (nombre del archivo) sin penalización de rendimiento
	const [hoverTooltip, setHoverTooltip] = useState<{
		visible: boolean;
		text: string;
		x: number;
		y: number;
	}>(() => ({ visible: false, text: '', x: 0, y: 0 }));

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

	// Estado del modal de creación de entidades
	const [createEntityModal, setCreateEntityModal] = useState<{
		isOpen: boolean;
		entityType: EntityType | null;
		fileIds: string[];
	}>({
		isOpen: false,
		entityType: null,
		fileIds: [],
	});

	// Layout: columnas basado en ancho y ajuste dinámico de tamaño de celda para usar todo el ancho
	const columns = Math.max(1, Math.floor(Math.max(0, viewport.width - gap) / (itemSize + gap)));
	const cellSize =
		columns > 0 ? Math.max(20, Math.floor(Math.max(0, viewport.width - (columns + 1) * gap) / columns)) : itemSize;
	const rowHeight = cellSize + gap;
	const totalRows = Math.ceil(items.length / columns);
	const totalHeight = totalRows * rowHeight + gap;

	// Visible rows con overscan (usar scroll local cuando hay contenedor externo)
	const localScrollTop = Math.max(0, viewport.scrollTop - (scrollContainer ? viewport.offsetTop : 0));
	const firstVisibleRow = Math.max(0, Math.floor(localScrollTop / rowHeight) - overscanRows);
	const lastVisibleRow = Math.min(
		totalRows - 1,
		Math.floor((localScrollTop + viewport.height) / rowHeight) + overscanRows
	);

	const visibleRange = useMemo(() => ({ firstVisibleRow, lastVisibleRow }), [firstVisibleRow, lastVisibleRow]);

	// Utilidades: coordenadas relativas al contenido y mapeo a índices
	const getContentCoords = (e: { clientX: number; clientY: number }) => {
		const container = containerRef.current;
		if (!container) return { x: 0, y: 0 };
		const rect = container.getBoundingClientRect();
		const x = e.clientX - rect.left + viewport.scrollLeft;
		let y = e.clientY - rect.top + viewport.scrollTop;
		if (scrollContainer) y -= viewport.offsetTop; // normalizar a coords locales del grupo
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
					// Generar thumbnails de manera asíncrona para los items visibles
					for (let i = startIndex; i <= endIndex; i++) {
						if (signal.aborted) break; // Check de cancelación

						const it = items[i];
						if (!it) continue;
						const key = it.id;

						// Si ya tenemos la imagen en caché, continuar
						if (get(key)) continue;

						try {
							// Caso especial para carpetas: cargar preview SVG compuesto
							if (it.entityType === 'folder') {
								const previewUrl = `/api/folders/${it.id}/preview`;
								if (signal.aborted) break;

								// Cargar la imagen SVG del preview
								await load(key, previewUrl);
								continue;
							}

							// Generar thumbnail usando la misma lógica que MediaThumbnail
							const src = await generateThumbnailUrl(it, ThumbnailQuality.MEDIUM);
							if (signal.aborted) break;

							if (src && !src.startsWith('🎵') && !src.startsWith('🖼️') && !src.startsWith('🎥')) {
								// Solo cargar si es una URL real (no un emoji)
								load(key, src);
							} else {
								// Para fallback icons (emojis), crear un placeholder entry
								set(key, { status: 'ready', fallbackIcon: src });
							}
						} catch (error) {
							if (signal.aborted) break;
							// Silenciar errores frecuentes de generación de thumbnails para rendimiento
							const fallback = getFallbackIcon(it.entityType);
							set(key, { status: 'ready', fallbackIcon: fallback });
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
		const endIndex = Math.min(items.length - 1, (visibleRange.lastVisibleRow + 1) * columns - 1);

		debouncedPrefetch(startIndex, endIndex, items);
	}, [visibleRange, columns, items, debouncedPrefetch]);

	// Render throttleado para 60fps máximo
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

		// Offset superior por scroll
		const startIndex = visibleRange.firstVisibleRow * columns;
		const rawEndIndex = Math.min(items.length - 1, (visibleRange.lastVisibleRow + 1) * columns - 1);

		const endIndex = rawEndIndex;

		// Logs de render eliminados por rendimiento

		for (let i = startIndex; i <= endIndex; i++) {
			const it = items[i];
			if (!it) continue;
			const col = i % columns;
			const row = Math.floor(i / columns);
			const x = col * (cellSize + gap) + gap;
			// CORREGIDO: No restar localScrollTop - las posiciones deben ser relativas al viewport
			const y = (row - visibleRange.firstVisibleRow) * (cellSize + gap) + gap;

			// Background y borde de selección (carpetas sin bordes por defecto)
			const isFolder = it.entityType === 'folder';
			const isHovered = hoverIndex === i;

			ctx.fillStyle = '#111827'; // bg-card aproximado (tailwind slate-900)
			ctx.fillRect(x, y, cellSize, cellSize);

			// Solo mostrar borde para carpetas si están hover o seleccionadas
			if (isSelected(it.id)) {
				ctx.strokeStyle = '#3b82f6';
				ctx.lineWidth = CanvasRenderConfig.grid.borderWidth;
				ctx.strokeRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
			} else if (!isFolder && isHovered) {
				// Para no-carpetas, mostrar borde de hover normal
				ctx.strokeStyle = '#f59e0b';
				ctx.lineWidth = 1;
				ctx.setLineDash([4, 3]);
				ctx.strokeRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
				ctx.setLineDash([]);
			}

			const entry = get(it.id);

			// Caso especial para carpetas con preview SVG
			if (isFolder && entry?.status === 'ready' && entry.image) {
				const img = entry.image as any;
				const iw = (img.naturalWidth ?? img.width) as number;
				const ih = (img.naturalHeight ?? img.height) as number;

				if (iw > 0 && ih > 0) {
					// Renderizar el preview SVG escalado para llenar la celda
					const scale = Math.min(cellSize / iw, cellSize / ih);
					const dw = Math.ceil(iw * scale);
					const dh = Math.ceil(ih * scale);
					const dx = x + Math.floor((cellSize - dw) / 2);
					const dy = y + Math.floor((cellSize - dh) / 2);

					ctx.drawImage(img, dx, dy, dw, dh);
				} else {
					// Fallback si no se pudo cargar el preview
					ctx.fillStyle = '#374151';
					ctx.fillRect(x, y, cellSize, cellSize);
					ctx.fillStyle = '#e5e7eb';
					ctx.font = `${Math.floor(cellSize * 0.4)}px system-ui, -apple-system, Segoe UI, Roboto, Arial`;
					ctx.textAlign = 'center';
					ctx.textBaseline = 'middle';
					ctx.fillText('📁', x + cellSize / 2, y + cellSize / 2);
				}
			}
			// Renderizado normal para no-carpetas y carpetas sin miniaturas
			else {
				// Definir área de recorte por celda para simular object-fit: cover sin desbordes
				const pad = 2; // pequeño padding visual
				ctx.save();
				ctx.beginPath();
				ctx.rect(x + pad, y + pad, cellSize - pad * 2, cellSize - pad * 2);
				ctx.clip();

				// Mejora de calidad de reescalado
				ctx.imageSmoothingEnabled = CanvasRenderConfig.visuals.enableSmoothing;
				// imageSmoothingQuality puede no estar tipeado, pero la mayoría de navegadores lo soportan
				(ctx as any).imageSmoothingQuality = 'high';

				if (entry?.status === 'ready' && entry.image) {
					// Ajuste para cubrir celda manteniendo aspect ratio (object-fit: cover)
					const img = entry.image as any;
					const iw = (img.naturalWidth ?? img.width) as number;
					const ih = (img.naturalHeight ?? img.height) as number;
					if (iw > 0 && ih > 0) {
						// Fade-in suave en primeros ~220ms desde readyAt
						const now = performance.now();
						const t0 = entry.readyAt ?? now;
						const dt = Math.max(0, now - t0);
						const alpha = Math.min(1, dt / 220);
						const prevAlpha = ctx.globalAlpha;
						ctx.globalAlpha = alpha;
						const scale = Math.max((cellSize - pad * 2) / iw, (cellSize - pad * 2) / ih);
						const dw = Math.ceil(iw * scale);
						const dh = Math.ceil(ih * scale);
						// centrado dentro del área recortada
						const dx = x + pad + Math.floor((cellSize - pad * 2 - dw) / 2);
						const dy = y + pad + Math.floor((cellSize - pad * 2 - dh) / 2);
						ctx.drawImage(img, dx, dy, dw, dh);
						ctx.globalAlpha = prevAlpha;
					}
				} else if (entry?.status === 'ready' && entry.fallbackIcon) {
					// Renderizar fallback icon (emoji) centrado y recortado
					ctx.fillStyle = '#374151';
					ctx.fillRect(x + pad, y + pad, cellSize - pad * 2, cellSize - pad * 2);
					ctx.fillStyle = '#e5e7eb';
					ctx.font = `${Math.floor(cellSize * 0.45)}px system-ui, -apple-system, Segoe UI, Roboto, Arial`;
					ctx.textAlign = 'center';
					ctx.textBaseline = 'middle';
					ctx.fillText(entry.fallbackIcon, x + cellSize / 2, y + cellSize / 2);
					ctx.textAlign = 'left';
					ctx.textBaseline = 'alphabetic';
				} else {
					// placeholder con información del estado, recortado a la celda
					ctx.fillStyle = entry?.status === 'loading' ? '#6b7280' : '#374151';
					ctx.fillRect(x + pad, y + pad, cellSize - pad * 2, cellSize - pad * 2);
					// Texto de debug del estado
					ctx.fillStyle = '#ffffff';
					ctx.font = '10px monospace';
					ctx.textAlign = 'center';
					const statusText = entry?.status || (it.thumbnailUrl ? 'no-cache' : 'no-url');
					ctx.fillText(statusText, x + cellSize / 2, y + cellSize / 2);
					ctx.textAlign = 'left';
				}

				// Restaurar para que bordes/overlays no queden recortados
				ctx.restore();
			}
		}
		// La lógica de hover ya está integrada en el renderizado de cada celda

		// Overlay de selección por arrastre (rectángulo)
		if (dragStart && dragCurrent) {
			const rx = Math.min(dragStart.x, dragCurrent.x) - viewport.scrollLeft;
			// CORREGIDO: Calcular posición Y relativa al viewport actual
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
		hoverIndex,
		dragStart,
		dragCurrent,
		scrollContainer,
	]);

	const rafRender = useRaf(renderCallback);

	// useEffect que agenda render por frame (RAF)
	useEffect(() => {
		rafRender();
	}, [rafRender]);

	// Autoscroll suave al ítem activo cuando cambia (mejora UX para navegación por teclado)
	useEffect(() => {
		if (!activeId) return;
		const idx = items.findIndex((it) => it.id === activeId);
		if (idx < 0) return;

		const host = (scrollContainer ?? containerRef.current) as HTMLElement | null;
		if (!host) return;

		const row = Math.floor(idx / Math.max(1, columns));
		const firstRow = visibleRange.firstVisibleRow;
		const lastRow = visibleRange.lastVisibleRow;
		if (row >= firstRow && row <= lastRow) return; // ya visible

		const rowsPerViewport = Math.max(1, lastRow - firstRow + 1);
		const targetFirstRow = Math.max(0, row - Math.floor(rowsPerViewport / 2));
		const targetTop = targetFirstRow * (cellSize + gap);
		const offset = scrollContainer ? (viewport.offsetTop ?? 0) : 0;
		try {
			host.scrollTo({ top: targetTop + offset, behavior: 'smooth' });
		} catch {
			// fallback sin smooth si el navegador no soporta behavior
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

	// Observa tamaño del contenedor, scroll y offsetTop relativo al host
	useEffect(() => {
		const internal = containerRef.current;
		if (!internal) return;

		// Mejorar la detección del scroll container
		let host: HTMLElement | null = null;

		if (scrollContainer) {
			host = scrollContainer;
		} else {
			// En modo sin agrupar, el scroll está en el contenedor interno
			// Asegurar que el elemento tiene overflow-auto aplicado
			const computedStyle = window.getComputedStyle(internal);
			if (computedStyle.overflow === 'auto' || computedStyle.overflowY === 'auto') {
				host = internal;
			} else {
				// Fallback: buscar el padre con scroll
				let parent = internal.parentElement;
				while (parent) {
					const style = window.getComputedStyle(parent);
					if (style.overflow === 'auto' || style.overflowY === 'auto') {
						host = parent;
						break;
					}
					parent = parent.parentElement;
				}
				// Si no encontramos un padre con scroll, usar internal
				host = host || internal;
			}
		}

		if (!host) return;

		// Eliminar logs de setup por rendimiento

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

		// init values
		const initialViewport = {
			width: host.clientWidth,
			height: host.clientHeight,
			scrollTop: host.scrollTop,
			scrollLeft: host.scrollLeft,
			offsetTop: scrollContainer ? computeOffsetTop() : 0,
		};

		console.log('🚀 FileCanvas initial viewport:', initialViewport);
		setViewport(initialViewport);

		return () => {
			ro.disconnect();
			host.removeEventListener('scroll', onScroll);
			if (rafId != null) cancelAnimationFrame(rafId);
		};
	}, [scrollContainer]);

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

		// Actualizar tooltip ligero cuando cambia de celda
		if (idx >= 0 && idx < items.length) {
			const col = idx % Math.max(1, columns);
			const row = Math.floor(idx / Math.max(1, columns));
			const x = col * (cellSize + gap) + gap + 8; // padding
			const y = (row - visibleRange.firstVisibleRow) * (cellSize + gap) + gap + 8;
			const name = items[idx]?.name || '';
			setHoverTooltip((t) =>
				t.text !== name || !t.visible || Math.abs(t.x - x) > 2 || Math.abs(t.y - y) > 2
					? { visible: true, text: name, x, y }
					: t
			);
		} else if (hoverTooltip.visible) {
			setHoverTooltip((t) => ({ ...t, visible: false }));
		}
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

		// Click simple - solo manejar selección aquí
		const idx = indexFromCoords(pos.x, pos.y);
		if (idx === -1) return;
		const item = items[idx];
		if (!item) return;
		const modifiers: ClickModifiers = { ctrlKey: e.ctrlKey, metaKey: e.metaKey, shiftKey: e.shiftKey };

		// Solo manejar click simple, doble-click se maneja por separado
		onItemClick?.(item, modifiers);
	};

	// Handler del menú contextual
	const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();

		const pos = getContentCoords(e);
		const idx = indexFromCoords(pos.x, pos.y);

		// Si hay click sobre un item
		if (idx !== -1 && items[idx]) {
			const clickedItem = items[idx];

			// Si el item no está seleccionado, seleccionarlo
			if (!selectedIds.includes(clickedItem.id)) {
				setSelectedIds([clickedItem.id]);
				setActiveId(clickedItem.id);
			}

			// Obtener items seleccionados actuales
			const currentSelectedItems = items.filter((item) =>
				(selectedIds.includes(clickedItem.id) ? selectedIds : [clickedItem.id]).includes(item.id)
			);

			setContextMenu({
				isOpen: true,
				position: { x: e.clientX, y: e.clientY },
				selectedItems: currentSelectedItems,
			});
		} else if (contextMenu.isOpen) {
			// Click en área vacía - cerrar menú si está abierto
			setContextMenu({
				isOpen: false,
				position: null,
				selectedItems: [],
			});
		}
	};

	// Cerrar menú contextual
	const closeContextMenu = () => {
		setContextMenu({
			isOpen: false,
			position: null,
			selectedItems: [],
		});
	};

	// Abrir modal de creación de entidad
	const handleCreateEntity = useCallback(
		(entityType: string) => {
			const fileIds = contextMenu.selectedItems.map((item) => item.id);
			setCreateEntityModal({
				isOpen: true,
				entityType: entityType as EntityType,
				fileIds,
			});
		},
		[contextMenu.selectedItems]
	);

	// Cerrar modal de creación
	const closeCreateEntityModal = () => {
		setCreateEntityModal({ isOpen: false, entityType: null, fileIds: [] });
	};

	// Cuando se crea una entidad, asociar los archivos automáticamente
	const handleEntityCreated = useCallback(
		async (entityId: string, entityType: EntityType) => {
			const fileIds = createEntityModal.fileIds;
			if (fileIds.length === 0) return;

			console.log(`📎 Asociando ${fileIds.length} archivos con ${entityType} ${entityId}`);

			try {
				// Asociar cada archivo con la nueva entidad según su tipo
				for (const fileId of fileIds) {
					switch (entityType) {
						case 'album':
							await addToAlbum.mutateAsync({ fileId, albumId: entityId });
							break;
						case 'collection':
							await addToCollection.mutateAsync({ fileId, collectionId: entityId });
							break;
						case 'group':
							await addToGroup.mutateAsync({ fileId, groupId: entityId });
							break;
						case 'character':
							await addToCharacter.mutateAsync({ fileId, characterId: entityId });
							break;
						case 'place':
							await addToPlace.mutateAsync({ fileId, placeId: entityId });
							break;
						case 'concept':
							await addToConcept.mutateAsync({ fileId, conceptId: entityId });
							break;
						case 'tag':
							await addTags.mutateAsync({ fileId, tags: [entityId] });
							break;
						case 'note':
							await addToNote.mutateAsync({ fileId, noteId: entityId });
							break;
						case 'prompt':
							await addToPrompt.mutateAsync({ fileId, promptId: entityId });
							break;
						case 'wildcard':
							await addToWildcard.mutateAsync({ fileId, wildcardId: entityId });
							break;
						default:
							console.warn(`⚠️ Tipo de entidad no soportado: ${entityType}`);
					}
				}
				console.log(`✅ Archivos asociados exitosamente con ${entityType} ${entityId}`);
			} catch (error) {
				console.error(`❌ Error al asociar archivos con ${entityType}:`, error);
			}
		},
		[
			createEntityModal.fileIds,
			addToAlbum,
			addToCollection,
			addToGroup,
			addToCharacter,
			addToPlace,
			addToConcept,
			addTags,
			addToNote,
			addToPrompt,
			addToWildcard,
		]
	);

	// Handler de acciones del menú contextual
	const handleContextMenuAction = (
		action: ExtendedContextMenuAction,
		payload: { selected: MediaItem[]; targetId?: string }
	) => {
		const selected = payload.selected ?? [];
		if (selected.length === 0) return;
		switch (action) {
			case 'open': {
				// Abrir visor con solo el primer elemento seleccionado (modo single-image)
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
					console.log('🖱️ Abriendo visor desde menú contextual:', first.name);
					// Abrir en modo single-image pasando solo este elemento
					openViewer([singleImageItem] as any, 0);
				}
				break;
			}
			case 'add-to-favorites': {
				// Toggle favorito para cada seleccionado (secuencial)
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
			case 'add-to-album': {
				const targetId = payload.targetId;
				if (!targetId) return;
				(async () => {
					for (const it of selected) {
						try {
							await addToAlbum.mutateAsync({ fileId: it.id, albumId: targetId });
						} catch {}
					}
				})();
				break;
			}
			case 'add-to-group': {
				const targetId = payload.targetId;
				if (!targetId) return;
				(async () => {
					for (const it of selected) {
						try {
							await addToGroup.mutateAsync({ fileId: it.id, groupId: targetId });
						} catch {}
					}
				})();
				break;
			}
			case 'add-to-characters': {
				const targetId = payload.targetId;
				if (!targetId) return;
				(async () => {
					for (const it of selected) {
						try {
							await addToCharacter.mutateAsync({ fileId: it.id, characterId: targetId });
						} catch {}
					}
				})();
				break;
			}
			case 'add-to-places': {
				const targetId = payload.targetId;
				if (!targetId) return;
				(async () => {
					for (const it of selected) {
						try {
							await addToPlace.mutateAsync({ fileId: it.id, placeId: targetId });
						} catch {}
					}
				})();
				break;
			}
			case 'add-to-concept': {
				const targetId = payload.targetId;
				if (!targetId) return;
				(async () => {
					for (const it of selected) {
						try {
							await addToConcept.mutateAsync({ fileId: it.id, conceptId: targetId });
						} catch {}
					}
				})();
				break;
			}
			case 'add-to-world-item': {
				const targetId = payload.targetId;
				if (!targetId) return;
				(async () => {
					for (const it of selected) {
						try {
							await addToWorldItem.mutateAsync({ fileId: it.id, worldItemId: targetId });
						} catch {}
					}
				})();
				break;
			}
			case 'add-to-notes': {
				const targetId = payload.targetId;
				if (!targetId) return;
				(async () => {
					for (const it of selected) {
						try {
							await addToNote.mutateAsync({ fileId: it.id, noteId: targetId });
						} catch {}
					}
				})();
				break;
			}
			case 'add-to-prompts': {
				const targetId = payload.targetId;
				if (!targetId) return;
				(async () => {
					for (const it of selected) {
						try {
							await addToPrompt.mutateAsync({ fileId: it.id, promptId: targetId });
						} catch {}
					}
				})();
				break;
			}
			case 'add-to-properties': {
				const targetId = payload.targetId;
				if (!targetId) return;
				(async () => {
					for (const it of selected) {
						try {
							await addToProperty.mutateAsync({ fileId: it.id, propertyId: targetId });
						} catch {}
					}
				})();
				break;
			}
			case 'add-to-wildcards': {
				const targetId = payload.targetId;
				if (!targetId) return;
				(async () => {
					for (const it of selected) {
						try {
							await addToWildcard.mutateAsync({ fileId: it.id, wildcardId: targetId });
						} catch {}
					}
				})();
				break;
			}
			default:
				break;
		}
	};

	// Handler específico para doble-click
	const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
		const pos = getContentCoords(e as any);
		const idx = indexFromCoords(pos.x, pos.y);
		if (idx === -1) return;
		const item = items[idx];
		if (!item) return;

		console.log('🖱️ Doble-click detectado en:', item.name);

		// Para doble-click, abrir SOLO la imagen seleccionada, no toda la colección
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
			// Abrir en modo single-image pasando solo este elemento
			openViewer([imageItem] as any, 0);
		}

		onItemDoubleClick?.(item);
	};

	const useExternal = !!scrollContainer;
	return (
		<>
			<div
				className={useExternal ? 'relative w-full' : 'relative h-full w-full overflow-auto'}
				data-testid="file-canvas"
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
				{/* Espaciador para representar la altura total del contenido y permitir scroll */}
				<div style={{ height: totalHeight }} />
				{/* Canvas como overlay del viewport; el dibujo compensa el scroll interno */}
				<canvas className="pointer-events-none absolute inset-0" ref={canvasRef} />

				{/* Tooltip de hover (no interfiere con eventos del canvas) */}
				{hoverTooltip.visible && !dragStart && (
					<div
						aria-hidden
						style={{
							position: 'absolute',
							zIndex: 20,
							pointerEvents: 'none',
							left: hoverTooltip.x,
							top: hoverTooltip.y,
							maxWidth: '150px',
							backgroundColor: 'rgba(0,0,0,0.7)',
							color: '#fff',
							fontSize: '0.75rem',
							borderRadius: 4,
							padding: '0.25rem 0.5rem',
							whiteSpace: 'nowrap',
							overflow: 'hidden',
							textOverflow: 'ellipsis',
							boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
							transition: 'all 100ms ease-in',
							cursor: 'pointer',
						}}
					>
						{hoverTooltip.text}
						<span className="sr-only">nombre de archivo en hover</span>
					</div>
				)}
			</div>

			{/* Menú contextual */}
			<ExtendedContextMenu
				isOpen={contextMenu.isOpen}
				onAction={handleContextMenuAction}
				onClose={closeContextMenu}
				onCreateEntity={handleCreateEntity}
				position={contextMenu.position}
				selectedItems={contextMenu.selectedItems}
			/>

			{/* Modal de creación de entidades */}
			<CreateEntityModal
				entityType={createEntityModal.entityType}
				fileIds={createEntityModal.fileIds}
				isOpen={createEntityModal.isOpen}
				onClose={closeCreateEntityModal}
				onEntityCreated={handleEntityCreated}
			/>
		</>
	);
}
