"use client";

import { useCallback, useEffect, useRef, useMemo, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { FileCard } from "./file-card";
import { useInView } from "react-intersection-observer";
import type { FileItem } from "@/types/file-item";
import { AnimationProvider } from "./animation-context";
import { ScrollArea } from "@/components/ui/scroll-area";

// Buffer de items para mantener en memoria
const BUFFER_SIZE = 1;

interface FileGridProps {
	onItemClick?: (item: FileItem) => void;
	onItemDoubleClick?: (item: FileItem) => void;
	isResizing?: boolean;
	items: FileItem[];
	loadMoreItems?: () => void;
}

// Configuración base del grid con valores más flexibles
const GRID_CONFIG = {
	minColumns: 2,
	maxColumns: 8,
	gap: 1,
	itemBaseWidth: 180,
	itemAspectRatio: 1,
	breakpoints: {
		sm: 640,
		md: 768,
		lg: 1024,
		xl: 1280,
	},
} as const;

export function FileGrid({
	onItemClick,
	onItemDoubleClick,
	isResizing,
	items,
	loadMoreItems,
}: FileGridProps) {
	const parentRef = useRef<HTMLDivElement>(null);
	const { ref: loadMoreRef, inView } = useInView({
		threshold: 0,
	});

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

	// Mantener un registro de los índices visibles
	const visibleIndicesRef = useRef<{ start: number; end: number }>({
		start: 0,
		end: 0,
	});

	// Buffer de items renderizados
	const bufferedItemsRef = useRef<{ [key: number]: boolean }>({});

	// Cálculo dinámico del tamaño de la grilla basado en el ancho del contenedor
	const { itemWidth, itemHeight, columns } = useMemo(() => {
		const availableWidth = containerWidth || window.innerWidth;

		// Calcular columnas basado en breakpoints
		let targetColumns = Math.floor(availableWidth / GRID_CONFIG.itemBaseWidth);
		targetColumns = Math.max(
			GRID_CONFIG.minColumns,
			Math.min(GRID_CONFIG.maxColumns, targetColumns)
		);

		// Calcular el ancho real del item considerando gaps
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

	const rowCount = Math.ceil(items.length / columns);

	const virtualizer = useVirtualizer({
		count: rowCount,
		getScrollElement: () => parentRef.current,
		estimateSize: () => itemHeight,
		overscan: 6,
		onChange: (instance) => {
			if (!instance.range) return;

			const startRow = instance.range.startIndex;
			const endRow = instance.range.endIndex;

			// Actualizar índices visibles
			visibleIndicesRef.current = {
				start: startRow * columns,
				end: Math.min((endRow + 1) * columns, items.length),
			};

			// Actualizar buffer
			const newBuffer: { [key: number]: boolean } = {};
			const bufferStart = Math.max(
				0,
				visibleIndicesRef.current.start - BUFFER_SIZE
			);
			const bufferEnd = Math.min(
				items.length,
				visibleIndicesRef.current.end + BUFFER_SIZE
			);

			for (let i = bufferStart; i < bufferEnd; i++) {
				newBuffer[i] = true;
			}
			bufferedItemsRef.current = newBuffer;
		},
	});

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

	const isItemBuffered = useCallback((index: number) => {
		return !!bufferedItemsRef.current[index];
	}, []);

	return (
		<AnimationProvider>
			<ScrollArea className="h-full w-full">
				<div
					ref={parentRef}
					className="h-full w-full overflow-hidden"
					style={{
						padding: `${GRID_CONFIG.gap}px`,
					}}
				>
					<div
						style={{
							height: `${virtualizer.getTotalSize()}px`,
							width: "100%",
							position: "relative",
						}}
					>
						{virtualizer.getVirtualItems().map((virtualRow) => (
							<div
								key={virtualRow.index}
								style={{
									position: "absolute",
									top: 0,
									left: 0,
									width: "100%",
									height: `${itemHeight + GRID_CONFIG.gap}px`,
									transform: `translateY(${virtualRow.start}px)`,
									display: "grid",
									gridTemplateColumns: `repeat(${columns}, 1fr)`,
									gap: `${GRID_CONFIG.gap}px`,
									padding: `${GRID_CONFIG.gap}px`,
								}}
							>
								{getItemsForRow(virtualRow.index).map((item, colIndex) => {
									const itemIndex = virtualRow.index * columns + colIndex;
									const shouldRender = isItemBuffered(itemIndex);

									return (
										<div
											key={item.id}
											style={{
												width: "100%",
												height: "100%",
											}}
										>
											{shouldRender && (
												<FileCard
													item={item}
													onClick={onItemClick}
													onDoubleClick={onItemDoubleClick}
													index={itemIndex}
													totalColumns={columns}
												/>
											)}
										</div>
									);
								})}
							</div>
						))}
					</div>
					<div ref={loadMoreRef} className="h-5 w-full" />
				</div>
			</ScrollArea>
		</AnimationProvider>
	);
}
