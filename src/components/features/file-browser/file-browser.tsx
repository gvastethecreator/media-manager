'use client';

import { Button } from '@/components/ui/button';
import { serverLogger } from '@/lib/logger/server-logger';
import { cn } from '@/lib/utils';
import { useDetailsPanel } from '@/store/details-panel.store';
import { useFileManager } from '@/store/files/file-manager.store';
import { useImageResources } from '@/store/image-resources.store';
import type { FileItem } from '@/types/file-item';
import { Pin, PinOff, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type * as React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { GRID_CONFIG } from './config/grid-config';
import { handleContextAction } from './context-menu/context-action-handler';
import type { ContextMenuAction } from './context-menu/context-menu';
import { DetailsPanel } from './details/details-panel';
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
	const { isVisible, isFixed, toggleVisibility, toggleFixed } = useDetailsPanel();
	const [position, setPosition] = useState({ x: 0, y: 0 });
	const constraintsRef = useRef<HTMLDivElement>(null);
	const panelRef = useRef<HTMLDivElement>(null);

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

	// Efecto para ajustar la posición inicial cuando está fijo
	useEffect(() => {
		if (panelRef.current && constraintsRef.current && isFixed) {
			const container = constraintsRef.current;
			const panel = panelRef.current;
			const containerWidth = container.offsetWidth;
			const panelWidth = panel.offsetWidth;

			setPosition({
				x: containerWidth - panelWidth - 20,
				y: 20,
			});
		}
	}, [isFixed]);

	return (
		<div ref={constraintsRef} className="relative h-full w-full">
			<div
				ref={gridParentRef}
				className={cn(
					'h-full w-full overflow-auto relative transition-all duration-200',
					viewMode === 'list' && 'px-2 py-1',
					isTransitioning && 'opacity-0 transition-opacity duration-50',
					isFixed && 'pr-[320px]'
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
										onClick={onItemClick}
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

			<AnimatePresence mode="wait">
				{selectedItems.length > 0 && isVisible && (
					<motion.div
						ref={panelRef}
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.95 }}
						transition={{ type: 'spring', damping: 25, stiffness: 200 }}
						drag={!isFixed}
						dragMomentum={false}
						dragElastic={0.1}
						dragConstraints={constraintsRef}
						style={{
							position: 'fixed',
							top: position.y,
							left: position.x,
							width: '320px',
							height: 'calc(100vh - 40px)',
							zIndex: isFixed ? 100 : 50,
							cursor: isFixed ? 'default' : 'move',
						}}
						className={cn(
							'bg-background-primary border rounded-lg shadow-lg overflow-hidden',
							!isFixed && 'hover:shadow-xl transition-shadow duration-200',
							isFixed && 'fixed right-5 top-5'
						)}
					>
						<div className="flex items-center justify-between p-2 border-b">
							<h3 className="text-sm font-medium">Detalles</h3>
							<div className="flex items-center gap-1">
								<Button
									variant="ghost"
									size="icon"
									className="h-8 w-8 cursor-pointer"
									onClick={() => toggleFixed()}
									title={isFixed ? 'Desfijar panel' : 'Fijar panel'}
								>
									{isFixed ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
								</Button>
								<Button
									variant="ghost"
									size="icon"
									className="h-8 w-8 cursor-pointer"
									onClick={() => toggleVisibility()}
								>
									<X className="h-4 w-4" />
								</Button>
							</div>
						</div>
						<div className="h-[calc(100%-40px)] overflow-auto">
							<DetailsPanel selectedItems={mappedItems} />
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
