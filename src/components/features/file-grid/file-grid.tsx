"use client";

import { useCallback, useEffect, useRef, useMemo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { FileCard } from "./file-card";
import { useInView } from "react-intersection-observer";
import type { FileItem } from "@/types/file-item";
import { AnimationProvider } from "./animation-context";
import { ScrollArea } from "@/components/ui/scroll-area";

// Buffer de items para mantener en memoria
const BUFFER_SIZE = 100;

interface FileGridProps {
	onItemClick?: (item: FileItem) => void;
	onItemDoubleClick?: (item: FileItem) => void;
	isResizing?: boolean;
	items: FileItem[];
	loadMoreItems?: () => void;
}

// Configuración base del grid
const GRID_CONFIG = {
	minColumns: 5,
	gap: 0,
	itemBaseWidth: 200,
	itemAspectRatio: 1.2,
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

	// Mantener un registro de los índices visibles
	const visibleIndicesRef = useRef<{ start: number; end: number }>({
		start: 0,
		end: 0,
	});

	// Buffer de items renderizados
	const bufferedItemsRef = useRef<{ [key: number]: boolean }>({});

	// Cálculo dinámico del tamaño de la grilla
	const { itemWidth, itemHeight, columns } = useMemo(() => {
		const containerWidth = parentRef.current?.offsetWidth || window.innerWidth;
		const availableWidth = containerWidth;
		const minItemWidth = Math.floor(availableWidth / GRID_CONFIG.minColumns);
		const itemWidth = Math.min(GRID_CONFIG.itemBaseWidth, minItemWidth);
		const columns = Math.max(
			GRID_CONFIG.minColumns,
			Math.floor(availableWidth / itemWidth)
		);
		const finalItemWidth = availableWidth / columns;

		return {
			itemWidth: finalItemWidth,
			itemHeight: finalItemWidth * GRID_CONFIG.itemAspectRatio,
			columns,
		};
	}, [parentRef.current?.offsetWidth]);

	const rowCount = Math.ceil(items.length / columns);

	const virtualizer = useVirtualizer({
		count: rowCount,
		getScrollElement: () => parentRef.current,
		estimateSize: () => itemHeight + GRID_CONFIG.gap,
		overscan: 3,
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
				<div ref={parentRef} className="h-full w-full">
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
									height: `${itemHeight}px`,
									transform: `translateY(${virtualRow.start}px)`,
									display: "grid",
									gridTemplateColumns: `repeat(${columns}, 1fr)`,
									gap: 0,
									padding: 0,
									borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
								}}
							>
								{getItemsForRow(virtualRow.index).map((item, colIndex) => {
									const itemIndex = virtualRow.index * columns + colIndex;
									const shouldRender = isItemBuffered(itemIndex);

									return (
										<div
											key={item.id}
											className="border-r border-1 border-white/10 last:border-r-0"
										>
											{shouldRender && (
												<FileCard
													item={item}
													onClick={onItemClick}
													onDoubleClick={onItemDoubleClick}
													style={{
														width: "100%",
														height: "100%",
													}}
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
					<div ref={loadMoreRef} className="h-10 w-full" />
				</div>
			</ScrollArea>
		</AnimationProvider>
	);
}
