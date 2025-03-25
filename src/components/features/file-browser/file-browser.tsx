'use client';

import { serverLogger } from '@/lib/logger/server-logger';
import { cn } from '@/lib/utils';
import { useDetailsPanel } from '@/store/details-panel.store';
import { useFileManager } from '@/store/files/file-manager.store';
import { useImageResources } from '@/store/image-resources.store';
import type { FileItem } from '@/types/file-item';
import type * as React from 'react';
import { useCallback, useEffect, useRef } from 'react';
import { GRID_CONFIG } from './config/grid-config';
import { handleContextAction } from './context-menu/context-action-handler';
import type { ContextMenuAction } from './context-menu/context-menu';
import { useGridView } from './hooks/use-grid-view';
import { useGridVirtualizer } from './hooks/use-grid-virtualizer';
import { CardsView } from './views/cards-view';
import { GridView } from './views/grid-view';
import { ListView } from './views/list-view';
import { MasonryView } from './views/masonry-view';

// Para propósitos de depuración - mantenemos esta variable aunque esté sin usar en la mayoría de los casos

const gridLogger = serverLogger.withContext('FileGrid');

/**
 * FileBrowser - Componente avanzado para visualización y gestión de archivos
 *
 * Este componente implementa una interfaz de navegación de archivos con múltiples modos de visualización
 * (grid, lista, masonry, tarjetas) y funcionalidades avanzadas como virtualización, carga optimizada
 * de miniaturas, selección múltiple y panel de detalles interactivo.
 *
 * @see Documentación completa en docs/components/file-browser.md
 */
export interface FileBrowserProps {
	items: FileItem[];
	isResizing?: boolean;
	onItemClick?: (item: FileItem) => void;
	onItemDoubleClick?: (item: FileItem) => void;
	loadMoreItems?: () => void;
}

/**
 * Componente principal para la visualización y navegación de archivos
 *
 * Características principales:
 * - Múltiples modos de visualización (grid, lista, masonry, tarjetas)
 * - Virtualización para rendimiento optimizado
 * - Carga diferida de miniaturas
 * - Panel de detalles interactivo y arrastrable
 * - Selección múltiple de archivos
 * - Integración con sistema de menú contextual
 */
