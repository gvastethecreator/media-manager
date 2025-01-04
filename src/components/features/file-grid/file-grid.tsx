"use client";

import { useCallback, useEffect, useRef, useMemo, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { FileCard } from "./file-card";
import { useInView } from "react-intersection-observer";
import type { FileItem } from "@/types/file-item";
import { AnimationProvider } from "./animation-context";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

// Configuración del buffer y carga
const BUFFER_CONFIG = {
	OVERSCAN_ROWS: 2, // Aumentado para mejor buffer
	LOAD_BATCH_ROWS: 2, // Aumentado para cargar más elementos a la vez
	LOAD_DELAY: 50, // Reducido para mejor respuesta
	SCROLL_THRESHOLD: 200, // Aumentado para cargar antes
} as const;

interface FileGridProps {
	onItemClick?: (item: FileItem) => void;
	onItemDoubleClick?: (item: FileItem) => void;
	isResizing?: boolean;
	items: FileItem[];
	loadMoreItems?: () => void;
}

// Configuración de animaciones
const ANIMATION_CONFIG = {
	STAGGER_DELAY: 0.02,
	INITIAL_DELAY: 0.3,
	BATCH_SIZE: 10, // Número de items a animar por lote
} as const;

// Optimizar la configuración del grid
const GRID_CONFIG = {
	minColumns: 3,
	maxColumns: 6,
	gap: 0,
	itemBaseWidth: 200,
	itemAspectRatio: 1,
	breakpoints: {
		sm: 640,
		md: 768,
		lg: 1024,
		xl: 1280,
	},
} as const;

// Memoizar el cálculo de la posición del item
const calculateItemPosition = (index: number, columns: number) => {
	const row = Math.floor(index / columns);
	const col = index % columns;
	return { row, col };
};

// Cache global persistente para mantener los elementos renderizados
const globalRenderedItems = new Set<string>();

export function FileGrid({
	onItemClick,
	onItemDoubleClick,
	isResizing,
	items,
	loadMoreItems,
}: FileGridProps) {
	const parentRef = useRef<HTMLDivElement>(null);
	const [shouldLoadMore, setShouldLoadMore] = useState(false);
	const { ref: loadMoreRef, inView } = useInView({
		threshold: 0,
	});

	// Referencia para mantener el estado de animación
	const animationQueue = useRef<Map<string, number>>(new Map());
	const lastAnimationTime = useRef<number>(Date.now());
	const bufferedItemsRef = useRef<Set<number>>(new Set());
	const [containerWidth, setContainerWidth] = useState(0);

	// Usar ResizeObserver para detectar cambios en el contenedor
	useEffect(() => {
		if (!parentRef.current) return;

		const resizeObserver = new ResizeObserver((entries) => {
			for (const entry of entries) {
				const width = entry.contentRect.width;
				setContainerWidth(width);
			}
		});

		resizeObserver.observe(parentRef.current);
		return () => resizeObserver.disconnect();
	}, []);

	// Función para verificar si un item ya ha sido renderizado
	const isItemRendered = useCallback((itemId: string) => {
		return globalRenderedItems.has(itemId);
	}, []);

	// Función para marcar un item como renderizado
	const markItemAsRendered = useCallback((itemId: string) => {
		globalRenderedItems.add(itemId);
	}, []);

	// Función para calcular el delay de animación
	const calculateAnimationDelay = useCallback((index: number) => {
		const now = Date.now();
		const timeSinceLastAnimation = now - lastAnimationTime.current;
		const baseDelay = Math.max(0, 50 - timeSinceLastAnimation);
		const itemDelay = index * 50;
		return baseDelay + itemDelay;
	}, []);

	// Memoizar el cálculo de dimensiones del grid
	const { itemWidth, itemHeight, columns } = useMemo(() => {
		const availableWidth = containerWidth || window.innerWidth;
		let targetColumns = Math.floor(availableWidth / GRID_CONFIG.itemBaseWidth);
		targetColumns = Math.max(
			GRID_CONFIG.minColumns,
			Math.min(GRID_CONFIG.maxColumns, targetColumns)
		);

		const totalGapWidth = (targetColumns - 1) * GRID_CONFIG.gap;
		const itemWidth = Math.floor(
			(availableWidth - totalGapWidth) / targetColumns
		);

		return {
			itemWidth,
			itemHeight: Math.floor(itemWidth * GRID_CONFIG.itemAspectRatio),
			columns: targetColumns,
		};
	}, [containerWidth]);

	// Optimizar la función getItemsForRow
	const getItemsForRow = useCallback(
		(rowIndex: number) => {
			const startIndex = rowIndex * columns;
			return items.slice(startIndex, startIndex + columns);
		},
		[items, columns]
	);

	// Función para verificar si un item está en el buffer
	const isItemBuffered = useCallback(
		(index: number) => bufferedItemsRef.current.has(index),
		[]
	);

	const virtualizer = useVirtualizer({
		count: Math.ceil(items.length / columns),
		getScrollElement: () => parentRef.current,
		estimateSize: () => itemHeight,
		overscan: BUFFER_CONFIG.OVERSCAN_ROWS,
		onChange: (instance) => {
			if (!instance.range) return;

			const startRow = instance.range.startIndex;
			const endRow = instance.range.endIndex;
			const visibleStartIndex = startRow * columns;
			const visibleEndIndex = Math.min((endRow + 1) * columns, items.length);

			// Marcar items visibles como renderizados y calcular sus delays
			for (let i = visibleStartIndex; i < visibleEndIndex; i++) {
				const item = items[i];
				if (item && !isItemRendered(item.id)) {
					const delay = calculateAnimationDelay(i - visibleStartIndex);
					animationQueue.current.set(item.id, delay);
					markItemAsRendered(item.id);
					lastAnimationTime.current = Date.now() + delay;
				}
			}

			// Actualizar buffer
			const overscanStart = Math.max(0, startRow - BUFFER_CONFIG.OVERSCAN_ROWS);
			const overscanEnd = Math.min(
				Math.ceil(items.length / columns),
				endRow + BUFFER_CONFIG.OVERSCAN_ROWS
			);

			const newBuffer = new Set<number>();
			for (let row = overscanStart; row <= overscanEnd; row++) {
				const rowStartIndex = row * columns;
				const rowEndIndex = Math.min(rowStartIndex + columns, items.length);
				for (let i = rowStartIndex; i < rowEndIndex; i++) {
					newBuffer.add(i);
				}
			}

			bufferedItemsRef.current = newBuffer;
		},
	});

	// Manejo de scroll infinito
	useEffect(() => {
		if (inView && loadMoreItems) {
			loadMoreItems();
		}
	}, [inView, loadMoreItems]);

	return (
		<div
			ref={parentRef}
			className={cn(
				"h-full w-full overflow-auto relative",
				"scrollbar-thin scrollbar-thumb-secondary scrollbar-track-transparent",
				"hover:scrollbar-thumb-secondary/80"
			)}
			style={{
				padding: `${GRID_CONFIG.gap}px`,
				willChange: "transform",
				contain: "size layout paint",
			}}
		>
			<div
				style={{
					height: `${virtualizer.getTotalSize()}px`,
					width: "100%",
					position: "relative",
				}}
			>
				<AnimatePresence mode="popLayout" initial={false}>
					{virtualizer.getVirtualItems().map((virtualRow) => {
						const rowItems = getItemsForRow(virtualRow.index);

						return (
							<motion.div
								key={virtualRow.index}
								initial={false}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								style={{
									position: "absolute",
									top: 0,
									left: 0,
									width: "100%",
									height: `${itemHeight}px`,
									transform: `translateY(${virtualRow.start}px)`,
									display: "grid",
									gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
									gap: `${GRID_CONFIG.gap}px`,
									padding: `${GRID_CONFIG.gap / 2}px`,
									willChange: "transform",
								}}
							>
								{rowItems.map((item: FileItem, colIndex: number) => {
									const itemIndex = virtualRow.index * columns + colIndex;
									const isBuffered = isItemBuffered(itemIndex);
									const hasBeenRendered = isItemRendered(item.id);
									const animationDelay =
										animationQueue.current.get(item.id) || 0;

									return (
										<motion.div
											key={item.id}
											initial={
												hasBeenRendered ? false : { opacity: 0, scale: 0.8 }
											}
											animate={{ opacity: 1, scale: 1 }}
											transition={{
												type: "spring",
												stiffness: 100,
												damping: 15,
												mass: 0.1,
												delay: hasBeenRendered ? 0 : animationDelay / 1000,
											}}
											className="relative w-full h-full"
										>
											{isBuffered && (
												<FileCard
													item={item}
													onClick={onItemClick}
													onDoubleClick={onItemDoubleClick}
													index={itemIndex}
													totalColumns={columns}
													shouldLoad={true}
													hasBeenRendered={hasBeenRendered}
												/>
											)}
										</motion.div>
									);
								})}
							</motion.div>
						);
					})}
				</AnimatePresence>
			</div>
		</div>
	);
}
