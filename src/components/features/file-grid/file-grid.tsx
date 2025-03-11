"use client";

import { logger } from "@/lib/logger/logger";
import { cn } from "@/lib/utils";
import { useFileManager } from "@/store/file-manager.store";
import { useImageResources } from "@/store/image-resources.store";
import type { FileItem } from "@/types/file-item";
import type * as React from "react";
import { useCallback, useEffect, useRef } from "react";
import { GRID_CONFIG } from "./config/grid-config";
import { handleContextAction } from "./context-menu/context-action-handler";
import type { ContextMenuAction } from "./context-menu/context-menu";
import { useGridView } from "./hooks/use-grid-view";
import { useGridVirtualizer } from "./hooks/use-grid-virtualizer";
import { useThumbnailLoader } from "./hooks/use-thumbnail-loader";
import { CardsView } from "./views/cards-view";
import { GridView } from "./views/grid-view";
import { ListView } from "./views/list-view";
import { MasonryView } from "./views/masonry-view";

// Para propósitos de depuración - mantenemos esta variable aunque esté sin usar en la mayoría de los casos
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const gridLogger = logger.withContext("FileGrid");

export interface FileGridProps {
	items: FileItem[];
	isResizing?: boolean;
	onItemClick?: (item: FileItem) => void;
	onItemDoubleClick?: (item: FileItem) => void;
	loadMoreItems?: () => void;
}

