"use client";

import { useCallback, useEffect, useRef, useMemo, useState } from "react";
import { FileCard } from "./file-card";
import { FileItem } from "@/types/file-item";
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
	const parentRef = useRef<HTMLDivElement>(null);
	const loadMoreRef = useRef<HTMLDivElement>(null);
	const [containerWidth, setContainerWidth] = useState(0);
	const [isScrolling, setIsScrolling] = useState(false);
	const scrollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const { selectedItems, viewMode } = useFileManager();

	// Dimensiones del grid memoizadas
	const { columns, itemSize, gap } = useMemo(() => {
		const availableWidth = containerWidth || window.innerWidth - 32; // Ajuste para padding
		let targetColumns;
		let itemSize;
		let gap;

		switch (viewMode) {
			case "masonry":
				gap = GRID_CONFIG.masonry.gap;
				targetColumns = Math.floor(
					(availableWidth + gap) / (GRID_CONFIG.masonry.itemBaseWidth + gap)
				);
				targetColumns = Math.max(
					GRID_CONFIG.masonry.minColumns,
					Math.min(GRID_CONFIG.masonry.maxColumns, targetColumns)
				);
				itemSize = Math.floor(
					(availableWidth - (targetColumns - 1) * gap) / targetColumns
				);
				break;
			case "cards":
				gap = GRID_CONFIG.cards.gap;
				targetColumns = Math.floor(
					(availableWidth + gap) / (GRID_CONFIG.cards.itemBaseWidth + gap)
				);
				targetColumns = Math.max(
					GRID_CONFIG.cards.minColumns,
					Math.min(GRID_CONFIG.cards.maxColumns, targetColumns)
				);
				itemSize = Math.floor(
					(availableWidth - (targetColumns - 1) * gap) / targetColumns
				);
				break;
			case "list":
				targetColumns = 1;
				gap = 8;
				itemSize = availableWidth;
				break;
			default:
				gap = GRID_CONFIG.gap;
				targetColumns = Math.floor(
					(availableWidth + gap) / (GRID_CONFIG.itemBaseWidth + gap)
				);
				targetColumns = Math.max(
					GRID_CONFIG.minColumns,
					Math.min(GRID_CONFIG.maxColumns, targetColumns)
				);
				itemSize = Math.floor(
					(availableWidth - (targetColumns - 1) * gap) / targetColumns
				);
		}

		return { columns: targetColumns, itemSize, gap };
	}, [containerWidth, viewMode]);

	// Optimizar ResizeObserver
	useEffect(() => {
		if (!parentRef.current) return;

		const updateWidth = (width: number) => {
			if (width > 0 && width !== containerWidth) {
				setContainerWidth(width);
			}
		};

		const resizeObserver = new ResizeObserver((entries) => {
			if (resizeTimeoutRef.current) {
				clearTimeout(resizeTimeoutRef.current);
			}

			const width = entries[0].contentRect.width;
			if (isResizing) {
				// Durante el resize, actualizamos con un debounce más largo
				resizeTimeoutRef.current = setTimeout(() => {
					updateWidth(width);
				}, 100);
			} else {
				// Si no hay resize activo, actualizamos inmediatamente
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
	}, [containerWidth, isResizing]);

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

	// Configuración de virtualización optimizada
	const virtualizer = useVirtualizer({
		count: items.length,
		getScrollElement: () => parentRef.current,
		estimateSize: useCallback(() => {
			switch (viewMode) {
				case "list":
					return 72;
				case "cards":
					return itemSize * 1.5;
				case "masonry":
					return itemSize;
				default:
					return itemSize;
			}
		}, [viewMode, itemSize]),
		overscan: Math.ceil(window.innerHeight / itemSize) * 2,
		horizontal: false,
		lanes: viewMode === "list" ? 1 : columns,
		gap: gap,
		scrollPaddingStart: gap,
		scrollPaddingEnd: gap,
		scrollMargin: gap,
		debug: false,
	});

	const renderVirtualItem = useCallback(
		(virtualItem: VirtualItem) => {
			const item = items[virtualItem.index];
			if (!item) return null;

			const isSelected = selectedItems.some(
				(selected) => selected.id === item.id
			);

			const style: React.CSSProperties = {
				position: "absolute",
				top: 0,
				left: 0,
				transform: `translate3d(${
					viewMode === "list" ? 0 : virtualItem.lane * (itemSize + gap)
				}px, ${virtualItem.start}px, 0)`,
				width: viewMode === "list" ? "100%" : `${itemSize}px`,
				height: viewMode === "list" ? "72px" : `${itemSize}px`,
				padding: gap / 2,
				willChange: "transform",
				contain: "content",
			};

			return (
				<div
					key={virtualItem.key}
					data-index={virtualItem.index}
					className={cn("absolute", viewMode === "list" && "w-full")}
					style={style}
				>
					<FileCard
						item={item}
						onClick={onItemClick}
						onDoubleClick={onItemDoubleClick}
						index={virtualItem.index}
						totalColumns={columns}
						shouldLoad={!isScrolling}
						isSelected={isSelected}
						viewMode={viewMode}
					/>
				</div>
			);
		},
		[
			items,
			selectedItems,
			columns,
			itemSize,
			gap,
			isScrolling,
			viewMode,
			onItemClick,
			onItemDoubleClick,
		]
	);

	return (
		<div
			ref={parentRef}
			className={cn(
				"h-full w-full overflow-auto relative",
				viewMode === "list" && "px-4 py-2"
			)}
			onScroll={handleScroll}
			style={{
				height: "100%",
				width: "100%",
				position: "relative",
				contain: "strict",
				willChange: "transform",
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
				{virtualizer.getVirtualItems().map(renderVirtualItem)}
			</div>
			<div ref={loadMoreRef} className="h-px w-full" />
		</div>
	);
}
