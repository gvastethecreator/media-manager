"use client";

import { useCallback, useEffect, useRef, useMemo, useState } from "react";
import { FileCard } from "./file-card";
import { FileItem } from "@/types/file-item";
import { cn } from "@/lib/utils";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useFileManager } from "@/store/file-manager.store";
import { useImageResources } from "@/store/image-resources.store";

// Función auxiliar para parsear metadata
const getMetadata = (metadata: string | null) => {
	if (!metadata) return null;
	try {
		return JSON.parse(metadata);
	} catch {
		return null;
	}
};

// Configuración optimizada del grid con valores ajustados
const GRID_CONFIG = {
	minColumns: 3,
	maxColumns: 6,
	gap: 4,
	itemBaseWidth: 200,
	overscanCount: 2,
	scrollingDelay: 150,
	batchSize: 5,
	prefetchDistance: 1,
	cacheSize: 50,
	debounceTime: 100,
	breakpoints: {
		sm: 640,
		md: 768,
		lg: 1024,
		xl: 1280,
	},
	masonry: {
		minColumns: 2,
		maxColumns: 4,
		gap: 8,
		itemBaseWidth: 300,
	},
	cards: {
		minColumns: 2,
		maxColumns: 4,
		gap: 16,
		itemBaseWidth: 300,
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
	const { selectedItems, viewMode } = useFileManager();
	const imageResources = useImageResources();

	// Precargar recursos cuando cambian los items
	useEffect(() => {
		const imageItems = items.filter(
			(item) =>
				item.type === "image" ||
				getMetadata(item.metadata)?.mimeType?.startsWith("image/")
		);

		if (imageItems.length > 0) {
			imageResources.preloadResources(imageItems.map((item) => item.id));
		}
	}, [items]);

	// Dimensiones del grid memoizadas
	const { columns, itemSize } = useMemo(() => {
		const availableWidth = containerWidth || window.innerWidth;
		let targetColumns;
		let itemSize;

		switch (viewMode) {
			case "masonry":
				targetColumns = Math.floor(
					availableWidth / GRID_CONFIG.masonry.itemBaseWidth
				);
				targetColumns = Math.max(
					GRID_CONFIG.masonry.minColumns,
					Math.min(GRID_CONFIG.masonry.maxColumns, targetColumns)
				);
				itemSize = Math.floor(
					(availableWidth - (targetColumns - 1) * GRID_CONFIG.masonry.gap) /
						targetColumns
				);
				break;
			case "cards":
				targetColumns = Math.floor(
					availableWidth / GRID_CONFIG.cards.itemBaseWidth
				);
				targetColumns = Math.max(
					GRID_CONFIG.cards.minColumns,
					Math.min(GRID_CONFIG.cards.maxColumns, targetColumns)
				);
				itemSize = Math.floor(
					(availableWidth - (targetColumns - 1) * GRID_CONFIG.cards.gap) /
						targetColumns
				);
				break;
			case "list":
				targetColumns = 1;
				itemSize = availableWidth;
				break;
			default:
				targetColumns = Math.floor(availableWidth / GRID_CONFIG.itemBaseWidth);
				targetColumns = Math.max(
					GRID_CONFIG.minColumns,
					Math.min(GRID_CONFIG.maxColumns, targetColumns)
				);
				itemSize = Math.floor(
					(availableWidth - (targetColumns - 1) * GRID_CONFIG.gap) /
						targetColumns
				);
		}

		return { columns: targetColumns, itemSize };
	}, [containerWidth, viewMode]);

	// Calcular filas con memoización
	const rowCount = useMemo(
		() => Math.ceil(items.length / columns),
		[items.length, columns]
	);

	// Optimizar la actualización de items visibles
	const updateVisibleItems = useCallback(
		(entries: IntersectionObserverEntry[]) => {
			if (isScrolling) return;

			const visibleIds = new Set<string>();
			entries.forEach((entry) => {
				const id = entry.target.getAttribute("data-id");
				if (id && entry.isIntersecting) {
					visibleIds.add(id);
					if (!cacheRef.current.has(id)) {
						cacheRef.current.set(id, true);
					}
				}
			});

			setVisibleItems(visibleIds);
		},
		[isScrolling]
	);

	// Configurar observer con opciones optimizadas
	useEffect(() => {
		if (!gridRef.current) return;

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

	// Optimizar el manejo del scroll infinito
	useEffect(() => {
		if (!loadMoreRef.current || !loadMoreItems) return;

		const observer = new IntersectionObserver(
			(entries) => {
				const [entry] = entries;
				if (entry?.isIntersecting && !isScrolling) {
					requestAnimationFrame(() => {
						loadMoreItems();
					});
				}
			},
			{
				rootMargin: "100px 0px",
				threshold: 0,
			}
		);

		observer.observe(loadMoreRef.current);
		return () => observer.disconnect();
	}, [loadMoreItems, isScrolling]);

	// Optimizar ResizeObserver
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

	// Virtualizador optimizado
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
			className={cn(
				"h-full w-full overflow-auto relative",
				viewMode === "list" && "px-4 py-2"
			)}
			style={{
				padding:
					viewMode === "grid" || viewMode === "masonry" ? `${GRID_CONFIG.gap}px`
					: viewMode === "cards" ? `${GRID_CONFIG.cards.gap}px`
					: undefined,
				contain: "size layout paint style",
			}}
		>
			<div
				style={{
					height: `${rowVirtualizer.getTotalSize()}px`,
					width: "100%",
					position: "relative",
					willChange: "transform",
					contain: "size layout",
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
								top: 0,
								left: 0,
								width: "100%",
								height:
									viewMode === "grid" || viewMode === "masonry" ?
										`${itemSize}px`
									: viewMode === "cards" ? "auto"
									: "auto",
								transform: `translateY(${virtualRow.start}px)`,
								willChange: "transform",
								contain: "size layout",
							}}
						>
							<div
								className={cn(
									viewMode === "grid" || viewMode === "masonry" ? "grid h-full"
									: viewMode === "cards" ? "grid gap-4"
									: "flex flex-col gap-2"
								)}
								style={
									viewMode === "grid" || viewMode === "masonry" ?
										{
											gridTemplateColumns: `repeat(${columns}, 1fr)`,
											columnGap:
												viewMode === "masonry" ?
													GRID_CONFIG.masonry.gap
												:	GRID_CONFIG.gap,
										}
									: viewMode === "cards" ?
										{
											gridTemplateColumns: `repeat(${columns}, 1fr)`,
											gap: GRID_CONFIG.cards.gap,
										}
									:	undefined
								}
							>
								{rowItems.map((item, columnIndex) => {
									const index = rowStartIndex + columnIndex;
									const isVisible = visibleItems.has(item.id);
									const shouldLoad = !isScrolling && isVisible;
									const isSelected = selectedItems.some(
										(selected) => selected.id === item.id
									);

									return (
										<div
											key={item.id}
											data-id={item.id}
											className={cn(
												"relative w-full",
												viewMode === "grid" || viewMode === "masonry" ?
													"py-2 px-1"
												: viewMode === "cards" ? "py-2"
												: "py-1"
											)}
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
												isSelected={isSelected}
												viewMode={viewMode}
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
