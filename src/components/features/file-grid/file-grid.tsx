"use client";

import { useCallback, useEffect, useRef, useMemo, useState } from "react";
import { FileCard } from "./file-card";
import { FileItem } from "@/types/file-item";
import { cn } from "@/lib/utils";
import { useVirtualizer } from "@tanstack/react-virtual";
import { DetailsPanel } from "@/components/panels/details/details-panel";
import { useFileManager } from "@/store/file-manager";

// Configuración optimizada del grid con valores ajustados
const GRID_CONFIG = {
	minColumns: 3,
	maxColumns: 6,
	gap: 4,
	itemBaseWidth: 200,
	overscanCount: 3, // Reducido para mejor rendimiento
	scrollingDelay: 300, // Aumentado para reducir actualizaciones
	batchSize: 5, // Reducido para cargas más pequeñas
	prefetchDistance: 1, // Reducido para optimizar la precarga
	cacheSize: 100, // Reducido para mejor gestión de memoria
	debounceTime: 150, // Nuevo: tiempo de debounce para actualizaciones
	breakpoints: {
		sm: 640,
		md: 768,
		lg: 1024,
		xl: 1280,
	},
} as const;

// Sistema de caché LRU mejorado con tipos
interface CacheItem {
	timestamp: number;
	value: boolean;
}

class LRUCache<K extends string> {
	private cache: Map<K, CacheItem>;
	private maxSize: number;
	private cleanupInterval: number;
	private cleanup: NodeJS.Timeout | null = null;

	constructor(maxSize: number) {
		this.cache = new Map();
		this.maxSize = maxSize;
		this.cleanupInterval = 60000; // 1 minuto
		this.startCleanup();
	}

	private startCleanup() {
		if (this.cleanup) {
			clearInterval(this.cleanup);
		}

		this.cleanup = setInterval(() => {
			const now = Date.now();
			const maxAge = 5 * 60 * 1000; // 5 minutos

			for (const [key, item] of this.cache.entries()) {
				if (now - item.timestamp > maxAge) {
					this.cache.delete(key);
				}
			}
		}, this.cleanupInterval);
	}

	get(key: K): boolean {
		const item = this.cache.get(key);
		if (item) {
			item.timestamp = Date.now();
			this.cache.delete(key);
			this.cache.set(key, item);
			return item.value;
		}
		return false;
	}

	set(key: K, value: boolean): void {
		if (this.cache.size >= this.maxSize) {
			const oldestKey = this.cache.keys().next().value;
			if (oldestKey) {
				this.cache.delete(oldestKey);
			}
		}
		this.cache.set(key, { value, timestamp: Date.now() });
	}

	has(key: K): boolean {
		return this.cache.has(key);
	}

	clear(): void {
		this.cache.clear();
		if (this.cleanup) {
			clearInterval(this.cleanup);
			this.cleanup = null;
		}
	}

	dispose(): void {
		this.clear();
	}
}

// Caché global de thumbnails renderizados con tipo mejorado
const renderedItemsCache = new LRUCache<string>(GRID_CONFIG.cacheSize);

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
	const scrollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const cacheRef = useRef(renderedItemsCache);
	const { selectedItems } = useFileManager();

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

	// Calcular filas con memoización
	const rowCount = useMemo(
		() => Math.ceil(items.length / columns),
		[items.length, columns]
	);

	// Funciones de caché optimizadas y memoizadas
	const isItemRendered = useCallback(
		(itemId: string): boolean => {
			if (!itemId || !cacheRef.current) return false;
			try {
				return cacheRef.current.has(itemId);
			} catch {
				return false;
			}
		},
		[cacheRef]
	);

	const markItemAsRendered = useCallback(
		(itemId: string): void => {
			if (!itemId || !cacheRef.current) return;
			try {
				cacheRef.current.set(itemId, true);
			} catch {
				console.warn("Failed to mark item as rendered:", itemId);
			}
		},
		[cacheRef]
	);

	// Sistema de visibilidad optimizado con debounce
	const updateVisibleItems = useCallback(
		(entries: IntersectionObserverEntry[]) => {
			if (isScrolling) return;

			setVisibleItems((prev) => {
				const next = new Set(prev);
				entries.forEach((entry) => {
					const id = entry.target.getAttribute("data-id");
					if (id) {
						if (entry.isIntersecting) {
							next.add(id);
							if (!isItemRendered(id)) {
								markItemAsRendered(id);
							}
						} else {
							next.delete(id);
						}
					}
				});
				return next;
			});
		},
		[isScrolling, isItemRendered, markItemAsRendered]
	);

	// Configurar observer para items visibles con opciones optimizadas
	useEffect(() => {
		observerRef.current = new IntersectionObserver(updateVisibleItems, {
			root: gridRef.current,
			rootMargin: "20px 0px",
			threshold: 0,
		});

		const observer = observerRef.current;

		return () => {
			if (observer) {
				observer.disconnect();
			}
		};
	}, [updateVisibleItems]);

	// Cleanup de timeouts mejorado
	useEffect(() => {
		return () => {
			if (scrollingTimeoutRef.current) {
				clearTimeout(scrollingTimeoutRef.current);
			}
			if (resizeTimeoutRef.current) {
				clearTimeout(resizeTimeoutRef.current);
			}
			if (cacheRef.current) {
				cacheRef.current.clear();
			}
		};
	}, []);

	// Optimizar IntersectionObserver para infinite scroll
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
				rootMargin: "200px 0px",
				threshold: 0,
			}
		);

		observer.observe(loadMoreRef.current);
		return () => observer.disconnect();
	}, [loadMoreItems, isScrolling]);

	// ResizeObserver optimizado con debounce
	useEffect(() => {
		if (!gridRef.current) return;

		const resizeObserver = new ResizeObserver((entries) => {
			if (resizeTimeoutRef.current) {
				clearTimeout(resizeTimeoutRef.current);
			}

			resizeTimeoutRef.current = setTimeout(() => {
				const width = entries[0].contentRect.width;
				if (width > 0 && width !== containerWidth) {
					setContainerWidth(width);
				}
			}, GRID_CONFIG.debounceTime);
		});

		resizeObserver.observe(gridRef.current);
		return () => {
			resizeObserver.disconnect();
			if (resizeTimeoutRef.current) {
				clearTimeout(resizeTimeoutRef.current);
			}
		};
	}, [containerWidth]);

	// Virtualizador optimizado con configuración ajustada
	const rowVirtualizer = useVirtualizer({
		count: rowCount,
		getScrollElement: () => gridRef.current,
		estimateSize: useCallback(() => itemSize, [itemSize]),
		overscan: isScrolling ? 1 : GRID_CONFIG.overscanCount,
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
									const isSelected = selectedItems.some(
										(selected) => selected.id === item.id
									);

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
												isSelected={isSelected}
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
