"use client";

import { useCallback, useEffect, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { FileCard } from "./file-card";
import { useInView } from "react-intersection-observer";
import type { FileItem } from "@/types/file-item";

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
	gap: 0, // Eliminamos el gap entre items
	itemBaseWidth: 200,
	itemAspectRatio: 1.2, // Ajustamos para un aspecto más rectangular (16:9 ≈ 1.77)
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

	useEffect(() => {
		if (inView && loadMoreItems) {
			loadMoreItems();
		}
	}, [inView, loadMoreItems]);

	// Cálculo dinámico del tamaño de la grilla
	const calculateGridDimensions = () => {
		const containerWidth = parentRef.current?.offsetWidth || window.innerWidth;
		// Ya no restamos gap porque lo eliminamos
		const availableWidth = containerWidth;

		// Calculamos el ancho mínimo por item
		const minItemWidth = Math.floor(availableWidth / GRID_CONFIG.minColumns);
		const itemWidth = Math.min(GRID_CONFIG.itemBaseWidth, minItemWidth);

		// Calculamos columnas para ocupar todo el ancho
		const columns = Math.max(
			GRID_CONFIG.minColumns,
			Math.floor(availableWidth / itemWidth)
		);

		// Ajustamos el itemWidth final para que ocupe exactamente el ancho disponible
		const finalItemWidth = availableWidth / columns;

		return {
			itemWidth: finalItemWidth,
			itemHeight: finalItemWidth * GRID_CONFIG.itemAspectRatio,
			columns,
		};
	};

	const { itemWidth, itemHeight, columns } = calculateGridDimensions();
	const rowCount = Math.ceil(items.length / columns);

	const virtualizer = useVirtualizer({
		count: rowCount,
		getScrollElement: () => parentRef.current,
		estimateSize: () => itemHeight + GRID_CONFIG.gap,
		overscan: 3,
	});

	const getItemsForRow = useCallback(
		(rowIndex: number) => {
			const startIndex = rowIndex * columns;
			return items.slice(startIndex, startIndex + columns);
		},
		[items, columns]
	);

	return (
		<div ref={parentRef} className="h-full w-full overflow-auto">
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
						{getItemsForRow(virtualRow.index).map((item, index) => (
							<div
								key={item.id}
								className="border-r border-1 border-white/10 last:border-r-0"
							>
								<FileCard
									item={item}
									onClick={onItemClick}
									onDoubleClick={onItemDoubleClick}
									style={{
										width: "100%",
										height: "100%",
									}}
									index={index}
								/>
							</div>
						))}
					</div>
				))}
			</div>
			<div ref={loadMoreRef} className="h-10 w-full" />
		</div>
	);
}
