/**
 * @component FileGrid
 * @description Componente principal para mostrar una cuadrícula de archivos con virtualización y optimización de rendimiento.
 *
 * Flujo de integración:
 * 1. Recibe items (FileItem[]) desde el componente padre
 * 2. Utiliza virtualización para renderizar solo los elementos visibles
 * 3. Maneja la selección de archivos y la interacción del usuario
 * 4. Se integra con FileCard para renderizar cada elemento
 * 5. Soporta infinite scroll para cargar más elementos
 *
 * Optimizaciones:
 * - Virtualización con @tanstack/react-virtual
 * - Cache de elementos renderizados
 * - Lazy loading de imágenes
 * - Gestión eficiente de eventos de scroll
 *
 * @param {FileGridProps} props - Propiedades del componente
 */

"use client";

import { useCallback, useEffect, useRef, useMemo, useState } from "react";
import { FileCard } from "./file-card";
import type { FileItem } from "@/types/file-item";
import { cn } from "@/lib/utils";
import { useVirtualizer } from "@tanstack/react-virtual";

// Optimizar la configuración del grid
const GRID_CONFIG = {
	minColumns: 3,
	maxColumns: 6,
	gap: 4,
	itemBaseWidth: 200,
	overscanCount: 15,
	scrollingDelay: 150,
	batchSize: 20,
	breakpoints: {
		sm: 640,
		md: 768,
		lg: 1024,
		xl: 1280,
	},
} as const;

// Sistema de cache mejorado usando Map para mejor rendimiento en el cliente
const renderedItemsCache = new Map<string, boolean>();

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
		overscan: isScrolling ? 8 : GRID_CONFIG.overscanCount,
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

	// Optimizar la función isItemRendered
	const isItemRendered = useCallback((itemId: string) => {
		return renderedItemsCache.has(itemId);
	}, []);

	// Optimizar la función markItemAsRendered
	const markItemAsRendered = useCallback((itemId: string) => {
		renderedItemsCache.set(itemId, true);
	}, []);

	return (
		<div
			ref={gridRef}
			className={cn("h-full w-full overflow-auto relative")}
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
									columnGap: 0,
								}}
							>
								{rowItems.map((item, columnIndex) => {
									const index = rowStartIndex + columnIndex;
									const hasBeenRendered = isItemRendered(item.id);
									const shouldLoad = !isScrolling || hasBeenRendered;

									if (!hasBeenRendered && shouldLoad) {
										markItemAsRendered(item.id);
									}

									return (
										<div
											key={item.id}
											className="relative w-full py-2 px-1"
											style={{
												willChange: "transform",
												contain: "layout style paint",
											}}
										>
											<FileCard
												item={item}
												onClick={onItemClick}
												onDoubleClick={onItemDoubleClick}
												index={index}
												totalColumns={columns}
												shouldLoad={shouldLoad}
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