export function FileBrowser({ items, isResizing, onItemClick, onItemDoubleClick, loadMoreItems }: FileBrowserProps) {
	const { selectedItems, viewMode, toggleItemSelection } = useFileManager();
	const imageResources = useImageResources();
	const { setVisible, setSelectedItems } = useDetailsPanel();
	const constraintsRef = useRef<HTMLDivElement>(null);

	// Crear una referencia local para el div parent
	const gridParentRef = useRef<HTMLDivElement>(null);

	// Usar los hooks para separar la lógica
	const { parentRef, loadMoreRef, containerWidth, isTransitioning, handleScroll, debouncedLoadThumbnails } =
		useGridView({
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

	// Efecto para actualizar la virtualización cuando cambie el ordenamiento
	useEffect(() => {
		if (virtualizer) {
			virtualizer.measure();
			virtualizer.scrollToIndex(0);
		}
	}, [virtualizer]);

	// Mantener el panel de detalles actualizado con los elementos seleccionados
	useEffect(() => {
		// Convertir FileItem[] a ImageItem[] para el panel de detalles
		const mappedItems = selectedItems.map((item) => ({
			id: item.id,
			name: item.name,
			path: item.path,
			url: item.thumbnail || undefined,
			metadata: item.metadata === null ? undefined : item.metadata,
			fileSize: item.size,
			width: item.width,
			height: item.height,
			tags: item.tags?.map((tag) => tag.name),
			createdAt: item.createdAt,
			updatedAt: item.updatedAt,
		}));

		// Actualizar el store de detalles con los items mapeados
		setSelectedItems(mappedItems);
	}, [selectedItems, setSelectedItems]);

	// Manejador personalizado para el clic en ítems
	const handleItemClick = useCallback(
		(item: FileItem) => {
			// Seleccionar el ítem (reemplaza la selección actual sin multi-selección)
			toggleItemSelection(item, false);

			// Mostrar el panel de detalles con el ítem seleccionado
			setVisible(true);

			// Asegurarnos de que el panel no esté colapsado
			const isRightPanelCollapsed = localStorage.getItem('right-panel-collapsed') === 'true';
			if (isRightPanelCollapsed) {
				localStorage.setItem('right-panel-collapsed', 'false');
				// Provocar un refresco de la UI para expandir el panel
				window.dispatchEvent(new Event('storage'));
			}

			// Llamar al callback onItemClick si existe
			if (onItemClick) {
				onItemClick(item);
			}
		},
		[toggleItemSelection, setVisible, onItemClick]
	);

	// Manejador de acciones contextuales
	const handleContextMenuAction = useCallback(
		(action: ContextMenuAction, item: FileItem, data?: Record<string, unknown>) => {
			// Crear una función wrapper para toggleItemSelection que proporcione un valor por defecto
			const toggleItemSelectionWrapper = (fileItem: FileItem, isMultiSelect = false) => {
				toggleItemSelection(fileItem, isMultiSelect);
			};

			handleContextAction(action, item, data, onItemDoubleClick, toggleItemSelectionWrapper);
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
			parentRef.current = gridParentRef.current;
		}
	}, [parentRef]);

	return (
		<div ref={constraintsRef} className="relative h-full w-full">
			<div
				ref={gridParentRef}
				className={cn(
					'h-full w-full overflow-auto relative transition-all duration-200',
					viewMode === 'list' && 'px-2 py-1',
					isTransitioning && 'opacity-0 transition-opacity duration-50'
				)}
				onScroll={handleScroll}
				style={{
					height: '100%',
					width: '100%',
					position: 'relative',
					contain: 'strict',
					willChange: 'transform',
					padding: GRID_CONFIG[viewMode].padding,
				}}
			>
				<div
					style={{
						height: virtualizer.getTotalSize(),
						width: '100%',
						position: 'relative',
						contain: 'strict',
					}}
				>
					{!isTransitioning &&
						virtualizer.getVirtualItems().map((virtualItem) => {
							const item = items[virtualItem.index];
							if (!item) {
								return null;
							}

							// Manejar el caso especial de ReactPromise
							let processedItem = item;

							// Verificar si estamos lidiando con un ReactPromise o un objeto Promise
							if (
								item &&
								// ReactPromise tiene 'value', 'status', etc.
								((typeof item === 'object' && 'value' in item && 'status' in item) ||
									// Promise regular
									item instanceof Promise ||
									// Promesas serializadas como objetos
									(typeof item === 'object' && item !== null && 'then' in item && typeof item.then === 'function'))
							) {
								try {
									gridLogger.warn('Detectado ReactPromise como item, intentando extraer el valor:', item);

									// Para ReactPromise podemos intentar obtener el valor directamente
									if ('value' in item && typeof item.value === 'string') {
										try {
											// Intentar parsear el valor como JSON
											const parsedItem = JSON.parse(item.value);
											if (parsedItem && typeof parsedItem === 'object' && 'id' in parsedItem) {
												processedItem = parsedItem;
											}
										} catch (parseError) {
											gridLogger.error('Error al parsear el valor del ReactPromise:', parseError);
										}
									}
								} catch (promiseError) {
									gridLogger.error('Error al procesar Promise/ReactPromise:', promiseError);
								}
							}

							// Verificar que el item (ahora posiblemente extraído de una promesa) tenga un ID válido
							if (!processedItem.id || typeof processedItem.id !== 'string' || processedItem.id.trim() === '') {
								gridLogger.warn('Intentando renderizar item con ID inválido:', processedItem);
								return null;
							}

							const style: React.CSSProperties = {
								position: 'absolute',
								top: 0,
								left: 0,
								transform: `translate3d(${viewMode === 'list' ? 0 : virtualItem.lane * (itemSize + GRID_CONFIG.gap[viewMode])
									}px, ${virtualItem.start}px, 0)`,
								width: viewMode === 'list' ? '100%' : itemSize,
								height:
									viewMode === 'masonry'
										? calculateMasonryHeight(processedItem, itemSize)
										: virtualItem.size - GRID_CONFIG.gap[viewMode],
								padding: 0,
								willChange: 'transform',
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
									className={cn('absolute')}
									style={style}
								>
									<ViewComponent
										item={processedItem}
										onClick={handleItemClick}
										onDoubleClick={onItemDoubleClick}
										onContextAction={handleContextMenuAction}
										shouldLoad={true}
										isSelected={selectedItems.some((selected) => selected.id === processedItem.id)}
										itemSize={itemSize}
										thumbnail={thumbnail}
										style={{
											width: '100%',
											height: '100%',
										}}
									/>
								</div>
							);
						})}
				</div>
				<div ref={loadMoreRef} className="h-px w-full" />
			</div>
		</div>
	);
}
