"use client";

import { useCallback, useEffect, useRef, useMemo, useState } from "react";
import { FileCard } from "./file-card";
import type { FileItem } from "@/types/file-item";
import { cn } from "@/lib/utils";
import { useVirtualizer } from "@tanstack/react-virtual";

// Cache global persistente para mantener los elementos renderizados
const globalRenderedItems = new Set<string>();

// Optimizar la configuración del grid
const GRID_CONFIG = {
	minColumns: 3,
	maxColumns: 6,
	gap: 1,
	itemBaseWidth: 200,
	overscanCount: 10,
	scrollingDelay: 100,
	breakpoints: {
		sm: 640,
		md: 768,
		lg: 1024,
		xl: 1280,
	},
} as const;

interface FileGridProps {
	onItemClick?: (item: FileItem) => void;
	onItemDoubleClick?: (item: FileItem) => void;
	items: FileItem[];
	loadMoreItems?: () => void;
}

export function FileGrid({
	onItemClick,
	onItemDoubleClick,
	items,
	loadMoreItems,
}: FileGridProps) {
	const gridRef = useRef<HTMLDivElement>(null);
	const loadMoreRef = useRef<HTMLDivElement>(null);
	const [containerWidth, setContainerWidth] = useState(window.innerWidth);
	const [isScrolling, setIsScrolling] = useState(false);
	const scrollingTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

	// Configurar el observer para infinite scroll
	useEffect(() => {
		if (!loadMoreRef.current || !loadMoreItems) return;

		const observer = new IntersectionObserver(
			(entries) => {
				const [entry] = entries;
				if (entry?.isIntersecting) {
					loadMoreItems();
				}
			},
			{
				rootMargin: "800px 0px",
				threshold: 0,
			}
		);

		observer.observe(loadMoreRef.current);
		return () => observer.disconnect();
	}, [loadMoreItems]);

	// Usar ResizeObserver para detectar cambios en el contenedor
	useEffect(() => {
		if (!gridRef.current) return;

		const resizeObserver = new ResizeObserver((entries) => {
			const width = entries[0].contentRect.width;
			if (width > 0) {
				setContainerWidth(width);
			}
		});

		resizeObserver.observe(gridRef.current);
		return () => resizeObserver.disconnect();
	}, []);

	// Memoizar el cálculo de dimensiones del grid
	const { columns, itemSize } = useMemo(() => {
		const availableWidth = containerWidth;
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

	// Calcular el número de filas
	const rowCount = Math.ceil(items.length / columns);

	// Configurar el virtualizador con opciones optimizadas
	const rowVirtualizer = useVirtualizer({
		count: rowCount,
		getScrollElement: () => gridRef.current,
		estimateSize: useCallback(() => itemSize, [itemSize]),
		overscan: isScrolling ? 5 : GRID_CONFIG.overscanCount,
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

	// Cleanup del timeout de scrolling
	useEffect(() => {
		return () => {
			if (scrollingTimeoutRef.current) {
				clearTimeout(scrollingTimeoutRef.current);
			}
		};
	}, []);

	// Función para verificar si un item ya ha sido renderizado
	const isItemRendered = useCallback((itemId: string) => {
		return globalRenderedItems.has(itemId);
	}, []);

	// Función para marcar un item como renderizado
	const markItemAsRendered = useCallback((itemId: string) => {
		globalRenderedItems.add(itemId);
	}, []);

	return (
		<div
			ref={gridRef}
			className={cn(
				"h-full w-full overflow-auto relative",
				"scrollbar-thin scrollbar-thumb-secondary scrollbar-track-transparent",
				"hover:scrollbar-thumb-secondary/80"
			)}
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
									columnGap: `${GRID_CONFIG.gap}px`,
								}}
							>
								{rowItems.map((item, columnIndex) => {
									const index = rowStartIndex + columnIndex;
									const hasBeenRendered = isItemRendered(item.id);

									if (!hasBeenRendered) {
										markItemAsRendered(item.id);
									}

									return (
										<div key={item.id} className="relative w-full">
											<FileCard
												item={item}
												onClick={onItemClick}
												onDoubleClick={onItemDoubleClick}
												index={index}
												totalColumns={columns}
												shouldLoad={!isScrolling || hasBeenRendered}
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
