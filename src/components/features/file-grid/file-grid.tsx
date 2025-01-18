"use client";

import { useCallback, useEffect, useRef, useMemo, useState } from "react";
import { FileCard } from "./file-card";
import { FileItem } from "@/types/file-item";
import { ViewMode } from "@/types/settings";
import { cn } from "@/lib/utils";
import { useVirtualizer, type VirtualItem } from "@tanstack/react-virtual";
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

// Tipos para la configuración del grid
interface BaseGridConfig {
	minColumns: number;
	maxColumns: number;
	itemBaseWidth: number;
	padding: number;
}

interface GridViewConfig extends BaseGridConfig {
	rowHeight: number;
	aspectRatio: number;
}

interface MasonryConfig extends BaseGridConfig {
	maxHeight: number;
	minHeight: number;
	columnGap: number;
	rowGap: number;
}

interface CardsConfig extends BaseGridConfig {
	rowHeight: number;
	aspectRatio: number;
}

interface ListConfig {
	height: number;
	padding: number;
}

interface GridGaps {
	grid: number;
	masonry: number;
	cards: number;
	list: number;
}

interface GridConfig {
	gap: GridGaps;
	grid: GridViewConfig;
	masonry: MasonryConfig;
	cards: CardsConfig;
	list: ListConfig;
	overscan: number;
}

