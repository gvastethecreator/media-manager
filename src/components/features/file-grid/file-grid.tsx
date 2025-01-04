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
	OVERSCAN_ROWS: 1, // Reducido para mejor rendimiento
	LOAD_BATCH_ROWS: 1, // Cargar una fila a la vez
	LOAD_DELAY: 100, // Reducido el delay
	SCROLL_THRESHOLD: 100, // px antes del final para cargar más
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
	gap: 0, // Añadido gap para mejor espaciado
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

	// Estado para controlar qué items están listos para cargar
	const [itemsToLoad, setItemsToLoad] = useState<Set<number>>(new Set());
	const loadingBatchRef = useRef<NodeJS.Timeout | null>(null);

	// Usar ResizeObserver para detectar cambios en el contenedor
	const [containerWidth, setContainerWidth] = useState(0);

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

	// Memoizar el cálculo de filas
	const rowCount = useMemo(
		() => Math.ceil(items.length / columns),
		[items.length, columns]
	);

	// Sistema de carga progresiva por filas
	const loadItemsBatch = useCallback(() => {
		setItemsToLoad((prev) => {
			const newSet = new Set(prev);
			const currentRow = Math.floor(visibleIndicesRef.current.start / columns);
			let rowsLoaded = 0;

			// Procesar fila por fila desde la posición actual
			for (
				let row = currentRow;
				row < rowCount && rowsLoaded < BUFFER_CONFIG.LOAD_BATCH_ROWS;
				row++
			) {
				const rowStartIndex = row * columns;
				const rowEndIndex = Math.min(rowStartIndex + columns, items.length);
				let rowHasNewItems = false;

				// Verificar si la fila está en el buffer y no ha sido cargada
				for (let i = rowStartIndex; i < rowEndIndex; i++) {
					if (bufferedItemsRef.current.has(i) && !prev.has(i)) {
						newSet.add(i);
						rowHasNewItems = true;
					}
				}

				if (rowHasNewItems) {
					rowsLoaded++;
				}
			}

			// Si quedan filas por cargar, programar el siguiente lote
			if (rowsLoaded === BUFFER_CONFIG.LOAD_BATCH_ROWS) {
				if (loadingBatchRef.current) {
					clearTimeout(loadingBatchRef.current);
				}
				loadingBatchRef.current = setTimeout(
					loadItemsBatch,
					BUFFER_CONFIG.LOAD_DELAY
				);
			}

			return newSet;
		});
	}, [columns, rowCount, items.length]);

	// Gestión del buffer y visibilidad mejorada
	const bufferedItemsRef = useRef<Set<number>>(new Set());
	const visibleIndicesRef = useRef<{ start: number; end: number }>({
		start: 0,
		end: 0,
	});

	const virtualizer = useVirtualizer({
		count: rowCount,
		getScrollElement: () => parentRef.current,
		estimateSize: () => itemHeight,
		overscan: BUFFER_CONFIG.OVERSCAN_ROWS,
		onChange: (instance) => {
			if (!instance.range) return;

			const startRow = instance.range.startIndex;
			const endRow = instance.range.endIndex;
			const visibleStartIndex = startRow * columns;
			const visibleEndIndex = Math.min((endRow + 1) * columns, items.length);

			// Actualizar índices visibles
			visibleIndicesRef.current = {
				start: visibleStartIndex,
				end: visibleEndIndex,
			};

			// Calcular el buffer incluyendo el overscan
			const overscanStart = Math.max(0, startRow - BUFFER_CONFIG.OVERSCAN_ROWS);
			const overscanEnd = Math.min(
				rowCount,
				endRow + BUFFER_CONFIG.OVERSCAN_ROWS
			);
			const newBuffer = new Set<number>();

			// Añadir al buffer solo los items en el rango visible + overscan
			for (let row = overscanStart; row <= overscanEnd; row++) {
				const rowStartIndex = row * columns;
				const rowEndIndex = Math.min(rowStartIndex + columns, items.length);
				for (let i = rowStartIndex; i < rowEndIndex; i++) {
					newBuffer.add(i);
				}
			}

			// Solo actualizar si hay cambios en el buffer
			const hasChanges = Array.from(newBuffer).some(
				(index) => !bufferedItemsRef.current.has(index)
			);

			if (hasChanges) {
				bufferedItemsRef.current = newBuffer;

				// Programar carga del siguiente lote
				if (loadingBatchRef.current) {
					clearTimeout(loadingBatchRef.current);
				}
				loadingBatchRef.current = setTimeout(
					loadItemsBatch,
					BUFFER_CONFIG.LOAD_DELAY
				);
			}
		},
	});

	// Optimizar la función getItemsForRow
	const getItemsForRow = useCallback(
		(rowIndex: number) => {
			const startIndex = rowIndex * columns;
			return items.slice(startIndex, startIndex + columns);
		},
		[items, columns]
	);

	useEffect(() => {
		if (inView && loadMoreItems) {
			loadMoreItems();
		}
	}, [inView, loadMoreItems]);

	const isItemBuffered = useCallback(
		(index: number) => bufferedItemsRef.current.has(index),
		[]
	);

	const shouldLoadItem = useCallback(
		(index: number) => itemsToLoad.has(index),
		[itemsToLoad]
	);

	// Manejo de scroll optimizado
	const handleScroll = useCallback(() => {
		if (!parentRef.current) return;

		const { scrollTop, scrollHeight, clientHeight } = parentRef.current;
		const bottomThreshold =
			scrollHeight - clientHeight - BUFFER_CONFIG.SCROLL_THRESHOLD;

		setShouldLoadMore(scrollTop > bottomThreshold);
	}, []);

	useEffect(() => {
		const scrollElement = parentRef.current;
		if (!scrollElement) return;

		scrollElement.addEventListener("scroll", handleScroll);
		return () => scrollElement.removeEventListener("scroll", handleScroll);
	}, [handleScroll]);

	useEffect(() => {
		if (shouldLoadMore && loadMoreItems) {
			loadMoreItems();
			setShouldLoadMore(false);
		}
	}, [shouldLoadMore, loadMoreItems]);

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
				<AnimatePresence mode="popLayout">
					{virtualizer.getVirtualItems().map((virtualRow) => {
						const rowItems = getItemsForRow(virtualRow.index);

						return (
							<motion.div
								key={virtualRow.index}
								initial={{ opacity: 0 }}
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
								{rowItems.map((item, colIndex) => {
									const itemIndex = virtualRow.index * columns + colIndex;
									const isBuffered = isItemBuffered(itemIndex);
									const shouldLoad = shouldLoadItem(itemIndex);
									const { row, col } = calculateItemPosition(
										itemIndex,
										columns
									);

									return (
										<motion.div
											key={item.id}
											initial={{ opacity: 0, scale: 0.9 }}
											animate={{ opacity: 1, scale: 1 }}
											transition={{
												type: "spring",
												stiffness: 100,
												damping: 15,
												mass: 0.1,
												delay: (row * 0.1 + col * 0.05) * 0.3,
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
													shouldLoad={shouldLoad}
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
