/**
 * @component FileGrid
 * @description Componente principal para mostrar una cuadrícula de archivos con virtualización y optimización de rendimiento.
 *
 * Flujo de integración:
 * 1. Recibe items (FileItem[]) desde el componente padre
 * 2. Utiliza virtualización para renderizar solo los elementos visibles
 * 3. Maneja la selección de archivos y la interacción del usuario
 * 4. Se integra con FileCard para renderizar cada elemento
 * 5. Soporta infinite scroll para cargar más elementos
 *
 * Optimizaciones:
 * - Virtualización con @tanstack/react-virtual
 * - Sistema de caché LRU para thumbnails
 * - Lazy loading con IntersectionObserver
 * - Prefetch inteligente de imágenes cercanas
 * - Gestión eficiente de memoria
 *
 * @param {FileGridProps} props - Propiedades del componente
 */

"use client";

import { useCallback, useEffect, useRef, useMemo, useState } from "react";
import { FileCard } from "./file-card";
import { FileItem } from "@/types/file-item";
import { cn } from "@/lib/utils";
import { useVirtualizer } from "@tanstack/react-virtual";

// Configuración optimizada del grid
const GRID_CONFIG = {
	minColumns: 3,
	maxColumns: 6,
	gap: 4,
	itemBaseWidth: 200,
	overscanCount: 5, // Reducido para mejor rendimiento inicial
	scrollingDelay: 150,
	batchSize: 10, // Reducido para cargas más pequeñas
	prefetchDistance: 2, // Número de filas a precargar
	cacheSize: 200, // Tamaño máximo de la caché LRU
	breakpoints: {
		sm: 640,
		md: 768,
		lg: 1024,
		xl: 1280,
	},
} as const;

// Sistema de caché LRU mejorado
class LRUCache<K, V> {
	private cache: Map<K, V>;
	private maxSize: number;

	constructor(maxSize: number) {
		this.cache = new Map<K, V>();
		this.maxSize = maxSize;
	}

	get(key: K): V | undefined {
		const value = this.cache.get(key);
		if (value) {
			// Mover al final (más reciente)
			this.cache.delete(key);
			this.cache.set(key, value);
		}
		return value;
	}

	set(key: K, value: V): void {
		if (this.cache.size >= this.maxSize) {
			// Eliminar el elemento más antiguo
			const firstKey = this.cache.keys().next().value;
			this.cache.delete(firstKey);
		}
		this.cache.set(key, value);
	}

	has(key: K): boolean {
		return this.cache.has(key);
	}

	clear(): void {
		this.cache.clear();
	}
}

// Caché global de thumbnails renderizados
const renderedItemsCache = new LRUCache<string, boolean>(GRID_CONFIG.cacheSize);

export interface FileGridProps {
	items: FileItem[];
	isResizing?: boolean;
	onItemClick?: (item: FileItem) => void;
	onItemDoubleClick?: (item: FileItem) => void;
	loadMoreItems?: () => void;
}

