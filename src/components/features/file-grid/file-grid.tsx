"use client";

import { useCallback, useEffect, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { FileCard } from "./file-card";
import { useFilesStore } from "@/store/files";
import { useSettingsStore } from "@/store/settings";
import { cn } from "@/lib/utils";
import { useInView } from "react-intersection-observer";
import type { FileItem } from "@/types/file-item";

interface FileGridProps {
	viewMode?: "grid" | "list";
	selectedItem?: FileItem | null;
	selectedIds?: string[];
	onItemClick?: (item: FileItem) => void;
	onItemDoubleClick?: (item: FileItem) => void;
	isResizing?: boolean;
	items: FileItem[];
	loadMoreItems?: () => void;
}

// Configuración base del grid
const GRID_CONFIG = {
	minColumns: 4,
	gap: 16, // 1rem = 16px
	itemBaseWidth: 200,
	itemAspectRatio: 1.2, // altura = ancho * 1.2 para metadata
} as const;

export function FileGrid({
	viewMode = "grid",
	selectedItem,
	selectedIds,
	onItemClick,
	onItemDoubleClick,
	isResizing,
	items,
	loadMoreItems,
}: FileGridProps) {
	const parentRef = useRef<HTMLDivElement>(null);

	const { ref: loadMoreRef, inView } = useInView({
		threshold: 0.1,
		rootMargin: "100px",
	});

	useEffect(() => {
		if (inView && loadMoreItems) {
			loadMoreItems();
		}
	}, [inView, loadMoreItems]);

	// Cálculo dinámico del tamaño de la grilla
	const calculateGridDimensions = () => {
		const containerWidth = parentRef.current?.offsetWidth || window.innerWidth;
		const availableWidth = containerWidth - GRID_CONFIG.gap; // Restamos el gap inicial
		const minItemWidth = Math.floor(
			(availableWidth - (GRID_CONFIG.minColumns - 1) * GRID_CONFIG.gap) /
				GRID_CONFIG.minColumns
		);
		const itemWidth = Math.min(GRID_CONFIG.itemBaseWidth, minItemWidth);
		const columns = Math.max(
			GRID_CONFIG.minColumns,
			Math.floor(
				(availableWidth + GRID_CONFIG.gap) / (itemWidth + GRID_CONFIG.gap)
			)
		);

		return {
			itemWidth,
			itemHeight: Math.floor(itemWidth * GRID_CONFIG.itemAspectRatio),
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
		scrollingDelay: isResizing ? 1000 : 150,
	});

	const getItemsForRow = useCallback(
		(rowIndex: number) => {
			const startIndex = rowIndex * columns;
			return items.slice(startIndex, startIndex + columns);
		},
		[items, columns]
	);

	return (
		<div
			ref={parentRef}
			className="h-full w-full overflow-auto"
			style={{
				contain: "layout style paint",
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
							gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
							gap: `${GRID_CONFIG.gap}px`,
							padding: `0 ${GRID_CONFIG.gap}px`,
						}}
					>
						{getItemsForRow(virtualRow.index).map((item) => (
							<FileCard
								key={item.id}
								item={item}
								isSelected={selectedIds?.includes(item.id)}
								onClick={onItemClick}
								onDoubleClick={onItemDoubleClick}
								style={{
									width: "100%",
									height: "100%",
								}}
							/>
						))}
					</div>
				))}
			</div>
			<div ref={loadMoreRef} className="h-4 w-full" />
		</div>
	);
}
