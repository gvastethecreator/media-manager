"use client";

import { useCallback, useEffect, useRef, useMemo, useState } from "react";
import { FileCard } from "./file-card";
import { useInView } from "react-intersection-observer";
import type { FileItem } from "@/types/file-item";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

// Cache global persistente para mantener los elementos renderizados
const globalRenderedItems = new Set<string>();

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
	const [containerWidth, setContainerWidth] = useState(0);

	// Observer para infinite scroll con un margen mayor
	const { ref: loadMoreRef, inView } = useInView({
		threshold: 0,
		rootMargin: "500px", // Aumentado para cargar más anticipadamente
	});

	// Usar ResizeObserver para detectar cambios en el contenedor
	useEffect(() => {
		if (!gridRef.current) return;

		const resizeObserver = new ResizeObserver((entries) => {
			for (const entry of entries) {
				const width = entry.contentRect.width;
				setContainerWidth(width);
			}
		});

		resizeObserver.observe(gridRef.current);
		return () => resizeObserver.disconnect();
	}, []);

	// Memoizar el cálculo de dimensiones del grid
	const { columns } = useMemo(() => {
		const availableWidth = containerWidth || window.innerWidth;
		let targetColumns = Math.floor(availableWidth / GRID_CONFIG.itemBaseWidth);
		targetColumns = Math.max(
			GRID_CONFIG.minColumns,
			Math.min(GRID_CONFIG.maxColumns, targetColumns)
		);

		return { columns: targetColumns };
	}, [containerWidth]);

	// Función para verificar si un item ya ha sido renderizado
	const isItemRendered = useCallback((itemId: string) => {
		return globalRenderedItems.has(itemId);
	}, []);

	// Función para marcar un item como renderizado
	const markItemAsRendered = useCallback((itemId: string) => {
		globalRenderedItems.add(itemId);
	}, []);

	// Manejo de scroll infinito
	useEffect(() => {
		if (inView && loadMoreItems) {
			loadMoreItems();
		}
	}, [inView, loadMoreItems]);

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
				willChange: "transform",
				contain: "size layout paint",
			}}
		>
			<div
				className="grid auto-rows-fr gap-0"
				style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
			>
				{items.map((item: FileItem, index: number) => {
					const { ref, inView: isVisible } = useInView({
						threshold: 0,
						triggerOnce: true,
						rootMargin: "100px", // Aumentado para cargar antes de entrar al viewport
					});

					const hasBeenRendered = isItemRendered(item.id);

					if (!hasBeenRendered && isVisible) {
						markItemAsRendered(item.id);
					}

					return (
						<motion.div
							ref={ref}
							key={item.id}
							layoutId={`file-${item.id}`}
							className="relative w-full aspect-square"
						>
							<FileCard
								item={item}
								onClick={onItemClick}
								onDoubleClick={onItemDoubleClick}
								index={index}
								totalColumns={columns}
								shouldLoad={isVisible}
								hasBeenRendered={hasBeenRendered}
							/>
						</motion.div>
					);
				})}
			</div>
			<div ref={loadMoreRef} className="h-px w-full" />
		</div>
	);
}