// Configuración base del grid optimizada
export const GRID_CONFIG: GridConfig = {
	gap: {
		grid: 8,
		masonry: 8,
		cards: 16,
		list: 4,
	},
	grid: {
		minColumns: 4,
		maxColumns: 8,
		itemBaseWidth: 200,
		rowHeight: 200,
		padding: 8,
		aspectRatio: 1,
	},
	masonry: {
		minColumns: 4,
		maxColumns: 8,
		itemBaseWidth: 220,
		maxHeight: 600,
		minHeight: 100,
		padding: 8,
		columnGap: 8,
		rowGap: 8,
	},
	cards: {
		minColumns: 2,
		maxColumns: 3,
		itemBaseWidth: 360,
		rowHeight: 420,
		padding: 16,
		aspectRatio: 1.4,
	},
	list: {
		height: 80,
		padding: 4,
	},
	overscan: 10,
};

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
const renderedItemsCache = new LRUCache<string>(50);

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
	const parentRef = useRef<HTMLDivElement>(null);
	const loadMoreRef = useRef<HTMLDivElement>(null);
	const [containerWidth, setContainerWidth] = useState(0);
	const [isScrolling, setIsScrolling] = useState(false);
	const [isTransitioning, setIsTransitioning] = useState(false);
	const scrollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const previousViewMode = useRef<ViewMode | null>(null);
	const { selectedItems, viewMode } = useFileManager();

	// Limpiar timeouts
	useEffect(() => {
		return () => {
			if (scrollingTimeoutRef.current)
				clearTimeout(scrollingTimeoutRef.current);
			if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
			if (transitionTimeoutRef.current)
				clearTimeout(transitionTimeoutRef.current);
		};
	}, []);

	// Forzar recálculo al cambiar de vista
	useEffect(() => {
		if (previousViewMode.current !== viewMode) {
			setIsTransitioning(true);
			if (transitionTimeoutRef.current) {
				clearTimeout(transitionTimeoutRef.current);
			}

			// Resetear scroll
			if (parentRef.current) {
				parentRef.current.scrollTop = 0;
			}

			// Forzar recálculo después de un breve delay
			transitionTimeoutRef.current = setTimeout(() => {
				if (parentRef.current) {
					const width = parentRef.current.offsetWidth;
					setContainerWidth(width);
					previousViewMode.current = viewMode;
					setIsTransitioning(false);
				}
			}, 50);
		}
	}, [viewMode]);

	// Dimensiones del grid memoizadas y optimizadas
	const { columns, itemSize, rowHeight } = useMemo(() => {
		const availableWidth = containerWidth || window.innerWidth - 48;
		const currentGap = GRID_CONFIG.gap[viewMode];
		const config = GRID_CONFIG[viewMode];

		const calculateColumns = (config: BaseGridConfig) => {
			const { minColumns, maxColumns, itemBaseWidth, padding } = config;
			const totalPadding = padding * 2;
			const totalGapWidth = currentGap * (maxColumns - 1);
			const availableWidthWithGap = availableWidth - totalPadding;
			const calculatedCols = Math.floor(
				availableWidthWithGap / (itemBaseWidth + currentGap)
			);
			return Math.max(minColumns, Math.min(maxColumns, calculatedCols));
		};

		const calculateItemSize = (cols: number, config: BaseGridConfig) => {
			const totalPadding = config.padding * 2;
			const totalGapWidth = currentGap * (cols - 1);
			const availableWidthWithGap = availableWidth - totalPadding;
			const itemWidth = Math.floor(
				(availableWidthWithGap - totalGapWidth) / cols
			);

			// Asegurar que el tamaño no exceda el máximo para el modo
			return Math.min(
				itemWidth,
				viewMode === "masonry" ? config.itemBaseWidth * 1.5 : itemWidth
			);
		};

		let cols: number;
		let size: number;
		let height: number;

		switch (viewMode) {
			case "masonry": {
				const config = GRID_CONFIG.masonry;
				cols = calculateColumns(config);
				size = calculateItemSize(cols, config);
				height = 0;
				break;
			}
			case "cards": {
				const config = GRID_CONFIG.cards;
				cols = calculateColumns(config);
				size = calculateItemSize(cols, config);
				height = config.rowHeight;
				break;
			}
			case "list": {
				const config = GRID_CONFIG.list;
				cols = 1;
				size = availableWidth - currentGap * 2 - config.padding * 2;
				height = config.height;
				break;
			}
			default: {
				const config = GRID_CONFIG.grid;
				cols = calculateColumns(config);
				size = calculateItemSize(cols, config);
				height = size;
			}
		}

		return { columns: cols, itemSize: size, rowHeight: height };
	}, [containerWidth, viewMode]);

	// Optimizar ResizeObserver con mejor manejo de cambios
	useEffect(() => {
		if (!parentRef.current) return;

		const updateWidth = (width: number) => {
			if (
				width > 0 &&
				(width !== containerWidth || previousViewMode.current !== viewMode)
			) {
				setContainerWidth(width);
				previousViewMode.current = viewMode;
			}
		};

		const resizeObserver = new ResizeObserver((entries) => {
			if (resizeTimeoutRef.current) {
				clearTimeout(resizeTimeoutRef.current);
			}

			const width = entries[0].contentRect.width;
			if (isResizing) {
				resizeTimeoutRef.current = setTimeout(() => {
					updateWidth(width);
				}, 100);
			} else {
				updateWidth(width);
			}
		});

		resizeObserver.observe(parentRef.current);
		return () => {
			resizeObserver.disconnect();
			if (resizeTimeoutRef.current) {
				clearTimeout(resizeTimeoutRef.current);
			}
		};
	}, [containerWidth, isResizing, viewMode]);

	// Optimizar el cálculo de altura para masonry
	const calculateMasonryHeight = useCallback(
		(item: FileItem, baseWidth: number) => {
			const metadata = getMetadata(item.metadata);
			const config = GRID_CONFIG.masonry;

			if (!metadata?.dimensions) {
				return config.minHeight;
			}

			const aspectRatio =
				metadata.dimensions.width / metadata.dimensions.height;
			const calculatedHeight = Math.round(baseWidth / aspectRatio);

			return Math.max(
				config.minHeight,
				Math.min(calculatedHeight, config.maxHeight)
			);
		},
		[]
	);

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

	const handleScroll = useCallback(() => {
		if (scrollingTimeoutRef.current) {
			clearTimeout(scrollingTimeoutRef.current);
		}
		setIsScrolling(true);
		scrollingTimeoutRef.current = setTimeout(() => {
			setIsScrolling(false);
		}, 150);
	}, []);

	// Actualizar virtualizer con soporte mejorado para masonry
	const virtualizer = useVirtualizer({
		count: items.length,
		getScrollElement: () => parentRef.current,
		estimateSize: useCallback(
			(index: number) => {
				const item = items[index];
				if (!item) return rowHeight + GRID_CONFIG.gap[viewMode];

				switch (viewMode) {
					case "masonry": {
						const height = calculateMasonryHeight(item, itemSize);
						return height + GRID_CONFIG.masonry.rowGap;
					}
					case "cards":
						return GRID_CONFIG.cards.rowHeight + GRID_CONFIG.gap[viewMode];
					case "list":
						return GRID_CONFIG.list.height + GRID_CONFIG.gap[viewMode];
					default:
						return itemSize + GRID_CONFIG.gap[viewMode];
				}
			},
			[items, viewMode, itemSize, rowHeight, calculateMasonryHeight]
		),
		overscan: GRID_CONFIG.overscan,
		horizontal: false,
		lanes: viewMode === "list" ? 1 : columns,
		gap:
			viewMode === "masonry" ?
				GRID_CONFIG.masonry.columnGap
			:	GRID_CONFIG.gap[viewMode],
		scrollPaddingStart: GRID_CONFIG.gap[viewMode],
		scrollPaddingEnd: GRID_CONFIG.gap[viewMode],
	});

	return (
		<div
			ref={parentRef}
			className={cn(
				"h-full w-full overflow-auto relative",
				viewMode === "list" && "px-2 py-1",
				isTransitioning && "opacity-0 transition-opacity duration-50"
			)}
			onScroll={handleScroll}
			style={{
				height: "100%",
				width: "100%",
				position: "relative",
				contain: "strict",
				willChange: "transform",
				padding: GRID_CONFIG[viewMode].padding,
			}}
		>
			<div
				style={{
					height: virtualizer.getTotalSize(),
					width: "100%",
					position: "relative",
					contain: "strict",
				}}
			>
				{!isTransitioning &&
					virtualizer.getVirtualItems().map((virtualItem) => {
						const item = items[virtualItem.index];
						if (!item) return null;

						const style: React.CSSProperties = {
							position: "absolute",
							top: 0,
							left: 0,
							transform: `translate3d(${
								viewMode === "list" ? 0 : (
									virtualItem.lane *
									(itemSize +
										(viewMode === "masonry" ?
											GRID_CONFIG.masonry.columnGap
										:	GRID_CONFIG.gap[viewMode]))
								)
							}px, ${virtualItem.start}px, 0)`,
							width: viewMode === "list" ? "100%" : itemSize,
							height:
								viewMode === "masonry" ?
									calculateMasonryHeight(item, itemSize)
								:	virtualItem.size - GRID_CONFIG.gap[viewMode],
							padding: 0,
							willChange: "transform",
						};

						return (
							<div
								key={`${viewMode}-${virtualItem.key}`}
								data-index={virtualItem.index}
								className={cn("absolute")}
								style={style}
							>
								<FileCard
									item={item}
									onClick={onItemClick}
									onDoubleClick={onItemDoubleClick}
									index={virtualItem.index}
									totalColumns={columns}
									shouldLoad={!isScrolling && !isTransitioning}
									isSelected={selectedItems.some(
										(selected) => selected.id === item.id
									)}
									viewMode={viewMode}
									itemSize={itemSize}
									style={{
										width: "100%",
										height: "100%",
									}}
								/>
							</div>
						);
					})}
			</div>
			<div ref={loadMoreRef} className="h-px w-full" />
		</div>
	);
}
