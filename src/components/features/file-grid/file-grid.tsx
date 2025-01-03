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
}

export function FileGrid({
	viewMode = "grid",
	selectedItem,
	selectedIds,
	onItemClick,
	onItemDoubleClick,
	isResizing,
}: FileGridProps) {
	const { thumbnailSize } = useSettingsStore();
	const { displayedItems, loadMoreItems } = useFilesStore();
	const parentRef = useRef<HTMLDivElement>(null);

	// Configuración del observador para carga infinita
	const { ref: loadMoreRef, inView } = useInView({
		threshold: 0.1,
		rootMargin: "100px",
	});

	// Cargar más items cuando el observador está en vista
	useEffect(() => {
		if (inView) {
			loadMoreItems();
		}
	}, [inView, loadMoreItems]);

	// Calcular dimensiones de la cuadrícula
	const columnWidth =
		thumbnailSize === "sm" ? 150 : thumbnailSize === "md" ? 200 : 250;
	const rowHeight = columnWidth + 32; // altura = ancho + padding
	const columnCount = Math.floor(
		(parentRef.current?.offsetWidth || 0) / columnWidth
	);
	const rowCount = Math.ceil(displayedItems.length / (columnCount || 1));

	const virtualizer = useVirtualizer({
		count: rowCount,
		getScrollElement: () => parentRef.current,
		estimateSize: () => rowHeight,
		overscan: Math.min(5, Math.ceil(rowCount * 0.1)),
		scrollingDelay: isResizing ? 1000 : 150,
	});

	const getItemsForRow = useCallback(
		(rowIndex: number) => {
			const startIndex = rowIndex * columnCount;
			return displayedItems.slice(startIndex, startIndex + columnCount);
		},
		[displayedItems, columnCount]
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
							height: `${rowHeight}px`,
							transform: `translateY(${virtualRow.start}px)`,
						}}
						className={cn("grid auto-rows-[1fr] gap-4", {
							"grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8":
								thumbnailSize === "sm",
							"grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6":
								thumbnailSize === "md",
							"grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5":
								thumbnailSize === "lg",
						})}
					>
						{getItemsForRow(virtualRow.index).map((item) => (
							<FileCard
								key={item.id}
								item={item}
								size={thumbnailSize}
								isSelected={selectedIds?.includes(item.id)}
								onClick={onItemClick}
								onDoubleClick={onItemDoubleClick}
							/>
						))}
					</div>
				))}
			</div>
			<div ref={loadMoreRef} className="h-4 w-full" />
		</div>
	);
}
