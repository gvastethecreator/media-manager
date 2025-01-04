"use client";

import { useCallback, useEffect, useRef, useMemo, useState } from "react";
import { FileCard } from "./file-card";
import type { FileItem } from "@/types/file-item";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useVirtualizer } from "@tanstack/react-virtual";

// Cache global persistente para mantener los elementos renderizados
const globalRenderedItems = new Set<string>();

// Optimizar la configuración del grid
const GRID_CONFIG = {
	minColumns: 3,
	maxColumns: 6,
	gap: 1,
	itemBaseWidth: 200,
	itemAspectRatio: 1,
	overscanCount: 3,
	scrollingDelay: 150,
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
	isResizing?: boolean;
	items: FileItem[];
	loadMoreItems?: () => void;
}

export function FileGrid({
	onItemClick,
	onItemDoubleClick,
	isResizing,
	items,
	loadMoreItems,
}: FileGridProps) {
	const gridRef = useRef<HTMLDivElement>(null);
	const loadMoreRef = useRef<HTMLDivElement>(null);
	const [containerWidth, setContainerWidth] = useState(0);
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
			for (const entry of entries) {
				const width = entry.contentRect.width;
				// Debounce del resize para evitar recálculos innecesarios
				requestAnimationFrame(() => {
					setContainerWidth(width);
				});
			}
		});

		resizeObserver.observe(gridRef.current);
		return () => resizeObserver.disconnect();
	}, []);

	// Memoizar el cálculo de dimensiones del grid
	const { columns, itemSize, rowHeight } = useMemo(() => {
		const availableWidth = containerWidth || window.innerWidth;
		let targetColumns = Math.floor(availableWidth / GRID_CONFIG.itemBaseWidth);
		targetColumns = Math.max(
			GRID_CONFIG.minColumns,
			Math.min(GRID_CONFIG.maxColumns, targetColumns)
		);

		// Calculamos el tamaño del item considerando el gap
		const itemSize = Math.floor(
			(availableWidth - (targetColumns - 1) * GRID_CONFIG.gap) / targetColumns
		);

		// La altura de la fila es igual al tamaño del item
		const rowHeight = itemSize;

		return { columns: targetColumns, itemSize, rowHeight };
	}, [containerWidth]);

	// Calcular el número de filas
	const rowCount = Math.ceil(items.length / columns);

	// Configurar el virtualizador con opciones optimizadas
	const rowVirtualizer = useVirtualizer({
		count: rowCount,
		getScrollElement: () => gridRef.current,
		estimateSize: useCallback(() => rowHeight, [rowHeight]),
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
				willChange: "transform",
			}}
		>
			<div
				style={{
					height: `${rowVirtualizer.getTotalSize()}px`,
					width: "100%",
					position: "relative",
					willChange: "transform",
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
								height: `${rowHeight}px`,
								transform: `translateY(${virtualRow.start}px)`,
								willChange: "transform",
							}}
						>
							<div
								className="grid h-full"
								style={{
									gridTemplateColumns: `repeat(${columns}, 1fr)`,
									gap: `${GRID_CONFIG.gap}px`,
								}}
							>
								{rowItems.map((item, columnIndex) => {
									const index = rowStartIndex + columnIndex;
									const hasBeenRendered = isItemRendered(item.id);

									if (!hasBeenRendered) {
										markItemAsRendered(item.id);
									}

									return (
										<motion.div
											key={item.id}
											className="relative w-full aspect-square"
											initial={{ opacity: 0 }}
											animate={{ opacity: 1 }}
											transition={{ duration: 0.2 }}
											layout
										>
											<FileCard
												item={item}
												onClick={onItemClick}
												onDoubleClick={onItemDoubleClick}
												index={index}
												totalColumns={columns}
												shouldLoad={!isScrolling || hasBeenRendered}
												hasBeenRendered={hasBeenRendered}
											/>
										</motion.div>
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