export function FileGrid({
	items,
	isResizing,
	onItemClick,
	onItemDoubleClick,
	loadMoreItems,
}: FileGridProps) {
	const { selectedItems, viewMode, toggleItemSelection } = useFileManager();
	const imageResources = useImageResources();

	// Crear una referencia local para el div parent
	const gridParentRef = useRef<HTMLDivElement>(null);

	// Usar los hooks para separar la lógica
	const {
		parentRef,
		loadMoreRef,
		containerWidth,
		isTransitioning,
		handleScroll,
		debouncedLoadThumbnails,
	} = useGridView({
		viewMode,
		isResizing,
		loadMoreItems,
	});

	// Hook para virtualización - usamos un cast de tipo para resolver el problema de incompatibilidad
	const { itemSize, virtualizer, calculateMasonryHeight } = useGridVirtualizer({
		items,
		parentRef: gridParentRef as React.RefObject<HTMLDivElement>,
		viewMode,
		containerWidth,
	});

	// Manejador de acciones contextuales
	const handleContextMenuAction = useCallback(
		(
			action: ContextMenuAction,
			item: FileItem,
			data?: Record<string, unknown>
		) => {
			// Crear una función wrapper para toggleItemSelection que proporcione un valor por defecto
			const toggleItemSelectionWrapper = (
				fileItem: FileItem,
				isMultiSelect = false
			) => {
				toggleItemSelection(fileItem, isMultiSelect);
			};

			handleContextAction(
				action,
				item,
				data,
				onItemDoubleClick,
				toggleItemSelectionWrapper
			);
		},
		[onItemDoubleClick, toggleItemSelection]
	);

	// Efecto para cargar thumbnails visibles cuando cambia la lista
	useEffect(() => {
		if (virtualizer && items.length > 0 && !isTransitioning) {
			const visibleItems = virtualizer
				.getVirtualItems()
				.map((virtualItem) => items[virtualItem.index])
				.filter((item): item is FileItem => !!item && !!item.id);

			// Usar el debounce para cargar los thumbnails
			debouncedLoadThumbnails(visibleItems);
		}
	}, [virtualizer, items, isTransitioning, debouncedLoadThumbnails]);

	// Sincronizar nuestra ref local con la ref del hook
	useEffect(() => {
		if (gridParentRef.current) {
			// @ts-ignore - Sabemos que es seguro asignar esto
			parentRef.current = gridParentRef.current;
		}
	}, [parentRef]);

	return (
		<div
			ref={gridParentRef}
			className={cn(
				"h-full w-full overflow-auto relative",
				viewMode === "list" && "px-2 py-1",
				isTransitioning && "opacity-0 transition-opacity duration-50"
			)}
			onScroll={handleScroll}
			style={{
				height: "100%",
				width: "100%",
				position: "relative",
				contain: "strict",
				willChange: "transform",
				padding: GRID_CONFIG[viewMode].padding,
			}}
		>
			<div
				style={{
					height: virtualizer.getTotalSize(),
					width: "100%",
					position: "relative",
					contain: "strict",
				}}
			>
				{!isTransitioning &&
					virtualizer.getVirtualItems().map((virtualItem) => {
						const item = items[virtualItem.index];
						if (!item) {
							return null;
						}

						// Manejar el caso especial de ReactPromise
						// eslint-disable-next-line @typescript-eslint/no-unused-vars
						let processedItem = item;

						// Verificar si estamos lidiando con un ReactPromise o un objeto Promise
						if (
							item &&
							// ReactPromise tiene 'value', 'status', etc.
							((typeof item === "object" &&
								"value" in item &&
								"status" in item) ||
								// Promise regular
								item instanceof Promise ||
								// Promesas serializadas como objetos
								(typeof item === "object" &&
									item !== null &&
									"then" in item &&
									typeof item.then === "function"))
						) {
							try {
								// eslint-disable-next-line @typescript-eslint/no-unused-vars
								gridLogger.warn(
									"Detectado ReactPromise como item, intentando extraer el valor:",
									item
								);

								// Para ReactPromise podemos intentar obtener el valor directamente
								if ("value" in item && typeof item.value === "string") {
									try {
										// Intentar parsear el valor como JSON
										const parsedItem = JSON.parse(item.value);
										if (
											parsedItem &&
											typeof parsedItem === "object" &&
											"id" in parsedItem
										) {
											processedItem = parsedItem;
										}
									} catch (parseError) {
										// eslint-disable-next-line @typescript-eslint/no-unused-vars
										gridLogger.error(
											"Error al parsear el valor del ReactPromise:",
											parseError
										);
									}
								}
							} catch (promiseError) {
								// eslint-disable-next-line @typescript-eslint/no-unused-vars
								gridLogger.error(
									"Error al procesar Promise/ReactPromise:",
									promiseError
								);
							}
						}

						// Verificar que el item (ahora posiblemente extraído de una promesa) tenga un ID válido
						if (
							!processedItem.id ||
							typeof processedItem.id !== "string" ||
							processedItem.id.trim() === ""
						) {
							// eslint-disable-next-line @typescript-eslint/no-unused-vars
							gridLogger.warn(
								"Intentando renderizar item con ID inválido:",
								processedItem
							);
							return null;
						}

						const style: React.CSSProperties = {
							position: "absolute",
							top: 0,
							left: 0,
							transform: `translate3d(${
								viewMode === "list"
									? 0
									: virtualItem.lane * (itemSize + GRID_CONFIG.gap[viewMode])
							}px, ${virtualItem.start}px, 0)`,
							width: viewMode === "list" ? "100%" : itemSize,
							height:
								viewMode === "masonry"
									? calculateMasonryHeight(processedItem, itemSize)
									: virtualItem.size - GRID_CONFIG.gap[viewMode],
							padding: 0,
							willChange: "transform",
						};

						const ViewComponent = {
							grid: GridView,
							masonry: MasonryView,
							cards: CardsView,
							list: ListView,
						}[viewMode];

						// Ahora que sabemos que item.id es válido, podemos acceder al recurso
						const resource = imageResources.resources.get(processedItem.id);
						const thumbnail = resource?.thumbnail || null;

						return (
							<div
								key={`${viewMode}-${virtualItem.key}`}
								data-index={virtualItem.index}
								className={cn("absolute")}
								style={style}
							>
								<ViewComponent
									item={processedItem}
									onClick={onItemClick}
									onDoubleClick={onItemDoubleClick}
									onContextAction={handleContextMenuAction}
									shouldLoad={true}
									isSelected={selectedItems.some(
										(selected) => selected.id === processedItem.id
									)}
									itemSize={itemSize}
									thumbnail={thumbnail}
									style={{
										width: "100%",
										height: "100%",
									}}
								/>
							</div>
						);
					})}
			</div>
			<div ref={loadMoreRef} className="h-px w-full" />
		</div>
	);
}