export function FileGrid({
	items,
	isResizing,
	onItemClick,
	onItemDoubleClick,
	loadMoreItems,
}: FileGridProps) {
	const gridRef = useRef<HTMLDivElement>(null);
	const loadMoreRef = useRef<HTMLDivElement>(null);
	const observerRef = useRef<IntersectionObserver | null>(null);
	const [containerWidth, setContainerWidth] = useState(0);
	const [isScrolling, setIsScrolling] = useState(false);
	const [visibleItems, setVisibleItems] = useState<Set<string>>(new Set());
	const scrollingTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
		undefined
	);

	// Configurar IntersectionObserver para infinite scroll con mejor rendimiento
	useEffect(() => {
		if (!loadMoreRef.current || !loadMoreItems) return;

		const observer = new IntersectionObserver(
			(entries) => {
				const [entry] = entries;
				if (entry?.isIntersecting && !isScrolling) {
					loadMoreItems();
				}
			},
			{
				rootMargin: "400px 0px", // Reducido para mejor rendimiento
				threshold: 0,
			}
		);

		observer.observe(loadMoreRef.current);
		return () => observer.disconnect();
	}, [loadMoreItems, isScrolling]);

	// ResizeObserver optimizado
	useEffect(() => {
		if (!gridRef.current) return;

		const resizeObserver = new ResizeObserver((entries) => {
			const width = entries[0].contentRect.width;
			if (width > 0 && width !== containerWidth) {
				setContainerWidth(width);
			}
		});

		resizeObserver.observe(gridRef.current);
		return () => resizeObserver.disconnect();
	}, [containerWidth]);

	// Dimensiones del grid memoizadas
	const { columns, itemSize } = useMemo(() => {
		const availableWidth = containerWidth || window.innerWidth;
		let targetColumns = Math.floor(availableWidth / GRID_CONFIG.itemBaseWidth);
		targetColumns = Math.max(
			GRID_CONFIG.minColumns,
			Math.min(GRID_CONFIG.maxColumns, targetColumns)
		);

		const itemSize = Math.floor(
			(availableWidth - (targetColumns - 1) * GRID_CONFIG.gap) / targetColumns
		);

		return { columns: targetColumns, itemSize };
	}, [containerWidth]);

	// Calcular filas
	const rowCount = Math.ceil(items.length / columns);

	// Virtualizador optimizado
	const rowVirtualizer = useVirtualizer({
		count: rowCount,
		getScrollElement: () => gridRef.current,
		estimateSize: useCallback(() => itemSize, [itemSize]),
		overscan: isScrolling ? 2 : GRID_CONFIG.overscanCount,
		onChange: (instance) => {
			if (instance.isScrolling) {
				setIsScrolling(true);
				if (scrollingTimeoutRef.current) {
					clearTimeout(scrollingTimeoutRef.current);
				}
				scrollingTimeoutRef.current = setTimeout(() => {
					setIsScrolling(false);
				}, GRID_CONFIG.scrollingDelay);
			}
		},
	});

	// Cleanup de timeouts
	useEffect(() => {
		return () => {
			if (scrollingTimeoutRef.current) {
				clearTimeout(scrollingTimeoutRef.current);
			}
		};
	}, []);

	// Sistema de visibilidad optimizado
	const updateVisibleItems = useCallback(
		(entries: IntersectionObserverEntry[]) => {
			setVisibleItems((prev) => {
				const next = new Set(prev);
				entries.forEach((entry) => {
					const id = entry.target.getAttribute("data-id");
					if (id) {
						if (entry.isIntersecting) {
							next.add(id);
						} else {
							next.delete(id);
						}
					}
				});
				return next;
			});
		},
		[]
	);

	// Configurar observer para items visibles
	useEffect(() => {
		observerRef.current = new IntersectionObserver(updateVisibleItems, {
			root: gridRef.current,
			rootMargin: "50px 0px",
			threshold: 0,
		});

		return () => {
			if (observerRef.current) {
				observerRef.current.disconnect();
			}
		};
	}, [updateVisibleItems]);

	// Funciones de caché optimizadas
	const isItemRendered = useCallback((itemId: string) => {
		return renderedItemsCache.has(itemId);
	}, []);

	const markItemAsRendered = useCallback((itemId: string) => {
		renderedItemsCache.set(itemId, true);
	}, []);

	return (
		<div
			ref={gridRef}
			className={cn("h-full w-full overflow-auto relative")}
			style={{
				padding: `${GRID_CONFIG.gap}px`,
				contain: "size layout paint style",
			}}
		>
			<div
				style={{
					height: `${rowVirtualizer.getTotalSize()}px`,
					width: "100%",
					position: "relative",
				}}
			>
				{rowVirtualizer.getVirtualItems().map((virtualRow) => {
					const rowStartIndex = virtualRow.index * columns;
					const rowItems = items.slice(rowStartIndex, rowStartIndex + columns);

					return (
						<div
							key={virtualRow.key}
							style={{
								position: "absolute",
								top: `${virtualRow.start}px`,
								left: 0,
								width: "100%",
								height: `${itemSize}px`,
							}}
						>
							<div
								className="grid h-full"
								style={{
									gridTemplateColumns: `repeat(${columns}, 1fr)`,
									columnGap: 0,
								}}
							>
								{rowItems.map((item, columnIndex) => {
									const index = rowStartIndex + columnIndex;
									const hasBeenRendered = isItemRendered(item.id);
									const isVisible = visibleItems.has(item.id);
									const shouldLoad =
										(!isScrolling && isVisible) || hasBeenRendered;

									if (!hasBeenRendered && shouldLoad) {
										markItemAsRendered(item.id);
									}

									return (
										<div
											key={item.id}
											data-id={item.id}
											className="relative w-full py-2 px-1"
											ref={(el) => {
												if (el && observerRef.current) {
													observerRef.current.observe(el);
												}
											}}
											style={{
												willChange: "transform",
												contain: "layout style paint",
											}}
										>
											<FileCard
												item={item}
												onClick={onItemClick}
												onDoubleClick={onItemDoubleClick}
												index={index}
												totalColumns={columns}
												shouldLoad={shouldLoad}
												hasBeenRendered={hasBeenRendered}
											/>
										</div>
									);
								})}
							</div>
						</div>
					);
				})}
			</div>
			<div ref={loadMoreRef} className="h-px w-full" />
		</div>
	);
}
